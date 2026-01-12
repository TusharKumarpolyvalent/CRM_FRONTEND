import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { successToast, warningToast } from '../../helpers/Toast';

// ---------------------------------------------------------
// 🔹 Fetch Leads with From-To date filter
// ---------------------------------------------------------
export const LeadThunk = createAsyncThunk(
  'lead/fetch',
  async ({ campaignId, flag, fromDate, toDate, date }, { rejectWithValue }) => {
    try {
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
      
      const fullUrl = `${url}?${params.toString()}`;
      console.log('🔗 Fetching leads from:', fullUrl);
      
      const response = await axios.get(fullUrl);
      
      console.log('📦 API Response:', {
        status: response.status,
        dataLength: response.data?.data?.length,
        success: response.data?.success,
      });
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        // ✅ DEBUG: Check for reassign data
        const leadsWithReassign = response.data.data.filter(lead => 
          lead.reassign && lead.reassign !== 'null' && lead.reassign !== ''
        );
        
        console.log(`✅ Fetched ${response.data.data.length} leads`);
        console.log(`🔍 Found ${leadsWithReassign.length} leads with reassign data`);
        
        // Log sample of reassigned leads
        if (leadsWithReassign.length > 0) {
          console.log('🔍 Sample reassigned leads:');
          leadsWithReassign.slice(0, 3).forEach((lead, index) => {
            console.log(`${index + 1}. Lead ${lead.id}:`, {
              name: lead.name,
              reassign: lead.reassign,
              assigned_to: lead.assigned_to,
              status: lead.status
            });
            
            // Try to parse reassign data
            try {
              const parsed = JSON.parse(lead.reassign);
              console.log('   Parsed reassign:', parsed);
            } catch (e) {
              console.log('   Raw reassign:', lead.reassign);
            }
          });
        }
        
        return response.data.data;
      } else {
        console.warn('⚠️ Unexpected response format:', response.data);
        return [];
      }
    } catch (error) {
      console.error('❌ Error in LeadThunk:', error.message);
      console.error('Error response:', error.response?.data);
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
      console.log('📤 AssignLeadThunk - Sending data:', {
        leadIds,
        agentId,
        reassignData,
        isReassign: !!reassignData
      });

      const jsonLeadIds = JSON.stringify(leadIds);
      
      // Send reassignData to backend
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/assign/${agentId}`,
        { 
          leadIds: jsonLeadIds, 
          reassignData: reassignData || null 
        }
      );

      console.log('✅ Backend response:', {
        success: response.data.success,
        message: response.data.message,
        count: response.data.count,
        hasUpdatedLeads: !!response.data.updatedLeads,
        updatedLeadsCount: response.data.updatedLeads?.length,
        firstUpdatedLead: response.data.updatedLeads?.[0]
      });

      if (response.data.success) {
        const message = reassignData 
          ? `${response.data.count} leads reassigned successfully` 
          : `${response.data.count} leads assigned successfully`;
        
        successToast(message);
        
        // Return updated leads if available
        if (response.data.updatedLeads && Array.isArray(response.data.updatedLeads)) {
          console.log('📦 Returning updated leads from backend');
          return response.data.updatedLeads;
        }
        
        // Refresh leads with current filters
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
      console.error('❌ Error in AssignLeadThunk:', err.message);
      console.error('Error details:', err.response?.data);
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
    error: null,
  },
  reducers: {
    resetLeads: (state) => {
      state.data = [];
      state.error = null;
      state.loader = false;
    },
    // Manual update of reassign data
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
      // FETCH LEADS
      .addCase(LeadThunk.pending, (state) => {
        state.loader = true;
        state.error = null;
      })
      .addCase(LeadThunk.fulfilled, (state, action) => {
        state.loader = false;
        state.data = action.payload || [];
        // DEBUG: Log reassign data in fetched leads
        const leadsWithReassign = action.payload?.filter(lead => lead.reassign);
        if (leadsWithReassign.length > 0) {
          console.log('📊 Loaded leads with reassign:', leadsWithReassign.length);
        }
      })
      .addCase(LeadThunk.rejected, (state, action) => {
        state.loader = false;
        state.error = action.payload || action.error.message;
        state.data = [];
      })
      // ASSIGN LEADS
      .addCase(AssignLeadThunk.pending, (state) => {
        state.loader = true;
        state.error = null;
      })
      .addCase(AssignLeadThunk.fulfilled, (state, action) => {
        state.loader = false;
        
        // If we got updated leads in response, update the state
        if (action.payload && Array.isArray(action.payload)) {
          console.log('✅ Updating leads state with reassigned data');
          console.log('Updated leads count:', action.payload.length);
          console.log('Sample updated lead:', action.payload[0]);
          
          // Create a map of updated leads for quick lookup
          const updatedLeadsMap = {};
          action.payload.forEach(lead => {
            updatedLeadsMap[lead.id] = lead;
          });
          
          // Update existing leads with new data
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
export default LeadSlice.reducer;