import { useRef } from 'react';
import axios from 'axios';
import { errorToast, successToast } from '../helpers/Toast';
import { useDispatch } from 'react-redux';
import { LeadThunk } from '../redux/slice/LeadSlice';

const ImportFile = ({ campaignId, flag }) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    console.log('File selected:', file);

    const formData = new FormData();
    formData.append('file', file); // "file" MUST match backend field name

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/import-Leads`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      if (response.status === 200) {
        successToast('Leads import successfully');
        dispatch(LeadThunk({ campaignId, flag }));
      } else errorToast('Leads import failed');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
      />

      <button
        onClick={handleButtonClick}
        className="bg-blue-400 hover:bg-blue-700 transition text-white px-4 py-2 rounded-lg cursor-pointer"
      >
        Import Leads
      </button>
    </div>
  );
};

export default ImportFile;
