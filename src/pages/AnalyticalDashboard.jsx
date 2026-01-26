import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as XLSX from 'xlsx';

import { campaignThunk } from '../redux/slice/CampaignSlice';
import { Bar,Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend ,ArcElement} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);


ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getCampaignPerformanceAPI } from '../helpers/functions'; // Make sure this exists

const AnalyticalDashboard = () => {
  const dispatch = useDispatch();

  // Redux campaigns state
  const campaigns = useSelector((state) => state.campaigns?.data || []);

  // Local state
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch campaigns on mount
  useEffect(() => {
    dispatch(campaignThunk());
  }, [dispatch]);
const exportToExcel = () => {
  if (!performanceData.length) return;

  const worksheet = XLSX.utils.json_to_sheet(performanceData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Campaign Report');

  XLSX.writeFile(workbook, 'campaign_performance.xlsx');
};
const exportToCSV = () => {
  if (!performanceData.length) return;

  const worksheet = XLSX.utils.json_to_sheet(performanceData);
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'campaign_performance.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
// clear function
const handleClearFilters = () => {
  setSelectedCampaign('');
  setFromDate(null);
  setToDate(null);
  setPerformanceData([]);
};

  // Fetch performance data for selected campaign + date range
const handleFetchPerformance = async () => {
  if (!selectedCampaign) return alert('Select a campaign first');
  setLoading(true);

  try {
    const params = { campaign_id: selectedCampaign };
    if (fromDate && toDate) {
      params.fromDate = fromDate.toISOString().split('T')[0];
      params.toDate = toDate.toISOString().split('T')[0];
    }

    const res = await getCampaignPerformanceAPI(params);

    // Ensure it's always an array
    const dataArray = Array.isArray(res.data) ? res.data : res.data?.data || [];
    setPerformanceData(dataArray);

  } catch (err) {
    console.error(err);
    setPerformanceData([]);
    alert('Error fetching performance');
  }

  setLoading(false);
};


  // Prepare chart data
  const chartLabels = performanceData.map((item) => item.source_name || 'Unknown');
  const chartValues = performanceData.map((item) => item.total_leads || 0);
  const qualifiedValues = performanceData.map((item) => item.total_qualified || 0);

  const barData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Total Leads',
        data: chartValues,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
      {
        label: 'Qualified Leads',
        data: qualifiedValues,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  const pieData = {
  labels: performanceData.map(
    (item) => item.source_name || 'Unknown'
  ),
  datasets: [
    {
      label: 'Source Share',
      data: performanceData.map(
        (item) => item.total_leads || 0
      ),
      backgroundColor: [
        '#3B82F6',
        '#10B981',
        '#F59E0B',
        '#EF4444',
        '#8B5CF6',
        '#14B8A6',
      ],
      borderWidth: 1,
    },
  ],
};

 return (
  <div className="flex w-full h-full gap-6 p-6 bg-gray-100">

    {/* LEFT FILTER PANEL */}
    <div className="w-[28%] bg-white border rounded-xl p-5 shadow-sm sticky top-0 h-fit">
      <h3 className="text-lg font-semibold mb-5 text-gray-800">
        Filters
      </h3>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-600">
            Campaign
          </label>
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="w-full border p-2.5 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Campaign</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">
            From Date
          </label>
          <DatePicker
            selected={fromDate}
            onChange={(date) => setFromDate(date)}
            className="w-full border p-2.5 rounded-lg mt-1"
            placeholderText="From Date"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">
            To Date
          </label>
          <DatePicker
            selected={toDate}
            onChange={(date) => setToDate(date)}
            className="w-full border p-2.5 rounded-lg mt-1"
            placeholderText="To Date"
          />
        </div>

        <button
          onClick={handleFetchPerformance}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium"
        >
          Apply Filters
        </button>
        <button
  onClick={handleClearFilters}
  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2.5 rounded-lg font-medium mt-2"
>
  Clear Filters
</button>
      </div>
    </div>

    {/* RIGHT CONTENT */}
    <div className="w-[72%] flex flex-col gap-6">

      {/* EXPORT BAR */}
      <div className="bg-white border rounded-xl shadow-sm p-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">
          Campaign Performance
        </h3>

        <div className="flex gap-2">
          <button
            onClick={exportToExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md text-sm"
          >
            Export Excel
          </button>
          <button
            onClick={exportToCSV}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-md text-sm"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="bg-white border rounded-xl shadow-sm p-5 overflow-y-auto flex-1">

        {loading && (
          <p className="text-center text-gray-500">
            Loading performance data...
          </p>
        )}

        {!loading && performanceData.length === 0 && (
          <p className="text-center text-gray-400">
            No data available. Apply filters to view report.
          </p>
        )}

        {!loading && performanceData.length > 0 && (
          <>
            {/* CHART */}
           {/* CHARTS */}
<div className="grid grid-cols-2 gap-6 mb-8">

  {/* BAR CHART */}
  <div className="bg-white border rounded-xl p-4">
    <h4 className="font-semibold text-gray-700 mb-3">
      Leads vs Qualified
    </h4>
    <Bar data={barData} />
  </div>

  {/* PIE CHART */}
  <div className="bg-white border rounded-xl p-4">
    <h4 className="font-semibold text-gray-700 mb-3">
      Source Share
    </h4>
    <Pie data={pieData} />
  </div>

</div>


            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-lg overflow-hidden">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-3 text-left">Source</th>
                    <th className="p-3 text-center">Total Leads</th>
                    <th className="p-3 text-center">Qualified</th>
                    <th className="p-3 text-center">Qualified %</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.map((item, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="p-3">{item.source_name || '-'}</td>
                      <td className="p-3 text-center">
                        {item.total_leads || 0}
                      </td>
                      <td className="p-3 text-center">
                        {item.total_qualified || 0}
                      </td>
                      <td className="p-3 text-center font-medium">
                        {item.qualified_percent || 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>
    </div>
  </div>
);

};

export default AnalyticalDashboard;
