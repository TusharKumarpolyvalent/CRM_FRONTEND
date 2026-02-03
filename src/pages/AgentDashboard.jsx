import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  LoggedInUserLeadThunk,
  updateFollowUpThunk,
} from '../redux/slice/LoggedInUserSlice';
import { formatDate } from '../helpers/functions';
import { Copy, Phone, Calendar, BarChart } from 'lucide-react';
import { CheckCheck } from 'lucide-react';
import AssignToggle from '../components/AssignedToggle';
import { statusOption } from '../utils/constant';
import { Pencil, Check } from 'lucide-react';
import axios from 'axios';
import { statusReasons } from '../utils/constant';

const AgentDashboard = () => {
  const dispatch = useDispatch();
  const loggedInUser = useSelector((store) => store.loggedInUser);
  const [copyFlag, setCopyFlag] = useState(true);
  const [leadFilter, setLeadFilter] = useState('open');
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formData, setFormData] = useState({
    status: '',
    remark: '',
    followup_at: '',
    reason: '',
  });
  const [editCity, setEditCity] = useState({});
  const [editPincode, setEditPincode] = useState({});
  
  // Daily Call Count State
  const [callCountDate, setCallCountDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [dailyCallCount, setDailyCallCount] = useState(0);
  const [callCountLoading, setCallCountLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Function to calculate calls for a specific date
  const calculateDailyCalls = (date) => {
    if (!loggedInUser?.Leads) return 0;
    
    const selectedDate = new Date(date).toISOString().split('T')[0];
    
    // Count leads that have last_call on the selected date
    const calls = loggedInUser.Leads.filter(lead => {
      if (!lead.last_call) return false;
      
      const leadDate = new Date(lead.last_call).toISOString().split('T')[0];
      return leadDate === selectedDate;
    });
    
    return calls.length;
  };

  // Handle call count calculation
  const handleCallCount = () => {
    setCallCountLoading(true);
    setTimeout(() => {
      const count = calculateDailyCalls(callCountDate);
      setDailyCallCount(count);
      setCallCountLoading(false);
    }, 300);
  };

  // Reset call count
  const resetCallCount = () => {
    const today = new Date().toISOString().split('T')[0];
    setCallCountDate(today);
    setDailyCallCount(0);
  };

  const updateLeadCity = async () => {
    try {
      const data = {
        city: editCity[Object.keys(editCity)[0]],
      };

    const response = await axios.patch(
  `${import.meta.env.VITE_API_BASE_URL}/agent/update-lead-address/${Object.keys(editCity)[0]}`,
  data
);

      console.log('Lead city updated:', response.data);
      setEditCity({});
      dispatch(LoggedInUserLeadThunk(loggedInUser.data.id));
    } catch (err) {
      console.error('Error updating lead city:', err);
    }
  };

  const updateLeadPincode = async () => {
    try {
      const data = {
        pincode: editPincode[Object.keys(editPincode)[0]],
      };

    const response = await axios.patch(
  `${import.meta.env.VITE_API_BASE_URL}/agent/update-lead-address/${Object.keys(editPincode)[0]}`,
  data
);

      console.log('Lead pincode updated:', response.data);
      setEditPincode({});
      dispatch(LoggedInUserLeadThunk(loggedInUser.data.id));
    } catch (err) {
      console.error('Error updating lead pincode:', err);
    }
  };

  useEffect(() => {
    dispatch(LoggedInUserLeadThunk(loggedInUser.data.id));
  }, [loggedInUser.data]);

  const handleCopyNumber = (leads) => {
    if (!leads || !leads.length) {
      alert("No numbers to copy");
      return;
    }

    const phoneNo = leads.map((lead) => lead.phone);
    const combineNo = phoneNo.join("\n");

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(combineNo)
        .then(() => {
          setCopyFlag(false);
          setTimeout(() => setCopyFlag(true), 2000);
        })
        .catch((err) => {
          console.error("Clipboard failed:", err);
        });
    } else {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = combineNo;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        document.execCommand("copy");
        document.body.removeChild(textarea);

        setCopyFlag(false);
        setTimeout(() => setCopyFlag(true), 2000);
      } catch (err) {
        console.error("Fallback copy failed:", err);
        alert("Copy not supported in this browser");
      }
    }
  };

  const handleSave = async () => {
    if (!selectedLead) return;

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/agent/follow-up/${selectedLead.id}`,
        {
          status: formData.status,
          remark: formData.remark,
          reason: formData.reason,
          followupAt: formData.followup_at,
          last_call: new Date().toISOString(),
        }
      );

      console.log('✅ Response:', response.data);
      
      setTimeout(() => {
        dispatch(LoggedInUserLeadThunk(loggedInUser.data.id));
      }, 1000);
      
      setSelectedLead(null);
      setFormData({ status: '', remark: '', followup_at: '', reason: '' });
      
      // alert('✅ Lead updated successfully!');
      
    } catch (err) {
      console.error('❌ Error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      alert(`Update failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const filteredLeads = useMemo(() => {
    if (!loggedInUser?.Leads) return [];

    const filtered = loggedInUser.Leads.filter((lead) => {
      const status = (lead.status || '').toLowerCase().trim();

      const isReassigned =
        lead.reassign &&
        lead.reassign !== '' &&
        lead.reassign !== 'null';

      let reassignedAt = null;
      if (isReassigned) {
        try {
          reassignedAt = JSON.parse(lead.reassign)?.timestamp;
        } catch (e) {}
      }

      const isActionDone =
        isReassigned &&
        lead.last_call &&
        reassignedAt &&
        new Date(lead.last_call) > new Date(reassignedAt);

      const agentStatuses = [
        'connected',
        'qualified',
        'not connected',
        'not qualified',
      ];

      const hasAgentStatus = agentStatuses.includes(status);

      if (leadFilter === 'open') {
        if (isReassigned && !isActionDone) return true;
        if (!isReassigned && !hasAgentStatus) return true;
        return false;
      }

      if (leadFilter === 'reassigned') {
        return isReassigned && isActionDone;
      }

      if (leadFilter === 'all') return true;

      if (isReassigned) return false;
      if (!hasAgentStatus) return false;

      return status === leadFilter;
    });

    if (leadFilter === 'reassigned') {
      return filtered.sort((a, b) => {
        let aTime = 0;
        let bTime = 0;

        try {
          const aParsed = JSON.parse(a.reassign || '{}');
          const bParsed = JSON.parse(b.reassign || '{}');

          aTime = aParsed.timestamp
            ? new Date(aParsed.timestamp).getTime()
            : 0;

          bTime = bParsed.timestamp
            ? new Date(bParsed.timestamp).getTime()
            : 0;
        } catch (e) {}

        return bTime - aTime;
      });
    }

    return filtered;
  }, [loggedInUser?.Leads, leadFilter]);

  return (
    <>
      <div className="p-6 mt-10">
        {/* ======= TOP ROW: Agent Details + Daily Call Counter ======= */}
        <div className="flex flex-col lg:flex-row gap-6 mb-5">
          {/* Agent Details Card */}
          <div
            className="flex-1 bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] 
                      border border-blue-200 p-6 relative overflow-hidden
                      hover:shadow-[0_6px_20px_rgba(1,138,224,0.25)] transition-all duration-300"
          >
            <div className="absolute left-0 top-0 h-full w-1.5 bg-[#018ae0] rounded-l-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-[#018ae0]/5 to-transparent rounded-2xl pointer-events-none"></div>

            <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center gap-2 relative z-10">
              <span className="inline-block h-5 rounded-sm"></span>
              Agent Details
            </h2>

            <div className="space-y-4 text-sm relative z-10">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Agent Name:</span>
                <span className="text-gray-900">
                  {loggedInUser?.data?.name || '—'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Agent ID:</span>
                <span className="text-gray-900">
                  {loggedInUser?.data?.id || '—'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Total Leads:</span>
                <span className="text-gray-900 font-bold">
                  {loggedInUser?.Leads?.length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Daily Call Counter Card */}
          <div
            className="flex-1 bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] 
                      border border-purple-200 p-6 relative overflow-hidden
                      hover:shadow-[0_6px_20px_rgba(147,51,234,0.25)] transition-all duration-300"
          >
            <div className="absolute left-0 top-0 h-full w-1.5 bg-purple-600 rounded-l-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl pointer-events-none"></div>

            <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center gap-2 relative z-10">
              <BarChart className="w-5 h-5 text-purple-600" />
              Daily Call Counter
            </h2>

            <div className="space-y-4 relative z-10">
              {/* Date Selector */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Date
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <input
                      type="date"
                      value={callCountDate}
                      onChange={(e) => setCallCountDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                               focus:outline-none focus:ring-2 focus:ring-purple-500/30 
                               focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCallCount}
                    disabled={callCountLoading}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white 
                             rounded-lg font-medium transition-colors disabled:opacity-50 
                             disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {callCountLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Counting...
                      </>
                    ) : (
                      <>
                        <Phone className="w-4 h-4" />
                        Count Calls
                      </>
                    )}
                  </button>

                  <button
                    onClick={resetCallCount}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 
                             rounded-lg font-medium transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Result Display */}
              {dailyCallCount > 0 && (
                <div className="mt-4 p-4 bg-purple-50 border border-purple-100 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-purple-700 font-medium">
                        📞 Total Calls on {callCountDate}
                      </div>
                      <div className="text-sm text-purple-600">
                        Based on last_call timestamp
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-purple-700">
                      {dailyCallCount}
                    </div>
                  </div>
                </div>
              )}

              {dailyCallCount === 0 && !callCountLoading && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                  <div className="text-gray-500">
                    Select a date and click "Count Calls" to see daily call count
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======= LEAD FILTER TOGGLE ======= */}
        <div className="flex justify-end p-6">
          <AssignToggle
            options={[
              { label: 'Open', value: 'open' },
              { label: 'Qualified', value: 'qualified' },
              { label: 'Reassigned', value: 'reassigned' },
              { label: 'Not Connected', value: 'not connected' },
              { label: 'Not Qualified', value: 'not qualified' },
              { label: 'Connected', value: 'connected' },
              { label: 'All', value: 'all' },
            ]}
            onChange={(value) => setLeadFilter(value)}
          />
        </div>

        {/* ======= LEADS TABLE ======= */}
        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-3 overflow-x-auto rounded-2xl shadow-lg border border-gray-200 bg-white">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gradient-to-r from-[#018ae0] to-[#005bb5] text-white sticky top-0">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left">Sr no.</th>
                  <th className="px-4 py-3 text-left">Campaign</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className='px-4 py-3 text-left'>Source</th>
                  <th className="px-4 py-3 text-left flex gap-2 items-center">
                    <span>Phone</span>
                    {copyFlag ? (
                      <Copy
                        className="cursor-pointer hover:text-blue-300 transition-colors"
                        onClick={() => handleCopyNumber(filteredLeads)}
                      />
                    ) : (
                      <CheckCheck className="text-green-300" />
                    )}
                  </th>
                  <th className="px-4 py-3 text-left">Pincode</th>
                  <th className="px-4 py-3 text-left">City</th>
                  <th className="px-4 py-3 text-left">Last Call</th>
                  <th className="px-4 py-3 text-left">Customer Status</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      No leads found for "{leadFilter}" filter
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead, index) => (
                    <tr
                      key={index}
                      className="hover:bg-blue-50 transition-colors odd:bg-white even:bg-gray-50"
                    >
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3">{lead.campaign_id || '-'}</td>
                      <td className="px-4 py-3">{lead.name}</td>
                      <td className="px-4 py-3">{lead.source || '-'}</td>
                      <td className="px-4 py-3">{lead.phone}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-between items-center gap-5">
                          {lead.id in editPincode ? (
                            <input
                              type="text"
                              value={editPincode[lead.id]}
                              onChange={(e) =>
                                setEditPincode({
                                  [lead.id]: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg 
                                       outline-none focus:border-blue-500 focus:ring-2 
                                       focus:ring-blue-200 transition duration-200"
                            />
                          ) : (
                            <p>{lead.pincode || '-'}</p>
                          )}
                          <span>
                            {lead.id in editPincode ? (
                              <Check
                                size={18}
                                className="text-gray-600 cursor-pointer hover:text-green-600"
                                onClick={updateLeadPincode}
                              />
                            ) : (
                              <Pencil
                                className="text-gray-700 cursor-pointer hover:text-blue-600"
                                onClick={() =>
                                  setEditPincode({ [lead.id]: lead.pincode })
                                }
                              />
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-between items-center gap-5">
                          {lead.id in editCity ? (
                            <input
                              type="text"
                              value={editCity[lead.id]}
                              onChange={(e) =>
                                setEditCity({
                                  [lead.id]: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg 
                                       outline-none focus:border-blue-500 focus:ring-2 
                                       focus:ring-blue-200 transition duration-200"
                            />
                          ) : (
                            <p>{lead.city || '-'}</p>
                          )}
                          <span>
                            {lead.id in editCity ? (
                              <Check
                                size={18}
                                className="text-gray-600 cursor-pointer hover:text-green-600"
                                onClick={updateLeadCity}
                              />
                            ) : (
                              <Pencil
                                className="text-gray-700 cursor-pointer hover:text-blue-600"
                                onClick={() =>
                                  setEditCity({ [lead.id]: lead.city })
                                }
                              />
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{formatDate(lead.last_call)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {lead.status || 'No Status'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md 
                                   hover:bg-blue-700 cursor-pointer transition-colors"
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ============= MODAL SECTION ============= */}
      {selectedLead && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm 
                    flex justify-center items-center p-5 z-[100]"
        >
          <div
            className="bg-white w-full max-w-4xl rounded-lg shadow-xl 
                      p-6 overflow-y-auto max-h-[90vh] backdrop-blur-0"
          >
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-xl font-semibold">
                Lead #{selectedLead.id} - {selectedLead.name}
              </h2>
              <button
                onClick={() => setSelectedLead(null)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <p>
                <strong>Phone:</strong> {selectedLead.phone}
              </p>
              <p>
                <strong>Campaign ID:</strong> {selectedLead.campaign_id}
              </p>
              <p>
                <strong>Customer status:</strong> {selectedLead.status}
              </p>
              <p>
                <strong>Email:</strong> {selectedLead.email}
              </p>
              <p>
                <strong>Attempts:</strong> {selectedLead.attempts}
              </p>
              <p>
                <strong>City:</strong> {selectedLead.city}
              </p>
              <p>
                <strong>Last Call:</strong>
                {formatDate(selectedLead.last_call)}
              </p>
              <p>
                <strong>Product:</strong> {selectedLead.product}
              </p>
              <p>
                <strong>Follow-up At:</strong> {selectedLead.followupAt}
              </p>
              <p>
                <strong>Lead Status:</strong> {selectedLead.doc_status}
              </p>
            </div>

            {/* Update Lead Form */}
            <div className="border rounded-lg p-4 mb-5">
              <h3 className="font-semibold mb-3">Update Lead</h3>

              <label className="block mb-1">Status</label>
              <select
                name="status"
                className="w-full border rounded px-3 py-2 mb-3"
                onChange={handleChange}
              >
                <option value="" disabled selected>
                  Select status
                </option>
                {statusOption.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              
              {formData.status && (
                <>
                  <label className="block mb-1">Reason</label>
                  <select
                    name="reason"
                    className="w-full border rounded px-3 py-2 mb-3"
                    onChange={handleChange}
                  >
                    <option value="" disabled selected>
                      Select reason
                    </option>
                    {statusReasons[formData.status]?.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </>
              )}
              
              <label className="block mb-1">Remarks</label>
              <textarea
                name="remark"
                className="w-full border rounded px-3 py-2 mb-3"
                rows="3"
                onChange={handleChange}
              />

              <button
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 cursor-pointer"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AgentDashboard;  