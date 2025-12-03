import { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';
import Card from '../components/Card';
import { useLocation, useNavigate } from 'react-router-dom';
import AddLeads from '../modals/AddLeads';
import { useGlobalContext } from '../context/GlobalContext';
import { useDispatch, useSelector } from 'react-redux';
import { AssignLeadThunk, LeadThunk } from '../redux/slice/LeadSlice';
import ImportFile from '../components/ImportLeads';
import { UsersThunk } from '../redux/slice/UsersSlice';
import { warningToast } from '../helpers/Toast';
import AssignToggle from '../components/AssignedToggle';
import { checkAuth, formatDate } from '../helpers/functions';
import { s } from 'framer-motion/client';

const Lead = () => {
  const [currentFlag, setCurrentFlag] = useState('false');
  console.log('current flag : ', currentFlag);

  const navigate = useNavigate();
  const { state } = useLocation();
  const dispatch = useDispatch();
  const agents = useSelector((store) => store.users.data);
  useEffect(() => {
    if (!(state && state.campaign && state.campaign.id)) {
      checkAuth(navigate);
    }
    if (state && state.campaign) {
      dispatch(LeadThunk({ campaignId: state.campaign.id, flag: 'false' }));
      dispatch(UsersThunk('agent'));
    }
  }, []);

  const leadsData = useSelector((store) => store.leads);
  const { showAddLeadsModal, setShowAddLeadsModal } = useGlobalContext();
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [agentId, setAgentId] = useState('');

  const selectAllLeades = (val) => {
    if (val) {
      setSelectedLeads(leadsData.data.map((lead, index) => lead.id));
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

  const leadToAgent = () => {
    if (selectedLeads.length === 0)
      return warningToast('Please select at least one lead');
    if (!agentId) return warningToast('Please select an Agent');
    dispatch(
      AssignLeadThunk({
        leadIds: selectedLeads,
        agentId,
        campaignId: state.campaign.id,
        flag: currentFlag, // <-- added!
      })
    );

    // dispatch(LeadThunk({ campaignId: state.campaign.id, flag: 'false' }));
    setSelectedLeads([]);
  };

  return (
    <div className="p-6 ">
      {showAddLeadsModal && (
        <AddLeads campaignId={state.campaign.id} flag="false" />
      )}
      <div className="flex justify-between items-center">
        <div className="max-w-md min-w-xl  bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition">
          <div className="p-6 space-y-3">
            <h2 className="text-xl font-bold text-gray-800">
              {state?.campaign.name}
            </h2>

            <p className="text-gray-600">{state?.campaign.description}</p>

            <div>
              <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                ID: {state?.campaign.id}
              </span>
            </div>

            <div>
              {state?.campaign.status === '1' ? (
                <span
                  className="inline-block px-3 py-1 rounded-full text-sm 
                   bg-green-100 text-green-800"
                >
                  Status: Active
                </span>
              ) : (
                <span
                  className="inline-block px-3 py-1 rounded-full text-sm 
                   bg-red-100 text-red-800"
                >
                  Status: Inactive
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center gap-10">
          <Card content="Total Leads" count={leadsData.data?.length} />
          <button
            onClick={() => setShowAddLeadsModal(true)}
            className="bg-green-500 hover:bg-green-700  transition text-white px-4 py-2 rounded-lg cursor-pointer"
          >
            Create Leads
          </button>
          {/* <button className="bg-blue-400 hover:bg-blue-700 transition text-white px-4 py-2 rounded-lg cursor-pointer">
            Import Leads
          </button> */}
          <ImportFile campaignId={state?.campaign.id} flag="false" />
        </div>
      </div>
      <div className="p-6 flex justify-between">
        <div>
          <select
            className="px-4 py-2 w-52 rounded-tl-lg rounded-bl-lg border border-gray-300 bg-white text-gray-700 shadow-sm
         hover:border-[#018ae0] transition cursor-pointer"
            onChange={(e) => setAgentId(e.target.value)}
          >
            <option value="" disabled selected>
              select agent
            </option>
            {agents.length &&
              agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
          </select>
          <button
            className="px-4 py-2 rounded-tr-lg rounded-br-lg border border-gray-300 bg-white text-gray-700 shadow-sm hover:border-[#018ae0] transition cursor-pointer"
            onClick={leadToAgent}
          >
            {currentFlag === 'true' ? 'Re-Assign' : 'Assign'}
          </button>
        </div>
        <AssignToggle
          options={['Unassigned', 'Assigned', 'All']}
          onChange={(value) => {
            setCurrentFlag(value);
            dispatch(LeadThunk({ campaignId: state.campaign.id, flag: value }));
          }}
        />
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
                    checked={
                      selectedLeads.length === leadsData.data?.length &&
                      leadsData.data?.length > 0
                    }
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
              {leadsData.loader ? (
                <tr>
                  <td colSpan={18} className="flex justify-center">
                    <Loader className="animate-spin" size={24} />
                  </td>
                </tr>
              ) : leadsData.data.length === 0 ? (
                <tr className="">
                  <td
                    colSpan={18}
                    className="pl-[650px] py-5 font-semibold text-xl"
                  >
                    {' '}
                    Need to Import some leads
                  </td>
                </tr>
              ) : (
                leadsData.data?.map((lead, index) => (
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
                    <td className="px-4 py-3 min-w-[160px]">
                      {lead.campaign_id}
                    </td>
                    <td className="px-4 py-3 min-w-[180px] font-medium text-gray-900">
                      {lead.name}
                    </td>
                    <td className="px-4 py-3 min-w-[180px]">{lead.phone}</td>
                    <td className="px-4 py-3 min-w-[220px]">{lead.email}</td>
                    <td className="px-4 py-3 min-w-[180px]">{lead.city}</td>
                    <td className="px-4 py-3 min-w-[180px]">{lead.product}</td>
                    <td className="px-4 py-3 min-w-[180px]">{lead.source}</td>
                    <td className="px-4 py-3 min-w-[140px]">
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 min-w-[160px]">
                      {agents.filter(
                        (agent) => agent.id === lead.assigned_to
                      )[0]?.name || 'Not Assigned'}
                    </td>
                    <td className="px-4 py-3 min-w-[140px]">{lead.attempts}</td>
                    <td className="px-4 py-3 min-w-[200px] whitespace-nowrap">
                      {lead.last_call || '- -'}
                    </td>
                    <td className="px-4 py-3 min-w-[200px] whitespace-nowrap">
                      {lead.followup_at || '- -'}
                    </td>
                    <td className="px-4 py-3 min-w-[160px]">
                      <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
                        {lead.doc_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 min-w-[240px]">
                      {lead.remarks || '- -'}
                    </td>
                    <td className="px-4 py-3 min-w-[200px] whitespace-nowrap">
                      {formatDate(lead.created_at)}
                    </td>
                    <td className="px-4 py-3 min-w-[200px] whitespace-nowrap">
                      {formatDate(lead.updated_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Lead;
