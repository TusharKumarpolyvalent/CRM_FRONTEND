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
import { statusOption, statusReasons } from '../utils/constant';
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
  console.log("leaaaaaaad", leads);
  const [selectedAgentForCount, setSelectedAgentForCount] = useState('');

  
  const { showAddLeadsModal, setShowAddLeadsModal } = useGlobalContext();
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [agentId, setAgentId] = useState('');
  
  // 🔥 Count by specific date
  const [callCountDate, setCallCountDate] = useState(new Date().toISOString().split('T')[0]);
  const [callCount, setCallCount] = useState(0);

  // 🔥 NEW: Separate reassign filter state
  const [reassignFilter, setReassignFilter] = useState('all'); // 'all', 'reassigned', 'not-reassigned'

  const [filterObj, setFilterObj] = useState({
    status: [],
    status_reason: [],
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

const handleCallCount = async () => {
  if (!callCountDate) {
    warningToast('Please select a date');
    return;
  }

  if (!selectedAgentForCount) {
    warningToast('Please select an agent');
    return;
  }

  try {
    const res = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/admin/daily-call-count`,
      {
        params: {
          agentId: selectedAgentForCount,
          date: callCountDate,
        },
      }
    );

    if (res.data.success) {
      setCallCount(res.data.count || 0);
      successToast(
        `Calls on ${callCountDate}: ${res.data.count || 0}`
      );
    } else {
      setCallCount(0);
      warningToast('No data found');
    }
  } catch (error) {
    console.error('Daily call count error:', error);
    setCallCount(0);
    warningToast('Failed to fetch call count');
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
    if (key === 'reassign') {
      setReassignFilter('all');
      return;
    }

    const newFilterObj = { ...filterObj, [key]: [] };

    // ✅ status clear hua to sub-status bhi clear
    if (key === 'status') {
      newFilterObj.status_reason = [];
    }

    setFilterObj(newFilterObj);

    let tempLeads = [...leadsData.data];

    // ✅ Apply reassign filter (if any)
    if (reassignFilter === 'reassigned') {
      tempLeads = tempLeads.filter((lead) => !!lead.reassign);
    } else if (reassignFilter === 'not-reassigned') {
      tempLeads = tempLeads.filter((lead) => !lead.reassign);
    }

    // ✅ Status filter (reassigned option removed)
    if (newFilterObj.status.length > 0) {
      tempLeads = tempLeads.filter((lead) =>
        newFilterObj.status.includes(lead.status)
      );
    }

    // ✅ Status Sub Status filter
    if (newFilterObj.status_reason.length > 0) {
      tempLeads = tempLeads.filter((lead) =>
        newFilterObj.status_reason.includes(lead.reason)
      );
    }

    // attempts
    if (newFilterObj.attempts.length > 0) {
      tempLeads = tempLeads.filter((lead) =>
        newFilterObj.attempts.includes(lead.attempts.toString())
      );
    }

    // agent
    if (newFilterObj.assigned_to.length > 0) {
      tempLeads = tempLeads.filter((lead) =>
        newFilterObj.assigned_to.includes(lead.assigned_to)
      );
    }

    // doc status
    if (newFilterObj.doc_status.length > 0) {
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
      console.log('✅ Anushkaa:', leadsData.data.length, 'items');
      setLeads([...leadsData.data]);
    } else {
      console.warn('Anushkaa leadsData.data is not an array :', leadsData.data);
      setLeads([]);
    }
  }, [leadsData.data]);

  // 🔥 FIXED: Initial load - fetch agents only
  useEffect(() => {
    if (!(state && state.Campaign && state.Campaign.id)) {
      checkAuth(navigate);
    }
    if (state && state.Campaign) {
      dispatch(UsersThunk('agent'));
    }
  }, []);

  // 🔥 FIXED: Fetch leads when flag or date range changes
  useEffect(() => {
    if (state && state.Campaign) {
      const params = {
        campaignId: state.Campaign.id,
        flag: currentFlag,
      };
      
      // Use date range if both dates are selected
      if (dateRange.from && dateRange.to) {
        params.fromDate = dateRange.from;
        params.toDate = dateRange.to;
      } else {
        // Default to today if no date range
        params.date = new Date().toISOString().split('T')[0];
      }
      
      dispatch(LeadThunk(params));
    }
  }, [currentFlag, dateRange.from, dateRange.to, state?.Campaign?.id]);

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
    setReassignFilter('all');
    setFilterObj({
      status: [],
      status_reason: [],
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

    // ✅ NEW: Apply reassign filter FIRST
    if (reassignFilter === 'reassigned') {
      tempLeads = tempLeads.filter((lead) => !!lead.reassign);
    } else if (reassignFilter === 'not-reassigned') {
      tempLeads = tempLeads.filter((lead) => !lead.reassign);
    }

    // ✅ Status filter (reassigned option removed)
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

    if (filterObj.status_reason.length > 0) {
      tempLeads = tempLeads.filter((lead) =>
        filterObj.status_reason.includes(lead.reason)
      );
    }

    setLeads(tempLeads);
  };

  useEffect(() => {
    console.log('FILTER OBJ:', filterObj);
    console.log('REASSIGN FILTER:', reassignFilter);
  }, [filterObj, reassignFilter]);

  const selectAllLeades = (val) => {
    if (val) {
      let leadInLimit = leads
        .filter((lead, index) => index + 1 <= selectLimit)
        .filter((lead) => lead.status !== 'Qualified');

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

  const leadToAgent = async () => {
    if (!selectedLeads.length)
      return warningToast('Please select at least one lead');
    if (!agentId) return warningToast('Please select an Agent');

    try {
      await dispatch(
        AssignLeadThunk({
          leadIds: selectedLeads,
          agentId,
          campaignId: state.Campaign.id,
          flag: currentFlag,
        })
      );

      successToast(
        currentFlag === 'true'
          ? 'Leads reassigned successfully'
          : 'Leads assigned successfully'
      );

      // Refresh leads after assignment
      const params = {
        campaignId: state.Campaign.id,
        flag: currentFlag,
      };
      
      if (dateRange.from && dateRange.to) {
        params.fromDate = dateRange.from;
        params.toDate = dateRange.to;
      } else {
        params.date = new Date().toISOString().split('T')[0];
      }
      
      dispatch(LeadThunk(params));

      setSelectedLeads([]);
    } catch (error) {
      console.error(error);
      warningToast('Failed to assign leads');
    }
  };

  const getCombinedStatusReasons = () => {
    let reasons = [];

    filterObj.status.forEach((status) => {
      if (statusReasons[status]) {
        reasons.push(...statusReasons[status]);
      }
    });

    // duplicate hata do
    return [...new Set(reasons)];
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
    <div className="p-6 space-y-6">
      {showAddLeadsModal && (
        <AddLeads campaignId={state.Campaign.id} flag="false" />
      )}
      
      {/* Campaign Header Card and Actions */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Campaign Info Card */}
        <div className="flex-1 bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300">
          <div className="p-6 space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">
              {state?.Campaign.name}
            </h2>
            <p className="text-gray-600">{state?.Campaign.description}</p>
            
            <div className="flex flex-wrap gap-3">
              <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                ID: {state?.Campaign.id}
              </span>
              
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

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-4 justify-center items-center">
          <Card 
            content="Total Leads" 
            count={leadsData.data?.length} 
            className="min-w-[180px]"
          />
          
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setShowAddLeadsModal(true)}
              className="bg-green-500 hover:bg-green-600 transition-all duration-200 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm hover:shadow-md"
            >
              Create Leads
            </button>

            <ImportFile campaignId={state?.Campaign.id} flag="false" />

            <button
              onClick={exportCSV}
              className="bg-blue-500 hover:bg-blue-600 transition-all duration-200 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm hover:shadow-md"
            >
              Export CSV
            </button>

            <button
              onClick={exportExcel}
              className="bg-purple-500 hover:bg-purple-600 transition-all duration-200 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm hover:shadow-md"
            >
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Date Filters and Assignment Controls */}
     <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-6">

  {/* DATE + CALL COUNT SECTION */}
  <div className="flex flex-col xl:flex-row gap-6 justify-between">

    {/* LEFT SIDE - DATE RANGE */}
    <div className="flex flex-wrap items-end gap-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">
          From
        </label>
        <input
          type="date"
          value={dateRange.from}
          onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
          className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#018ae0]/40 focus:border-[#018ae0]"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">
          To
        </label>
        <input
          type="date"
          value={dateRange.to}
          onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
          className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#018ae0]/40 focus:border-[#018ae0]"
        />
      </div>

      <button
        onClick={handleDateRangeChange}
        className="px-5 py-2.5 bg-[#018ae0] hover:bg-[#005bb5] text-white rounded-xl font-medium transition"
      >
        Apply
      </button>

      <button
        onClick={resetToToday}
        className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition"
      >
        Today
      </button>
    </div>

    {/* RIGHT SIDE - CALL COUNT */}
   {/* RIGHT SIDE - DAILY CALL COUNT */}
<div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition w-full">

  <div className="flex flex-col xl:flex-row items-end gap-5">

    {/* Agent */}
    <div className="flex flex-col w-full xl:w-56">
      <label className="text-xs font-semibold text-gray-600 mb-1">
        Select Agent
      </label>
      <select
        value={selectedAgentForCount}
        onChange={(e) => setSelectedAgentForCount(e.target.value)}
        className="h-11 px-4 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
      >
        <option value="">Select Agent</option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name}
          </option>
        ))}
      </select>
    </div>

    {/* Date */}
    <div className="flex flex-col w-full xl:w-48">
      <label className="text-xs font-semibold text-gray-600 mb-1">
        Select Date
      </label>
      <input
        type="date"
        value={callCountDate}
        onChange={(e) => setCallCountDate(e.target.value)}
        className="h-11 px-4 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
      />
    </div>

    {/* Buttons */}
    <div className="flex gap-3 w-full xl:w-auto">
      <button
        onClick={handleCallCount}
        className="h-11 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition shadow-sm"
      >
        Get Count
      </button>

      <button
        onClick={() => {
          setCallCount(0);
          setCallCountDate(new Date().toISOString().split('T')[0]);
          setSelectedAgentForCount('');
        }}
        className="h-11 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition"
      >
        Reset
      </button>
    </div>

    {/* Result KPI */}
    {selectedAgentForCount && (
      <div className="xl:ml-auto w-full xl:w-auto mt-4 xl:mt-0">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl shadow-md text-center min-w-[160px]">
          <div className="text-xs uppercase tracking-wide opacity-80">
            Total Calls
          </div>
          <div className="text-3xl font-bold">
            {callCount}
          </div>
        </div>
      </div>
    )}

  </div>
</div>


  </div>

  {/* ASSIGNMENT SECTION */}
  <div className="flex flex-wrap justify-between items-center gap-4 pt-4 border-t border-gray-100">

    <div className="flex gap-3 items-center">
      <select
        onChange={(e) => setAgentId(e.target.value)}
        defaultValue=""
        className="px-4 py-2.5 w-52 border border-gray-300 rounded-l-xl"
      >
        <option value="" disabled>Select Agent</option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name}
          </option>
        ))}
      </select>

      <button
        onClick={leadToAgent}
        className={`px-5 py-2.5 rounded-r-xl font-medium text-white transition ${
          currentFlag === 'true'
            ? 'bg-orange-500 hover:bg-orange-600'
            : 'bg-green-500 hover:bg-green-600'
        }`}
      >
        {currentFlag === 'true' ? 'Reassign' : 'Assign'}
      </button>
    </div>

    <AssignToggle
      options={[
        { label: 'Unassigned', value: 'false' },
        { label: 'Assigned', value: 'true' },
        { label: 'All', value: 'all' },
      ]}
      onChange={(value) => setCurrentFlag(value)}
    />
  </div>
</div>


      {/* Filter Panel (Only for Assigned Leads) */}
      {currentFlag === 'true' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 font-sans">Filter Panel</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              {/* Filter Options */}
              <div className="flex flex-wrap gap-4 flex-1">
                {/* 🔥 NEW: Reassign Status Filter */}
                <div className="relative min-w-[180px]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reassign Status
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700
                      shadow-sm transition focus:outline-none focus:border-[#018ae0] 
                      focus:ring-2 focus:ring-[#018ae0]/30 hover:border-[#018ae0]"
                    value={reassignFilter}
                    onChange={(e) => setReassignFilter(e.target.value)}
                  >
                    <option value="all">All Leads</option>
                    <option value="reassigned">Reassigned Only</option>
                    <option value="not-reassigned">Not Reassigned</option>
                  </select>
                  {reassignFilter !== 'all' && (
                    <X
                      size={14}
                      className="absolute right-2 top-9 cursor-pointer text-gray-500 hover:text-red-500"
                      onClick={() => clearSingleFilter('reassign')}
                    />
                  )}
                </div>

                {/* Customer Status (reassigned option removed) */}
                <div className="relative min-w-[180px]">
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

                {/* Customer Status Sub Status */}
                {filterObj.status.length > 0 && (
                  <div className="min-w-[220px]">
                    <MultiSelectDropdown
                      label="Sub Status"
                      placeholder="Select sub status"
                      options={[
                        { label: 'All', value: 'all' },
                        ...getCombinedStatusReasons().map((r) => ({
                          label: r,
                          value: r,
                        })),
                      ]}
                      selected={filterObj.status_reason}
                      onChange={(vals) => {
                        if (vals.includes('all')) {
                          setFilterObj((p) => ({ ...p, status_reason: [] }));
                        } else {
                          setFilterObj((p) => ({ ...p, status_reason: vals }));
                        }
                      }}
                    />
                    {filterObj.status_reason.length > 0 && (
                      <X
                        size={14}
                        className="absolute right-2 top-9 cursor-pointer text-gray-500 hover:text-red-500"
                        onClick={() => clearSingleFilter('status_reason')}
                      />
                    )}
                  </div>
                )}

                {/* Attempts */}
                <div className="relative min-w-[140px]">
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
                <div className="relative min-w-[160px]">
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
                <div className="relative min-w-[140px]">
                  <MultiSelectDropdown
                    label="Lead Status"
                    placeholder="Select status"
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

              {/* Filter Actions */}
              <div className="flex gap-3 shrink-0">
                <button
                  className="px-5 py-2.5 bg-[#018ae0] hover:bg-[#005bb5] text-white rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                  onClick={applyFilters}
                >
                  Apply Filters
                </button>
                <button
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 font-medium"
                  onClick={clearAllFilters}
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leads Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {customLoaderFlag ? (
          <div className="p-12">
            <CustomLoader screen="Lead import is currently running" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700">
             <thead className="bg-[#018ae0] text-white sticky top-0 z-10 shadow-sm">

                <tr>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                    <input
                      className="cursor-pointer w-4 h-4"
                      type="checkbox"
                      onChange={(e) => selectAllLeades(e.target.checked)}
                    />
                  </th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                    Sr no.
                  </th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                    Campaign ID
                  </th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                    City
                  </th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                    Pincode
                  </th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                    Source
                  </th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                    Reason
                  </th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                    Assigned To
                  </th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                    Attempts
                  </th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                    Reassign Status
                  </th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                    Last Call
                  </th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                    Follow-up At
                  </th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                    Doc Status
                  </th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                    Remarks
                  </th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                    Created At
                  </th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                    Updated At
                  </th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                    Passed to Client
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leadsData.loader ? (
                  <tr>
                    <td colSpan={23} className="text-center py-12">
                      <div className="flex justify-center items-center space-x-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#018ae0]"></div>
                        <span className="text-gray-600 font-medium">Loading leads...</span>
                      </div>
                    </td>
                  </tr>
                ) : leads?.length === 0 ? (
                  <tr>
                    <td colSpan={23} className="text-center py-16">
                      <div className="text-gray-500 text-lg font-medium">
                        📭 No leads found
                        {dateRange.from && dateRange.to && (
                          <div className="text-sm mt-2 text-gray-400">
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
                    const isReassigned = !!lead.reassign;

                    return (
                      <tr
                        key={lead.id}
                        className={`
                          transition-colors duration-150 hover:bg-blue-50
                          ${isReassigned ? 'bg-orange-50 hover:bg-orange-100' : ''}
                          ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        `}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          {lead.status === 'Qualified' ? (
                            <span className="text-gray-400">--</span>
                          ) : (
                            <input
                              type="checkbox"
                              checked={selectedLeads.includes(lead.id)}
                              onChange={(e) => individualLeadSelect(lead.id, e.target.checked)}
                              className="w-4 h-4 cursor-pointer"
                            />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {lead.campaign_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {lead.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {lead.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {lead.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {lead.city}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {lead.pincode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {lead.product}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {lead.source}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {lead.reason || <span className="text-gray-400">--</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {agentName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-medium">
                            {lead.attempts}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {lead.reassign ? (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              🔄 Reassigned
                            </span>
                          ) : (
                            <span className="text-gray-400">--</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {lead.last_call || <span className="text-gray-400">--</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {lead.followup_at || <span className="text-gray-400">--</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {lead.doc_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <div className="truncate">
                            {lead.remarks || <span className="text-gray-400">--</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDate(lead.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDate(lead.updated_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {user.role === 'admin' ? (
                            <>
                              {lead.checkedclientlead && !editingChecked[lead.id] ? (
                                <div className="flex items-center justify-center gap-2">
                                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Checked
                                  </span>
                                  <button
                                    className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs transition-colors"
                                    onClick={() =>
                                      setEditingChecked({ ...editingChecked, [lead.id]: true })
                                    }
                                  >
                                    Edit
                                  </button>
                                </div>
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
                                  className="w-4 h-4 cursor-pointer"
                                />
                              )}
                            </>
                          ) : lead.checkedclientlead ? (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Checked
                            </span>
                          ) : (
                            <span className="text-gray-400">--</span>
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