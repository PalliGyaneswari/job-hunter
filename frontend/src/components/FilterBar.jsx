import { useRef } from 'react'
import { Search, ChevronDown, X } from 'lucide-react'

const CATEGORIES = [
  { value: '',                         label: 'All Categories' },
  { value: 'AI Engineer',              label: '🤖 AI Engineer' },
  { value: 'ML Engineer',              label: '🧠 ML Engineer' },
  { value: 'Full Stack Developer',     label: '⚡ Full Stack Developer' },
  { value: 'Software Engineer',        label: '💻 Software Engineer' },
  { value: 'Software Engineer Intern', label: '🎓 SE Intern' },
]

const LOCATIONS = [
  { value: '',               label: 'All Locations' },
  { value: 'Bangalore',      label: '🏙️ Bangalore' },
  { value: 'Hyderabad',      label: '🏙️ Hyderabad' },
  { value: 'Pune',           label: '🏙️ Pune' },
  { value: 'Chennai',        label: '🏙️ Chennai' },
  { value: 'Vijayawada',     label: '🏙️ Vijayawada' },
  { value: 'Visakhapatnam',  label: '🏙️ Visakhapatnam' },
  { value: 'Dubai',          label: '🇦🇪 Dubai' },
  { value: 'United States',  label: '🇺🇸 United States' },
  { value: 'Remote',         label: '🌐 Remote' },
]

export default function FilterBar({
  category, location, search,
  onCategoryChange, onLocationChange, onSearchChange,
  totalResults,
}) {
  const searchRef = useRef(null)
  const hasFilters = category || location || search

  const clearAll = () => {
    onCategoryChange('')
    onLocationChange('')
    onSearchChange('')
    searchRef.current?.focus()
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4 items-start sm:items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-0">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-vault-text-dim pointer-events-none" />
        <input
          ref={searchRef}
          id="filter-search"
          type="text"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search jobs, companies…"
          className="w-full bg-vault-card border border-vault-border rounded-lg pl-9 pr-4 py-2.5 text-vault-text text-sm mono placeholder:text-vault-text-dim focus:border-vault-brass focus:outline-none focus:ring-1 focus:ring-vault-brass/20 transition-all"
        />
      </div>

      {/* Category */}
      <div className="relative w-full sm:w-auto">
        <select
          id="filter-category"
          value={category}
          onChange={e => onCategoryChange(e.target.value)}
          className="appearance-none w-full sm:w-48 bg-vault-card border border-vault-border rounded-lg pl-3 pr-8 py-2.5 text-vault-text text-sm focus:border-vault-brass focus:outline-none transition-all cursor-pointer"
        >
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value} className="bg-vault-indigo">
              {c.label}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-vault-text-dim pointer-events-none" />
      </div>

      {/* Location */}
      <div className="relative w-full sm:w-auto">
        <select
          id="filter-location"
          value={location}
          onChange={e => onLocationChange(e.target.value)}
          className="appearance-none w-full sm:w-44 bg-vault-card border border-vault-border rounded-lg pl-3 pr-8 py-2.5 text-vault-text text-sm focus:border-vault-brass focus:outline-none transition-all cursor-pointer"
        >
          {LOCATIONS.map(l => (
            <option key={l.value} value={l.value} className="bg-vault-indigo">
              {l.label}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-vault-text-dim pointer-events-none" />
      </div>

      {/* Clear filters + result count */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {hasFilters && (
          <button
            id="filter-clear-btn"
            onClick={clearAll}
            className="flex items-center gap-1.5 text-vault-text-dim hover:text-vault-rose transition-colors text-sm"
          >
            <X size={14} />
            <span>Clear</span>
          </button>
        )}
        {totalResults !== undefined && (
          <span className="mono text-xs text-vault-text-dim whitespace-nowrap">
            {totalResults.toLocaleString()} result{totalResults !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  )
}
