import Card from '../components/Card';
import { lazy, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGlobalContext } from '../context/GlobalContext';
import AddCampaign from '../modals/AddCampaign';
import { campaignThunk } from '../redux/slice/CampaignSlice';

const Loader = lazy(() => import('../components/Loader'));
const CampaignCard = lazy(() => import('../components/CampaignCard'));

const AdminDashboard = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(campaignThunk());
  }, []);
  const campaigns = useSelector((state) => state.campaigns);
  const { showAddCampaignModal } = useGlobalContext();

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
    </div>
  );
};

export default AdminDashboard;
