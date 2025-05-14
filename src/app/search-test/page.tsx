"use client";

import { useState } from 'react';
import SearchModal from '@/components/SearchModal';

export default function SearchTestPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Search Modal Test Page</h1>
      
      <button
        onClick={() => {
          console.log('Opening modal from test page');
          setIsModalOpen(true);
        }}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Open Search Modal
      </button>

      <div className="mt-4">
        <p>Modal state: {isModalOpen ? 'Open' : 'Closed'}</p>
      </div>

      {isModalOpen && (
        <SearchModal 
          isOpen={isModalOpen} 
          onClose={() => {
            console.log('Closing modal from test page');
            setIsModalOpen(false);
          }} 
        />
      )}
    </div>
  );
}
