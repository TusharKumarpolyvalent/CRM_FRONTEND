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

  useEffect(() => {
    dispatch(UsersThunk('agent'));
  }, [dispatch]);

  useEffect(() => {
    if (agents.length && !selectedAgent) {
      setSelectedAgent(agents[0].id);
    }
  }, [agents]);

  const fetchPerformance = async () => {
    if (!selectedAgent) return alert('Select agent');

    setLoading(true);
    try {
      const res = await getAgentPerformanceApI({
        agent_id: selectedAgent,
        fromDate: fromDate ? fromDate.toISOString().split('T')[0] : null,
        toDate: toDate ? toDate.toISOString().split('T')[0] : null,
      });

      setData(res.data.data || []);
      setChartKey((k) => k + 1);
    } catch (err) {
      console.error(err);
      alert('Error fetching agent performance');
    }
    setLoading(false);
  };

  const clearFilters = () => {
    setSelectedAgent('');
    setFromDate(null);
    setToDate(null);
    setData([]);
  };

  /* ================= SUMMARY ================= */
  const summary = data.reduce(
    (acc, d) => {
      acc.total += d.total_call_count;
      acc.connected += d.connected;
      acc.notConnected += d.not_connected;
      acc.qualified += d.qualified;
      return acc;
    },
    { total: 0, connected: 0, notConnected: 0, qualified: 0 }
  );

  
  /* ================= STACKED BAR ================= */
  const stackedBarData = {
    labels: data.map((d) => d.campaign_name),
    datasets: [
      {
        label: 'Connected',
        data: data.map((d) => d.connected),
        backgroundColor: '#22c55e',
      },
      {
        label: 'Not Connected',
        data: data.map((d) => d.not_connected),
        backgroundColor: '#ef4444',
      },
      {
        label: 'Qualified',
        data: data.map((d) => d.qualified),
        backgroundColor: '#3b82f6',
      },
      {
        label: 'Not Qualified',
        data: data.map((d) => d.not_qualified),
        backgroundColor: '#f59e0b',
      },
    ],
  };

  const stackedOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
    },
    scales: {
      x: { stacked: true },
      y: { stacked: true },
    },
  };

  /* ================= PIE ================= */
  const pieData = {
    labels: ['Connected', 'Not Connected', 'Qualified', 'Not Qualified'],
    datasets: [
      {
        data: [
          summary.connected,
          summary.notConnected,
          summary.qualified,
          summary.total - summary.qualified,
        ],
        backgroundColor: ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b'],
      },
    ],
  };
const exportToExcel = () => {
  if (!data || !data.length) return alert('No data to export');

  // Map your data into exportable format
  const exportData = data.map((d) => ({
    'Campaign Name': d.campaign_name,
    'Total Call Count': d.total_call_count,
    Connected: d.connected,
    'Not Connected': d.not_connected,
    Qualified: d.qualified,
    'Not Qualified': d.not_qualified,
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
  saveAs(blob, `AgentPerformance_${selectedAgent || 'all'}.xlsx`);
};
  return (
    <div className="flex w-full h-full gap-4 p-4">

      {/* FILTERS */}
      <div className="w-[30%] bg-gray-50 border rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-4">Filters</h3>

        <label className="text-sm">Agent</label>
        <select
          className="w-full border p-2 rounded mb-4"
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
        >
          <option value="">Select Agent</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        <label className="text-sm">From Date</label>
        <DatePicker
          selected={fromDate}
          onChange={setFromDate}
          className="w-full border p-2 rounded mb-4"
        />

        <label className="text-sm">To Date</label>
        <DatePicker
          selected={toDate}
          onChange={setToDate}
          className="w-full border p-2 rounded mb-4"
        />

        <button onClick={fetchPerformance} className="w-full bg-blue-600 text-white py-2 rounded mb-2">
          Apply
        </button>

        <button onClick={clearFilters} className="w-full bg-gray-300 py-2 rounded">
          Clear
        </button>
        <button
  onClick={exportToExcel}
  className="w-full bg-green-600 text-white py-2 rounded mb-2"
>
  Export to Excel
</button>

        
      </div>

      {/* CONTENT */}
      <div className="w-[70%] border rounded-lg p-4 overflow-y-auto">

        {loading && <p className="text-center">Loading...</p>}

        {!loading && data.length > 0 && (
          <>
            {/* KPI CARDS */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded">
                <p>Total Calls</p>
                <p className="text-xl font-bold">{summary.total}</p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <p>Connected %</p>
                <p className="text-xl font-bold">
                  {summary.total ? ((summary.connected / summary.total) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="bg-indigo-50 p-4 rounded">
                <p>Qualified %</p>
                <p className="text-xl font-bold">
                  {summary.total ? ((summary.qualified / summary.total) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded">
                <p>Not Connected %</p>
                <p className="text-xl font-bold">
                  {summary.total ? ((summary.notConnected / summary.total) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>

            {/* CHARTS */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="border p-4 rounded">
                <Bar key={`stack-${chartKey}`} data={stackedBarData} options={stackedOptions} />
              </div>
              <div className="border p-4 rounded">
                <Pie key={`pie-${chartKey}`} data={pieData} />
              </div>
            </div>



            <div className="border rounded">
             <table className="w-full text-sm border-collapse">
    <thead className="bg-gray-100">
      <tr>
        <th className="border p-2">Campaign Name</th>
        <th className="border p-2">Total Call Count</th>
        <th className="border p-2">Connected</th>
        <th className="border p-2">Not Connected</th>
        <th className="border p-2">Qualified</th>
        <th className="border p-2">Not Qualified</th>
        <th className="border p-2">Connected %</th>
        <th className="border p-2">Not Connected %</th>
      </tr>
    </thead>

    <tbody>
    {data.map((d, i) => {
  const connectedPercent = d.total_call_count
    ? ((d.connected / d.total_call_count) * 100).toFixed(2)
    : 0;

  const notConnectedPercent = d.total_call_count
    ? ((d.not_connected / d.total_call_count) * 100).toFixed(2)
    : 0;

  return (
    <tr key={i} className="text-center">
      <td className="border p-2">{d.campaign_name}</td>
      <td className="border p-2">{d.total_call_count}</td>
      <td className="border p-2">{d.connected}</td>
      <td className="border p-2">{d.not_connected}</td>
      <td className="border p-2">{d.qualified}</td>
      <td className="border p-2">{d.not_qualified}</td>
      <td className="border p-2">{connectedPercent}%</td>
      <td className="border p-2">{notConnectedPercent}%</td>
    </tr>
  );
})}

    </tbody>
  </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
