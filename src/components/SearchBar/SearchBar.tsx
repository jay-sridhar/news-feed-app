interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  placeholder?: string
}

export function SearchBar({ value, onChange, onClear, placeholder }: SearchBarProps): JSX.Element {
  return (
    <div className="relative px-3 py-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Search articles…'}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-sm outline-none focus:border-blue-400 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:bg-gray-800"
      />
      {value.length > 0 && (
        <button
          onClick={onClear}
          className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  )
}
