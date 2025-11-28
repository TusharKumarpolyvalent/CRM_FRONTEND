import React, { useState } from "react";

const AgentDashboard = () => {
  const [selectedLead, setSelectedLead] = useState(null); // Modal ke liye state

  const leads = [
    {
      id: 1,
      name: "tushar",
      phone: "8178677009",
      lastCall: "2025-11-20 10:34:20",
      status: "Not Interested",
      email: "tusharboken77@gmail.com",
      city: "GURUGRAM",
      product: "milk",
      assignedTo: "test",
      followupAt: "2026-01-09 15:04:00",
      docStatus: "pending",
    },
    {
      id: 2,
      name: "Anushka",
      phone: "8178677009",
      lastCall: "2025-11-20 10:34:20",
      status: "Not confirm",
      email: "tusharboken77@gmail.com",
      city: "GURUGRAM",
      product: "milk",
      assignedTo: "test",
      followupAt: "2026-01-09 15:04:00",
      docStatus: "pending",
    },
    {
      id: 1,
      name: "tushar",
      phone: "8178677009",
      lastCall: "2025-11-20 10:34:20",
      status: "Not Interested",
      email: "tusharboken77@gmail.com",
      city: "GURUGRAM",
      product: "milk",
      assignedTo: "test",
      followupAt: "2026-01-09 15:04:00",
      docStatus: "pending",
    },
  ];

  return (
    <>
      <div className="p-6 flex gap-6 mt-10">

        {/* Assigned Leads Card */}
        <div className="flex-1  overflow-x-auto rounded-2xl shadow-lg border border-gray-200">
          {/* <div className="border-0 px-3 py-3 rounded-l  font-semibold bg-[#018ae0] text-gray-700">
            Assigned Leads
          </div> */}

          <div className="overflow-x-auto ">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gradient-to-r from-[#018ae0] to-[#005bb5] text-white sticky top-0">
                <tr className="border-b bg-[#018ae0]">
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Last Call</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {leads.map((lead, index) => (
                  <tr key={index} className="hover:bg-blue-50 transition-colors odd:bg-white even:bg-gray-50">
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
        </div>

        {/* Right Card */}
        <div className="w-80 border rounded-xl shadow-sm bg-white p-4">
          <div className="font-semibold mb-3">Quick Actions</div>

          <button className="w-full border border-blue-500 text-blue-600 py-2 rounded-md hover:bg-blue-50">
            Export My Leads
          </button>
        </div>
      </div>


      {/* ================= MODAL SECTION ================= */}
      {selectedLead && (
     <div className="fixed inset-0 
                  bg-opacity-20 
                  backdrop-blur-sm 
                  flex justify-center items-center p-5 
                  z-[100]">

    {/* Modal container — NO BLUR HERE */}
    <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl 
                    p-6 overflow-y-auto max-h-[90vh]
                    backdrop-blur-0">
            
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
              <textarea
                className="w-full border rounded px-3 py-2 mb-3"
                rows="3"
              ></textarea>

              <label className="block mb-1">Follow-up Date/Time</label>
              <input
                type="datetime-local"
                className="w-full border rounded px-3 py-2 mb-3"
              />

              <label className="block mb-1">Upload Document</label>
              <input
                type="file"
                className="w-full border rounded px-3 py-2 mb-4"
              />

              <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                Save
              </button>
            </div>

            {/* Activity Log */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Activity Log</h3>

              <div className="text-sm text-gray-600 space-y-1">
                <p>2025-11-20 15:04:20 — Status changed to Not Interested</p>
                <p>2025-11-20 15:03:52 — Status changed to Call Cut</p>
                <p>2025-11-20 15:03:28 — Status changed to Call Cut</p>
                <p>2025-11-20 15:02:56 — Status changed to Number Busy</p>
              </div>
            </div>

          </div>
        </div>
      )}

    </>
  );
};

export default AgentDashboard;
