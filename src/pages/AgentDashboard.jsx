import React, { use, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LoggedInUserLeadThunk, updateFollowUpThunk } from '../redux/slice/LoggedInUserSlice';


const statusOption = ["Converted", "Call Back", "Not Interested", "Number Busy"]
const AgentDashboard = () => {



  const [formData, setFormData] = useState({
    status: "",
    remark: "",
    followup_at: ""
  });





const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};


  const toISO = (dateStr) => {
  return new Date(dateStr).toISOString();
};

const handleSave = () => {
  
  dispatch(updateFollowUpThunk({
    agentId: loggedInUser.data.id,
    id: selectedLead.id,
    attempt: selectedLead.attempts,
     data: {
      status: formData.status,
      remark: formData.remark,      
      lastcall: toISO(formData.followup_at) 
    }
  }));


  setSelectedLead(null); 
};

const formatDate = (isoString) => {
  if (!isoString) return "—";

  return new Date(isoString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata" // IST
  });
};





  const [selectedLead, setSelectedLead] = useState(null); 
  useEffect(() => {
    
  if (selectedLead) {

    setFormData({
      status: selectedLead.status || "",
      remark: selectedLead.remarks || "",   // FIXED
      followup_at: selectedLead.followupAt || "",
    });
  }
}, [selectedLead]);// Modal ke liye state

  const dispatch = useDispatch();

  const loggedInUser = useSelector((store) => store.loggedInUser);


  useEffect(() => {
    dispatch(LoggedInUserLeadThunk(loggedInUser.data.id));

  }, [loggedInUser.data])



  return (
    <>
      <div className="p-6 mt-10">
        {/* ======= TOP SUMMARY ROW ======= */}
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] 
                border border-blue-200 p-6 relative overflow-hidden
                hover:shadow-[0_6px_20px_rgba(1,138,224,0.25)] transition-all duration-300 mb-5">

          {/* Blue Accent Side Strip */}
          <div className="absolute left-0 top-0 h-full w-1.5 bg-[#018ae0] rounded-l-2xl"></div>

          {/* Subtle Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#018ae0]/5 to-transparent rounded-2xl pointer-events-none"></div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center gap-2 relative z-10">
            <span className="inline-block  h-5  rounded-sm"></span>
            Agent Details
          </h2>

          {/* Content */}
          <div className="space-y-4 text-sm relative z-10">

            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Agent Name:</span>
              <span className="text-gray-900">{loggedInUser?.data?.name || "—"}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Agent ID:</span>
              <span className="text-gray-900">{loggedInUser?.data?.id || "—"}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Total Leads:</span>
              <span className="text-gray-900">{loggedInUser?.leads?.length || 0}</span>
            </div>

          </div>
        </div>


        {/* ======= MAIN CONTENT ROW (Table + Right Card) ======= */}
        <div className="grid grid-cols-4 gap-6">

          {/* Assigned Leads Table */}
          <div className="col-span-3 overflow-x-auto rounded-2xl shadow-lg border border-gray-200 bg-white">

            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gradient-to-r from-[#018ae0] to-[#005bb5] text-white sticky top-0">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Last Call</th>
                  <th className="px-4 py-3 text-left">Customer Status</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {loggedInUser.leads?.map((lead, index) => (
                  <tr
                    key={index}
                    className="hover:bg-blue-50 transition-colors odd:bg-white even:bg-gray-50"
                  >
                    <td className="px-4 py-3">{lead.id}</td>
                    <td className="px-4 py-3">{lead.name}</td>
                    <td className="px-4 py-3">{lead.phone}</td>
                    <td className="px-4 py-3">{formatDate(lead.last_call)}</td>
                    <td className="px-4 py-3">{lead.status}</td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedLead(lead)}
                        disabled={lead.attempts === "3" ? true: false}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        {lead.attempts === "3" ? "closed": "open"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right Card */}
          <div className="col-span-1 bg-white border rounded-xl shadow-sm p-4">
            <div className="font-semibold mb-3">Quick Actions</div>

            <button className="w-full border border-blue-500 text-blue-600 py-2 rounded-md hover:bg-blue-50">
              Export My Leads
            </button>
          </div>
        </div>
      </div>

      {/* ============= MODAL SECTION ============= */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm 
                    flex justify-center items-center p-5 z-[100]">

          {/* Modal Box (No Blur) */}
          <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl 
                      p-6 overflow-y-auto max-h-[90vh] backdrop-blur-0">

            {/* Header */}
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-xl font-semibold">
                Lead #{selectedLead.id} - {selectedLead.name}
              </h2>
              <button
                onClick={() => setSelectedLead(null)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Close
              </button>
            </div>

            {/* Lead Details */}
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <p><strong>Phone:</strong> {selectedLead.phone}</p>
              <p><strong>Customer status:</strong> {selectedLead.status}</p>
              <p><strong>Email:</strong> {selectedLead.email}</p>
              <p><strong>Attempts:</strong> {selectedLead.attempts}</p>
              <p><strong>City:</strong> {selectedLead.city}</p>
              <p><strong>Last Call:</strong>{formatDate(selectedLead.last_call)}</p>
              <p><strong>Product:</strong> {selectedLead.product}</p>
              <p><strong>Follow-up At:</strong> {selectedLead.followupAt}</p>
              <p><strong>Lead Status:</strong> {selectedLead.doc_status}</p>
            </div>

            {/* Update Lead */}
           {/* ===== UPDATE LEAD ===== */}
<div className="border rounded-lg p-4 mb-5">
  <h3 className="font-semibold mb-3">Update Lead</h3>

  <label className="block mb-1">Status</label>
  <select
    name="status"
    className="w-full border rounded px-3 py-2 mb-3"
    // value={formData.status}
    onChange={handleChange}
  >
    <option value="" disabled selected>Select status</option>
    {statusOption.map(s => <option key={s} value={s}>{s}</option>)}
  </select>

  <label className="block mb-1">Remarks</label>
  <textarea
    name="remark"
    className="w-full border rounded px-3 py-2 mb-3"
    rows="3"
    value={formData.remark}
    onChange={handleChange}
  />

  <label className="block mb-1">Follow-up Date/Time</label>
  <input
    type="datetime-local"
    name="followup_at"
    className="w-full border rounded px-3 py-2 mb-3"
    value={formData.followup_at}
    onChange={handleChange}
  />

  <button
    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
    onClick={handleSave}
  >
    Save
  </button>
</div>


            {/* Activity Log */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Activity Log</h3>

              <div className="text-sm text-gray-600 space-y-1">
                <p>2025-11-20 15:04 — Status changed to Not Interested</p>
                <p>2025-11-20 15:03 — Status changed to Call Cut</p>
                <p>2025-11-20 15:03 — Status changed to Call Cut</p>
                <p>2025-11-20 15:02 — Status changed to Number Busy</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>

  );
};

export default AgentDashboard;
