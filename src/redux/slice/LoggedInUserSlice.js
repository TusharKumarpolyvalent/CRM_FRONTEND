import { createAsyncThunk, createSlice, current } from '@reduxjs/toolkit';
import axios from 'axios';

export const LoggedInUserLeadThunk = createAsyncThunk(
  'loggedInUserLeadThunk',
  async (id, { rejectWithValue }) => {
    try {
      console.log('🔄 Fetching leads for agent ID:', id);
      
      const url = `${import.meta.env.VITE_API_BASE_URL}/agent/get-leads?id=${id}`;
      console.log('🔗 Fetching from:', url);
      
      const response = await axios.get(url);

      console.log('✅ Agent leads response status:', response.status);
      console.log('📊 Response has data?', !!response.data?.data);
      console.log('📊 Data array length:', response.data?.data?.length);

      // ✅ FIX: Check if data exists, not success field
      if (response.data && response.data.data) {
        const leads = response.data.data;
        
        if (!Array.isArray(leads)) {
          console.warn('❌ Data is not an array:', leads);
          return rejectWithValue('Invalid data format');
        }
        
        console.log(`✅ Returning ${leads.length} leads for agent ${id}`);
        
        // Debug reassign data
        const reassignedLeads = leads.filter(lead => lead.reassign && lead.reassign !== 'null');
        console.log(`🔍 Found ${reassignedLeads.length} reassigned leads`);
        
        if (reassignedLeads.length > 0) {
          reassignedLeads.forEach(lead => {
            console.log(`   Lead ${lead.id}: reassign="${lead.reassign}"`);
          });
        }
        
        return leads;
      } else {
        console.warn('❌ No data in response:', response.data);
        return rejectWithValue('No leads data found');
      }
      
    } catch (err) {
      console.error('❌ Error in LoggedInUserLeadThunk:', err.message);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateFollowUpThunk = createAsyncThunk(
  'updateFollowUpThunk',
  async (
    { agentId, id, data, attempt, leadData },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/agent/follow-up/${id}`,
        data
      );

      dispatch(LoggedInUserLeadThunk(agentId));
      let currentAttempt = parseInt(attempt);
      currentAttempt += 1;
      let statusKey = 'status' + currentAttempt.toString();
      let remarkKey = 'remark' + currentAttempt.toString();
      let leadRecordData = {
        [statusKey]: data.status,
        [remarkKey]: data.remark,
      };
      dispatch(LeadRecordThunk({ id: id, data: leadRecordData }));

      let userId = leadData.assigned_to;
      let description = `status changed from ${leadData.status} to ${data.status} with remark :${data.remark}`;
      let activityLeadId = leadData.id.toString();
      let activityData = {
        phone: leadData.phone,
        id: activityLeadId,
        description,
        agentId: userId,
      };

      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/activity/add`,
        activityData
      );
      return res.data;
    } catch (err) {
      console.log('Error in follow-up update thunk:', err);
      return rejectWithValue(err.response?.data || 'Error in follow-up update');
    }
  }
);
export const LeadRecordThunk = createAsyncThunk(
  'LeadRecordThunk',
  async ({ id, data }) => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/agent/leadrecord/${id}`,
        data
      );
      return res.data;
    } catch (err) {
      console.log('Error in follow-up update thunk:', err);
      return rejectWithValue(err.response?.data || 'Error in follow-up update');
    }
  }
);

const LoggedInUserSlice = createSlice({
  name: 'loggedInUser',
  initialState: {
    data: {},
    Leads: [],
  },
  reducers: {
    setLoggedInUser(state, action) {
      state.data = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(LoggedInUserLeadThunk.fulfilled, (state, action) => {
      state.Leads = action.payload;
    });
  },
});

export const { setLoggedInUser } = LoggedInUserSlice.actions;
export default LoggedInUserSlice.reducer;
