import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Filter, SortAsc, SortDesc } from 'lucide-react';

// Debounce hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Types
interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  debounceMs?: number;
  className?: string;
  autoFocus?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Пошук...',
  value: externalValue,
  onChange,
  onSearch,
  debounceMs = 300,
  className = '',
  autoFocus = false,
}) => {
  const [internalValue, setInternalValue] = useState(externalValue || '');
  const inputRef = useRef<HTMLInputElement>(null);

  // Use external or internal value
  const value = externalValue !== undefined ? externalValue : internalValue;
  const debouncedValue = useDebounce(value, debounceMs);

  // Handle debounced search
  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedValue);
    }
  }, [debouncedValue, onSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (onChange) {
      onChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  const handleClear = () => {
    if (onChange) {
      onChange('');
    } else {
      setInternalValue('');
    }
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="w-5 h-5 text-slate-400 dark:text-slate-500" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="
          w-full pl-10 pr-10 py-2.5
          bg-white dark:bg-slate-800
          border border-slate-200 dark:border-slate-700
          rounded-xl
          text-slate-900 dark:text-white
          placeholder-slate-400 dark:placeholder-slate-500
          focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
          transition-all duration-200
        "
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

// Filter dropdown component
interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  label?: string;
  options: FilterOption[];
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label = 'Фільтр',
  options,
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-2 px-4 py-2.5
          bg-white dark:bg-slate-800
          border border-slate-200 dark:border-slate-700
          rounded-xl
          text-slate-700 dark:text-slate-300
          hover:bg-slate-50 dark:hover:bg-slate-700
          transition-colors
        "
      >
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">{label}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="
            absolute top-full mt-2 right-0 z-50
            min-w-[160px]
            bg-white dark:bg-slate-800
            border border-slate-200 dark:border-slate-700
            rounded-xl shadow-lg
            overflow-hidden
            animate-scale-in origin-top-right
          ">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-4 py-2.5 text-left text-sm
                  transition-colors
                  ${
                    value === option.value
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Sort button component
interface SortButtonProps {
  label?: string;
  isAscending: boolean;
  onToggle: () => void;
  className?: string;
}

export const SortButton: React.FC<SortButtonProps> = ({
  label = 'Сортувати',
  isAscending,
  onToggle,
  className = '',
}) => {
  return (
    <button
      onClick={onToggle}
      className={`
        flex items-center gap-2 px-4 py-2.5
        bg-white dark:bg-slate-800
        border border-slate-200 dark:border-slate-700
        rounded-xl
        text-slate-700 dark:text-slate-300
        hover:bg-slate-50 dark:hover:bg-slate-700
        transition-colors
        ${className}
      `}
    >
      {isAscending ? (
        <SortAsc className="w-4 h-4" />
      ) : (
        <SortDesc className="w-4 h-4" />
      )}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
};

// Combined search toolbar
interface SearchToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterOptions?: FilterOption[];
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  sortAscending?: boolean;
  onSortToggle?: () => void;
  sortLabel?: string;
  searchPlaceholder?: string;
}

export const SearchToolbar: React.FC<SearchToolbarProps> = ({
  searchValue,
  onSearchChange,
  filterOptions,
  filterValue,
  onFilterChange,
  sortAscending,
  onSortToggle,
  sortLabel,
  searchPlaceholder,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <SearchInput
        value={searchValue}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
        className="flex-1"
      />
      <div className="flex gap-2">
        {filterOptions && onFilterChange && (
          <FilterDropdown
            options={filterOptions}
            value={filterValue}
            onChange={onFilterChange}
          />
        )}
        {onSortToggle && sortAscending !== undefined && (
          <SortButton
            label={sortLabel}
            isAscending={sortAscending}
            onToggle={onSortToggle}
          />
        )}
      </div>
    </div>
  );
};

export default SearchInput;
