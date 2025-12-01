import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { checkAuth } from "../helpers/functions";
import { useDispatch } from "react-redux";
import { setLoggedInUser } from "../redux/slice/LoggedInUserSlice";

const Loginnew = () => {
     const navigate = useNavigate();
     const dispatch = useDispatch();
    useEffect(() => {
    checkAuth(navigate);

   
  }, []);
 

  const [loginData, setLoginData] = useState({
    id: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
    
       const res = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/login`,
      {
        id: loginData.id,
        password: loginData.password,
      });
    

      if (res.data?.data) {
        // Save login session
        localStorage.setItem(
          "crm_user",
          JSON.stringify({
          
            user: res.data.data,
          })
        );
        localStorage.setItem(
          "loggedIn",
            "true"
        );
        dispatch(setLoggedInUser(res.data.data));

        if(res.data.data.role === 'admin') navigate("/admin/dashboard");
        else if(res.data.data.role === 'agent') navigate("/agent/dashboard");
        else setError("Unauthorized role");
      } else {
        setError("Invalid response from server");
      }
    } catch (err) {
      setError("Invalid ID or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white shadow-md p-8 rounded-xl border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-2">
          Welcome
        </h2>
        <p className="text-center text-gray-500 mb-6">
          Login to your account
        </p>

        <form className="space-y-5" onSubmit={handleLogin}>
          {/* Error Message */}
          {error && (
            <p className="text-red-500 bg-red-100 p-2 rounded text-center text-sm">
              {error}
            </p>
          )}

          {/* ID */}
          <div>
            <label className="block text-gray-700 text-sm mb-1">
              ID
            </label>
            <input
              type="text"
              name="id"
              value={loginData.id}
              onChange={handleChange}
              placeholder="Enter your ID"
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 transition"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 text-sm mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={loginData.password}
              onChange={handleChange}
              placeholder="Enter password"
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 transition"
              required
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition font-medium"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Loginnew;
