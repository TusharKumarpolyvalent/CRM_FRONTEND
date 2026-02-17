import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { UsersThunk } from '../redux/slice/UsersSlice';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { getAgentPerformanceApI } from '../helpers/functions';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

export default function AgentAnalyticalDashboard() {
  const agents = useSelector((state) => state.users?.data || []);
  const dispatch = useDispatch();

  const [selectedAgent, setSelectedAgent] = useState('');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chartKey, setChartKey] = useState(0);
  const [error, setError] = useState(null);
  
  // Debug state
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    dispatch(UsersThunk('agent'));
  }, [dispatch]);

  useEffect(() => {
    if (agents.length && !selectedAgent) {
      setSelectedAgent(agents[0]?.id || '');
    }
  }, [agents]);

  const fetchPerformance = async () => {
    if (!selectedAgent) {
      setError('Please select an agent');
      return;
    }

    setLoading(true);
    setError(null);
    setDebugInfo(null);
    setData([]);
    
    try {
      const params = { agent_id: selectedAgent };

      if (fromDate) {
        params.fromDate = fromDate.toLocaleDateString('en-CA');
      }
      if (toDate) {
        params.toDate = toDate.toLocaleDateString('en-CA');
      }

      console.log('📅 Fetching performance with params:', params);
      
      const res = await getAgentPerformanceApI(params);
      console.log('📅 Performance response:', JSON.stringify(res, null, 2));
      
      setDebugInfo({
        type: 'range',
        request: params,
        response: res
      });
      
      // Extract data from response structure
      let campaignData = [];
      
      if (res?.data?.data?.campaign_wise) {
        campaignData = res.data.data.campaign_wise;
      } else if (res?.data?.campaign_wise) {
        campaignData = res.data.campaign_wise;
      }
      
      setData(Array.isArray(campaignData) ? campaignData : []);
      
      console.log('📅 Total campaigns:', campaignData.length);
      
      setChartKey((k) => k + 1);
    } catch (err) {
      console.error('📅 Error:', err);
      setError(err.message || 'Error fetching agent performance');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedAgent(agents[0]?.id || '');
    setFromDate(null);
    setToDate(null);
    setData([]);
    setError(null);
    setDebugInfo(null);
  };

  // Calculate summary
  const summary = data.reduce(
    (acc, d) => {
      acc.total += d.total_call_count || 0;
      acc.connected += d.connected || 0;
      acc.notConnected += d.not_connected || 0;
      acc.qualified += d.qualified || 0;
      acc.notQualified += d.not_qualified || 0;
      return acc;
    },
    { total: 0, connected: 0, notConnected: 0, qualified: 0, notQualified: 0 }
  );

  const stackedBarData = {
    labels: data.map((d) => d.campaign_name || 'Unknown'),
    datasets: [
      {
        label: 'Connected',
        data: data.map((d) => d.connected || 0),
        backgroundColor: '#22c55e',
      },
      {
        label: 'Not Connected',
        data: data.map((d) => d.not_connected || 0),
        backgroundColor: '#ef4444',
      },
      {
        label: 'Qualified',
        data: data.map((d) => d.qualified || 0),
        backgroundColor: '#3b82f6',
      },
      {
        label: 'Not Qualified',
        data: data.map((d) => d.not_qualified || 0),
        backgroundColor: '#f59e0b',
      },
    ],
  };

  const stackedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: 'Campaign-wise Call Distribution'
      }
    },
    scales: {
      x: { 
        stacked: true,
        title: {
          display: true,
          text: 'Campaigns'
        }
      },
      y: { 
        stacked: true,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Calls'
        }
      },
    },
  };

  const pieData = {
    labels: ['Connected', 'Not Connected', 'Qualified', 'Not Qualified'],
    datasets: [
      {
        data: [
          summary.connected,
          summary.notConnected,
          summary.qualified,
          summary.notQualified,
        ],
        backgroundColor: ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b'],
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      title: {
        display: true,
        text: 'Overall Call Distribution'
      }
    },
  };

  const exportToExcel = () => {
    if (!data || !data.length) {
      setError('No data to export');
      return;
    }

    const exportData = data.map((d) => ({
      'Campaign Name': d.campaign_name || 'Unknown',
      'Total Call Count': d.total_call_count || 0,
      Connected: d.connected || 0,
      'Not Connected': d.not_connected || 0,
      Qualified: d.qualified || 0,
      'Not Qualified': d.not_qualified || 0,
      'Connected %': d.total_call_count
        ? ((d.connected / d.total_call_count) * 100).toFixed(2)
        : 0,
      'Not Connected %': d.total_call_count
        ? ((d.not_connected / d.total_call_count) * 100).toFixed(2)
        : 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AgentPerformance');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    const agentName = agents.find(a => a.id === selectedAgent)?.name || 'agent';
    saveAs(blob, `AgentPerformance_${agentName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const selectedAgentName = agents.find(a => a.id === selectedAgent)?.name || '';

  return (
    <div className="flex w-full h-full gap-4 p-4 bg-gray-50">
      {/* FILTERS PANEL */}
      <div className="w-80 bg-white border rounded-xl p-5 h-full overflow-y-auto shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-5">Filters</h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              Select Agent
            </label>
            <select
              className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={selectedAgent}
              onChange={(e) => {
                setSelectedAgent(e.target.value);
                setError(null);
              }}
            >
              <option value="">-- Select Agent --</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              From Date
            </label>
            <DatePicker
              selected={fromDate}
              onChange={setFromDate}
              className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholderText="Start date"
              dateFormat="yyyy-MM-dd"
              maxDate={toDate || new Date()}
              isClearable
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              To Date
            </label>
            <DatePicker
              selected={toDate}
              onChange={setToDate}
              className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholderText="End date"
              dateFormat="yyyy-MM-dd"
              minDate={fromDate}
              maxDate={new Date()}
              isClearable
            />
          </div>

          <button
            onClick={fetchPerformance}
            disabled={loading || !selectedAgent}
            className={`w-full py-2.5 rounded-lg font-medium transition-colors ${
              loading || !selectedAgent
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Loading...' : 'Apply Filters'}
          </button>

          <button
            onClick={clearFilters}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2.5 rounded-lg font-medium transition-colors"
          >
            Clear Filters
          </button>

          {data.length > 0 && (
            <button
              onClick={exportToExcel}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium transition-colors"
            >
              Export to Excel
            </button>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 bg-white border rounded-xl p-6 overflow-y-auto shadow-sm">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-2 text-gray-600">Loading performance data...</p>
            </div>
          </div>
        )}

        {!loading && !selectedAgent && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="mt-2">Select an agent to view performance data</p>
            </div>
          </div>
        )}

        {!loading && selectedAgent && data.length === 0 && !error && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-2">No data available for selected filters</p>
            </div>
          </div>
        )}

        {!loading && data.length > 0 && (
          <>
            {/* Date Range Info */}
            {(fromDate || toDate) && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium text-blue-700">Date Range:</span>{' '}
                  <span className="text-blue-600">
                    {fromDate ? fromDate.toLocaleDateString() : 'Start'} to{' '}
                    {toDate ? toDate.toLocaleDateString() : 'End'}
                  </span>
                </p>
                <p className="text-sm mt-1">
                  <span className="font-medium text-blue-700">Agent:</span>{' '}
                  <span className="text-blue-600">{selectedAgentName}</span>
                </p>
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-600 font-medium">Total Calls</p>
                <p className="text-3xl font-bold text-blue-700">{summary.total}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-600 font-medium">Connected</p>
                <p className="text-3xl font-bold text-green-700">{summary.connected}</p>
                <p className="text-xs text-green-500">
                  {summary.total ? ((summary.connected / summary.total) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
                <p className="text-sm text-indigo-600 font-medium">Qualified</p>
                <p className="text-3xl font-bold text-indigo-700">{summary.qualified}</p>
                <p className="text-xs text-indigo-500">
                  {summary.total ? ((summary.qualified / summary.total) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-red-600 font-medium">Not Connected</p>
                <p className="text-3xl font-bold text-red-700">{summary.notConnected}</p>
                <p className="text-xs text-red-500">
                  {summary.total ? ((summary.notConnected / summary.total) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white border rounded-lg p-4 h-96">
                <h4 className="font-semibold text-gray-700 mb-3">Campaign-wise Distribution</h4>
                <Bar key={`stack-${chartKey}`} data={stackedBarData} options={stackedOptions} />
              </div>
              <div className="bg-white border rounded-lg p-4 h-96">
                <h4 className="font-semibold text-gray-700 mb-3">Overall Call Distribution</h4>
                <Pie key={`pie-${chartKey}`} data={pieData} options={pieOptions} />
              </div>
            </div>

            {/* Data Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border-b p-3 text-left">Campaign Name</th>
                      <th className="border-b p-3 text-right">Total Calls</th>
                      <th className="border-b p-3 text-right">Connected</th>
                      <th className="border-b p-3 text-right">Not Connected</th>
                      <th className="border-b p-3 text-right">Qualified</th>
                      <th className="border-b p-3 text-right">Not Qualified</th>
                      <th className="border-b p-3 text-right">Connected %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((d, i) => {
                      const connectedPercent = d.total_call_count
                        ? ((d.connected / d.total_call_count) * 100).toFixed(1)
                        : 0;

                      return (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="border-b p-3 font-medium">{d.campaign_name || 'Unknown'}</td>
                          <td className="border-b p-3 text-right">{d.total_call_count || 0}</td>
                          <td className="border-b p-3 text-right text-green-600">{d.connected || 0}</td>
                          <td className="border-b p-3 text-right text-red-600">{d.not_connected || 0}</td>
                          <td className="border-b p-3 text-right text-blue-600">{d.qualified || 0}</td>
                          <td className="border-b p-3 text-right text-orange-600">{d.not_qualified || 0}</td>
                          <td className="border-b p-3 text-right">{connectedPercent}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}