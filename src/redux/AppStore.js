import { configureStore } from '@reduxjs/toolkit';
import campaignReducer from './slice/CampaignSlice';
import leadReducer from './slice/LeadSlice';
import usersReducer from './slice/UsersSlice';
import loggedInUserReducer from './slice/LoggedInUserSlice';
const appStore = configureStore({
  reducer: {
    campaigns: campaignReducer,
    leads: leadReducer,
    users: usersReducer,
    loggedInUser: loggedInUserReducer,
  },
});

export default appStore;
