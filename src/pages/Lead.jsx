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
import axios from "axios";
import { successToast } from '../helpers/Toast';
import MultiSelectDropdown from '../components/MultiSelectDropdown';

const Lead = () => {
  const [selectLimit, setSelectLimit] = useState(
    import.meta.env.VITE_LEAD_SELECT_LIMIT
  );
  const user = useSelector((store) => store.loggedInUser.data);

  const [currentFlag, setCurrentFlag] = useState('false');
  console.log('CURRENT FLAG:', currentFlag);

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

const [filterObj, setFilterObj] = useState({
  status: [],
  attempts: [],
  assigned_to: [],
  doc_status: [],
});

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
 const [editingChecked, setEditingChecked] = useState({});

const handleMultiFilter = (key, value) => {
  setFilterObj((prev) => {
    const alreadySelected = prev[key].includes(value);

    return {
      ...prev,
      [key]: alreadySelected
        ? prev[key].filter((v) => v !== value) // remove
        : [...prev[key], value], // add
    };
  });
};
const clearSingleFilter = (key) => {
  // 1️⃣ sirf selected filter ko empty karo
  const newFilterObj = { ...filterObj, [key]: [] };
  setFilterObj(newFilterObj);

  // 2️⃣ updated filter object ke hisaab se leads ko filter karo
  let tempLeads = [...leadsData.data];

  if (newFilterObj.status.length) {
    tempLeads = tempLeads.filter((lead) =>
      newFilterObj.status.includes(lead.status)
    );
  }

  if (newFilterObj.attempts.length) {
    tempLeads = tempLeads.filter((lead) =>
      newFilterObj.attempts.includes(lead.attempts.toString())
    );
  }

  if (newFilterObj.assigned_to.length) {
    tempLeads = tempLeads.filter((lead) =>
      newFilterObj.assigned_to.includes(lead.assigned_to)
    );
  }

  if (newFilterObj.doc_status.length) {
    tempLeads = tempLeads.filter((lead) =>
      newFilterObj.doc_status.includes(lead.doc_status)
    );
  }

  setLeads(tempLeads);
};




  useEffect(() => {
    setLeads(leadsData.data);
  }, [leadsData.data]);

  useEffect(() => {
    if (!(state && state.Campaign && state.Campaign.id)) {
      checkAuth(navigate);
    }
    if (state && state.Campaign) {
      dispatch(
        LeadThunk({
          campaignId: state.Campaign.id,
          flag: currentFlag,
          date: selectedDate,
        })
      );
      dispatch(UsersThunk('agent'));
    }
  }, []);


  useEffect(() => {
    console.log("date useeffect");

    dispatch(
      LeadThunk({
        campaignId: state.Campaign.id,
        flag: currentFlag,
        date: selectedDate,
      })
    );
  }, [selectedDate]);



const handleCheckedClientLead = async (leadId, value) => {
  const lead = leads.find((l) => l.id === leadId);
  const wasChecked = lead?.checkedclientlead;

  // Optimistic UI update
  setLeads((prevLeads) =>
    prevLeads.map((lead) =>
      lead.id === leadId
        ? { ...lead, checkedclientlead: value }
        : lead
    )
  );

  try {
    await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/admin/checked-client-lead/${leadId}`,
      { checkedclientlead: value }
    );

    if (wasChecked && !value) {
      successToast('Edit successfully');
    } else {
      successToast('Checked client lead updated');
    }

    setEditingChecked({ ...editingChecked, [leadId]: false });
  } catch (error) {
    // revert UI on failure
    setLeads((prevLeads) =>
      prevLeads.map((lead) =>
        lead.id === leadId
          ? { ...lead, checkedclientlead: wasChecked }
          : lead
      )
    );
    warningToast('Failed to update checked client lead');
  }
};
const clearAllFilters = () => {
  setFilterObj({
    status: [],
    attempts: [],
    assigned_to: [],
    doc_status: [],
  });

  setLeads(leadsData.data);
};




  const handleFilters = (e) => {
    setFilterObj({ ...filterObj, [e.target.name]: e.target.value });
  };

  const removeFilter = (key) => {
    let obj = { ...filterObj };
    delete obj[key];
    setFilterObj(obj);
  };
const applyFilters = () => {
  let tempLeads = [...leadsData.data]; // ALWAYS original data

  if (filterObj.status.length > 0) {
    tempLeads = tempLeads.filter((lead) =>
      filterObj.status.includes(lead.status)
    );
  }

  if (filterObj.attempts.length > 0) {
    tempLeads = tempLeads.filter((lead) =>
      filterObj.attempts.includes(lead.attempts.toString())
    );
  }

  if (filterObj.assigned_to.length > 0) {
    tempLeads = tempLeads.filter((lead) =>
      filterObj.assigned_to.includes(lead.assigned_to)
    );
  }

  if (filterObj.doc_status.length > 0) {
    tempLeads = tempLeads.filter((lead) =>
      filterObj.doc_status.includes(lead.doc_status)
    );
  }

  setLeads(tempLeads);
};

useEffect(() => {
  console.log('FILTER OBJ:', filterObj);
}, [filterObj]);


  const selectAllLeades = (val) => {
    if (val) {
      let leadInLimit = leads
        .filter((lead, index) => index + 1 <= selectLimit)
        .filter((lead) => lead.status !== 'Qualified' && lead.attempts !== '3');
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

      <div className="p-6 flex justify-between ">
        <div className='flex gap-10'>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="
    px-4 py-2
    border border-gray-300
    rounded-lg
    bg-white
    text-gray-700
    shadow-sm
    transition
    focus:outline-none
    focus:border-[#018ae0]
    focus:ring-2
    focus:ring-[#018ae0]/30
    hover:border-[#018ae0]
  "
          />

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
        </div>
<AssignToggle
  options={[
    { label: 'Unassigned', value: 'false' },
    { label: 'Assigned', value: 'true' },
    { label: 'All', value: 'all' },
  ]}
  onChange={(value) => {
    setCurrentFlag(value);
    dispatch(
      LeadThunk({
        campaignId: state.Campaign.id,
        flag: value,
        date: selectedDate,
      })
    );
  }}
/>


      </div>

   {currentFlag === 'true' && (
  <>
    <h2 className="font-bold text-xl font-serif">Filter Panel</h2>
    <div className="p-6 flex items-center justify-between gap-10 bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition">

      {/* --- FILTERS --- */}
      <div className="flex gap-3">

        {/* Customer Status */}
        <div className="relative">
          <MultiSelectDropdown
            label="Customer Status"
            placeholder="Select status"
            options={[
              { label: 'All', value: 'all' },
              ...statusOption.map((s) => ({ label: s, value: s })),
            ]}
            selected={filterObj.status}
            onChange={(vals) => {
              if (vals.includes('all')) {
                setFilterObj((p) => ({ ...p, status: [] }));
              } else {
                setFilterObj((p) => ({ ...p, status: vals }));
              }
            }}
          />
          {filterObj.status.length > 0 && (
            <X
              size={14}
              className="absolute right-2 top-9 cursor-pointer text-gray-500 hover:text-red-500"
              onClick={() => clearSingleFilter('status')}
            />
          )}
        </div>

        {/* Attempts */}
        <div className="relative">
          <MultiSelectDropdown
            label="Attempts"
            placeholder="Select attempts"
            options={[
              { label: 'All', value: 'all' },
              ...[0, 1, 2, 3].map((n) => ({ label: n.toString(), value: n.toString() })),
            ]}
            selected={filterObj.attempts}
            onChange={(vals) => {
              if (vals.includes('all')) {
                setFilterObj((p) => ({ ...p, attempts: [] }));
              } else {
                setFilterObj((p) => ({ ...p, attempts: vals }));
              }
            }}
          />
          {filterObj.attempts.length > 0 && (
            <X
              size={14}
              className="absolute right-2 top-9 cursor-pointer text-gray-500 hover:text-red-500"
              onClick={() => clearSingleFilter('attempts')}
            />
          )}
        </div>

        {/* Agent */}
        <div className="relative">
          <MultiSelectDropdown
            label="Agent"
            placeholder="Select agents"
            options={[
              { label: 'All', value: 'all' },
              ...agents.map((a) => ({ label: a.name, value: a.id })),
            ]}
            selected={filterObj.assigned_to}
            onChange={(vals) => {
              if (vals.includes('all')) {
                setFilterObj((p) => ({ ...p, assigned_to: [] }));
              } else {
                setFilterObj((p) => ({ ...p, assigned_to: vals }));
              }
            }}
          />
          {filterObj.assigned_to.length > 0 && (
            <X
              size={14}
              className="absolute right-2 top-9 cursor-pointer text-gray-500 hover:text-red-500"
              onClick={() => clearSingleFilter('assigned_to')}
            />
          )}
        </div>

        {/* Lead Status */}
        <div className="relative">
          <MultiSelectDropdown
            label="Lead Status"
            placeholder="Select lead status"
            options={[
              { label: 'All', value: 'all' },
              { label: 'pending', value: 'pending' },
              { label: 'review', value: 'review' },
              { label: 'closed', value: 'closed' },
            ]}
            selected={filterObj.doc_status}
            onChange={(vals) => {
              if (vals.includes('all')) {
                setFilterObj((p) => ({ ...p, doc_status: [] }));
              } else {
                setFilterObj((p) => ({ ...p, doc_status: vals }));
              }
            }}
          />
          {filterObj.doc_status.length > 0 && (
            <X
              size={14}
              className="absolute right-2 top-9 cursor-pointer text-gray-500 hover:text-red-500"
              onClick={() => clearSingleFilter('doc_status')}
            />
          )}
        </div>

      </div>

      {/* Apply / Clear All Buttons */}
      <div className="flex gap-3">
        <button
          className="bg-blue-400 hover:bg-blue-700 transition text-white px-4 py-2 rounded-lg cursor-pointer"
          onClick={applyFilters}
        >
          Apply filters
        </button>
        <button
          className="bg-gray-300 hover:bg-gray-400 transition text-gray-800 px-4 py-2 rounded-lg cursor-pointer"
          onClick={clearAllFilters}
        >
          Clear Filters
        </button>
      </div>

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
                    Pincode
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
                  <th className="px-4 py-3 text-left font-semibold min-w-[220px] whitespace-nowrap">
                    passed to client
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {leads?.length === -1 ? (
                  <tr>
                    <td colSpan={18} className="flex justify-center">
                      <Loader className="animate-spin" size={24} />
                    </td>
                  </tr>
                ) : leads?.length === 0 ? (
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
                      {lead.status === 'Qualified' || lead.attempts === '3' ? (
                        <td className="px-4 py-3 min-w-[100px]">--</td>
                      ) : (
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
                      )}

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
                      <td className="px-4 py-3 min-w-[180px]">{lead.pincode}</td>
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
                      <td className="px-4 py-3 min-w-[140px] text-center">
                       {user.role === 'admin' ? (
  <>
    {lead.checkedclientlead && !editingChecked[lead.id] ? (
      <>
        <span className="text-green-700 font-semibold">Checked</span>
        <button
          className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-xs"
          onClick={() =>
            setEditingChecked({ ...editingChecked, [lead.id]: true })
          }
        >
          Edit
        </button>
      </>
    ) : (
      <input
        type="checkbox"
        checked={lead.checkedclientlead}
        onChange={(e) =>
          handleCheckedClientLead(lead.id, e.target.checked)
        }
        onBlur={() =>
          setEditingChecked({ ...editingChecked, [lead.id]: false })
        }
      />
    )}
  </>
) : lead.checkedclientlead ? (
  <span className="text-green-700 font-semibold">Checked</span>
) : (
  <span>- -</span>
)}

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
