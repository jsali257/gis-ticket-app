"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaLink, FaExternalLinkAlt, FaSpinner } from 'react-icons/fa';
import { Ticket } from '@/types';
import { useToast } from './ToastProvider';

type RelatedTicketsProps = {
  ticketId: string;
  propertyId?: string;
};

const RelatedTickets = ({ ticketId, propertyId }: RelatedTicketsProps) => {
  const [relatedTickets, setRelatedTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    const fetchRelatedTickets = async () => {
      if (!propertyId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/tickets/related?ticketId=${ticketId}&propertyId=${propertyId}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch related tickets');
        }

        const data = await response.json();
        setRelatedTickets(data);
        
        // Show toast with connection count
        if (data.length > 0) {
          showToast(`Found ${data.length} related ticket${data.length === 1 ? '' : 's'} for this property`, 'info');
        }
      } catch (err) {
        console.error('Error fetching related tickets:', err);
        setError('Failed to load related tickets');
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedTickets();
  }, [ticketId, propertyId, showToast]);

  if (!propertyId) {
    return null;
  }

  return (
    <div className="mt-6 bg-gray-800 rounded-lg shadow-md border border-gray-700">
      <div className="border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <h3 className="text-lg font-medium text-white flex items-center">
          <FaLink className="mr-2 text-blue-400" />
          Related Tickets
        </h3>
        {loading ? (
          <div className="flex items-center text-blue-400 text-sm">
            <FaSpinner className="animate-spin mr-2" />
            <span>Loading...</span>
          </div>
        ) : relatedTickets.length > 0 ? (
          <span className="text-sm bg-blue-900 text-blue-200 px-2 py-1 rounded-full">
            {relatedTickets.length} connection{relatedTickets.length !== 1 ? 's' : ''}
          </span>
        ) : null}
      </div>

      <div className="p-4">
        {error ? (
          <div className="text-red-400 py-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        ) : !loading && relatedTickets.length === 0 ? (
          <div className="text-gray-400 py-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            No other tickets found for this property ID: {propertyId}
          </div>
        ) : !loading && (
          <div className="space-y-3">
            {relatedTickets.length > 0 && (
              <p className="text-sm text-gray-400 mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                Property ID: {propertyId}
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
              {relatedTickets.map((ticket) => (
                <div
                  key={ticket._id}
                  className="bg-gray-700 rounded-md p-3 hover:bg-gray-600 transition-colors border border-gray-600"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-white">
                        {ticket.firstName} {ticket.lastName}
                      </h4>
                      <p className="text-xs text-gray-300 mt-1 flex items-center">
                        {ticket.ticketNumber && (
                          <span className="bg-gray-800 px-2 py-0.5 rounded mr-2">#{ticket.ticketNumber}</span>
                        )}
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </p>
                      <p className="text-sm text-gray-300 mt-2">
                        {ticket.streetName}{ticket.subdivision ? `, ${ticket.subdivision}` : ''}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(ticket.workflowStage)}`}>
                          {ticket.workflowStage}
                        </span>
                        <Link
                          href={`/tickets/${ticket._id}`}
                          className="text-blue-400 hover:text-blue-300 flex items-center text-sm bg-gray-800 px-3 py-1 rounded"
                        >
                          View
                          <FaExternalLinkAlt className="ml-1" size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to get status color based on workflow stage
const getStatusColor = (workflowStage: string): string => {
  switch (workflowStage) {
    case 'Front Desk':
      return 'bg-blue-900 text-blue-200';
    case 'Addressing':
      return 'bg-yellow-900 text-yellow-200';
    case 'Verification':
      return 'bg-purple-900 text-purple-200';
    case 'Ready to Contact Customer':
      return 'bg-green-900 text-green-200';
    case 'Completed':
      return 'bg-gray-700 text-gray-300';
    default:
      return 'bg-gray-700 text-gray-300';
  }
};

export default RelatedTickets;
