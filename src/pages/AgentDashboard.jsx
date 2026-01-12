import { useEffect, useState,useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  LoggedInUserLeadThunk,
  updateFollowUpThunk,
} from '../redux/slice/LoggedInUserSlice';
import { formatDate } from '../helpers/functions';
import { Copy } from 'lucide-react';
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
  const [subStatus, setSubStatus] = useState(null);

  const [statusFilter, setStatusFilter] = useState('');

  const [selectedDate,setSelectedDate]=useState(()=>{
    const today = new Date();
    return today.toISOString().split('T')[0];
  })
  const [showAllDates,setShowAllDates]=useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toISO = (dateStr) => {
    return new Date(dateStr).toISOString();
  };

 


  const updateLeadCity = async () => {
    try {
      const data = {
        city: editCity[Object.keys(editCity)[0]],
      };

      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/agent/update-lead/${Object.keys(editCity)[0]}`,
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
        `${import.meta.env.VITE_API_BASE_URL}/agent/update-lead/${Object.keys(editPincode)[0]}`,
        data
      );
      console.log('Lead city updated:', response.data);
      setEditPincode({});
      dispatch(LoggedInUserLeadThunk(loggedInUser.data.id));
    } catch (err) {
      console.error('Error updating lead pincode:', err);
    }
  };

  const isSameDate = (isoDate, selectedDate) => {
  if (!isoDate) return false;
  const leadDate = new Date(isoDate).toISOString().split('T')[0];
  return leadDate === selectedDate;
};

  // useEffect(() => {
  //   if (selectedLead) {
  //     setFormData({
  //       status: selectedLead.status || '',
  //       remark: selectedLead.remarks || '', // FIXED
  //       followup_at: selectedLead.followupAt || '',
  //     });
  //   }
  // }, [selectedLead]); // Modal ke liye state

  useEffect(() => {
    dispatch(LoggedInUserLeadThunk(loggedInUser.data.id));
  }, [loggedInUser.data]);

  // useEffect(() => {
  //   const openLeads = loggedInUser.Leads.filter(
  //     (lead) => lead.attempts < '3'
  //   ).filter((lead) => lead.status?.toLowerCase() !== 'qualified');
  //   setLeads(openLeads);
  // }, [loggedInUser.Leads]);

  // const handleCopyNumber = (leads) => {
  //   if (leads.length) {
  //     const phoneNo = leads.map((leads) => leads.phone);
  //     const combineNo = phoneNo.join('\n');
  //     navigator.clipboard
  //       .writeText(combineNo)
  //       .then(() => {
  //         // alert('number copied successfully');
  //         setCopyFlag(false);
  //         setTimeout(() => {
  //           setCopyFlag(true);
  //         }, 2000);
  //       })
  //       .catch((err) => {
  //         console.error('Failed to copy:', err);
  //       });
  //   } else {
  //     alert('No numbers to copy');
  //   }
  // };

  const handleCopyNumber = (leads) => {
  if (!leads || !leads.length) {
    alert("No numbers to copy");
    return;
  }

  const phoneNo = leads.map((lead) => lead.phone);
  const combineNo = phoneNo.join("\n");

  // HTTPS / localhost
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
  } 
  // HTTP fallback
  else {
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
    const data = {
      status: formData.status,
      reason: formData.reason,
      remarks: formData.remark,
      // Add this line to update last_call with current timestamp
      last_call: new Date().toISOString(),
      followupAt: formData.followup_at,
    };

    console.log('🚀 Updating lead:', data);

    // ✅ Use POST method (which works with CORS)
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/agent/follow-up/${selectedLead.id}`,
      {
        status: formData.status,
        remark: formData.remark,
        reason: formData.reason,
        // ✅ Add last_call field
        last_call: new Date().toISOString(),
      }
    );

    console.log('✅ Response:', response.data);
    
    // Refresh leads after 1 second
    setTimeout(() => {
      dispatch(LoggedInUserLeadThunk(loggedInUser.data.id));
    }, 1000);
    
    setSelectedLead(null);
    setFormData({ status: '', remark: '', followup_at: '', reason: '' });
    
    alert('✅ Lead updated successfully!');
    
  } catch (err) {
    console.error('❌ Error:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status
    });
    
    alert(`Update failed: ${err.response?.data?.message || err.message}`);
  }
};



  // const handleLeadFilter = (value) => {
  //   if (value === 'closed') {
  //     const closedLeads = loggedInUser.Leads.filter(
  //       (lead) => lead.attempts === '3'
  //     );
  //     setLeads(closedLeads);
  //   }
  //   if (value === 'qualified') {
  //     const convertedLeads = loggedInUser.Leads.filter(
  //       (lead) => lead.status?.toLowerCase() === value
  //     );
  //     setLeads(convertedLeads);
  //   }
  //   if (value === 'open') {
  //     const openLeads = loggedInUser.Leads.filter(
  //       (lead) => lead.attempts < '3'
  //     ).filter((lead) => lead.status?.toLowerCase() !== 'qualified');
  //     setLeads(openLeads);
  //   }
  //   if (value === 'all') {
  //     setLeads(loggedInUser.Leads);
  //   }
  // };


  // Add this useEffect to debug
