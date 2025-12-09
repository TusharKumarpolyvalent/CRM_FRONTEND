import { useState } from 'react';
import { Search } from 'lucide-react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Logo from '../assets/Logo.png';
import { useGlobalContext } from '../context/GlobalContext';
import { X } from 'lucide-react';

export default function Navbar() {
  const { pathname } = useLocation();
  const { setShowAddCampaignModal, setShowAddUserModal } = useGlobalContext();

  const [dropdown, setDropdown] = useState(false);

  const navigate = useNavigate();

  // LOGOUT FUNCTION
  const logout = () => {
    localStorage.setItem('loggedIn', 'false');
    localStorage.removeItem('crm_user'); // user remove
    setDropdown(false); // dropdown band
    navigate('/'); // login page redirect
  };

  return (
    <div className="min-h-screen">
      <nav className="w-full bg-[#018ae0] p-4 flex items-center justify-between">
        {/* LEFT */}
        <div className="flex items-center gap-4">
          <img src={Logo} style={{ width: '200px' }} alt="logo" />

          {/* <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-white text-gray-600 rounded-lg pl-10 pr-4 py-2 outline-none"
            />
          </div> */}
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-6">
          {/* Only Admin Can See Add Campaign */}
          {pathname === '/admin/dashboard' && (
            <button
              onClick={() => setShowAddCampaignModal(true)}
              className="bg-blue-400 hover:bg-blue-500 transition text-white px-4 py-2 rounded-lg cursor-pointer"
            >
              Add Campaign
            </button>
          )}

          {/* AVATAR + DROPDOWN */}
          <div className="relative">
            <img
              src="https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"
              className="w-8 h-8 rounded-full border border-gray-600 cursor-pointer"
              alt="avatar"
              onClick={() => setDropdown(!dropdown)}
            />

            {dropdown && (
              <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg rounded-lg border z-50 cursor-pointer">
                <div className="relative">
                  <div
                    className="flex justify-end   w-4 absolute right-3"
                    onClick={() => {
                      setDropdown(false);
                    }}
                  >
                    <X />
                  </div>
                  <div></div>
                  {pathname === '/admin/dashboard' && (
                    <button
                      onClick={() => {
                        setShowAddUserModal(true);
                        setDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 hover:rounded-lg cursor-pointer"
                    >
                      Add User
                    </button>
                  )}
                  {/* LOGOUT */}
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-100 hover:rounded-lg cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <Outlet />
    </div>
  );
}
