import { useState } from 'react';
import Card from '../components/Card';
import { useLocation } from 'react-router-dom';

const Lead = () => {
  const leads = [
    {
      id: 1,
    },
    {
      id: 2,
    },
    {
      id: 3,
    },
    {
      id: 4,
    },
  ];
  const { state } = useLocation();
  console.log('campaign details : ', state.campaign);

  const [selectedLeads, setSelectedLeads] = useState([]);
  const selectAllLeades = (val) => {
    if (val) {
      setSelectedLeads(leads.map((lead, index) => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };
  const individualLeadSelect = (id, val) => {
    if (!val) {
      setSelectedLeads(selectedLeads.filter((leadId) => leadId !== id));
    } else {
      setSelectedLeads([...selectedLeads, id]);
    }
  };
  return (
    <div className="p-6 ">
      <div className="flex justify-between items-center">
        <div class="max-w-md min-w-xl  bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition">
          <div class="p-6 space-y-3">
            <h2 class="text-xl font-bold text-gray-800">
              {state.campaign.name}
            </h2>

            <p class="text-gray-600">{state.campaign.description}</p>

            <div>
              <span class="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                ID: {state.campaign.id}
              </span>
            </div>

            <div>
              {state.campaign.status === "1" ? 
               <span
                class="inline-block px-3 py-1 rounded-full text-sm 
                   bg-green-100 text-green-800"
              >
                Status: Active
              </span>  
              :
              <span
                class="inline-block px-3 py-1 rounded-full text-sm 
                   bg-red-100 text-red-800"
              >
                Status: Inactive
              </span>
            }
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center gap-10">
          <Card content="Total Leads" count={0} />
          <button className="bg-green-500 hover:bg-green-700  transition text-white px-4 py-2 rounded-lg cursor-pointer">
            Create Leads
          </button>
          <button className="bg-blue-400 hover:bg-blue-700 transition text-white px-4 py-2 rounded-lg cursor-pointer">
            Import Leads
          </button>
        </div>
      </div>
      <div className="p-6">
        <select
          class="px-4 py-2 w-52 rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm 
         focus:outline-none focus:ring-2 focus:ring-[#018ae0] focus:border-[#018ae0] 
         hover:border-[#018ae0] transition cursor-pointer"
        >
          <option value="" disabled selected>
            Assign Agent
          </option>
          <option value="">Agent 1</option>
          <option value="">Agent 2</option>
          <option value="">Agent 3</option>
          <option value="">Agent 4</option>
        </select>
      </div>
      <div className="p-6">
        <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-gradient-to-r from-[#018ae0] to-[#005bb5] text-white sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left font-semibold min-w-[120px]">
                  <input
                    className="cursor-pointer"
                    type="checkbox"
                    checked={selectedLeads.length === leads.length}
                    onChange={(e) => selectAllLeades(e.target.checked)}
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold min-w-[120px]">
                  ID
                </th>
                <th className="px-4 py-3 text-left font-semibold min-w-[180px]">
                  Campaign ID
                </th>
                <th className="px-4 py-3 text-left font-semibold min-w-[200px]">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-semibold min-w-[200px]">
                  Phone
                </th>
                <th className="px-4 py-3 text-left font-semibold min-w-[240px]">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-semibold min-w-[200px]">
                  City
                </th>
                <th className="px-4 py-3 text-left font-semibold min-w-[200px]">
                  Product
                </th>
                <th className="px-4 py-3 text-left font-semibold min-w-[200px]">
                  Source
                </th>
                <th className="px-4 py-3 text-left font-semibold min-w-[160px]">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-semibold min-w-[180px]">
                  Assigned To
                </th>
                <th className="px-4 py-3 text-left font-semibold min-w-[160px]">
                  Attempts
                </th>
                <th className="px-4 py-3 text-left font-semibold min-w-[220px] whitespace-nowrap">
                  Last Call
                </th>
                <th className="px-4 py-3 text-left font-semibold min-w-[220px] whitespace-nowrap">
                  Follow-up At
                </th>
                <th className="px-4 py-3 text-left font-semibold min-w-[180px]">
                  Doc Status
                </th>
                <th className="px-4 py-3 text-left font-semibold min-w-[260px]">
                  Remarks
                </th>
                <th className="px-4 py-3 text-left font-semibold min-w-[220px] whitespace-nowrap">
                  Created At
                </th>
                <th className="px-4 py-3 text-left font-semibold min-w-[220px] whitespace-nowrap">
                  Updated At
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {leads.map((lead, index) => (
                <tr
                  key={lead.id}
                  className="hover:bg-blue-50 transition-colors odd:bg-white even:bg-gray-50"
                >
                  <td className="px-4 py-3 min-w-[100px]">
                    <input
                      className="cursor-pointer"
                      type="checkbox"
                      checked={selectedLeads.includes(lead.id)}
                      onChange={(e) =>
                        individualLeadSelect(lead.id, e.target.checked)
                      }
                    />
                  </td>
                  <td className="px-4 py-3 min-w-[100px]">{lead.id}</td>
                  <td className="px-4 py-3 min-w-[160px]">101</td>
                  <td className="px-4 py-3 min-w-[180px] font-medium text-gray-900">
                    John Doe
                  </td>
                  <td className="px-4 py-3 min-w-[180px]">+123456789</td>
                  <td className="px-4 py-3 min-w-[220px]">john@example.com</td>
                  <td className="px-4 py-3 min-w-[180px]">New York</td>
                  <td className="px-4 py-3 min-w-[180px]">Product A</td>
                  <td className="px-4 py-3 min-w-[180px]">Google Ads</td>
                  <td className="px-4 py-3 min-w-[140px]">
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                      New
                    </span>
                  </td>
                  <td className="px-4 py-3 min-w-[160px]">3</td>
                  <td className="px-4 py-3 min-w-[140px]">2</td>
                  <td className="px-4 py-3 min-w-[200px] whitespace-nowrap">
                    2025-01-21 14:32
                  </td>
                  <td className="px-4 py-3 min-w-[200px] whitespace-nowrap">
                    2025-01-22 10:00
                  </td>
                  <td className="px-4 py-3 min-w-[160px]">
                    <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
                      pending
                    </span>
                  </td>
                  <td className="px-4 py-3 min-w-[240px]">
                    Need more details about the product.
                  </td>
                  <td className="px-4 py-3 min-w-[200px] whitespace-nowrap">
                    2025-01-21
                  </td>
                  <td className="px-4 py-3 min-w-[200px] whitespace-nowrap">
                    2025-01-21
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Lead;
