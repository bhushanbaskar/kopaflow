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
        "bg-white border border-black/[0.06] rounded-2xl p-2.5 sm:p-3 shadow-xs flex flex-wrap items-center justify-between gap-2.5 text-xs select-none",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
        {/* Search Field */}
        <div className="relative flex-1 min-w-[160px] max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-black/[0.06] rounded-full text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-950/10 focus:bg-white text-xs transition-all"
          />
        </div>

        {/* Primary Filter Dropdown */}
        {filterOptions && onFilterChange && (
          <div className="flex items-center gap-1.5">
            <select
              value={filterValue}
              onChange={(e) => onFilterChange(e.target.value)}
              className="bg-gray-50 border border-black/[0.06] rounded-full px-3 py-1.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-950/10 focus:bg-white text-xs cursor-pointer transition-all"
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
            <select
              value={secondaryFilterValue}
              onChange={(e) => onSecondaryFilterChange(e.target.value)}
              className="bg-gray-50 border border-black/[0.06] rounded-full px-3 py-1.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-950/10 focus:bg-white text-xs cursor-pointer transition-all"
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
            className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-900 px-2.5 py-1.5 rounded-full hover:bg-gray-100 touch-press transition-colors font-medium text-[11px]"
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
