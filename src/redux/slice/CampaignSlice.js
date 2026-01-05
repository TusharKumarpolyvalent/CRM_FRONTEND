import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { successToast } from '../../helpers/Toast';

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
export const deleteCampaignThunk = createAsyncThunk(
  'campaign/deleteCampaign',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/admin/delete-campaign/${id}`
      );

      successToast('Campaign deleted successfully');
      return id; // 👈 important (state update ke liye)
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Delete failed');
    }
  }
);

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
    // GET campaigns
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
    })

    // DELETE campaign
    .addCase(deleteCampaignThunk.pending, (state) => {
      state.loader = true;
    })
    .addCase(deleteCampaignThunk.fulfilled, (state, action) => {
      state.loader = false;

      console.log('Deleted ID:', action.payload);

      state.data = state.data.filter(
        (campaign) => campaign.id !== action.payload
      );
    })
    .addCase(deleteCampaignThunk.rejected, (state, action) => {
      state.loader = false;
      state.error = action.payload;
    });
},

  
});



export const { setCampaigns } = CampaignSlice.actions;
export default CampaignSlice.reducer;
