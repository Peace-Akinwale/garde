'use client';

import { Search } from 'lucide-react';

export default function SearchBar({ filters, onFiltersChange }) {
  const handleSearchChange = (e) => {
    onFiltersChange({ ...filters, search: e.target.value });
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
          className="w-full pl-10 pr-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-gray-400"
        />
      </div>

      {/* Type Filter */}
      <select
        value={filters.type}
        onChange={handleTypeChange}
        className="px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
