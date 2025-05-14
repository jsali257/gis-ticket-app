"use client";

import { useEffect, useRef } from 'react';
import { useSearch } from '@/context/SearchContext';
import SearchModal from './SearchModal';

const GlobalSearchModal = () => {
  const { isSearchOpen, closeSearch } = useSearch();
  
  // Log when the component renders and when the search state changes
  useEffect(() => {
    console.log('GlobalSearchModal rendered, isSearchOpen:', isSearchOpen);
  }, [isSearchOpen]);

  return (
    <>
      {isSearchOpen && (
        <SearchModal
          isOpen={isSearchOpen}
          onClose={closeSearch}
        />
      )}
    </>
  );
};

export default GlobalSearchModal;
