'use client';

import { Search, X } from 'lucide-react';

export default function SearchBar({ filters, onFiltersChange }) {
  const handleSearchChange = (e) => {
    onFiltersChange({ ...filters, search: e.target.value });
  };

  const handleClearSearch = () => {
    onFiltersChange({ ...filters, search: '' });
  };

  const handleTypeChange = (e) => {
    onFiltersChange({ ...filters, type: e.target.value });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search Input */}
      <div className="flex-1 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          value={filters.search}
          onChange={handleSearchChange}
          placeholder="Search guides..."
          className="w-full pl-10 pr-10 py-2 text-gray-900 dark:text-white bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
        {filters.search && (
          <button
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Clear search"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Type Filter */}
      <select
        value={filters.type}
        onChange={handleTypeChange}
        className="px-4 py-2 text-gray-900 dark:text-white bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      >
        <option value="all">All Types</option>
        <option value="recipe">Recipes</option>
        <option value="craft">Crafts & DIY</option>
        <option value="howto">How-to Guides</option>
        <option value="other">Other</option>
      </select>
    </div>
  );
}
