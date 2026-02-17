// helpers/functions.js

import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Auth check function
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

// Campaign Performance API
export const getCampaignPerformanceAPI = (params) => {
  return axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/campaign-performance`, { params });
};

// Agent Performance API (range based)
export const getAgentPerformanceApI = (params) => {
  return axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/agent-performance`, { params });
};

// ✅ DAILY CALL COUNT API - YEH FUNCTION ADD KARO
export const getDailyCallCountAPI = async (agentId, date) => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/agent/daily-call-count`, 
      { 
        params: { 
          agentId: agentId, 
          date: date 
        } 
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error in getDailyCallCountAPI:', error);
    throw error;
  }
};

// Date formatting function
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

// Optional: Format date to YYYY-MM-DD for API calls
export const formatDateForAPI = (date) => {
  if (!date) return null;
  return date.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD
};