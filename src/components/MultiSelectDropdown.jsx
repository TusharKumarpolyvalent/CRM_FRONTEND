import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';

const MultiSelectDropdown = ({
  label,
  options = [],
  selected = [],
  onChange,
  placeholder = 'Select',
}) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const dropdownRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleValue = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <>
      <div className="w-64">
        {label && (
          <label className="block text-sm font-semibold mb-1">
            {label}
          </label>
        )}

        <button
          ref={btnRef}
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="w-full border rounded-md px-3 py-2 flex justify-between items-center bg-white"
        >
          <span className="text-sm text-gray-700 truncate">
            {selected.length ? selected.join(', ') : placeholder}
          </span>
          <ChevronDown size={16} />
        </button>
      </div>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: position.top,
              left: position.left,
              width: position.width,
              zIndex: 9999,
            }}
            className="bg-white border rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => toggleValue(opt.value)}
                className={`px-3 py-2 text-sm cursor-pointer flex justify-between hover:bg-gray-100
                  ${
                    selected.includes(opt.value)
                      ? 'bg-blue-50 text-blue-700'
                      : ''
                  }`}
              >
                {opt.label}
                {selected.includes(opt.value) && '✓'}
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
};

export default MultiSelectDropdown;
