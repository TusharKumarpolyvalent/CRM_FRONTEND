import { useState } from 'react';
import AgentAnalyticalDashboard from '../pages/AgentAnalyticalDashboard';

export default function AgentDashboardModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="bg-green-600 text-white px-4 py-2 rounded"
        onClick={() => setOpen(true)}
      >
        Agent Dashboard
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white w-[95vw] h-[90vh] rounded-lg shadow-lg flex flex-col">

            {/* HEADER */}
            <div className="sticky top-0 bg-white z-20 border-b px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold">
                Agent Analytical Dashboard
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-xl"
              >
                ✕
              </button>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-hidden">
              <AgentAnalyticalDashboard />
            </div>

          </div>
        </div>
      )}
    </>
  );
}
