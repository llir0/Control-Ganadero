import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

interface CustomSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Seleccionar opción...',
  disabled = false,
  className = '',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`relative w-full ${className}`} ref={containerRef} id={id}>
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
          {label}
        </label>
      )}

      {/* Select Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full min-h-[42px] px-3.5 py-2.5 rounded-xl flex items-center justify-between text-left transition-all duration-200 border ${
          disabled
            ? 'bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed'
            : isOpen
            ? 'bg-slate-850 border-emerald-500 ring-2 ring-emerald-500/20 text-white shadow-lg shadow-emerald-950/30'
            : 'bg-slate-800/90 hover:bg-slate-800 border-slate-700/80 hover:border-slate-600 text-slate-100 shadow-sm'
        }`}
      >
        <div className="flex items-center space-x-2.5 truncate pr-2">
          {selectedOption?.icon && (
            <span className="shrink-0 text-emerald-400">{selectedOption.icon}</span>
          )}
          <span className="truncate font-medium text-xs sm:text-sm">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span
              className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${
                selectedOption.badgeColor || 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}
            >
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 right-0 top-full mt-1.5 z-[65] bg-slate-900/95 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden max-h-64 overflow-y-auto no-scrollbar p-1.5 divide-y divide-slate-800/40"
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-left transition-all duration-150 group ${
                    isSelected
                      ? 'bg-emerald-600/15 text-emerald-300 font-semibold border border-emerald-500/30'
                      : 'hover:bg-slate-800/90 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate pr-2">
                    {option.icon && (
                      <span
                        className={`shrink-0 transition-colors ${
                          isSelected ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'
                        }`}
                      >
                        {option.icon}
                      </span>
                    )}
                    <div className="truncate">
                      <div className="text-xs sm:text-sm truncate">{option.label}</div>
                      {option.description && (
                        <div className="text-[10px] text-slate-400 group-hover:text-slate-300 truncate">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    {option.badge && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          option.badgeColor || 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {option.badge}
                      </span>
                    )}
                    {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
