import React, { use, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LoggedInUserLeadThunk } from '../redux/slice/LoggedInUserSlice';

const AgentDashboard = () => {
  const [selectedLead, setSelectedLead] = useState(null); // Modal ke liye state

const dispatch = useDispatch(); 

const loggedInUser = useSelector((store) => store.loggedInUser);  

  console.log("loggedInUser leads:", loggedInUser.leads);
   useEffect(()=>{
    dispatch(LoggedInUserLeadThunk(loggedInUser.data.id));

   },[loggedInUser.data])

  const leads = [
    {
      id: 1,
      name: 'tushar',
      phone: '8178677009',
      lastCall: '2025-11-20 10:34:20',
      status: 'Not Interested',
      email: 'tusharboken77@gmail.com',
      city: 'GURUGRAM',
      product: 'milk',
      assignedTo: 'test',
      followupAt: '2026-01-09 15:04:00',
      docStatus: 'pending',
    },
    {
      id: 2,
      name: 'Anushka',
      phone: '8178677009',
      lastCall: '2025-11-20 10:34:20',
      status: 'Not confirm',
      email: 'tusharboken77@gmail.com',
      city: 'GURUGRAM',
      product: 'milk',
      assignedTo: 'test',
      followupAt: '2026-01-09 15:04:00',
      docStatus: 'pending',
    },
    {
      id: 1,
      name: 'tushar',
      phone: '8178677009',
      lastCall: '2025-11-20 10:34:20',
      status: 'Not Interested',
      email: 'tusharboken77@gmail.com',
      city: 'GURUGRAM',
      product: 'milk',
      assignedTo: 'test',
      followupAt: '2026-01-09 15:04:00',
      docStatus: 'pending',
    },
  ];

  return (
   <>
  <div className="p-6 mt-10">
    {/* ======= TOP SUMMARY ROW ======= */}
   <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg border p-5 hover:shadow-xl transition-all duration-300 mb-5">

  {/* Title */}
  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
    <span className="inline-block w-2 h-5  rounded-sm"></span>
    Agent Summary
  </h2>

  {/* Content */}
  <div className="space-y-3 text-sm">
    
    <div className="flex justify-between">
      <span className="font-medium text-gray-600">Agent Name:</span>
      <span className="text-gray-900">{loggedInUser.data?.name || "—"}</span>
    </div>

    <div className="flex justify-between">
      <span className="font-medium text-gray-600">Agent ID:</span>
      <span className="text-gray-900">{loggedInUser.data?.id || "—"}</span>
    </div>

    <div className="flex justify-between">
      <span className="font-medium text-gray-600">Total Leads:</span>
      <span className="text-gray-900">{loggedInUser.leads.length}</span>
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
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {loggedInUser.leads.map((lead, index) => (
              <tr
                key={index}
                className="hover:bg-blue-50 transition-colors odd:bg-white even:bg-gray-50"
              >
                <td className="px-4 py-3">{lead.id}</td>
                <td className="px-4 py-3">{lead.name}</td>
                <td className="px-4 py-3">{lead.phone}</td>
                <td className="px-4 py-3">{lead.lastCall}</td>
                <td className="px-4 py-3">{lead.status}</td>

                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelectedLead(lead)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Open
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
          <p><strong>Status:</strong> {selectedLead.status}</p>
          <p><strong>Email:</strong> {selectedLead.email}</p>
          <p><strong>Attempts:</strong> 4</p>
          <p><strong>City:</strong> {selectedLead.city}</p>
          <p><strong>Last Call:</strong> {selectedLead.lastCall}</p>
          <p><strong>Product:</strong> {selectedLead.product}</p>
          <p><strong>Follow-up At:</strong> {selectedLead.followupAt}</p>
          <p><strong>Assigned To:</strong> {selectedLead.assignedTo}</p>
          <p><strong>Doc Status:</strong> {selectedLead.docStatus}</p>
        </div>

        {/* Update Lead */}
        <div className="border rounded-lg p-4 mb-5">
          <h3 className="font-semibold mb-3">Update Lead</h3>

          <label className="block mb-1">Status</label>
          <select className="w-full border rounded px-3 py-2 mb-3">
            <option>Number Busy</option>
            <option>Not Interested</option>
            <option>Call Back</option>
            <option>Converted</option>
          </select>

          <label className="block mb-1">Remarks</label>
          <textarea className="w-full border rounded px-3 py-2 mb-3" rows="3"></textarea>

          <label className="block mb-1">Follow-up Date/Time</label>
          <input type="datetime-local" className="w-full border rounded px-3 py-2 mb-3" />

          <label className="block mb-1">Upload Document</label>
          <input type="file" className="w-full border rounded px-3 py-2 mb-4" />

          <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
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