useEffect(() => {
  if (loggedInUser?.Leads) {
    console.log('=== DEBUGGING OPEN LEADS ===');
    
    const openLeads = loggedInUser.Leads.filter((lead) => {
      const attempts = Number(lead.attempts || 0);
      const status = (lead.status || '').toLowerCase().trim();
      const isReassigned = !!lead.reassign;
      
      const hasStatus = !!lead.status && lead.status.trim() !== '';
      const hasRemarks = !!lead.remarks && lead.remarks.trim() !== '';
      const hasReason = !!lead.reason && lead.reason.trim() !== '';
      const hasLastCall = !!lead.last_call;
      
      console.log(`Lead ${lead.id}:`, {
        attempts,
        status,
        isReassigned,
        reassign: lead.reassign,
        hasStatus,
        hasRemarks,
        hasReason,
        hasLastCall,
        last_call: lead.last_call,
        remarks: lead.remarks
      });
      
      // Simple eligibility check
      if (attempts >= 3 || status === 'qualified') {
        return false;
      }
      
      // For reassigned leads
      if (isReassigned) {
        console.log(`  Reassigned lead ${lead.id}:`, lead.reassign);
        return true; // Temporary - always show reassigned
      }
      
      // For new leads
      const isNewLead = !hasStatus && !hasRemarks && !hasReason && !hasLastCall;
      console.log(`  New lead check ${lead.id}:`, isNewLead);
      return isNewLead;
    });
    
    console.log('Total leads:', loggedInUser.Leads.length);
    console.log('Open leads found:', openLeads.length);
    console.log('Reassigned in open:', openLeads.filter(l => l.reassign).length);
    console.log('New in open:', openLeads.filter(l => !l.reassign).length);
  }
}, [loggedInUser.Leads]);
// Add this useEffect to see ALL leads data
useEffect(() => {
  if (loggedInUser?.Leads) {
    console.log('=== ALL LEADS DATA ===');
    
    loggedInUser.Leads.forEach((lead, index) => {
      console.log(`${index + 1}. Lead ID: ${lead.id}, Name: ${lead.name}`, {
        reassign: lead.reassign,
        status: lead.status,
        remarks: lead.remarks,
        last_call: lead.last_call,
        reason: lead.reason,
        // Check conditions
        hasReassign: !!lead.reassign,
        hasStatus: lead.status && lead.status.trim() !== '',
        hasRemarks: lead.remarks && lead.remarks.trim() !== '',
        hasLastCall: !!lead.last_call,
        hasReason: lead.reason && lead.reason.trim() !== ''
      });
    });
  }
}, [loggedInUser?.Leads]);
// AgentDashboard.js mein check karein

// AgentDashboard.js mein yeh useEffect add karein
useEffect(() => {
  console.log('=== AGENT DASHBOARD DEBUG ===');
  console.log('Agent ID:', loggedInUser?.data?.id);
  console.log('Total leads:', loggedInUser?.Leads?.length);
  
  if (loggedInUser?.Leads) {
    // Check for reassign data
    const reassignedLeads = loggedInUser.Leads.filter(lead => 
      lead.reassign && lead.reassign !== 'null' && lead.reassign !== ''
    );
    
    console.log(`Found ${reassignedLeads.length} reassigned leads`);
    
    if (reassignedLeads.length > 0) {
      console.log('Reassigned leads details:');
      reassignedLeads.forEach((lead, index) => {
        console.log(`${index + 1}. Lead ${lead.id}:`, {
          name: lead.name,
          reassign: lead.reassign,
          status: lead.status,
          assigned_to: lead.assigned_to,
          last_call: lead.last_call,
          remarks: lead.remarks
        });
        
        // Parse reassign data
        try {
          const parsed = JSON.parse(lead.reassign);
          console.log('   Parsed:', parsed);
          console.log('   Current agent ID:', loggedInUser?.data?.id);
          console.log('   Match current agent?', parsed.agentId === loggedInUser?.data?.id?.toString());
        } catch (e) {
          console.log('   Cannot parse reassign data');
        }
      });
    }
  }
}, [loggedInUser?.Leads]);

