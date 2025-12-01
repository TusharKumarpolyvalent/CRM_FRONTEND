import Card from '../components/Card';
import { lazy, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGlobalContext } from '../context/GlobalContext';
import AddCampaign from '../modals/AddCampaign';
import { campaignThunk } from '../redux/slice/CampaignSlice';
import { useNavigate } from 'react-router-dom';
import { checkAuth } from '../helpers/functions';
import AddUser from './AddUser';

const Loader = lazy(() => import('../components/Loader'));
const CampaignCard = lazy(() => import('../components/CampaignCard'));

const AdminDashboard = () => {
   const navigate = useNavigate();
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(campaignThunk());
    checkAuth(navigate);
  }, []);
  const campaigns = useSelector((state) => state.campaigns);
  const loggedInUser = useSelector((store) => store.loggedInUser);

  
  const { showAddCampaignModal,showAddUserModal } = useGlobalContext();

  return (
    <div className="p-6">
      <div>
        <Card
          content="Total Campaign"
          count={campaigns?.data?.length}
          loaderStatus={campaigns.loader}
        />
      </div>
      <div>
        {campaigns.loader ? (
          <Loader screen="Campaigns" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
            {campaigns?.data?.map((item, idx) => (
              <div key={item.id} className="mt-4 cursor-pointer">
                <CampaignCard campaign={item} />
              </div>
            ))}
          </div>
        )}
      </div>
      <div>{showAddCampaignModal && <AddCampaign />}</div>
      <div>{showAddUserModal && <AddUser />}</div>

    </div>
  );
};

export default AdminDashboard;
