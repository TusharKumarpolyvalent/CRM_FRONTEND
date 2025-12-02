import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { successToast } from '../../helpers/Toast';

export const LeadThunk = createAsyncThunk(
  'leadThunk',
  
  async ({ campaignId, flag }) => {
    
  
    try {
      //make api call
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/admin/get-leads?id=${campaignId}&assigned=${flag}`
      );

      return response.data.data;
    } catch (err) {
      console.log('Error in leadThunk:', err.message);
    }
  }
);
export const AssignLeadThunk = createAsyncThunk(
  'AssignLeadThunk',
  async ({ leadIds, agentId, campaignId, flag }, { dispatch }) => {
    try {
      const jsonLeadIds = JSON.stringify(leadIds);

      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/assign/${agentId}`,
        { leadIds: jsonLeadIds }
      );

      successToast("Lead assigned successfully!");

      // refresh same tab
      dispatch(LeadThunk({ campaignId, flag }));

      return;
    } catch (err) {
      console.log('Error in AssignLeadThunk:', err.message);
    }
  }
);


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