// Yeh bhi add karein - check when leads refresh
useEffect(() => {
  console.log('🔄 AgentDashboard refreshed');
}, [loggedInUser?.Leads]);






// Debug reassign data specifically
useEffect(() => {
  if (loggedInUser?.Leads) {
    console.log('=== REASSIGN DATA DEBUG ===');
    
    loggedInUser.Leads.forEach(lead => {
      if (lead.reassign) {
        console.log(`Lead ${lead.id}:`, {
          reassign: lead.reassign,
          typeof: typeof lead.reassign,
          isString: typeof lead.reassign === 'string',
          length: lead.reassign?.length,
          isNull: lead.reassign === null,
          isUndefined: lead.reassign === undefined,
          isEmpty: lead.reassign === '',
          isReassign: lead.reassign !== null && lead.reassign !== undefined && lead.reassign !== ''
        });
      }
    });
  }
}, [loggedInUser?.Leads]);

const filteredLeads = useMemo(() => {
  if (!loggedInUser?.Leads) return [];

  return loggedInUser.Leads.filter((lead) => {
    const status = (lead.status || '').toLowerCase().trim();
    
    // Check if reassigned
    const isReassigned = lead.reassign && 
                        lead.reassign !== '' && 
                        lead.reassign !== 'null' && 
                        lead.reassign !== null;
    
    const agentStatuses = ['connected', 'qualified', 'not connected', 'not qualified'];
    const hasAgentStatus = agentStatuses.includes(status);

    // =========================
    // OPEN TAB
    // =========================
  if (leadFilter === 'open') {
  // Show: 1. Reassigned leads (all) + 2. New leads (no agent status)
  
  // Priority 1: All reassigned leads
  if (isReassigned) {
    console.log(`✅ Lead ${lead.id} IN Open - REASSIGNED`);
    return true;
  }
  
  // Priority 2: New leads without agent status
  if (!hasAgentStatus) {
    console.log(`✅ Lead ${lead.id} IN Open - NEW lead`);
    return true;
  }
  
  // Don't show: Non-reassigned leads with agent status
  console.log(`❌ Lead ${lead.id} NOT in Open - has agent status (${status})`);
  return false;
}

    // =========================
    // ALL TAB
    // =========================
    if (leadFilter === 'all') return true;

    // =========================
    // STATUS TABS (connected, qualified, etc.)
    // =========================
    // For status tabs, show ONLY non-reassigned leads with matching status
    if (isReassigned) {
      console.log(`❌ Lead ${lead.id} NOT in ${leadFilter} tab - is reassigned`);
      return false;
    }
    
    // Only show non-reassigned leads with matching agent status
    if (!hasAgentStatus) return false;
    
    // Date filtering
    if (!showAllDates && selectedDate) {
      const actionDate = lead.last_call || lead.updated_at || lead.created_at;
      if (actionDate) {
        const dateStr = new Date(actionDate).toISOString().split('T')[0];
        if (dateStr !== selectedDate) return false;
      }
    }
    
    return status === leadFilter;
  });
}, [loggedInUser?.Leads, leadFilter, selectedDate, showAllDates]);
  return (
    <>
      <div className="p-6 mt-10">
        {/* ======= TOP SUMMARY ROW ======= */}
        <div
          className="max-w-sm w-full bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] 
                border border-blue-200 p-6 relative overflow-hidden
                hover:shadow-[0_6px_20px_rgba(1,138,224,0.25)] transition-all duration-300 mb-5"
        >
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
              <span className="text-gray-900">
                {loggedInUser?.Leads?.length || 0}
              </span>
            </div>
          </div>
        </div>
  <div className="flex items-center gap-3">
  <input
    type="date"
    value={selectedDate}
    onChange={(e) => {
      setSelectedDate(e.target.value);
      setShowAllDates(false); // Disable all dates mode when picking a date
    }}
    className="border px-3 py-2 rounded"
  />

  <button
    onClick={() => {
      setShowAllDates(true);  // Show all dates
      setSelectedDate('');     // Clear selected date
    }}
    className={`px-4 py-2 rounded ${
      showAllDates ? 'bg-blue-600 text-white' : 'bg-gray-200'
    }`}
  >
    All Dates
  </button>
</div>

        <div className="flex justify-end p-6">
      <AssignToggle
  options={[
    { label: 'Open', value: 'open' },
    { label: 'Qualified', value: 'qualified' },
    { label: 'Not Connected', value: 'not connected' },
    { label: 'Not Qualified', value: 'not qualified' },
    { label: 'Connected', value: 'connected' },
    
    { label: 'All', value: 'all' },
  ]}
  onChange={(value) => setLeadFilter(value)}
/>




          

          
        </div>
        {/* ======= MAIN CONTENT ROW (Table + Right Card) ======= */}
        <div className="grid grid-cols-4 gap-6">
          {/* Assigned Leads Table */}
          <div className="col-span-3 overflow-x-auto rounded-2xl shadow-lg border border-gray-200 bg-white">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gradient-to-r from-[#018ae0] to-[#005bb5] text-white sticky top-0">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left">Sr no.</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left flex gap-2">
                    <span>Phone</span>
                    {copyFlag ? (
                      <Copy
                        className="cursor-pointer"
                        onClick={() => handleCopyNumber(loggedInUser.Leads)}
                      />
                    ) : (
                      <CheckCheck />
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
                {filteredLeads.map((lead, index) => (
                  <tr
                    key={index}
                    className="hover:bg-blue-50 transition-colors odd:bg-white even:bg-gray-50"
                  >
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3">{lead.name}</td>
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
                            // onBlur={() => setEditCity({})}
                            className="
    w-full
    px-3 py-2
    text-sm
    border border-gray-300
    rounded-lg
    outline-none
    focus:border-blue-500
    focus:ring-2
    focus:ring-blue-200
    transition
    duration-200
  "
                          />
                        ) : (
                          <p>{lead.pincode || '-'}</p>
                        )}
                        <span>
                          {lead.id in editPincode ? (
                            <Check
                              size={18}
                              className="text-gray-600 cursor-pointer"
                              onClick={updateLeadPincode}
                            />
                          ) : (
                            <Pencil
                              className="text-gray-700 cursor-pointer"
                              onClick={() =>
                                setEditPincode({ [lead.id]: lead.pincode })
                              }
                            />
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 ">
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
                            // onBlur={() => setEditCity({})}
                            className="
    w-full
    px-3 py-2
    text-sm
    border border-gray-300
    rounded-lg
    outline-none
    focus:border-blue-500
    focus:ring-2
    focus:ring-blue-200
    transition
    duration-200
  "
                          />
                        ) : (
                          <p>{lead.city || '-'}</p>
                        )}
                        <span>
                          {lead.id in editCity ? (
                            <Check
                              size={18}
                              className="text-gray-600 cursor-pointer"
                              onClick={updateLeadCity}
                            />
                          ) : (
                            <Pencil
                              className="text-gray-700 cursor-pointer"
                              onClick={() =>
                                setEditCity({ [lead.id]: lead.city })
                              }
                            />
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{formatDate(lead.last_call)}</td>
                    <td className="px-4 py-3">{lead.status}</td>

                    <td className="px-4 py-3">
                     <button
  onClick={() => setSelectedLead(lead)}
  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
>
  open
</button>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right Card */}
          {/* <div className="col-span-1 bg-white border rounded-xl shadow-sm p-4">
            <div className="font-semibold mb-3">Quick Actions</div>

            <button className="w-full border border-blue-500 text-blue-600 py-2 rounded-md hover:bg-blue-50">
              Export My Leads
            </button>
          </div> */}
        </div>
      </div>

      {/* ============= MODAL SECTION ============= */}
      {selectedLead && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm 
                    flex justify-center items-center p-5 z-[100]"
        >
          {/* Modal Box (No Blur) */}
          <div
            className="bg-white w-full max-w-4xl rounded-lg shadow-xl 
                      p-6 overflow-y-auto max-h-[90vh] backdrop-blur-0"
          >
            {/* Header */}
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

            {/* Lead Details */}
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <p>
                <strong>Phone:</strong> {selectedLead.phone}
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
                    // value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="" disabled selected>
                      Select reason
                    </option>
                    {statusReasons[formData.status].map((s) => (
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

            {/* Activity Log */}
            {/* <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Activity Log</h3>

              <div className="text-sm text-gray-600 space-y-1">
                <p>2025-11-20 15:04 — Status changed to Not Interested</p>
                <p>2025-11-20 15:03 — Status changed to Call Cut</p>
                <p>2025-11-20 15:03 — Status changed to Call Cut</p>
                <p>2025-11-20 15:02 — Status changed to Number Busy</p>
              </div>
            </div> */}
          </div>
        </div>
      )}
    </>
  );
};

export default AgentDashboard;

// connect with bitnami testing
