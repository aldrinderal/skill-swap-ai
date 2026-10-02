import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

/**
 * SearchableSkillSelect Component
 * Filterable and searchable dropdown for selecting skills
 */
export default function SearchableSkillSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select a skill...',
  disabledSkill = '',
  icon: Icon,
  colorScheme = 'indigo', // 'indigo' or 'emerald'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter skills based on query
  const filteredOptions = options.filter((skill) =>
    skill.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const isEmerald = colorScheme === 'emerald';
  const focusBorderColor = isEmerald ? 'focus:border-emerald-500 focus:ring-emerald-500/20' : 'focus:border-indigo-500 focus:ring-indigo-500/20';
  const selectedBg = isEmerald ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300';
  const iconColor = isEmerald ? 'text-emerald-500' : 'text-indigo-500';

  const handleSelect = (skill) => {
    onChange(skill);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <div
        tabIndex={0}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer select-none transition ${focusBorderColor} ${
          isOpen ? 'ring-2 ring-indigo-500/20 border-indigo-500' : ''
        }`}
      >
        {/* Leading Icon */}
        <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${iconColor}`}>
          {Icon ? <Icon className="w-4 h-4" /> : <Search className="w-4 h-4" />}
        </div>

        {/* Selected Value Display */}
        <span className={`block truncate ${value ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400'}`}>
          {value || placeholder}
        </span>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 ml-2">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180 text-indigo-600' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Input Filter */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search skill..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5" role="listbox">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                No matching skills found
              </div>
            ) : (
              filteredOptions.map((skill) => {
                const isSelected = value === skill;
                const isDisabled = disabledSkill && disabledSkill.toLowerCase() === skill.toLowerCase();

                return (
                  <button
                    key={skill}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={isDisabled}
                    onClick={() => handleSelect(skill)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl text-left transition ${
                      isDisabled
                        ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-slate-800/40 text-slate-400'
                        : isSelected
                        ? `${selectedBg} font-semibold`
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <span>
                      {skill} {isDisabled && <span className="text-[10px] text-rose-500 ml-1.5">(Already selected)</span>}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
