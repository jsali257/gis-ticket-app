"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FaSearch, FaTimes, FaTicketAlt, FaUser, FaMapMarkerAlt, FaInfoCircle } from 'react-icons/fa';
import { Ticket, User } from '@/types';

type SearchResult = {
  type: 'ticket' | 'user' | 'address';
  id: string;
  title: string;
  subtitle: string;
  highlight?: string;
};

type SearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  console.log('SearchModal rendered with isOpen:', isOpen);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [filters, setFilters] = useState({
    tickets: true,
    users: true,
    addresses: true,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus the input when the modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
          break;
        case 'Enter':
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            handleResultClick(results[selectedIndex]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Search function
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    console.log('Searching for:', searchQuery);

    try {
      // For debugging - add some mock results
      const mockResults: SearchResult[] = [
        {
          type: 'ticket',
          id: '1',
          title: 'John Doe',
          subtitle: 'New Address - Open (Front Desk)',
          highlight: 'This is a mock result for debugging'
        },
        {
          type: 'user',
          id: '2',
          title: 'Jane Smith',
          subtitle: 'jane@example.com - GIS (admin)'
        },
        {
          type: 'address',
          id: '3',
          title: '123 Main St, Example County',
          subtitle: 'Woodland Heights Lot 42'
        }
      ];
      
      console.log('Setting mock results for debugging');
      setResults(mockResults);
      setIsLoading(false);
      return;

      // Parse advanced search query if in advanced mode
      let parsedQuery = searchQuery;
      let typeFilter = null;
      
      if (advancedMode && searchQuery.includes(':')) {
        const parts = searchQuery.split(':');
        const prefix = parts[0].toLowerCase().trim();
        
        if (['ticket', 'user', 'address'].includes(prefix)) {
          typeFilter = prefix as 'ticket' | 'user' | 'address';
          parsedQuery = parts.slice(1).join(':').trim();
        }
      }

      console.log(`Fetching from API: /api/search?q=${encodeURIComponent(parsedQuery)}${typeFilter ? `&type=${typeFilter}` : ''}`);
      
      // Fetch results from API
      const response = await fetch(`/api/search?q=${encodeURIComponent(parsedQuery)}${typeFilter ? `&type=${typeFilter}` : ''}`);
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Search failed with status:', response.status, errorText);
        throw new Error(`Search failed: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API returned data:', data);
      
      // Filter results based on user preferences
      const filteredResults = data.filter((result: SearchResult) => {
        if (result.type === 'ticket' && !filters.tickets) return false;
        if (result.type === 'user' && !filters.users) return false;
        if (result.type === 'address' && !filters.addresses) return false;
        return true;
      });
      
      console.log('Filtered results:', filteredResults);
      setResults(filteredResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, filters, advancedMode]);

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'ticket':
        router.push(`/tickets/${result.id}`);
        break;
      case 'user':
        router.push(`/users/${result.id}`);
        break;
      case 'address':
        // Navigate to address or show on map
        router.push(`/map?address=${encodeURIComponent(result.title)}`);
        break;
    }
    onClose();
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'ticket':
        return <FaTicketAlt className="text-blue-500" />;
      case 'user':
        return <FaUser className="text-green-500" />;
      case 'address':
        return <FaMapMarkerAlt className="text-red-500" />;
      default:
        return <FaInfoCircle className="text-gray-500" />;
    }
  };

  // Suggestions based on recent searches or popular items
  const suggestions = [
    { text: 'Open tickets', query: 'status:open' },
    { text: 'High priority', query: 'priority:high' },
    { text: 'My assigned tickets', query: 'assignedTo:me' },
    { text: 'GIS Department', query: 'department:GIS' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Search header */}
        <div className="p-4 border-b flex items-center space-x-2">
          <FaSearch className="text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={advancedMode ? 'Type:query (e.g. ticket:missing address)' : 'Search for tickets, users, addresses...'}
            className="flex-1 outline-none text-lg"
            autoFocus
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes />
            </button>
          )}
          <button 
            onClick={() => setAdvancedMode(!advancedMode)}
            className={`px-2 py-1 rounded text-xs ${advancedMode ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
          >
            {advancedMode ? 'Advanced' : 'Simple'}
          </button>
          <button 
            onClick={onClose}
            className="ml-2 text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </button>
        </div>
        
        {/* Filter options */}
        <div className="px-4 py-2 bg-gray-50 flex space-x-4 text-sm">
          <label className="flex items-center space-x-1 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.tickets}
              onChange={() => setFilters(prev => ({ ...prev, tickets: !prev.tickets }))}
            />
            <span>Tickets</span>
          </label>
          <label className="flex items-center space-x-1 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.users}
              onChange={() => setFilters(prev => ({ ...prev, users: !prev.users }))}
            />
            <span>Users</span>
          </label>
          <label className="flex items-center space-x-1 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.addresses}
              onChange={() => setFilters(prev => ({ ...prev, addresses: !prev.addresses }))}
            />
            <span>Addresses</span>
          </label>
        </div>
        
        {/* Results area */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y">
              {results.map((result, index) => (
                <div 
                  key={`${result.type}-${result.id}`}
                  className={`p-3 hover:bg-gray-50 cursor-pointer flex items-start ${selectedIndex === index ? 'bg-blue-50' : ''}`}
                  onClick={() => handleResultClick(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="mr-3 mt-1">
                    {getResultIcon(result.type)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{result.title}</div>
                    <div className="text-sm text-gray-500">{result.subtitle}</div>
                    {result.highlight && (
                      <div className="text-xs mt-1 text-gray-700 bg-yellow-100 p-1 rounded">
                        ...{result.highlight}...
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 capitalize">
                    {result.type}
                  </div>
                </div>
              ))}
            </div>
          ) : query ? (
            <div className="p-4 text-center text-gray-500">
              No results found
            </div>
          ) : (
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">SUGGESTIONS</h3>
              <div className="grid grid-cols-2 gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="text-left p-2 bg-gray-50 hover:bg-gray-100 rounded text-sm"
                    onClick={() => setQuery(suggestion.query)}
                  >
                    {suggestion.text}
                  </button>
                ))}
              </div>
              
              <h3 className="text-sm font-medium text-gray-500 mt-4 mb-2">SEARCH TIPS</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Use <span className="font-mono bg-gray-100 px-1">status:open</span> to find open tickets</p>
                <p>• Use <span className="font-mono bg-gray-100 px-1">priority:high</span> for high priority items</p>
                <p>• Use <span className="font-mono bg-gray-100 px-1">department:GIS</span> for GIS department</p>
                <p>• Toggle Advanced mode for more search options</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Status footer */}
        <div className="p-2 border-t bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
          <div>
            {results.length > 0 && `${results.length} result${results.length !== 1 ? 's' : ''}`}
          </div>
          <div>
            Press <kbd className="px-1 py-0.5 bg-gray-200 rounded">↑</kbd> <kbd className="px-1 py-0.5 bg-gray-200 rounded">↓</kbd> to navigate, <kbd className="px-1 py-0.5 bg-gray-200 rounded">Enter</kbd> to select
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
