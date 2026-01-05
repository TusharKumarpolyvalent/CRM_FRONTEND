import { useState } from 'react';

const AssignToggle = ({ options = ['Unassigned', 'Assigned'], onChange }) => {
  const [active, setActive] = useState(options[0]);

  const handleClick = (value) => {
    let temp;
    if (value === 'Assigned') temp = 'true';
    if (value === 'Unassigned') temp = 'false';
    if (value === 'All') temp = 'all';
    if (value === 'Qualified') temp = 'qualified';
    if (value === 'Closed') temp = 'closed';
    if (value === 'Open') temp = 'open';
    setActive(value);
    onChange && onChange(temp);
  };

  return (
    <div className="flex bg-gray-200 p-1 rounded-lg w-fit gap-1">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => handleClick(option)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition cursor-pointer
            ${active === option ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
        >
          {option}
        </button>
      ))}
    </div>
    
  );
};

export default AssignToggle;
