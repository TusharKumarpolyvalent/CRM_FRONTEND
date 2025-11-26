import Card from '../components/Card';
import { lazy } from 'react';
import { useSelector } from 'react-redux';

const Loader = lazy(() => import('../components/Loader'));
const CampaignCard = lazy(() => import('../components/CampaignCard'));

const AdminDashboard = () => {
  const campaigns = useSelector((state) => state.campaigns);
  return (
    <div className="p-6">
      <div>
        <Card
          content="Total Campaign"
          count={campaigns.data.length}
          loaderStatus={campaigns.loader}
        />
      </div>
      {campaigns.loader ? (
        <Loader screen="Campaigns"/>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
          {campaigns.data.map((item) => (
            <div key={item.id} className="mt-4 cursor-pointer">
              <CampaignCard campaign={item} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
