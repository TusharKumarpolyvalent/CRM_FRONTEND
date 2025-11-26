import { configureStore } from '@reduxjs/toolkit';
import campaignReducer from './slice/CampaignSlice';

const appStore = configureStore({
  reducer: {
    campaigns: campaignReducer,
  },
});

export default appStore;
