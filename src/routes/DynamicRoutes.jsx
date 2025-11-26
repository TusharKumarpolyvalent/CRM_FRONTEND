import { lazy, Suspense } from 'react';
import { useRoutes } from 'react-router-dom';

const AdminDashboard = lazy(() => import('../pages/AdminDashboard.jsx'));
const About = lazy(() => import('../pages/About.jsx'));
const NotFound = lazy(() => import('../pages/NotFound.jsx'));
const NavBar = lazy(() => import('../components/NavBar.jsx'));
const Lead = lazy(() => import('../pages/Lead.jsx'));

export const DynamicRoutes = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {useRoutes([
        {
          path: '/admin',
          element: <NavBar />, // NavBar only on /
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
          path: '*',
          element: <NotFound />, // no NavBar
        },
      ])}
    </Suspense>
  );
};
