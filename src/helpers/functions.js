// export const assignLeads = ()=>{
//     console.log(import.meta.env.VITE_API_BASE_URL);

import axios from 'axios';
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
// helpers/api.js


export const getCampaignPerformanceAPI = (params) => {
  return axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/campaign-performance`, { params });
};
export const getAgentPerformanceApI = (params)=>{
  return axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/agent-performance`, { params });
}

// helpers/functions.js में
export const formatDate = (dateInput) => {
  if (!dateInput) return '—';
  
  try {
    // Handle different date formats
    let date;
    
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else {
      console.warn('Unknown date format:', dateInput);
      return '—';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateInput);
      return '—';
    }
    
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  } catch (error) {
    console.error('Error in formatDate:', error, 'Input:', dateInput);
    return '—';
  }
};