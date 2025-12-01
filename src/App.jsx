import { useEffect } from 'react';
import { DynamicRoutes } from './routes/DynamicRoutes';
import { campaignThunk } from './redux/slice/CampaignSlice';
import { useDispatch } from 'react-redux';

const App = () => {
  return (
    <>
      <DynamicRoutes />
    </>
  );
};

export default App;
