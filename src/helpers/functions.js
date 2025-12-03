// export const assignLeads = ()=>{
//     console.log(import.meta.env.VITE_API_BASE_URL);

import { useNavigate } from 'react-router-dom';

// }
export const checkAuth = (navigate) => {
  const loggedIn = localStorage.getItem('loggedIn');
  if (loggedIn === 'true') {
    const loggedInUser = JSON.parse(localStorage.getItem('crm_user'));
    if (loggedInUser?.user?.role === 'agent') navigate('/agent/dashboard');
    else if (loggedInUser?.user?.role === 'admin') navigate('/admin/dashboard');
  } else {
    navigate('/');
  }
};

export const formatDate = (isoString) => {
  if (!isoString) return '—';

  return new Date(isoString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata', // IST
  });
};
