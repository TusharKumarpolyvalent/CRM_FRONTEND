import React from 'react'

const AgentDashboard = () => {
  const leads = [
    {
      id: 1,
      name: "tushar",
      phone: "8178677009",
      lastCall: "2025-11-20 10:34:20",
      status: "Not Interested",
    },
    {
      id: 1,
      name: "tushar",
      phone: "8178677009",
      lastCall: "2025-11-20 10:34:20",
      status: "Not Interested",
    },
    {
      id: 1,
      name: "tushar",
      phone: "8178677009",
      lastCall: "2025-11-20 10:34:20",
      status: "Not Interested",
    },
    {
      id: 1,
      name: "tushar",
      phone: "8178677009",
      lastCall: "2025-11-20 10:34:20",
      status: "Not Interested",
    },
    {
      id: 1,
      name: "tushar",
      phone: "8178677009",
      lastCall: "2025-11-20 10:34:20",
      status: "Not Interested",
    }
  ];

  return (
    <>
      <div className="p-6 flex gap-6 mt-10.5 ">

        {/* Assigned Leads Card */}
        <div className="flex-1 border rounded-xl shadow-sm bg-white mb-5">
          <div className="border-b px-4 py-3 font-semibold text-gray-700">
            Assigned Leads
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold">ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold">Last Call</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Action</th>
                </tr>
              </thead>

              <tbody>
                {leads.map((lead, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-3">{lead.id}</td>
                    <td className="px-4 py-3">{lead.name}</td>
                    <td className="px-4 py-3">{lead.phone}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{lead.lastCall}</td>
                    <td className="px-4 py-3">{lead.status}</td>

                    <td className="px-4 py-3">
                      <button className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </div>

        {/* Right Side Card */}
        <div className="w-80  h-50 border rounded-xl shadow-sm bg-white p-4">
          <div className="font-semibold mb-3">Quick Actions</div>

          <button className="w-full border border-blue-500 text-blue-600 py-2 rounded-md hover:bg-blue-50">
            Export My Leads
          </button>
        </div>

      </div>
    </>
  );
};

export default AgentDashboard;
