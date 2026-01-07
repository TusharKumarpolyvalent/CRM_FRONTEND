import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { successToast } from '../../helpers/Toast';

// ---------------------------------------------------------
// 🔹 Fetch Leads with From-To date filter
// ---------------------------------------------------------
export const LeadThunk = createAsyncThunk(
  'leadThunk',
  async ({ campaignId, flag, from = '', to = '' }) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/admin/get-Leads?id=${campaignId}&assigned=${flag}&from=${from}&to=${to}`
      );

      return response.data.data; // Array of leads
    } catch (err) {
      console.error('Error in LeadThunk:', err.message);
      return Promise.reject(err.message); // Proper error handling
    }
  }
);

// ---------------------------------------------------------
// 🔹 Assign Leads to Agent
// ---------------------------------------------------------
export const AssignLeadThunk = createAsyncThunk(
  'AssignLeadThunk',
  async ({ leadIds, agentId, campaignId, flag, from = '', to = '' }, { dispatch }) => {
    try {
      const jsonLeadIds = JSON.stringify(leadIds);

      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/assign/${agentId}`,
        { leadIds: jsonLeadIds }
      );

      successToast('Lead assigned successfully!');

      // refresh leads with same filters including From-To dates
      dispatch(LeadThunk({ campaignId, flag, from, to }));

      return;
    } catch (err) {
      console.error('Error in AssignLeadThunk:', err.message);
      return Promise.reject(err.message);
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
  reducers: {},
  extraReducers: (builder) => {
    builder
      // FETCH LEADS
      .addCase(LeadThunk.pending, (state) => {
        state.loader = true;
        state.error = null;
      })
      .addCase(LeadThunk.fulfilled, (state, action) => {
        state.loader = false;
        state.data = action.payload;
      })
      .addCase(LeadThunk.rejected, (state, action) => {
        state.loader = false;
        state.error = action.error.message;
      });
  },
});

export default LeadSlice.reducer;
