import { useState } from 'react';
import { Search } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Logo from '../assets/logo.png';
export default function Navbar() {
  const { pathname } = useLocation();

  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="min-h-screen">
      <nav className="w-full bg-[#018ae0] p-4 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <div className="x">
            <img
              style={{
                width: '200px',
              }}
              src={Logo}
              alt=""
            />
            {/* <span className="text-white text-3xl">DashBoard</span> */}
          </div>
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-white text-gray-600 rounded-lg pl-10 pr-4 py-2 outline-none"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-6">
          {/* <Monitor className="h-5 w-5 text-gray-400 cursor-pointer" /> */}
          {/* <Sun className="h-5 w-5 text-gray-400 cursor-pointer" /> */}
          {/* <Moon className="h-5 w-5 text-gray-400 cursor-pointer" /> */}

          {/* <Bell className="h-5 w-5 text-gray-400 cursor-pointer" /> */}
          {pathname === '/admin/dashboard' && (
            <button className="bg-blue-400 hover:bg-blue-500 transition text-white px-4 py-2 rounded-lg">
              Add Campaign
            </button>
          )}
          <img
            src="https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"
            className="w-8 h-8 rounded-full border border-gray-600"
            alt="avatar"
          />
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
