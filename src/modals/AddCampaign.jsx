import { useState } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { campaignThunk } from '../redux/slice/CampaignSlice';
import { errorToast, successToast } from '../helpers/Toast';

const AddCampaign = () => {
  const { setShowAddCampaignModal } = useGlobalContext();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    client_name: '',
    meta_date: '',
    created_at: '',
    start_date: '',
    end_date: '',
  });

  // Convert date → ISO format (YYYY-MM-DDTHH:mm:ss.000Z)
  const toISODate = (date) => {
    if (!date) return '';
    return new Date(date).toISOString();
  };

  // Handle input updates
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Save Campaign
  const handleSave = async () => {
    try {
      const updatedData = {
        ...formData,
        meta_date: toISODate(formData.meta_date),
        created_at: toISODate(formData.created_at),
        start_date: toISODate(formData.start_date),
        end_date: toISODate(formData.end_date),
      };
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/add-Campaign`,
        updatedData,
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
      setShowAddCampaignModal(false);
      successToast('Campaign added successfully');

      dispatch(campaignThunk());
    } catch (error) {
      console.error('Error:', error);
      errorToast('Failed to add Campaign');
    }
  };

  return (
    <div className="fixed inset-0  bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-lg p-6 relative">
        <h2 className="text-xl font-semibold mb-4">Add Campaign</h2>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Campaign ID</label>
            <input
              name="id"
              type="text"
              className="w-full border p-2 rounded"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Campaign Name</label>
            <input
              name="name"
              type="text"
              className="w-full border p-2 rounded"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Client Name</label>
            <input
              name="client_name"
              type="text"
              className="w-full border p-2 rounded"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Meta Date</label>
            <input
              name="meta_date"
              type="date"
              className="w-full border p-2 rounded"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Created Date</label>
            <input
              name="created_at"
              type="date"
              className="w-full border p-2 rounded"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Start Date</label>
            <input
              name="start_date"
              type="date"
              className="w-full border p-2 rounded"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="text-sm font-medium">End Date</label>
            <input
              name="end_date"
              type="date"
              className="w-full border p-2 rounded"
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setShowAddCampaignModal(false)}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCampaign;
