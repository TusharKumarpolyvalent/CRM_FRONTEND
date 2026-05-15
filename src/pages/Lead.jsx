import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../api/axiosInstance.js';
import { successToast, warningToast } from '../helpers/Toast';

// ---------------------------------------------------------
// 🔹 Fetch Leads with From-To date filter
// ---------------------------------------------------------
export const LeadThunk = createAsyncThunk(
  'lead/fetch',
  async ({ campaignId, flag, fromDate, toDate, date, page = 1, pageSize = 30 }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('crm_token');
      let url = `${import.meta.env.VITE_API_BASE_URL}/admin/get-leads`;
      
      const params = new URLSearchParams();
      params.append('id', campaignId);
      
      if (flag) {
        params.append('assigned', flag);
      }
      
      if (date) {
        params.append('date', date);
      }
      
      if (fromDate && toDate) {
        params.append('fromDate', fromDate);
        params.append('toDate', toDate);
      }

      if (page) params.append('page', page);
      if (pageSize) params.append('pageSize', pageSize);

      const fullUrl = `${url}?${params.toString()}`;
      
      const response = await axios.get(fullUrl,{
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.status && Array.isArray(response.data.data)) {
        return {
          data: response.data.data,
          totalCount: response.data.totalCount ?? 0,
        };
      } else {
        return { data: [], totalCount: 0 };
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ---------------------------------------------------------
// 🔹 Assign Leads to Agent - DEBUG VERSION
// ---------------------------------------------------------
export const AssignLeadThunk = createAsyncThunk(
  'AssignLeadThunk',
  async ({ leadIds, agentId, campaignId, flag, from = '', to = '', reassignData }, { dispatch, rejectWithValue }) => {
    try {
      const jsonLeadIds = JSON.stringify(leadIds);
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/assign/${agentId}`,
        { 
          leadIds: jsonLeadIds, 
          reassignData: reassignData || null 
        }
      );

      if (response.data.success) {
        const message = reassignData 
          ? `${response.data.count} leads reassigned successfully` 
          : `${response.data.count} leads assigned successfully`;
        
        successToast(message);
        
        if (response.data.updatedLeads && Array.isArray(response.data.updatedLeads)) {
          return response.data.updatedLeads;
        }
        
        if (from && to) {
          setTimeout(() => {
            dispatch(LeadThunk({ 
              campaignId, 
              flag, 
              fromDate: from, 
              toDate: to 
            }));
          }, 500);
        } else {
          setTimeout(() => {
            const today = new Date().toISOString().split('T')[0];
            dispatch(LeadThunk({ 
              campaignId, 
              flag, 
              date: today 
            }));
          }, 500);
        }
        
        return null;
      } else {
        warningToast(response.data.message || 'Failed to assign leads');
        return rejectWithValue(response.data.message);
      }
      
    } catch (err) {
      warningToast('Failed to assign leads');
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ---------------------------------------------------------
// 🔹 Lead Slice
// ---------------------------------------------------------
const LeadSlice = createSlice({
  name: 'Lead',
  initialState: {
    loader: false,
    data: [],
    totalCount: 0,
    error: null,
  },
  reducers: {
    resetLeads: (state) => {
      state.data = [];
      state.totalCount = 0;
      state.error = null;
      state.loader = false;
    },
    updateLeadReassignData: (state, action) => {
      const { leadId, reassignData } = action.payload;
      state.data = state.data.map(lead => 
        lead.id === leadId 
          ? { ...lead, reassign: reassignData } 
          : lead
      );
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(LeadThunk.pending, (state) => {
        state.loader = true;
        state.error = null;
      })
      .addCase(LeadThunk.fulfilled, (state, action) => {
        state.loader = false;
        const payload = action.payload;
        state.data = payload?.data ?? payload ?? [];
        state.totalCount = payload?.totalCount ?? 0; // 🔥 Set total count from API
      })
      .addCase(LeadThunk.rejected, (state, action) => {
        state.loader = false;
        state.error = action.payload || action.error.message;
        state.data = [];
      })
      .addCase(AssignLeadThunk.pending, (state) => {
        state.loader = true;
        state.error = null;
      })
      .addCase(AssignLeadThunk.fulfilled, (state, action) => {
        state.loader = false;
        if (action.payload && Array.isArray(action.payload)) {
          const updatedLeadsMap = {};
          action.payload.forEach(lead => {
            updatedLeadsMap[lead.id] = lead;
          });
          state.data = state.data.map(lead => 
            updatedLeadsMap[lead.id] ? updatedLeadsMap[lead.id] : lead
          );
        }
      })
      .addCase(AssignLeadThunk.rejected, (state, action) => {
        state.loader = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { resetLeads, updateLeadReassignData } = LeadSlice.actions;
export const leadReducer = LeadSlice.reducer;

// =========================================================================
// REACT COMPONENT
// =========================================================================

import { useEffect, useState } from 'react';
import { Loader, Pencil, Check, X } from 'lucide-react';
import Card from '../components/Card';
import { useLocation, useNavigate } from 'react-router-dom';
import AddLeads from '../modals/AddLeads';
import { useGlobalContext } from '../context/GlobalContext';
import { useDispatch, useSelector } from 'react-redux';
import ImportFile from '../components/ImportLeads';
import { UsersThunk } from '../redux/slice/UsersSlice';
import AssignToggle from '../components/AssignedToggle';
import { checkAuth, formatDate } from '../helpers/functions';
import CustomLoader from '../components/CustomLoader';
import { statusOption, statusReasons } from '../utils/constant';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import MultiSelectDropdown from '../components/MultiSelectDropdown';

const Lead = () => {
  const [selectLimit, setSelectLimit] = useState(
    Number(import.meta.env.VITE_LEAD_SELECT_LIMIT) || 200
  );
  const user = useSelector((store) => store.loggedInUser.data);

  const [currentFlag, setCurrentFlag] = useState('false');
  const { customLoaderFlag } = useGlobalContext();
  const navigate = useNavigate();
  const { state } = useLocation();
  const dispatch = useDispatch();
  const agents = useSelector((store) => store.users.data);
  
  // Data from Redux
  const leadsData = useSelector((store) => store.Leads);
  const [leads, setLeads] = useState([]);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);

  // 🔥 FIXED: Total calculation using API totalCount
  const total = leadsData.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  
  const [selectedAgentForCount, setSelectedAgentForCount] = useState('');
  const [updatedDateRange, setUpdatedDateRange] = useState({ from: '', to: '' });
  const { showAddLeadsModal, setShowAddLeadsModal } = useGlobalContext();
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [agentId, setAgentId] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [tempCampaignId, setTempCampaignId] = useState(state?.Campaign?.id || '');
  const [callCountDate, setCallCountDate] = useState(new Date().toISOString().split('T')[0]);
  const [callCount, setCallCount] = useState(0);
  const [reassignFilter, setReassignFilter] = useState('all');

  const [filterObj, setFilterObj] = useState({
    status: [],
    status_reason: [],
    attempts: [],
    assigned_to: [],
    doc_status: [],
    source: [], 
  });

  const uniqueSources = [
    ...new Set(leadsData.data?.map((l) => l.source).filter(Boolean)),
  ];

  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const [editingChecked, setEditingChecked] = useState({});

  const getReassignDisplay = (reassignValue) => {
    if (!reassignValue) return null;
    try {
      return JSON.parse(reassignValue);
    } catch (error) {
      return {
        agentId: reassignValue,
        agentName: agents.find(a => a.id === reassignValue)?.name || reassignValue,
        timestamp: new Date().toISOString()
      };
    }
  };

  const handleCallCount = async () => {
    if (!callCountDate) return warningToast('Please select a date');
    if (!selectedAgentForCount) return warningToast('Please select an agent');

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/admin/daily-call-count`,
        { params: { agentId: selectedAgentForCount, date: callCountDate } }
      );
      if (res.data.success) {
        setCallCount(res.data.count || 0);
        successToast(`Calls on ${callCountDate}: ${res.data.count || 0}`);
      } else {
        setCallCount(0);
        warningToast('No data found');
      }
    } catch (error) {
      setCallCount(0);
      warningToast('Failed to fetch call count');
    }
  };

  const handleUpdateCampaignID = async () => {
    try{
      const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/admin/update-campaign/${state.Campaign.id}`,{
        oldId: state.Campaign.id,
        NewId: tempCampaignId
      });
      if(res.data.success){
        setIsEditing(false);
        successToast('Campaign ID updated successfully');
        state.Campaign.id = tempCampaignId;
      }
    } catch(error) {
      warningToast('Failed to update Campaign ID');
      setTempCampaignId(state?.Campaign?.id);
    }
  };

  const clearSingleFilter = (key) => {
    if (key === 'reassign') {
      setReassignFilter('all');
      return;
    }
    const newFilterObj = { ...filterObj, [key]: [] };
    if (key === 'status') newFilterObj.status_reason = [];
    
    setFilterObj(newFilterObj);
    applyAllLocalFilters(newFilterObj, reassignFilter);
  };

  // 🔥 FIXED: Remove setPage(1) from leadsData listener so page doesn't reset on Next click
  useEffect(() => {
    if (leadsData.data && Array.isArray(leadsData.data)) {
      setLeads([...leadsData.data]);
    } else {
      setLeads([]);
    }
  }, [leadsData.data]);

  useEffect(() => {
    if (!(state && state.Campaign && state.Campaign.id)) {
      checkAuth(navigate);
    }
    if (state && state.Campaign) {
      dispatch(UsersThunk('agent'));
    }
  }, []);

  // Fetch leads when parameters or PAGE changes
  useEffect(() => {
    if (state && state.Campaign) {
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
      
      dispatch(LeadThunk({
        ...params,
        page, // Backend receives page
        pageSize, // Backend receives pageSize
      }));
    }
  }, [currentFlag, dateRange.from, dateRange.to, state?.Campaign?.id, page, pageSize]);

  const applyUpdatedDateFilter = () => {
    if (!updatedDateRange.from || !updatedDateRange.to) return warningToast('Please select both dates');
    const from = new Date(updatedDateRange.from);
    const to = new Date(updatedDateRange.to);
    to.setHours(23, 59, 59, 999);

    const filtered = leadsData.data.filter((lead) => {
      if (!lead.updated_at) return false;
      const updatedAt = new Date(lead.updated_at);
      return updatedAt >= from && updatedAt <= to;
    });

    if (filtered.length === 0) warningToast(`No leads updated found`);
    else successToast(`${filtered.length} leads found`);

    setLeads(filtered);
    setPage(1); 
  };

  const handleDateRangeChange = () => {
    if (!dateRange.from || !dateRange.to) return warningToast('Please select both dates');
    setPage(1); // Reset page on new date search
    dispatch(LeadThunk({
      campaignId: state.Campaign.id,
      flag: currentFlag,
      fromDate: dateRange.from,
      toDate: dateRange.to,
      page: 1,
      pageSize
    }));
  };

  const resetToToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setDateRange({ from: today, to: today });
    setPage(1); // Reset page
    dispatch(LeadThunk({
      campaignId: state.Campaign.id,
      flag: currentFlag,
      date: today,
      page: 1,
      pageSize
    }));
  };

  const handleCheckedClientLead = async (leadId, value) => {
    const lead = leads.find((l) => l.id === leadId);
    const wasChecked = lead?.checkedclientlead;

    setLeads((prevLeads) => prevLeads.map((l) => l.id === leadId ? { ...l, checkedclientlead: value } : l));

    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/admin/checked-client-lead/${leadId}`, { checkedclientlead: value });
      successToast(wasChecked && !value ? 'Edit successfully' : 'Checked client lead updated');
      setEditingChecked({ ...editingChecked, [leadId]: false });
    } catch (error) {
      setLeads((prevLeads) => prevLeads.map((l) => l.id === leadId ? { ...l, checkedclientlead: wasChecked } : l));
      warningToast('Failed to update checked client lead');
    }
  };

  const clearAllFilters = () => {
    setReassignFilter('all');
    setFilterObj({ status: [], status_reason: [], attempts: [], assigned_to: [], doc_status: [], source: [] });
    setLeads(leadsData.data);
    setPage(1); 
  };

  const applyAllLocalFilters = (filters, reassignFlt) => {
    let tempLeads = [...leadsData.data];
    if (reassignFlt === 'reassigned') tempLeads = tempLeads.filter((lead) => !!lead.reassign);
    else if (reassignFlt === 'not-reassigned') tempLeads = tempLeads.filter((lead) => !lead.reassign);

    if (filters.status.length > 0) tempLeads = tempLeads.filter((lead) => filters.status.includes(lead.status));
    if (filters.attempts.length > 0) tempLeads = tempLeads.filter((lead) => filters.attempts.includes(lead.attempts.toString()));
    if (filters.source.length > 0) tempLeads = tempLeads.filter((lead) => filters.source.includes(lead.source));
    if (filters.assigned_to.length > 0) tempLeads = tempLeads.filter((lead) => filters.assigned_to.includes(lead.assigned_to));
    if (filters.doc_status.length > 0) tempLeads = tempLeads.filter((lead) => filters.doc_status.includes(lead.doc_status));
    if (filters.status_reason.length > 0) tempLeads = tempLeads.filter((lead) => filters.status_reason.includes(lead.reason));

    setLeads(tempLeads);
    setPage(1);
  }

  const applyFilters = () => applyAllLocalFilters(filterObj, reassignFilter);

  const selectAllLeades = (val) => {
    if (val) {
      let leadInLimit = leads.filter((lead, index) => index + 1 <= selectLimit).filter((lead) => lead.status !== 'Qualified');
      setSelectedLeads(leadInLimit.map((lead) => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const individualLeadSelect = (id, val) => {
    if (!val) setSelectedLeads(selectedLeads.filter((leadId) => leadId !== id));
    else setSelectedLeads([...selectedLeads, id]);
  };

  const leadToAgent = async () => {
    if (!selectedLeads.length) return warningToast('Please select at least one lead');
    if (!agentId) return warningToast('Please select an Agent');

    try {
      await dispatch(AssignLeadThunk({
        leadIds: selectedLeads,
        agentId,
        campaignId: state.Campaign.id,
        flag: currentFlag,
      }));

      successToast(currentFlag === 'true' ? 'Leads reassigned successfully' : 'Leads assigned successfully');
      setSelectedLeads([]);
    } catch (error) {
      warningToast('Failed to assign leads');
    }
  };

  const getCombinedStatusReasons = () => {
    let reasons = [];
    filterObj.status.forEach((status) => {
      if (statusReasons[status]) reasons.push(...statusReasons[status]);
    });
    return [...new Set(reasons)];
  };

  const maskPhone = (phone) => {
    if (!phone || typeof phone !== "string") return "";
    if (phone.length <= 3) return phone;
    return phone.slice(0, 3) + "*".repeat(phone.length - 3);
  };

  const maskEmail = (email) => {
    if (!email || typeof email !== "string" || !email.includes("@")) return "";
    const [name, domain] = email.split("@");
    if (!name) return email;
    if (name.length <= 3) return email;
    return name.slice(0, 3) + "*".repeat(name.length - 3) + "@" + domain;
  };

  const exportCSV = () => {
    if (!leads.length) return warningToast('No leads to export');
    const headers = Object.keys(leads[0]);
    const csvRows = [headers.join(',')];
    leads.forEach((lead) => {
      const values = headers.map((h) => `"${lead[h] ?? ''}"`);
      csvRows.push(values.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'leads.csv');
  };

  const exportExcel = () => {
    if (!leads.length) return warningToast('No leads to export');
    const worksheet = XLSX.utils.json_to_sheet(leads);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'leads.xlsx');
  };

  return (
    <div className="p-6 space-y-6">
      {showAddLeadsModal && <AddLeads campaignId={state.Campaign.id} />}
      
      {/* Campaign Header Card and Actions */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300">
          <div className="p-6 space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">{state?.Campaign.name}</h2>
            <p className="text-gray-600">{state?.Campaign.description}</p>
            
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full group">
                <span className="font-medium">ID: </span>
                {isEditing ? (
                  <div className="flex items-center ml-2 gap-1">
                    <input 
                      type="text"
                      value={tempCampaignId}
                      onChange={(e) => setTempCampaignId(e.target.value)}
                      className="border-b border-blue-500 bg-transparent outline-none w-24 px-1"
                      autoFocus
                    />
                    <button onClick={handleUpdateCampaignID} className="text-green-600 hover:text-green-800"><Check size={14} /></button>
                    <button onClick={() => setIsEditing(false)} className="text-red-600 hover:text-red-800"><X size={14} /></button>
                  </div>
                ) : (
                  <>
                    <span className="ml-1">{tempCampaignId}</span>
                    <button onClick={() => setIsEditing(true)} className="ml-2 text-blue-400 hover:text-blue-600 transition-colors"><Pencil size={12} /></button>
                  </>
                )}
              </div>
              
              {state?.Campaign.status === '1' ? (
                <span className="inline-block px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">Status: Active</span>
              ) : (
                <span className="inline-block px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">Status: Inactive</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-4 justify-center items-center">
          <Card content="Total Leads" count={leadsData.totalCount} className="min-w-[180px]" />
          
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => setShowAddLeadsModal(true)} className="bg-green-500 hover:bg-green-600 transition-all duration-200 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm hover:shadow-md">Create Leads</button>
            <ImportFile campaignId={state?.Campaign.id} flag="false" />
            <button onClick={exportCSV} className="bg-blue-500 hover:bg-blue-600 transition-all duration-200 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm hover:shadow-md">Export CSV</button>
            <button onClick={exportExcel} className="bg-purple-500 hover:bg-purple-600 transition-all duration-200 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm hover:shadow-md">Export Excel</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-6">
        <div className="flex flex-col xl:flex-row gap-6 justify-between">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">From</label>
              <input type="date" value={dateRange.from} onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#018ae0]/40 focus:border-[#018ae0]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">To</label>
              <input type="date" value={dateRange.to} onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#018ae0]/40 focus:border-[#018ae0]" />
            </div>
            <button onClick={handleDateRangeChange} className="px-5 py-2.5 bg-[#018ae0] hover:bg-[#005bb5] text-white rounded-xl font-medium transition">Apply</button>
            <button onClick={resetToToday} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition">Today</button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition w-full">
            <div className="flex flex-col xl:flex-row items-end gap-5">
              <div className="flex flex-col w-full xl:w-56">
                <label className="text-xs font-semibold text-gray-600 mb-1">Select Agent</label>
                <select value={selectedAgentForCount} onChange={(e) => setSelectedAgentForCount(e.target.value)} className="h-11 px-4 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition">
                  <option value="">Select Agent</option>
                  {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col w-full xl:w-48">
                <label className="text-xs font-semibold text-gray-600 mb-1">Select Date</label>
                <input type="date" value={callCountDate} onChange={(e) => setCallCountDate(e.target.value)} className="h-11 px-4 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition" />
              </div>
              <div className="flex gap-3 w-full xl:w-auto">
                <button onClick={handleCallCount} className="h-11 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition shadow-sm">Get Count</button>
                <button onClick={() => { setCallCount(0); setCallCountDate(new Date().toISOString().split('T')[0]); setSelectedAgentForCount(''); }} className="h-11 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition">Reset</button>
              </div>
              {selectedAgentForCount && (
                <div className="xl:ml-auto w-full xl:w-auto mt-4 xl:mt-0">
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl shadow-md text-center min-w-[160px]">
                    <div className="text-xs uppercase tracking-wide opacity-80">Total Calls</div>
                    <div className="text-3xl font-bold">{callCount}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Last Updated From</label>
            <input type="date" value={updatedDateRange.from} onChange={(e) => setUpdatedDateRange({ ...updatedDateRange, from: e.target.value })} className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#018ae0]/40 focus:border-[#018ae0]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Last Updated To</label>
            <input type="date" value={updatedDateRange.to} onChange={(e) => setUpdatedDateRange({ ...updatedDateRange, to: e.target.value })} className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#018ae0]/40 focus:border-[#018ae0]" />
          </div>
          <button onClick={applyUpdatedDateFilter} className="px-5 py-2.5 bg-[#018ae0] hover:bg-[#005bb5] text-white rounded-xl font-medium transition">Apply</button>
          <button onClick={() => { setUpdatedDateRange({ from: '', to: '' }); setLeads([...leadsData.data]); setPage(1); }} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition">Clear</button>
        </div>

        <div className="flex flex-wrap justify-between items-center gap-4 pt-4 border-t border-gray-100">
          <div className="flex gap-3 items-end">
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Selection Limit</label>
              <input type="number" value={selectLimit} onChange={(e) => setSelectLimit(Number(e.target.value))} className="h-11 w-24 px-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#018ae0] outline-none text-center font-bold text-gray-700" min="1" />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Assign To Agent</label>
              <div className="flex">
                <select onChange={(e) => setAgentId(e.target.value)} defaultValue="" className="px-4 py-2.5 h-11 w-52 border border-gray-300 rounded-l-xl focus:outline-none">
                  <option value="" disabled>Select Agent</option>
                  {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                </select>
                <button onClick={leadToAgent} className={`px-5 py-2.5 h-11 rounded-r-xl font-medium text-white transition ${currentFlag === 'true' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'}`}>
                  {currentFlag === 'true' ? 'Reassign' : 'Assign'}
                </button>
              </div>
            </div>

            {selectedLeads.length > 0 && (
              <div className="h-11 flex items-center px-4 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 font-semibold animate-pulse">
                {selectedLeads.length} Selected
              </div>
            )}
          </div>
          <AssignToggle options={[{ label: 'Unassigned', value: 'false' }, { label: 'Assigned', value: 'true' }, { label: 'All', value: 'all' }]} onChange={(value) => { setCurrentFlag(value); setPage(1); }} />
        </div>
      </div>

      {currentFlag === 'true' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 font-sans">Filter Panel</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex flex-wrap gap-4 flex-1">
                <div className="relative min-w-[180px]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reassign Status</label>
                  <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 shadow-sm transition focus:outline-none focus:border-[#018ae0] focus:ring-2 focus:ring-[#018ae0]/30 hover:border-[#018ae0]" value={reassignFilter} onChange={(e) => setReassignFilter(e.target.value)}>
                    <option value="all">All Leads</option>
                    <option value="reassigned">Reassigned Only</option>
                    <option value="not-reassigned">Not Reassigned</option>
                  </select>
                  {reassignFilter !== 'all' && <X size={14} className="absolute right-2 top-9 cursor-pointer text-gray-500 hover:text-red-500" onClick={() => clearSingleFilter('reassign')} />}
                </div>

                <div className="relative min-w-[180px]">
                  <MultiSelectDropdown label="Customer Status" placeholder="Select status" options={[{ label: 'All', value: 'all' }, ...statusOption.map((s) => ({ label: s, value: s }))]} selected={filterObj.status} onChange={(vals) => setFilterObj((p) => ({ ...p, status: vals.includes('all') ? [] : vals }))} />
                  {filterObj.status.length > 0 && <X size={14} className="absolute right-2 top-9 cursor-pointer text-gray-500 hover:text-red-500" onClick={() => clearSingleFilter('status')} />}
                </div>

                {filterObj.status.length > 0 && (
                  <div className="min-w-[220px]">
                    <MultiSelectDropdown label="Sub Status" placeholder="Select sub status" options={[{ label: 'All', value: 'all' }, ...getCombinedStatusReasons().map((r) => ({ label: r, value: r }))]} selected={filterObj.status_reason} onChange={(vals) => setFilterObj((p) => ({ ...p, status_reason: vals.includes('all') ? [] : vals }))} />
                    {filterObj.status_reason.length > 0 && <X size={14} className="absolute right-2 top-9 cursor-pointer text-gray-500 hover:text-red-500" onClick={() => clearSingleFilter('status_reason')} />}
                  </div>
                )}

                <div className="relative min-w-[140px]">
                  <MultiSelectDropdown label="Attempts" placeholder="Select attempts" options={[{ label: 'All', value: 'all' }, ...Array.from({ length: 11 }, (_, i) => i).map((n) => ({ label: n.toString(), value: n.toString() }))]} selected={filterObj.attempts} onChange={(vals) => setFilterObj((p) => ({ ...p, attempts: vals.includes('all') ? [] : vals }))} />
                  {filterObj.attempts.length > 0 && <X size={14} className="absolute right-2 top-9 cursor-pointer text-gray-500 hover:text-red-500" onClick={() => clearSingleFilter('attempts')} />}
                </div>

                <div className="relative min-w-[160px]">
                  <MultiSelectDropdown label="Source" placeholder="Select source" options={[{ label: 'All', value: 'all' }, ...uniqueSources.map((s) => ({ label: s, value: s }))]} selected={filterObj.source} onChange={(vals) => setFilterObj((p) => ({ ...p, source: vals.includes('all') ? [] : vals }))} />
                  {filterObj.source.length > 0 && <X size={14} className="absolute right-2 top-9 cursor-pointer text-gray-500 hover:text-red-500" onClick={() => clearSingleFilter('source')} />}
                </div>

                <div className="relative min-w-[160px]">
                  <MultiSelectDropdown label="Agent" placeholder="Select agents" options={[{ label: 'All', value: 'all' }, ...agents.map((a) => ({ label: a.name, value: a.id }))]} selected={filterObj.assigned_to} onChange={(vals) => setFilterObj((p) => ({ ...p, assigned_to: vals.includes('all') ? [] : vals }))} />
                  {filterObj.assigned_to.length > 0 && <X size={14} className="absolute right-2 top-9 cursor-pointer text-gray-500 hover:text-red-500" onClick={() => clearSingleFilter('assigned_to')} />}
                </div>

                <div className="relative min-w-[140px]">
                  <MultiSelectDropdown label="Lead Status" placeholder="Select status" options={[{ label: 'All', value: 'all' }, { label: 'pending', value: 'pending' }, { label: 'review', value: 'review' }, { label: 'closed', value: 'closed' }]} selected={filterObj.doc_status} onChange={(vals) => setFilterObj((p) => ({ ...p, doc_status: vals.includes('all') ? [] : vals }))} />
                  {filterObj.doc_status.length > 0 && <X size={14} className="absolute right-2 top-9 cursor-pointer text-gray-500 hover:text-red-500" onClick={() => clearSingleFilter('doc_status')} />}
                </div>
              </div>

              <div className="flex gap-3 shrink-0">
                <button className="px-5 py-2.5 bg-[#018ae0] hover:bg-[#005bb5] text-white rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md" onClick={applyFilters}>Apply Filters</button>
                <button className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 font-medium" onClick={clearAllFilters}>Clear All</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leads Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {customLoaderFlag ? (
          <div className="p-12"><CustomLoader screen="Lead import is currently running" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700">
             <thead className="bg-[#018ae0] text-white sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap"><input className="cursor-pointer w-4 h-4" type="checkbox" onChange={(e) => selectAllLeades(e.target.checked)} /></th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">Sr no.</th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">Campaign ID</th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">Name</th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">Phone</th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">Email</th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">City</th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">Pincode</th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">Product</th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">Source</th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">Reason</th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">Assigned To</th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">Attempts</th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">Reassign Status</th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">Last Call</th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">Follow-up At</th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">Doc Status</th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">Remarks</th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">Created At</th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">Updated At</th>
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">Passed to Client</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leadsData.loader ? (
                  <tr><td colSpan={23} className="text-center py-12"><div className="flex justify-center items-center space-x-3"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#018ae0]"></div><span className="text-gray-600 font-medium">Loading leads...</span></div></td></tr>
                ) : leads?.length === 0 ? (
                  <tr><td colSpan={23} className="text-center py-16"><div className="text-gray-500 text-lg font-medium">📭 No leads found</div></td></tr>
                ) : (
                  // 🔥 FIXED: Removed the `.slice()`. We map directly over `leads` because the backend already returns 30 items per page!
                  leads?.map((lead, i) => {
                    // 🔥 FIXED: Serial number is dynamically calculated based on the current page
                    const serialNumber = (page - 1) * pageSize + i + 1; 
                    const agentName = agents.find(agent => agent.id === lead.assigned_to)?.name || 'Not Assigned';
                    const isReassigned = !!lead.reassign;

                    return (
                      <tr key={lead.id} className={`transition-colors duration-150 hover:bg-blue-50 ${isReassigned ? 'bg-orange-50 hover:bg-orange-100' : ''} ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {lead.status === 'Qualified' ? <span className="text-gray-400">--</span> : <input type="checkbox" checked={selectedLeads.includes(lead.id)} onChange={(e) => individualLeadSelect(lead.id, e.target.checked)} className="w-4 h-4 cursor-pointer" />}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{serialNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{lead.campaign_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{lead.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{maskPhone(lead.phone)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{maskEmail(lead.email)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{lead.city}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{lead.pincode}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{lead.product}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{lead.source}</td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">{lead.status}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap">{lead.reason || <span className="text-gray-400">--</span>}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{agentName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center"><span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-medium">{lead.attempts}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap">{lead.reassign ? <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">🔄 Reassigned</span> : <span className="text-gray-400">--</span>}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{lead.last_call || <span className="text-gray-400">--</span>}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{lead.followup_at || <span className="text-gray-400">--</span>}</td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">{lead.doc_status}</span></td>
                        <td className="px-6 py-4 max-w-xs"><div className="truncate">{lead.remarks || <span className="text-gray-400">--</span>}</div></td>
                        <td className="px-6 py-4 whitespace-nowrap">{formatDate(lead.created_at)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{formatDate(lead.updated_at)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {user.role === 'admin' ? (
                            <>
                              {lead.checkedclientlead && !editingChecked[lead.id] ? (
                                <div className="flex items-center justify-center gap-2">
                                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Checked</span>
                                  <button className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs transition-colors" onClick={() => setEditingChecked({ ...editingChecked, [lead.id]: true })}>Edit</button>
                                </div>
                              ) : (
                                <input type="checkbox" checked={lead.checkedclientlead} onChange={(e) => handleCheckedClientLead(lead.id, e.target.checked)} onBlur={() => setEditingChecked({ ...editingChecked, [lead.id]: false })} className="w-4 h-4 cursor-pointer" />
                              )}
                            </>
                          ) : lead.checkedclientlead ? (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Checked</span>
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

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-4 py-4 border-t border-gray-100 bg-white">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={`px-4 py-2 rounded-lg font-medium transition ${page <= 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                Prev
              </button>

              <div className="text-sm text-gray-600">
                Page <span className="font-semibold text-gray-800">{page}</span> of{' '}
                <span className="font-semibold text-gray-800">{totalPages}</span>
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className={`px-4 py-2 rounded-lg font-medium transition ${page >= totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lead;