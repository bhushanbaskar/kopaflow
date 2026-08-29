import React from "react";
import { Search, RotateCcw } from "lucide-react";
import { cn } from "../../lib/utils/cn";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: FilterOption[];
  filterLabel?: string;
  secondaryFilterValue?: string;
  onSecondaryFilterChange?: (value: string) => void;
  secondaryFilterOptions?: FilterOption[];
  secondaryFilterLabel?: string;
  onReset?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search records...",
  filterValue,
  onFilterChange,
  filterOptions,
  filterLabel = "Filter",
  secondaryFilterValue,
  onSecondaryFilterChange,
  secondaryFilterOptions,
  secondaryFilterLabel = "Category",
  onReset,
  className,
  children,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "bg-white border border-slate-200 rounded p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
        {/* Search Field */}
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-700 focus:bg-white text-xs"
          />
        </div>

        {/* Primary Filter Dropdown */}
        {filterOptions && onFilterChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">{filterLabel}:</span>
            <select
              value={filterValue}
              onChange={(e) => onFilterChange(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-700 focus:bg-white text-xs"
            >
              <option value="ALL">All {filterLabel}s</option>
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Secondary Filter Dropdown */}
        {secondaryFilterOptions && onSecondaryFilterChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">{secondaryFilterLabel}:</span>
            <select
              value={secondaryFilterValue}
              onChange={(e) => onSecondaryFilterChange(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-700 focus:bg-white text-xs"
            >
              <option value="ALL">All {secondaryFilterLabel}s</option>
              {secondaryFilterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {onReset && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded hover:bg-slate-100 transition-colors"
            title="Reset Filters"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
