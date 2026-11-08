import React from 'react';
import { motion } from 'motion/react';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  activeColor?: string; // e.g. 'emerald', 'rose', 'blue', 'amber'
}

interface SegmentedPickerProps<T extends string = string> {
  label?: string;
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const SegmentedPicker = <T extends string = string>({
  label,
  value,
  onChange,
  options,
  disabled = false,
  className = '',
  id,
}: SegmentedPickerProps<T>) => {
  return (
    <div className={`w-full ${className}`} id={id}>
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
          {label}
        </label>
      )}

      <div className="relative p-1 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center gap-1 overflow-x-auto no-scrollbar">
        {options.map((option) => {
          const isSelected = option.value === value;
          const color = option.activeColor || 'emerald';

          let activeBgClass = 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50';
          if (color === 'rose') {
            activeBgClass = 'bg-rose-600 text-white shadow-lg shadow-rose-950/50';
          } else if (color === 'blue') {
            activeBgClass = 'bg-blue-600 text-white shadow-lg shadow-blue-950/50';
          } else if (color === 'amber') {
            activeBgClass = 'bg-amber-600 text-white shadow-lg shadow-amber-950/50';
          } else if (color === 'purple') {
            activeBgClass = 'bg-purple-600 text-white shadow-lg shadow-purple-950/50';
          }

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onChange(option.value)}
              className={`relative flex-1 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1.5 whitespace-nowrap z-10 ${
                isSelected
                  ? activeBgClass
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {option.icon && (
                <span className={`shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                  {option.icon}
                </span>
              )}
              <span className="truncate">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
