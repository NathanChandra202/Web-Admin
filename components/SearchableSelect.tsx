'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, Plus } from 'lucide-react';

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | SearchableOption)[];
  placeholder?: string;
  searchPlaceholder?: string;
  allowCustom?: boolean;
  customOptionPrefix?: string;
  className?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  emptyText?: string;
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Pilih salah satu...',
  searchPlaceholder = 'Cari...',
  allowCustom = false,
  customOptionPrefix = 'Gunakan',
  className = '',
  icon,
  disabled = false,
  id,
  emptyText = 'Tidak ditemukan',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options to SearchableOption format
  const normalizedOptions: SearchableOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  // Filtered options based on search query
  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      opt.value.toLowerCase().includes(q) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  });

  // Check if current search matches an option exactly
  const hasExactMatch = normalizedOptions.some(
    (opt) => opt.value.toLowerCase() === search.trim().toLowerCase() ||
             opt.label.toLowerCase() === search.trim().toLowerCase()
  );

  // Selected item label
  const selectedOption = normalizedOptions.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : value;

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  function handleSelect(val: string) {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  }

  function handleSelectCustom() {
    const trimmed = search.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setIsOpen(false);
    setSearch('');
  }

  return (
    <div className={`relative ${className}`} ref={containerRef} id={id}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#171c28] border rounded-xl text-left transition flex items-center justify-between gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen
            ? 'border-red-500 ring-2 ring-red-500/20'
            : 'border-[#273248] hover:border-[#3a4968]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {icon && <span className="text-gray-400 shrink-0">{icon}</span>}
          {selectedOption?.icon && (
            <span className="shrink-0">{selectedOption.icon}</span>
          )}
          {displayLabel ? (
            <span className="text-xs sm:text-sm text-white font-medium truncate">
              {displayLabel}
            </span>
          ) : (
            <span className="text-xs sm:text-sm text-gray-500 truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-gray-400">
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-red-400' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#121622] border border-[#2b364c] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search bar inside popover */}
          <div className="p-2.5 border-b border-[#222b3c] bg-[#161c2b]">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsOpen(false);
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filteredOptions.length > 0) {
                      handleSelect(filteredOptions[0].value);
                    } else if (allowCustom && search.trim()) {
                      handleSelectCustom();
                    }
                  }
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-8 py-2 bg-[#1b2234] border border-[#2a354c] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
            {/* Custom option button if allowCustom is enabled & no exact match */}
            {allowCustom && search.trim() && !hasExactMatch && (
              <button
                type="button"
                onClick={handleSelectCustom}
                className="w-full p-2.5 rounded-xl text-left transition flex items-center justify-between gap-2 bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 text-red-200 select-none cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Plus size={14} className="text-red-400 shrink-0" />
                  <span className="text-xs font-bold truncate">
                    {customOptionPrefix} &quot;{search.trim()}&quot;
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-900/70 text-red-300 shrink-0">
                  Ketik Sendiri
                </span>
              </button>
            )}

            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full p-2.5 rounded-xl text-left transition flex items-center justify-between gap-2.5 select-none cursor-pointer ${
                      isSelected
                        ? 'bg-red-950/50 border border-red-500/60 text-white font-semibold'
                        : 'hover:bg-[#1a2131] text-gray-200 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <div className="min-w-0">
                        <p className="text-xs truncate">{opt.label}</p>
                        {opt.sublabel && (
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">
                            {opt.sublabel}
                          </p>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check size={14} className="text-red-400 shrink-0" />
                    )}
                  </button>
                );
              })
            ) : !allowCustom || !search.trim() ? (
              <div className="py-6 px-4 text-center text-gray-400 text-xs">
                <p>{emptyText}</p>
                {allowCustom && (
                  <p className="text-[11px] text-gray-500 mt-1">
                    Ketik teks di kolom pencarian untuk menambahkan manual.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
