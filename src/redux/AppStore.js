import { configureStore } from '@reduxjs/toolkit';
import campaignReducer from './slice/CampaignSlice';
import leadReducer from './slice/LeadSlice';
import usersReducer from './slice/UsersSlice';
const appStore = configureStore({
  reducer: {
    campaigns: campaignReducer,
    leads: leadReducer,
    users: usersReducer,
  },
});

export default appStore;
