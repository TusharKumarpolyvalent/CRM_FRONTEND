import React, { useState } from 'react';
import AnalyticalDashboard from '../pages/AnalyticalDashboard';

export default function DashboardModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={() => setIsOpen(true)}
      >
       Campaign Dashboard
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white w-[95vw] h-[90vh] rounded-lg shadow-lg relative flex flex-col">

            {/* HEADER */}
            <div className="sticky top-0 bg-white z-20 border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Campaign Analytical Dashboard</h2>

              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-black text-xl"
              >
                ✕
              </button>
            </div>

            {/* BODY */}
            <div className="flex flex-1 overflow-hidden">
              <AnalyticalDashboard />
            </div>

          </div>
        </div>
      )}
    </>
  );
}
