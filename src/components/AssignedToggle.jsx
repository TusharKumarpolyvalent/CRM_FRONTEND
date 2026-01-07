import { useState } from 'react';

const AssignToggle = ({ options = [], onChange }) => {
  const [active, setActive] = useState(options[0].value);

  const handleClick = (option) => {
    setActive(option.value);
    onChange(option.value);
  };

  return (
    <div className="flex bg-gray-200 p-1 rounded-lg w-fit gap-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => handleClick(option)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition
            ${
              active === option.value
                ? 'bg-blue-600 text-white'
                : 'text-gray-700'
            }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default AssignToggle;
