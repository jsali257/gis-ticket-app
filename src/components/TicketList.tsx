"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Session } from 'next-auth';
// Removed modal imports
import { useToast } from './ToastProvider';
import { FaPlus, FaMapMarkerAlt, FaCheckCircle, FaClipboardList, FaArrowRight, FaPhoneAlt } from 'react-icons/fa';
import { User, Ticket } from '@/types';
import { getBusinessDaysBetween } from '@/lib/dateUtils';

type TicketListProps = {
  tickets: Ticket[];
  session: Session | null;
};

const TicketList = ({ tickets: initialTickets, session }: TicketListProps) => {
  const router = useRouter();
  const { showToast } = useToast();
  const [filter, setFilter] = useState({
    status: '',
    priority: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  // Removed modal state management
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastKnownTicketIdsRef = useRef<Set<string>>(new Set(initialTickets.map(t => t._id)));
  
  // Fetch users for the assignee dropdown and set up SSE for real-time ticket updates
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    
    fetchUsers();
    
    // Set up Server-Sent Events for real-time updates
    const setupSSE = () => {
      // Close any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      
      // Create a new EventSource connection
      const eventSource = new EventSource('/api/tickets/stream');
      eventSourceRef.current = eventSource;
      
      // Handle incoming ticket data
      eventSource.onmessage = (event) => {
        try {
          const newTickets = JSON.parse(event.data);
          
          // Check if there are any new tickets that weren't in the previous list
          const currentTicketIds = lastKnownTicketIdsRef.current;
          const newTicketIds = new Set(newTickets.map(t => t._id));
          
          // Find tickets that weren't in our last known set
          const actuallyNewTickets = newTickets.filter((t: any) => !currentTicketIds.has(t._id));
          
          // Log tickets to debug due date issue
          console.log('Received tickets from SSE:', newTickets);
          console.log('First ticket due date:', newTickets[0]?.dueDate);
          
          // Update the tickets state
          setTickets(newTickets);
          
          // Only show toast if we have actually new tickets
          if (actuallyNewTickets.length > 0) {
            showToast(`${actuallyNewTickets.length} new ticket${actuallyNewTickets.length > 1 ? 's' : ''} received!`, 'success');
            
            // Update our reference of known ticket IDs
            lastKnownTicketIdsRef.current = new Set(newTickets.map((t: any) => t._id));
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };
      
      // Handle errors
      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        eventSource.close();
        
        // Try to reconnect after a delay
        setTimeout(setupSSE, 5000);
      };
    };
    
    setupSSE();
    
    // Clean up function to close the SSE connection when component unmounts
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [initialTickets, showToast]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
    
    if (value) {
      showToast(`Filtering tickets by ${name}: ${value}`, 'info');
    }
  };
  
  // Navigate to ticket detail page when a ticket is clicked
  const navigateToTicket = (ticket: Ticket) => {
    router.push(`/tickets/${ticket._id}`);
    showToast(`Viewing ticket: ${ticket.firstName} ${ticket.lastName}`, 'info');
  };

  // Get user department from session
  const userDepartment = session?.user?.department || '';

  // Filter tickets based on user's department, workflow stage, and search term
  const filteredTickets = tickets.filter(ticket => {
    // Apply status and priority filters
    if (filter.status && ticket.status !== filter.status) return false;
    if (filter.priority && ticket.priority !== filter.priority) return false;
    
    // Apply search term filter if one exists
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        ticket.firstName?.toLowerCase().includes(searchLower) ||
        ticket.lastName?.toLowerCase().includes(searchLower) ||
        ticket.email?.toLowerCase().includes(searchLower) ||
        ticket.county?.toLowerCase().includes(searchLower) ||
        ticket.streetName?.toLowerCase().includes(searchLower) ||
        ticket.subdivision?.toLowerCase().includes(searchLower) ||
        ticket._id?.toLowerCase().includes(searchLower)
      );
    }
    
    if (userDepartment === 'Front Desk') {
      return true; // Show all tickets
    }
    
    // Default: show all tickets if no specific filtering applies
    return true;
  });

  // Sort tickets by due date priority (overdue first, then close to due date, then the rest)
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    // If either ticket doesn't have a due date, put it at the end
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    
    const aDaysLeft = getBusinessDaysBetween(new Date(), new Date(a.dueDate));
    const bDaysLeft = getBusinessDaysBetween(new Date(), new Date(b.dueDate));
    
    // Sort by days left (ascending)
    return aDaysLeft - bDaysLeft;
  });

  // Separate tickets by workflow stage for the split view
  const addressingTickets = sortedTickets.filter(
    ticket => ticket.workflowStage === 'Addressing'
  );
  
  const verificationTickets = sortedTickets.filter(
    ticket => ticket.workflowStage === 'Verification'
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low': return 'bg-green-900 text-green-100';
      case 'Medium': return 'bg-blue-900 text-blue-100';
      case 'High': return 'bg-yellow-900 text-yellow-100';
      case 'Critical': return 'bg-red-900 text-red-100';
      default: return 'bg-gray-700 text-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-green-600 text-white';
      case 'In Progress': return 'bg-blue-600 text-white';
      case 'Resolved': return 'bg-yellow-600 text-white';
      case 'Closed': return 'bg-red-600 text-white';
      case 'On Hold': return 'bg-amber-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  // Function to render a ticket card
  // Fallback function to generate ticket number if not stored in the ticket
  // This is for backward compatibility with existing tickets
  const generateTicketNumber = (createdAt: string): string => {
    const date = new Date(createdAt);
    const year = date.getFullYear().toString().slice(2); // Get last 2 digits of year
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  };
  
  const renderTicketCard = (ticket: Ticket) => (
    <div
      key={ticket._id}
      className="bg-[#2a2b33] rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer mb-4 border-l-4 border-blue-500 hover:translate-y-[-2px]"
      onClick={() => navigateToTicket(ticket)}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-blue-800 flex items-center justify-center mr-3">
              <span className="text-white font-medium">
                {ticket.firstName.charAt(0)}{ticket.lastName.charAt(0)}
              </span>
            </div>
            <div>
              <div className="flex items-center">
                <h3 className="text-sm font-medium text-white">{ticket.firstName} {ticket.lastName}</h3>
                <span className="ml-2 px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
                  #{ticket.ticketNumber || generateTicketNumber(ticket.createdAt)}
                </span>
              </div>
              <p className="text-xs text-gray-300">{ticket.email}</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
              ticket.priority === 'Low' ? 'bg-green-900 text-green-100' :
              ticket.priority === 'Medium' ? 'bg-blue-900 text-blue-100' :
              ticket.priority === 'High' ? 'bg-yellow-900 text-yellow-100' :
              'bg-red-900 text-red-100'
            }`}>
              {ticket.priority}
            </span>
            <span className="text-xs text-gray-300 mt-1">
              {new Date(ticket.createdAt).toLocaleDateString()}
            </span>
            {ticket.dueDate && (
              <span className={`text-xs mt-1 flex items-center ${
                new Date(ticket.dueDate) < new Date() ? 'text-red-400' : 'text-blue-400'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Due: {new Date(ticket.dueDate).toLocaleDateString()}
              </span>
            )}
            {ticket.dueDate && (
              <span className={`text-xs mt-1 ${(() => {
                const daysLeft = getBusinessDaysBetween(new Date(), new Date(ticket.dueDate));
                if (daysLeft < 0) return 'text-red-400'; // Overdue - red
                if (daysLeft <= 2) return 'text-orange-400'; // Close to due date - orange
                return 'text-blue-400'; // Plenty of time - blue
              })()}`}>
                {(() => {
                  const daysLeft = getBusinessDaysBetween(new Date(), new Date(ticket.dueDate));
                  if (daysLeft >= 0) {
                    return `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`;
                  } else {
                    return `${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} overdue`;
                  }
                })()}
              </span>
            )}
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-3">
          {ticket.dueDate && (
            <div className={`flex items-center mb-2 bg-opacity-20 rounded px-2 py-1 ${
              new Date(ticket.dueDate) < new Date() ? 'bg-red-900' : 'bg-blue-900'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 ${
                new Date(ticket.dueDate) < new Date() ? 'text-red-400' : 'text-blue-400'
              }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`text-sm ${(() => {
                const daysLeft = getBusinessDaysBetween(new Date(), new Date(ticket.dueDate));
                if (daysLeft < 0) return 'text-red-300'; // Overdue - red
                if (daysLeft <= 2) return 'text-orange-300'; // Close to due date - orange
                return 'text-blue-300'; // Plenty of time - blue
              })()} font-medium`}>
                Due: {new Date(ticket.dueDate).toLocaleDateString()} 
                {ticket.dueDate && (
                  <span className="ml-1 text-xs opacity-80">
                    {(() => {
                      const daysLeft = getBusinessDaysBetween(new Date(), new Date(ticket.dueDate));
                      if (daysLeft >= 0) {
                        return `(${daysLeft} day${daysLeft !== 1 ? 's' : ''} left)`;
                      } else {
                        return `(${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} overdue)`;
                      }
                    })()}
                  </span>
                )}
              </span>
            </div>
          )}
          <div className="flex flex-col space-y-2 mb-2">
            {/* Address Information */}
            <div className="flex items-start">
              <FaMapMarkerAlt className="text-gray-300 mr-2 mt-1" />
              <div className="flex flex-col">
                <span className="text-sm text-gray-200 truncate">{ticket.streetName}</span>
                {ticket.subdivision && (
                  <span className="text-xs text-gray-400">Subdivision: {ticket.subdivision}</span>
                )}
                {ticket.lotNumber && (
                  <span className="text-xs text-gray-400">Lot: {ticket.lotNumber}</span>
                )}
                {ticket.approvedAddress && (
                  <span className="text-xs text-green-400 font-medium flex items-center">
                    <FaCheckCircle className="mr-1 text-green-500" size="12" />
                    Approved: {ticket.approvedAddress}
                  </span>
                )}
              </div>
            </div>
            
            {/* Additional Details */}
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
              {ticket.mobilePhone && (
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {ticket.mobilePhone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3")}
                </div>
              )}
              {ticket.propertyId && (
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  ID: {ticket.propertyId}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                ticket.status === 'Open' ? 'bg-green-100 text-green-800' :
                ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                ticket.status === 'Resolved' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {ticket.status}
              </span>
              {ticket.workflowStage && (
                <span className="ml-2 text-xs text-gray-300 flex items-center">
                  <FaArrowRight className="mr-1 text-gray-300" size="10" />
                  {ticket.workflowStage}
                </span>
              )}
            </div>
            {ticket.requestType && (
              <span className="text-xs text-gray-300">{ticket.requestType}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-[#2a2b33] shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold text-white mb-4 md:mb-0">
              Tickets ({filteredTickets.length})
            </h2>
            
            <div className="relative w-full md:w-64 lg:w-96">
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#1e293b] text-white border border-gray-600 rounded-lg py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:space-x-4 items-center">
              <Link
                href="/tickets/new"
                className="mb-4 sm:mb-0 sm:mr-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <FaPlus className="mr-2" />
                New Ticket
              </Link>
              <div className="mb-4 sm:mb-0">
                <select
                  id="status"
                  name="status"
                  value={filter.status}
                  onChange={handleFilterChange}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              
              <div>
                <select
                  id="priority"
                  name="priority"
                  value={filter.priority}
                  onChange={handleFilterChange}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">All Priorities</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {filteredTickets.length === 0 ? (
        <div className="text-center py-12 bg-[#2a2b33] rounded-lg shadow">
          <p className="text-gray-300">No tickets found.</p>
        </div>
      ) : (
        // Different layouts based on user department
        userDepartment === 'Front Desk' ? (
          // Split view for Front Desk users
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Processing Tickets Column */}
            <div className="bg-[#2a2b33] rounded-lg shadow-md overflow-hidden">
              <div className="bg-[#1a1c23] p-4 border-b border-gray-700">
                <h3 className="text-lg font-medium text-white flex items-center">
                  <FaClipboardList className="mr-2 text-blue-400" />
                  Processing Tickets
                  <span className="ml-2 bg-blue-800 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {sortedTickets.filter(ticket => 
                      ['Front Desk', 'Addressing', 'Verification'].includes(ticket.workflowStage)
                    ).length}
                  </span>
                </h3>
              </div>
              
              <div className="p-4">
                <div className="space-y-4">
                  {sortedTickets
                    .filter(ticket => ['Front Desk', 'Addressing', 'Verification'].includes(ticket.workflowStage))
                    .map(ticket => renderTicketCard(ticket))
                  }
                  {sortedTickets.filter(ticket => 
                    ['Front Desk', 'Addressing', 'Verification'].includes(ticket.workflowStage)
                  ).length === 0 && (
                    <p className="text-gray-300">No tickets in progress.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Ready to Contact Customer Column */}
            <div className="bg-[#2a2b33] rounded-lg shadow-md overflow-hidden">
              <div className="bg-[#1a1c23] p-4 border-b border-gray-700">
                <h3 className="text-lg font-medium text-white flex items-center">
                  <FaPhoneAlt className="mr-2 text-green-400" />
                  Ready to Contact Customer
                  <span className="ml-2 bg-green-800 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {sortedTickets.filter(ticket => ticket.workflowStage === 'Ready to Contact Customer').length}
                  </span>
                </h3>
              </div>
              
              <div className="p-4">
                <div className="space-y-4">
                  {sortedTickets
                    .filter(ticket => ticket.workflowStage === 'Ready to Contact Customer')
                    .map(ticket => renderTicketCard(ticket))
                  }
                  {sortedTickets.filter(ticket => ticket.workflowStage === 'Ready to Contact Customer').length === 0 && (
                    <p className="text-gray-300">No tickets ready for customer contact.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Split view for GIS users
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Addressing Tickets Column */}
            <div className="bg-[#242b42] rounded-lg shadow-md overflow-hidden">
              <div className="bg-[#1e293b] p-4 border-b border-gray-700">
                <h3 className="text-lg font-medium text-white flex items-center">
                  <FaMapMarkerAlt className="mr-2 text-blue-400" />
                  Addressing Tickets
                  <span className="ml-2 bg-blue-800 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {addressingTickets.length}
                  </span>
                </h3>
              </div>
              
              <div className="p-4">
                {addressingTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-300">No addressing tickets assigned to you.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addressingTickets.map(ticket => renderTicketCard(ticket))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Verification Tickets Column */}
            <div className="bg-[#242b42] rounded-lg shadow-md overflow-hidden">
              <div className="bg-[#1e293b] p-4 border-b border-gray-700">
                <h3 className="text-lg font-medium text-white flex items-center">
                  <FaCheckCircle className="mr-2 text-green-400" />
                  Verification Tickets
                  <span className="ml-2 bg-green-800 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {verificationTickets.length}
                  </span>
                </h3>
              </div>
              
              <div className="p-4">
                {verificationTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-300">No verification tickets assigned to you.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {verificationTickets.map(ticket => renderTicketCard(ticket))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}
      
      {/* Direct navigation to ticket page is now used instead of modal */}
    </div>
    
  );
};

export default TicketList;
