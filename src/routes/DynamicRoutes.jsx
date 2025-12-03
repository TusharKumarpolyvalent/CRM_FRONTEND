import { lazy, Suspense } from 'react';
import { useRoutes } from 'react-router-dom';

import Loginnew from '../pages/Loginnew.jsx';
import AddUser from '../pages/AddUser.jsx';
// import AgentDashboard from '../pages/AgentDashboard.jsx';
// import Lead from '../pages/Lead.jsx'

const AdminDashboard = lazy(() => import('../pages/AdminDashboard.jsx'));
const About = lazy(() => import('../pages/About.jsx'));
const NotFound = lazy(() => import('../pages/NotFound.jsx'));
const NavBar = lazy(() => import('../components/NavBar.jsx'));
const Lead = lazy(() => import('../pages/Lead.jsx'));
const AgentDashboard = lazy(() => import('../pages/AgentDashboard.jsx'));

export const DynamicRoutes = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {useRoutes([
        {
          path: '/',
          element: <Loginnew />,
        },
        {
          path: '/admin',
          element: <NavBar />,
          children: [
            {
              index: true,
              path: '/admin/dashboard',
              element: <AdminDashboard />,
            },
            {
              path: '/admin/campaigns',
              element: <Lead />,
            },
          ],
        },
        {
          path: '/about',
          element: <About />, // no NavBar
        },
        {
          path: '/agent',
          element: <NavBar />,
          children: [
            {
              index: true,
              path: '/agent/dashboard',
              element: <AgentDashboard />,
            },
            // {
            //   path: '/admin/campaigns',
            //   element: <Lead />,
            // },
          ], // no NavBar
        },
        {
          path: '*',
          element: <NotFound />, // no NavBar
        },
      ])}
    </Suspense>
  );
};
