import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

export const campaignThunk = createAsyncThunk('campaignThunk', async () => {
  try {
    //make api call
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/admin/get-campaigns`
    );

    return response.data.data;
  } catch (err) {
    console.log('Error in campaignThunk:', err.message);
  }
});

const CampaignSlice = createSlice({
  name: 'Campaign_Details',
  initialState: {
    loader: false,
    data: [],
    error: null,
  },
  reducers: {
    setCampaigns: (state, action) => {
      return action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(campaignThunk.pending, (state) => {
        state.loader = true;
        state.error = null;
      })
      .addCase(campaignThunk.fulfilled, (state, action) => {
        state.loader = false;
        state.data = action.payload;
      })
      .addCase(campaignThunk.rejected, (state, action) => {
        state.loader = false;
        state.error = action.error.message;
      });
  },
});

export const { setCampaigns } = CampaignSlice.actions;
export default CampaignSlice.reducer;
