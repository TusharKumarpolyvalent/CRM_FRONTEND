import { useState } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import axios from 'axios';
import { useDispatch } from 'react-redux';
// import { leadsThunk } from '../redux/slice/LeadsSlice';
import { errorToast, successToast } from '../helpers/Toast';
import { LeadThunk } from '../redux/slice/LeadSlice';

const AddLeads = ({ campaignId, flag }) => {
  const { setShowAddLeadsModal } = useGlobalContext();

  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    campaign_id: campaignId || 'null',
    name: '',
    phone: '',
    email: '',
    city: '',
    product: '',
    source: '',
  });

  // Handle input value updates
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Save Lead
  const handleSave = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/add-leads`,
        formData,
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      setShowAddLeadsModal(false);
      successToast('Lead added successfully');
      dispatch(LeadThunk({ campaignId, flag }));

      //   dispatch(leadsThunk());
    } catch (error) {
      console.error('Error:', error);
      errorToast('Failed to add lead');
    }
  };

  return (
    <div className="fixed inset-0 bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-lg p-6 relative">
        <h2 className="text-xl font-semibold mb-4">Add Lead</h2>

        <div className="space-y-3">
          {/* Campaign ID */}
          <div>
            <label className="text-sm font-medium">Campaign ID</label>
            <input
              name="campaign_id"
              type="text"
              value={campaignId || 'null'}
              className="w-full border p-2 rounded"
              disabled
            />
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              name="name"
              type="text"
              className="w-full border p-2 rounded"
              onChange={handleChange}
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm font-medium">Phone</label>
            <input
              name="phone"
              type="text"
              className="w-full border p-2 rounded"
              onChange={handleChange}
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              name="email"
              type="email"
              className="w-full border p-2 rounded"
              onChange={handleChange}
            />
          </div>

          {/* City */}
          <div>
            <label className="text-sm font-medium">City</label>
            <input
              name="city"
              type="text"
              className="w-full border p-2 rounded"
              onChange={handleChange}
            />
          </div>

          {/* Product */}
          <div>
            <label className="text-sm font-medium">Product</label>
            <input
              name="product"
              type="text"
              className="w-full border p-2 rounded"
              onChange={handleChange}
            />
          </div>

          {/* Source */}
          <div>
            <label className="text-sm font-medium">Source</label>
            <input
              name="source"
              type="text"
              className="w-full border p-2 rounded"
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setShowAddLeadsModal(false)}
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

export default AddLeads;
