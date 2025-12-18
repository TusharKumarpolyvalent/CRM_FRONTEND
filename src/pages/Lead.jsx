import { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';
import Card from '../components/Card';
import { useLocation, useNavigate } from 'react-router-dom';
import AddLeads from '../modals/AddLeads';
import { useGlobalContext } from '../context/GlobalContext';
import { useDispatch, useSelector } from 'react-redux';
import { AssignLeadThunk, LeadThunk } from '../redux/slice/LeadSlice';
import ImportFile from '../components/ImportLeads';
import { UsersThunk } from '../redux/slice/UsersSlice';
import { warningToast } from '../helpers/Toast';
import AssignToggle from '../components/AssignedToggle';
import { checkAuth, formatDate } from '../helpers/functions';
import CustomLoader from '../components/CustomLoader';
import { statusOption } from '../utils/constant';
import { X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const Lead = () => {
  const [selectLimit, setSelectLimit] = useState(
    import.meta.env.VITE_LEAD_SELECT_LIMIT
  );
  const [currentFlag, setCurrentFlag] = useState('false');
  const { customLoaderFlag } = useGlobalContext();
  const navigate = useNavigate();
  const { state } = useLocation();
  const dispatch = useDispatch();
  const agents = useSelector((store) => store.users.data);
  const leadsData = useSelector((store) => store.Leads);
  const [leads, setLeads] = useState([]);
  const { showAddLeadsModal, setShowAddLeadsModal } = useGlobalContext();
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [agentId, setAgentId] = useState('');

  const [filterObj, setFilterObj] = useState({});

  useEffect(() => {
    setLeads(leadsData.data);
  }, [leadsData.data]);

  useEffect(() => {
    if (!(state && state.Campaign && state.Campaign.id)) {
      checkAuth(navigate);
    }
    if (state && state.Campaign) {
      dispatch(LeadThunk({ campaignId: state.Campaign.id, flag: 'false' }));
      dispatch(UsersThunk('agent'));
    }
  }, []);

  const handleFilters = (e) => {
    setFilterObj({ ...filterObj, [e.target.name]: e.target.value });
  };

  const removeFilter = (key) => {
    let obj = { ...filterObj };
    delete obj[key];
    setFilterObj(obj);
  };

  const applyFilters = () => {
    let tempLeads = [...leadsData.data];

    if ('status' in filterObj) {
      tempLeads = tempLeads.filter(
        (lead) => lead.status.toString() === filterObj.status.toString()
      );
    }
    if ('assigned_to' in filterObj) {
      tempLeads = tempLeads.filter(
        (lead) =>
          lead.assigned_to.toString() === filterObj.assigned_to.toString()
      );
    }
    if ('doc_status' in filterObj) {
      tempLeads = tempLeads.filter(
        (lead) => lead.doc_status.toString() === filterObj.doc_status.toString()
      );
    }
    if ('attempts' in filterObj) {
      tempLeads = tempLeads.filter(
        (lead) => lead.attempts.toString() === filterObj.attempts.toString()
      );
    }
    setLeads(tempLeads);
  };

  const selectAllLeades = (val) => {
    if (val) {
      let leadInLimit = leads.filter((lead, index) => index + 1 <= selectLimit).filter(lead => lead.status !== "Qualified" && lead.attempts !== "3");
      setSelectedLeads(leadInLimit.map((lead) => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };
  
  
  const individualLeadSelect = (id, val) => {
    if (!val) {
      setSelectedLeads(selectedLeads.filter((leadId) => leadId !== id));
    } else {
      setSelectedLeads([...selectedLeads, id]);
    }
  };

  const leadToAgent = () => {
    if (selectedLeads.length === 0)
      return warningToast('Please select at least one lead');
    if (!agentId) return warningToast('Please select an Agent');
    dispatch(
      AssignLeadThunk({
        leadIds: selectedLeads,
        agentId,
        campaignId: state.Campaign.id,
        flag: currentFlag,
      })
    );
    setSelectedLeads([]);
  };

  // ---------------------------------------------------------
  // 🔥 EXPORT CSV
  // ---------------------------------------------------------
  const exportCSV = () => {
    if (!leads.length) return warningToast('No leads to export');

    const headers = Object.keys(leads[0]);
    const csvRows = [headers.join(',')];

    leads.forEach((lead) => {
      const values = headers.map((h) => `"${lead[h] ?? ''}"`);
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    saveAs(blob, 'leads.csv');
  };

  // ---------------------------------------------------------
  // 🔥 EXPORT EXCEL
  // ---------------------------------------------------------
  const exportExcel = () => {
    if (!leads.length) return warningToast('No leads to export');

    const worksheet = XLSX.utils.json_to_sheet(leads);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    saveAs(blob, 'leads.xlsx');
  };

  // ---------------------------------------------------------

  return (
    <div className="p-6 ">
      {showAddLeadsModal && (
        <AddLeads campaignId={state.Campaign.id} flag="false" />
      )}
      <div className="flex justify-between items-center">
        <div className="max-w-md min-w-xl bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition">
          <div className="p-6 space-y-3">
            <h2 className="text-xl font-bold text-gray-800">
              {state?.Campaign.name}
            </h2>

            <p className="text-gray-600">{state?.Campaign.description}</p>

            <div>
              <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                ID: {state?.Campaign.id}
              </span>
            </div>

            <div>
              {state?.Campaign.status === '1' ? (
                <span className="inline-block px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                  Status: Active
                </span>
              ) : (
                <span className="inline-block px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
                  Status: Inactive
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center gap-10">
          <Card content="Total Leads" count={leadsData.data?.length} />
          <button
            onClick={() => setShowAddLeadsModal(true)}
            className="bg-green-500 hover:bg-green-700 transition text-white px-4 py-2 rounded-lg cursor-pointer"
          >
            Create Leads
          </button>

          <ImportFile campaignId={state?.Campaign.id} flag="false" />

          {/* 🔥 NEW EXPORT BUTTONS */}
          <button
            onClick={exportCSV}
            className="bg-blue-500 hover:bg-blue-700 transition text-white px-4 py-2 rounded-lg cursor-pointer"
          >
            Export CSV
          </button>

          <button
            onClick={exportExcel}
            className="bg-purple-500 hover:bg-purple-700 transition text-white px-4 py-2 rounded-lg cursor-pointer"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* --- rest of your UI remains unchanged --- */}

      {/* THE REST OF YOUR ORIGINAL CODE BELOW WITHOUT ANY CHANGE */}
      {/* -------------------------------------------------------- */}

      <div className="p-6 flex justify-between">
        <div className="flex">
          <>
            <select
              className="px-4 py-2 w-52 rounded-tl-lg rounded-bl-lg border border-gray-300 bg-white text-gray-700 shadow-sm
         hover:border-[#018ae0] transition cursor-pointer"
              onChange={(e) => setAgentId(e.target.value)}
            >
              <option value="" disabled selected>
                select agent
              </option>
              {agents.length &&
                agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
            </select>

            <button
              className="px-4 py-2 rounded-tr-lg rounded-br-lg border border-gray-300 bg-white text-gray-700 shadow-sm hover:border-[#018ae0] transition cursor-pointer"
              onClick={leadToAgent}
            >
              {currentFlag === 'true' ? 'Re-Assign' : 'Assign'}
            </button>
          </>
          <div className="px-6  flex items-center gap-3">
            <label
              htmlFor="selectlimit"
              className="text-sm font-medium text-gray-700"
            >
              Lead select limit:
            </label>

            <input
              id="selectlimit"
              value={selectLimit}
              type="number"
              step="50"
              onChange={(e) => setSelectLimit(Number(e.target.value))}
              className="px-3 py-2 w-20 rounded-lg border border-gray-300 bg-white 
     text-gray-700 shadow-sm focus:outline-none 
     focus:ring-1 focus:ring-[#018ae0] focus:border-[#018ae0] 
     transition"
            />
          </div>
        </div>

        <AssignToggle
          options={['Unassigned', 'Assigned', 'All']}
          onChange={(value) => {
            setCurrentFlag(value);
            dispatch(LeadThunk({ campaignId: state.Campaign.id, flag: value }));
          }}
        />
      </div>

      {currentFlag === 'true' && (
        <>
          <h2 className="font-bold text-xl font-serif">Filter Panel</h2>
          <div className=" p-6 flex items-center justify-between gap-10 bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition">
            {/* filters... */}
            <div className="flex gap-3">
              <div className="flex flex-col">
                <label htmlFor="">Filter by customer status</label>
                <div className="flex">
                  <select
                    name="status"
                    value={filterObj.status || ''}
                    className="px-4 py-2 w-52 rounded-tl-lg rounded-bl-lg border border-gray-300 bg-white text-gray-700 shadow-sm
         hover:border-[#018ae0] transition cursor-pointer"
                    onChange={(e) => handleFilters(e)}
                  >
                    <option value="" disabled selected>
                      customer status
                    </option>
                    {statusOption.length &&
                      statusOption.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                  </select>
                  <X
                    onClick={() => removeFilter('status')}
                    className="border-2 border border-gray-300 bg-white 
               text-gray-700 shadow-sm cursor-pointer rounded-br-lg rounded-tr-lg"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label htmlFor="">Filter by attempts</label>
                <div className="flex">
                  <select
                    name="attempts"
                    value={filterObj.attempts || ''}
                    className="px-4 py-2 w-52 rounded-tl-lg rounded-bl-lg border border-gray-300 bg-white text-gray-700 shadow-sm
         hover:border-[#018ae0] transition cursor-pointer"
                    onChange={(e) => handleFilters(e)}
                  >
                    <option value="" disabled selected>
                      attempts
                    </option>
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                  <X
                    onClick={() => removeFilter('attempts')}
                    className="border-2 border border-gray-300 bg-white text-gray-700 cursor-pointer rounded-br-lg rounded-tr-lg"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label htmlFor="">Filter by agent</label>
                <div className="flex">
                  <select
                    name="assigned_to"
                    value={filterObj.assigned_to || ''}
                    className="px-4 py-2 w-52 rounded-tl-lg rounded-bl-lg border border-gray-300 bg-white text-gray-700 shadow-sm
         hover:border-[#018ae0] transition cursor-pointer"
                    onChange={(e) => handleFilters(e)}
                  >
                    <option value="" disabled selected>
                      agent
                    </option>
                    {agents.length &&
                      agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name}
                        </option>
                      ))}
                  </select>
                  <X
                    onClick={() => removeFilter('assigned_to')}
                    className="border-2 border border-gray-300 bg-white text-gray-700 cursor-pointer rounded-br-lg rounded-tr-lg"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label htmlFor="">Filter by leads status</label>
                <div className="flex">
                  <select
                    name="doc_status"
                    value={filterObj.doc_status || ''}
                    className="px-4 py-2 w-52 rounded-tl-lg rounded-bl-lg border border-gray-300 bg-white text-gray-700 shadow-sm"
                    onChange={(e) => handleFilters(e)}
                  >
                    <option value="" disabled selected>
                      leads status
                    </option>
                    <option value="pending">Pending</option>
                    <option value="review">Review</option>
                    <option value="closed">Closed</option>
                  </select>
                  <X
                    onClick={() => removeFilter('doc_status')}
                    className="border-2 border border-gray-300 bg-white text-gray-700 cursor-pointer rounded-br-lg rounded-tr-lg"
                  />
                </div>
              </div>
            </div>

            <button
              className="bg-blue-400 hover:bg-blue-700 transition text-white px-4 py-2 rounded-lg cursor-pointer"
              onClick={() => applyFilters()}
            >
              Apply filters
            </button>
          </div>
        </>
      )}

      <div className="p-6">
        {customLoaderFlag ? (
          <CustomLoader screen="Lead import is currently running" />
        ) : (
          <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gradient-to-r from-[#018ae0] to-[#005bb5] text-white sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold min-w-[120px]">
                    <input
                      className="cursor-pointer"
                      type="checkbox"
                      onChange={(e) => selectAllLeades(e.target.checked)}
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold min-w-[120px]">
                    Sr no.
                  </th>
                  <th className="px-4 py-3 text-left font-semibold min-w-[180px]">
                    Campaign ID
                  </th>
                  <th className="px-4 py-3 text-left font-semibold min-w-[200px]">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold min-w-[200px]">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left font-semibold min-w-[240px]">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-semibold min-w-[200px]">
                    City
                  </th>
                  <th className="px-4 py-3 text-left font-semibold min-w-[200px]">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left font-semibold min-w-[200px]">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left font-semibold min-w-[160px]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold min-w-[160px]">
                    Reason
                  </th>
                  <th className="px-4 py-3 text-left font-semibold min-w-[180px]">
                    Assigned To
                  </th>
                  <th className="px-4 py-3 text-left font-semibold min-w-[160px]">
                    Attempts
                  </th>
                  <th className="px-4 py-3 text-left font-semibold min-w-[220px] whitespace-nowrap">
                    Last Call
                  </th>
                  <th className="px-4 py-3 text-left font-semibold min-w-[220px] whitespace-nowrap">
                    Follow-up At
                  </th>
                  <th className="px-4 py-3 text-left font-semibold min-w-[180px]">
                    Doc Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold min-w-[260px]">
                    Remarks
                  </th>
                  <th className="px-4 py-3 text-left font-semibold min-w-[220px] whitespace-nowrap">
                    Created At
                  </th>
                  <th className="px-4 py-3 text-left font-semibold min-w-[220px] whitespace-nowrap">
                    Updated At
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {leads.length === -1 ? (
                  <tr>
                    <td colSpan={18} className="flex justify-center">
                      <Loader className="animate-spin" size={24} />
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr className="">
                    <td
                      colSpan={18}
                      className="pl-[650px] py-5 font-semibold text-xl"
                    >
                      Need to Import some Leads
                    </td>
                  </tr>
                ) : (
                  leads?.map((lead, index) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-blue-50 transition-colors odd:bg-white even:bg-gray-50"
                    >
                      {
                        lead.status === "Qualified" || lead.attempts === "3" ? 
                      <td className="px-4 py-3 min-w-[100px]">--</td>
                        :
                      <td className="px-4 py-3 min-w-[100px]">
                        <input
                          className="cursor-pointer"
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={(e) =>
                            individualLeadSelect(lead.id, e.target.checked)
                          }
                        />
                      </td>
                      }

                      <td className="px-4 py-3 min-w-[100px]">{index + 1}</td>
                      <td className="px-4 py-3 min-w-[160px]">
                        {lead.campaign_id}
                      </td>
                      <td className="px-4 py-3 min-w-[180px] font-medium text-gray-900">
                        {lead.name}
                      </td>
                      <td className="px-4 py-3 min-w-[180px]">{lead.phone}</td>
                      <td className="px-4 py-3 min-w-[220px]">{lead.email}</td>
                      <td className="px-4 py-3 min-w-[180px]">{lead.city}</td>
                      <td className="px-4 py-3 min-w-[180px]">
                        {lead.product}
                      </td>
                      <td className="px-4 py-3 min-w-[180px]">{lead.source}</td>
                      <td className="px-4 py-3 min-w-[140px]">
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 min-w-[140px]">
                        {lead.reason || '- -'}
                      </td>
                      <td className="px-4 py-3 min-w-[160px]">
                        {agents.filter(
                          (agent) => agent.id === lead.assigned_to
                        )[0]?.name || 'Not Assigned'}
                      </td>
                      <td className="px-4 py-3 min-w-[140px]">
                        {lead.attempts}
                      </td>
                      <td className="px-4 py-3 min-w-[200px] whitespace-nowrap">
                        {lead.last_call || '- -'}
                      </td>
                      <td className="px-4 py-3 min-w-[200px] whitespace-nowrap">
                        {lead.followup_at || '- -'}
                      </td>
                      <td className="px-4 py-3 min-w-[160px]">
                        <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
                          {lead.doc_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 min-w-[240px]">
                        {lead.remarks || '- -'}
                      </td>
                      <td className="px-4 py-3 min-w-[200px] whitespace-nowrap">
                        {formatDate(lead.created_at)}
                      </td>
                      <td className="px-4 py-3 min-w-[200px] whitespace-nowrap">
                        {formatDate(lead.updated_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lead;
