import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CampaignCard = ({ campaign }) => {
  const navigate = useNavigate();

  const [isOn, setIsOn] = useState(false);

  const toggleSwitch = () => setIsOn(!isOn);

  return (
    <div className="max-w-sm mx-auto bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <img
        className="w-full h-48 object-cover"
        src={campaign.image}
        alt={campaign.name}
      />
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">{campaign.name}</h2>
        <p className="text-gray-600 mb-4">{campaign.description}</p>
        <p className="text-gray-600 mb-4">Campaign Id : {campaign.id}</p>

        {/* Toggle Switch */}
        <div className="flex justify-between items-center">
          <div>
            <button
              onClick={toggleSwitch}
              className={`w-16 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300
            ${isOn ? 'bg-blue-400 justify-end' : 'bg-gray-300 justify-start'}`}
            >
              <span className="w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300"></span>
            </button>
            <p className="mt-2 text-sm text-gray-500">{isOn ? 'ON' : 'OFF'}</p>
          </div>
          <div>
            <p
              className="bg-blue-400 rounded-md px-2 py-1 text-white"
              onClick={() =>
                navigate(`/admin/campaigns?id=${campaign.id}`, {
                  state: {
                    campaign: campaign,
                  },
                })
              }
            >
              Check Lead
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignCard;
