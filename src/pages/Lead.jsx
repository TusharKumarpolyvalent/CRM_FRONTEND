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

  // 🔥 Date range filter state
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const [editingChecked, setEditingChecked] = useState({});

  // Function to parse reassign data from database
  const getReassignDisplay = (reassignValue) => {
    if (!reassignValue) return null;
    
    try {
      return JSON.parse(reassignValue);
    } catch (error) {
      // If it's not valid JSON, return simple object
      console.error('Error parsing reassign data:', error);
      return {
        agentId: reassignValue,
        agentName: agents.find(a => a.id === reassignValue)?.name || reassignValue,
        timestamp: new Date().toISOString()
      };
    }
  };

  const handleMultiFilter = (key, value) => {
    setFilterObj((prev) => {
      const alreadySelected = prev[key].includes(value);

      return {
        ...prev,
        [key]: alreadySelected
          ? prev[key].filter((v) => v !== value)
          : [...prev[key], value],
      };
    });
  };

  const clearSingleFilter = (key) => {
    const newFilterObj = { ...filterObj, [key]: [] };
    setFilterObj(newFilterObj);

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
    console.log('🔍 Current leadsData:', {
      loading: leadsData.loader,
      count: leadsData.data?.length,
      error: leadsData.error,
      dataType: typeof leadsData.data,
      isArray: Array.isArray(leadsData.data)
    });
  }, [leadsData]);
  
  useEffect(() => {
    console.log('🔄 Setting leads from leadsData.data:', leadsData.data?.length);
    
    if (leadsData.data && Array.isArray(leadsData.data)) {
      console.log('✅ Setting leads:', leadsData.data.length, 'items');
      setLeads([...leadsData.data]);
    } else {
      console.warn('❌ leadsData.data is not an array:', leadsData.data);
      setLeads([]);
    }
  }, [leadsData.data, currentFlag]);

  useEffect(() => {
    if (!(state && state.Campaign && state.Campaign.id)) {
      checkAuth(navigate);
    }
    if (state && state.Campaign) {
      const today = new Date().toISOString().split('T')[0];
      dispatch(
        LeadThunk({
          campaignId: state.Campaign.id,
          flag: currentFlag,
          date: today,
        })
      );
      dispatch(UsersThunk('agent'));
    }
  }, []);

  // 🔥 Handle date range change
  const handleDateRangeChange = () => {
    if (!dateRange.from || !dateRange.to) {
      warningToast('Please select both From and To dates');
      return;
    }

    if (new Date(dateRange.from) > new Date(dateRange.to)) {
      warningToast('From date cannot be greater than To date');
      return;
    }
    
    console.log('Applying date range:', dateRange.from, 'to', dateRange.to);
    
    dispatch(
      LeadThunk({
        campaignId: state.Campaign.id,
        flag: currentFlag,
        fromDate: dateRange.from,
        toDate: dateRange.to
      })
    ).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        const leadCount = result.payload?.length || 0;
        if (leadCount > 0) {
          successToast(`Loaded ${leadCount} leads from ${dateRange.from} to ${dateRange.to}`);
        } else {
          warningToast(`No leads found from ${dateRange.from} to ${dateRange.to}`);
        }
      }
    }).catch((error) => {
      console.error('Failed to fetch leads:', error);
      warningToast('Failed to load leads');
    });
  };

  const resetToToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setDateRange({
      from: today,
      to: today
    });
    
    console.log('Resetting to today:', today);
    
    dispatch(
      LeadThunk({
        campaignId: state.Campaign.id,
        flag: currentFlag,
        date: today
      })
    ).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        successToast("Today's leads loaded");
      }
    }).catch((error) => {
      console.error('Failed to fetch today\'s leads:', error);
      warningToast('Failed to load leads');
    });
  };

  const handleCheckedClientLead = async (leadId, value) => {
    const lead = leads.find((l) => l.id === leadId);
    const wasChecked = lead?.checkedclientlead;

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
    let tempLeads = [...leadsData.data];

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

 // Lead.js में leadToAgent function में debug code add करें:

const leadToAgent = async () => {
  if (!selectedLeads.length)
    return warningToast('Please select at least one lead');
  if (!agentId) return warningToast('Please select an Agent');

  try {
    // DEBUG: Check current state
    console.log('🔍 Debug selected leads:', {
      selectedLeads,
      leadsCount: leads.length,
      firstLeadId: selectedLeads[0]
    });
    
    // Get all selected leads (not just first one)
    const selectedLeadData = leads.filter(lead => selectedLeads.includes(lead.id));
    
    console.log('🔍 Selected lead data:', {
      count: selectedLeadData.length,
      leads: selectedLeadData.map(lead => ({
        id: lead.id,
        name: lead.name,
        currentlyAssignedTo: lead.assigned_to,
        hasReassign: !!lead.reassign
      }))
    });
    
    // Check if ANY selected lead is already assigned to someone
    const hasPreviouslyAssignedLeads = selectedLeadData.some(lead => 
      lead.assigned_to && lead.assigned_to !== ''
    );
    
    console.log('🔍 Reassign check:', {
      currentFlag,
      hasPreviouslyAssignedLeads,
      selectedLeadCount: selectedLeadData.length
    });
    
    // Determine if this is a reassign operation
    const isReassign = hasPreviouslyAssignedLeads;
    
    // Prepare reassign data if any lead was previously assigned
    let reassignData = null;
    
    if (isReassign) {
      // Get previous agent info from the first lead that was assigned
      const previouslyAssignedLead = selectedLeadData.find(lead => lead.assigned_to);
      const previousAgentId = previouslyAssignedLead?.assigned_to;
      
      reassignData = {
        previousAgentId,
        previousAgentName: agents.find(a => a.id === previousAgentId)?.name || previousAgentId,
        reassignedBy: user.id,
        reassignedByName: user.name,
        reassignedAt: new Date().toISOString(),
        reason: 'Manual reassign from admin panel',
        totalLeadsReassigned: selectedLeads.length,
        previousAssignmentCount: selectedLeadData.filter(lead => lead.assigned_to).length
      };
      
      console.log('📤 Prepared reassignData:', reassignData);
    }

    await dispatch(
      AssignLeadThunk({
        leadIds: selectedLeads,
        agentId,
        campaignId: state.Campaign.id,
        flag: currentFlag,
        reassignData: reassignData ? JSON.stringify(reassignData) : null,
        from: dateRange.from,
        to: dateRange.to
      })
    );

    successToast(
      isReassign
        ? `${selectedLeads.length} leads reassigned successfully`
        : `${selectedLeads.length} leads assigned successfully`
    );

    // Refresh leads with current filters
    dispatch(
      LeadThunk({
        campaignId: state.Campaign.id,
        flag: currentFlag,
        fromDate: dateRange.from,
        toDate: dateRange.to,
      })
    ).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        // Check if reassign data was saved
        const updatedLeads = result.payload || [];
        const leadsWithReassign = updatedLeads.filter(lead => lead.reassign);
        
        console.log('🔄 After refresh:', {
          totalLeads: updatedLeads.length,
          leadsWithReassign: leadsWithReassign.length,
          sampleReassign: leadsWithReassign[0]?.reassign
        });
      }
    });

    setSelectedLeads([]);
    setAgentId(''); // Reset agent selection
  } catch (error) {
    console.error('❌ Error in leadToAgent:', error);
    warningToast('Failed to assign leads');
  }
};


  const clearReassignStatus = async (leadId) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/clear-reassign`,
        { leadId }
      );

      // Update local state
      setLeads(prevLeads =>
        prevLeads.map(lead =>
          lead.id === leadId
            ? { ...lead, reassign: null }
            : lead
        )
      );

      successToast('Reassign status cleared');
    } catch (error) {
      console.error('Error clearing reassign status:', error);
      warningToast('Failed to clear reassign status');
    }
  };

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

      {/* 🔥 UPDATED DATE FILTER SECTION */}
      <div className="p-6 flex justify-between">
        <div className='flex gap-10'>
          {/* Date Range Filter */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 shadow-sm
                  transition focus:outline-none focus:border-[#018ae0] focus:ring-2 focus:ring-[#018ae0]/30
                  hover:border-[#018ae0]"
              />
            </div>
            
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 shadow-sm
                  transition focus:outline-none focus:border-[#018ae0] focus:ring-2 focus:ring-[#018ae0]/30
                  hover:border-[#018ae0]"
              />
            </div>
            
            <div className="flex items-end gap-2">
              <button
                onClick={handleDateRangeChange}
                className="px-4 py-2 bg-[#018ae0] hover:bg-[#005bb5] text-white rounded-lg transition"
              >
                Apply Date
              </button>
              
              <button
                onClick={resetToToday}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Today
              </button>
            </div>
          </div>

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
                onClick={leadToAgent}
                className={`px-4 py-2 rounded-tr-lg rounded-br-lg shadow-sm transition cursor-pointer
                  ${
                    currentFlag === 'true'
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }
                `}
              >
                {currentFlag === 'true' ? 'Re-Assign' : 'Assign'}
              </button>
            </>
            
            <div className="px-6 flex items-center gap-3">
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
            
            if (dateRange.from && dateRange.to) {
              dispatch(
                LeadThunk({
                  campaignId: state.Campaign.id,
                  flag: value,
                  fromDate: dateRange.from,
                  toDate: dateRange.to
                })
              );
            } else {
              const today = new Date().toISOString().split('T')[0];
              dispatch(
                LeadThunk({
                  campaignId: state.Campaign.id,
                  flag: value,
                  date: today
                })
              );
            }
          }}
        />
      </div>

      {/* Rest of your component remains the same */}
      {currentFlag === 'true' && (
        <>
          <h2 className="font-bold text-xl font-serif">Filter Panel</h2>
          <div className="p-6 flex items-center justify-between gap-10 bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition">
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
                  {/* ✅ New Reassign Status Column */}
                  <th className="px-4 py-3 text-left font-semibold min-w-[160px]">
                    Reassign Status
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
                {leadsData.loader ? (
                  <tr>
                    <td colSpan={22} className="text-center py-10">
                      <div className="flex justify-center items-center">
                        <Loader className="animate-spin mr-3" size={24} />
                        <span>Loading leads...</span>
                      </div>
                    </td>
                  </tr>
                ) : 
                leads?.length === 0 ? (
                  <tr>
                    <td colSpan={22} className="text-left py-10 px-15">
                      <div className="text-gray-500 text-lg">
                        📭 No leads found
                        {dateRange.from && dateRange.to && (
                          <div className="text-m mt-2 text-gray-400">
                            Date Range: {dateRange.from} to {dateRange.to}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  leads?.map((lead, index) => {
                    const agentName = agents.find(agent => agent.id === lead.assigned_to)?.name || 'Not Assigned';
                    const reassignData = getReassignDisplay(lead.reassign);
                    
                    // Check if reassign is within 24 hours for highlighting
                const isReassigned = !!lead.reassign;

                    return (
                     <tr
  className={`
    transition-colors
    ${
      isReassigned
        ? 'bg-orange-50 hover:bg-orange-100'
        : 'hover:bg-blue-50 odd:bg-white even:bg-gray-50'
    }
  `}
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
                          {agentName}
                        </td>
                        <td className="px-4 py-3 min-w-[140px]">
                          {lead.attempts}
                        </td>
                        
                        {/* ✅ New Reassign Status Cell - Database से data लें */}
                      <td>
  {lead.reassign ? (
    <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
      🔄 Reassigned
    </span>
  ) : (
    '--'
  )}
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
                    );
                  })
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