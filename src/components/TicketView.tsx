"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useToast } from './ToastProvider';
import TicketActions from './TicketActions';
import RelatedTickets from './RelatedTickets';
import { FaEdit, FaSave, FaTimes, FaCheck, FaTimes as FaX } from 'react-icons/fa';

// Add CSS for 3D tabs with dark theme and workflow progress bar
const tabStyles = `
  .tabs-container {
    position: relative;
  }
  
  .tabs-navigation {
    display: flex;
    position: relative;
    z-index: 1;
  }
  
  .tab {
    padding: 12px 24px;
    margin-right: 4px;
    border-radius: 8px 8px 0 0;
    font-weight: 600;
    transition: all 0.3s ease;
    position: relative;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    box-shadow: 0 -2px 4px rgba(0,0,0,0.3);
  }
  
  .tab::before {
    content: '';
    position: absolute;
    top: 0;
    right: -10px;
    bottom: 0;
    width: 10px;
    background: inherit;
    border-top-right-radius: 8px;
    transform: skewX(10deg);
    transform-origin: bottom left;
    box-shadow: 2px -2px 2px rgba(0,0,0,0.3);
  }
  
  .tab-icon {
    margin-right: 8px;
    font-size: 1.1em;
  }
  
  .tab-content {
    position: relative;
    z-index: 5;
    border-radius: 0 8px 8px 8px;
    margin-top: -1px;
    background-color: #1f2937;
    border: 1px solid #374151;
    color: #e5e7eb;
  }
  
  /* Workflow Progress Bar Styles */
  .workflow-progress {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 2rem 0;
    position: relative;
    padding: 0 10px;
  }
  
  .workflow-progress::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background-color: #4b5563;
    transform: translateY(-50%);
    z-index: 1;
  }
  
  .workflow-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    z-index: 2;
  }
  
  .step-circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
    background-color: #4b5563;
    color: white;
    font-weight: bold;
    position: relative;
  }
  
  .step-circle.completed {
    background-color: #10b981;
  }
  
  .step-circle.active {
    background-color: #10b981;
    border: 2px solid white;
    box-shadow: 0 0 0 2px #10b981;
  }
  
  .step-circle.pending {
    background-color: #6b7280;
  }
  
  .step-label {
    font-size: 0.75rem;
    text-align: center;
    max-width: 80px;
    color: #d1d5db;
  }
  
  .step-circle svg {
    width: 20px;
    height: 20px;
  }
  
  .progress-line {
    position: absolute;
    top: 20px;
    height: 2px;
    background-color: #10b981;
    z-index: 1;
  }
`;

type User = {
  _id: string;
  name: string;
  email: string;
};

type Ticket = {
  _id: string;
  status: string;
  priority: string;
  workflowStage: string;
  addressCreated: boolean;
  addressVerified: boolean;
  assignedTo?: User | null;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
  // Ticket identification
  ticketNumber?: string;
  // Contact information
  firstName: string;
  lastName: string;
  email: string;
  mobilePhone?: string;
  landlinePhone?: string;
  // Request details
  requestType: string;
  existingAddress?: string;
  additionalInfo?: string;
  // Property information
  premiseType: string;
  propertyId?: string;
  county: string;
  streetName: string;
  closestIntersection?: string;
  subdivision?: string;
  lotNumber?: string;
  coordinates?: [number, number];
  // Verification
  approvedAddress?: string;
  verificationNotes?: string;
  // History
  history?: Array<{
    _id?: string;
    workflowStage: string;
    timestamp: string;
    actionBy?: User;
    assignedTo?: User;
    notes?: string;
  }>;
  // Due date and resolution tracking
  dueDate?: string;
  timeToResolve?: number;
};

// Define workflow stages in order
const WORKFLOW_STAGES = [
  'Front Desk',
  'Addressing',
  'Verification',
  'Completed'
];

// WorkflowProgress component
const WorkflowProgress = ({ currentStage }: { currentStage: string }) => {
  // Find the index of the current stage
  const currentIndex = WORKFLOW_STAGES.indexOf(currentStage);
  
  return (
    <div className="workflow-progress">
      {WORKFLOW_STAGES.map((stage, index) => {
        // Determine if this stage is completed, active, or pending
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        const isPending = index > currentIndex;
        
        // Calculate progress line width for completed stages
        const showProgressLine = index < WORKFLOW_STAGES.length - 1 && index < currentIndex;
        const progressLineWidth = `calc(100% / ${WORKFLOW_STAGES.length - 1})`;
        
        return (
          <div key={stage} className="workflow-step">
            {/* Progress line for completed stages */}
            {showProgressLine && (
              <div 
                className="progress-line" 
                style={{ 
                  left: `calc(100% / ${WORKFLOW_STAGES.length - 1} * ${index})`,
                  width: progressLineWidth
                }}
              />
            )}
            
            {/* Step circle with icon */}
            <div className={`step-circle ${isCompleted ? 'completed' : isActive ? 'active' : 'pending'}`}>
              {isCompleted ? (
                <FaCheck />
              ) : isPending ? (
                <span>{index + 1}</span>
              ) : (
                <FaCheck />
              )}
            </div>
            
            {/* Step label */}
            <div className="step-label">{stage}</div>
          </div>
        );
      })}
    </div>
  );
};

type TicketViewProps = {
  ticket: Ticket;
  users: User[];
  session: any;
};

const TicketView = ({ ticket: initialTicket, users, session }: TicketViewProps) => {
  const router = useRouter();
  const { showToast } = useToast();
  const [ticket, setTicket] = useState<Ticket>(initialTicket);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  // Set the default active tab based on the workflow stage
  const [activeTab, setActiveTab] = useState(() => {
    // If the ticket is in Addressing or Verification stage, default to addressing tab
    if (initialTicket.workflowStage === 'Addressing' || initialTicket.workflowStage === 'Verification') {
      return 'addressing';
    }
    // If the ticket is in Ready to Contact Customer stage, default to contact tab
    if (initialTicket.workflowStage === 'Ready to Contact Customer') {
      return 'contact';
    }
    return 'personal';
  });
  
  // Format dates for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Helper function to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-blue-100 text-blue-800';
      case 'High': return 'bg-yellow-100 text-yellow-800';
      case 'Critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Helper function to get workflow stage color
  const getWorkflowStageColor = (stage: string) => {
    switch (stage) {
      case 'Front Desk': return 'bg-purple-100 text-purple-800';
      case 'Addressing': return 'bg-indigo-100 text-indigo-800';
      case 'Verification': return 'bg-orange-100 text-orange-800';
      case 'Ready to Contact Customer': return 'bg-teal-100 text-teal-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Set up auto-save effect
  useEffect(() => {
    return () => {
      // Clear any pending auto-save timeouts when component unmounts
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  // Handle form input changes with auto-save
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTicket(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear any existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    // Set a new timeout for auto-save (2 seconds after last change)
    const timeout = setTimeout(() => {
      saveTicket(false); // Auto-save without showing toast
    }, 2000);
    
    setAutoSaveTimeout(timeout);
  };
  
  // Reset changes and revert to initial ticket data
  const resetChanges = () => {
    setTicket(initialTicket);
    showToast('Changes discarded', 'info');
  };
  
  // Save ticket changes
  const saveTicket = async (showNotification = true) => {
    if (isSubmitting) return; // Prevent multiple simultaneous saves
    
    setIsSubmitting(true);
    
    try {
      // Prepare the data to send - create a clean copy without unnecessary fields
      const ticketData = {
        // Only include fields that are expected by the API
        _id: ticket._id,
        firstName: ticket.firstName || '',
        lastName: ticket.lastName || '',
        email: ticket.email || '',
        mobilePhone: ticket.mobilePhone || '',
        landlinePhone: ticket.landlinePhone || '',
        requestType: ticket.requestType || '',
        premiseType: ticket.premiseType || '',
        propertyId: ticket.propertyId || '',
        streetName: ticket.streetName || '',
        county: ticket.county || '',
        status: ticket.status || 'Open',
        priority: ticket.priority || 'Medium',
        workflowStage: ticket.workflowStage || 'New',
        verificationNote: ticket.verificationNote || '',
        addressCreated: ticket.addressCreated || false,
        addressVerified: ticket.addressVerified || false,
        approvedAddress: ticket.approvedAddress || '',
        existingAddress: ticket.existingAddress || '',
        additionalInfo: ticket.additionalInfo || '',
        closestIntersection: ticket.closestIntersection || '',
        subdivision: ticket.subdivision || '',
        lotNumber: ticket.lotNumber || '',
        // Include createdAt and updatedAt timestamps
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        
        // Handle references properly - ensure createdBy is a valid ObjectId
        // Always use a valid ObjectId format to prevent database errors
        createdBy: '000000000000000000000000',
        assignedTo: ticket.assignedTo ? (typeof ticket.assignedTo === 'object' ? ticket.assignedTo._id : ticket.assignedTo) : null,
        
        // Process history array to ensure proper format
        history: ticket.history ? ticket.history.map(entry => ({
          ...entry,
          // Convert object references to IDs
          actionBy: entry.actionBy ? (typeof entry.actionBy === 'object' ? entry.actionBy._id : entry.actionBy) : null,
          assignedTo: entry.assignedTo ? (typeof entry.assignedTo === 'object' ? entry.assignedTo._id : entry.assignedTo) : null,
        })) : [],
      };
      
      console.log('Sending ticket data:', ticketData);
      
      const response = await fetch(`/api/tickets/${ticket._id}`, {
        method: 'PUT', // Use PUT instead of PATCH to match the API endpoint
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
      });
      
      // Check if the response is ok
      if (!response.ok) {
        // Try to get the text content first
        const textContent = await response.text();
        console.error('Error response text:', textContent);
        
        // Try to parse as JSON if possible
        let errorMessage = 'Failed to update ticket';
        try {
          if (textContent && textContent.trim()) {
            const errorData = JSON.parse(textContent);
            if (errorData && errorData.error) {
              errorMessage = errorData.error;
            }
          }
        } catch (jsonError) {
          console.error('Error parsing error response:', jsonError);
        }
        
        throw new Error(errorMessage);
      }
      
      // Success case
      if (showNotification) {
        showToast('Ticket updated successfully', 'success');
      }
      
      // Refresh the page to get the latest data
      router.refresh();
    } catch (error: any) {
      console.error('Save error:', error);
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render form field (used in edit mode)
  const renderFormField = (label: string, name: string, value: string, type: string = 'text') => {
    return (
      <div className="mb-3">
        <label htmlFor={name} className="block text-sm font-medium text-white mb-1">
          {label}
        </label>
        {type === 'textarea' ? (
          <textarea
            id={name}
            name={name}
            value={value || ''}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white"
            rows={4}
          />
        ) : type === 'select' ? (
          <select
            id={name}
            name={name}
            value={value || ''}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white"
          >
            {name === 'status' && (
              <>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </>
            )}
            {name === 'priority' && (
              <>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </>
            )}
            {name === 'premiseType' && (
              <>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Other">Other</option>
              </>
            )}
            {name === 'county' && (
              <>
                <option value="County A">County A</option>
                <option value="County B">County B</option>
                <option value="County C">County C</option>
              </>
            )}
          </select>
        ) : (
          <input
            type={type}
            id={name}
            name={name}
            value={value || ''}
            onChange={handleChange}
            className="w-full p-2 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-gray-100"
          />
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <style jsx>{tabStyles}</style>
      {/* Header with back and action buttons */}
      <div className="flex items-center justify-between mb-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-gray-100">
            Ticket #{ticket.ticketNumber || ticket._id.substring(ticket._id.length - 6)}
          </h1>
          <p className="text-gray-300 font-medium">
            {ticket.firstName} {ticket.lastName} - {ticket.requestType}
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/tickets"
            className="px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 border border-gray-600"
          >
            Back to Tickets
          </Link>
          <button
            onClick={() => saveTicket(true)}
            disabled={isSubmitting}
            className="flex items-center px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-900 border border-blue-600"
          >
            <FaSave className="mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Now'}
          </button>
          <button
            onClick={resetChanges}
            className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 border border-gray-600"
          >
            <FaTimes className="mr-2" />
            Reset Changes
          </button>
        </div>
      </div>
      
      {/* Workflow Progress - Moved to top */}
      <div className="mb-6 bg-gray-800 rounded-lg shadow-md p-4 border border-gray-700">
        <WorkflowProgress currentStage={ticket.workflowStage} />
      </div>
      
      {/* Status badges and quick edit fields */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="px-3 py-1 rounded-full bg-blue-900">
          <label className="text-xs font-medium text-white mr-2">Status:</label>
          <select
            name="status"
            value={ticket.status}
            onChange={handleChange}
            className="bg-blue-800 border-none text-sm font-medium text-white focus:outline-none focus:ring-0"
          >
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        <div className="px-3 py-1 rounded-full bg-yellow-900">
          <label className="text-xs font-medium text-white mr-2">Priority:</label>
          <select
            name="priority"
            value={ticket.priority}
            onChange={handleChange}
            className="bg-yellow-800 border-none text-sm font-medium text-white focus:outline-none focus:ring-0"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getWorkflowStageColor(ticket.workflowStage)}`}>
          Stage: {ticket.workflowStage}
        </span>
        
        {/* Assignee badge */}
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Assigned to: {ticket.assignedTo?.name || 'Unassigned'}
        </span>
        
        {/* Only show Address Created badge if in Verification or Completed stage */}
        {ticket.addressCreated && (ticket.workflowStage === 'Verification' || ticket.workflowStage === 'Completed') && (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            Address Created
          </span>
        )}
        {/* Only show Address Verified badge if in Completed stage */}
        {ticket.addressVerified && ticket.workflowStage === 'Completed' && (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            Address Verified
          </span>
        )}
      </div>
      
      {/* Ticket actions */}
      {session && (
        <TicketActions
          ticket={ticket}
          userRole={session.user?.role}
          userDepartment={session.user?.department}
          userId={session.user?.id}
          users={users}
        />
      )}
      
      {/* 3D Tabs Navigation */}
      <div className="tabs-container mb-6">
        <div className="tabs-navigation">
          <button 
            className={`tab ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
            style={{
              backgroundColor: activeTab === 'personal' ? '#4ade80' : '#e5e7eb',
              color: activeTab === 'personal' ? 'white' : '#4b5563',
              transform: activeTab === 'personal' ? 'translateY(0)' : 'translateY(5px)',
              zIndex: activeTab === 'personal' ? 10 : 1,
            }}
          >
            <span className="tab-icon">👤</span> Personal Info
          </button>
          
          <button 
            className={`tab ${activeTab === 'addressing' ? 'active' : ''}`}
            onClick={() => setActiveTab('addressing')}
            style={{
              backgroundColor: activeTab === 'addressing' ? '#60a5fa' : '#e5e7eb',
              color: activeTab === 'addressing' ? 'white' : '#4b5563',
              transform: activeTab === 'addressing' ? 'translateY(0)' : 'translateY(5px)',
              zIndex: activeTab === 'addressing' ? 10 : 1,
            }}
          >
            <span className="tab-icon">🏠</span> Addressing Info
          </button>
          
          {/* Contact Customer tab - only visible when ticket is in Ready to Contact Customer stage */}
          {ticket.workflowStage === 'Ready to Contact Customer' && (
            <button 
              className={`tab ${activeTab === 'contact' ? 'active' : ''}`}
              onClick={() => setActiveTab('contact')}
              style={{
                backgroundColor: activeTab === 'contact' ? '#14b8a6' : '#e5e7eb',
                color: activeTab === 'contact' ? 'white' : '#4b5563',
                transform: activeTab === 'contact' ? 'translateY(0)' : 'translateY(5px)',
                zIndex: activeTab === 'contact' ? 10 : 1,
              }}
            >
              <span className="tab-icon">📞</span> Contact Customer
            </button>
          )}
        </div>
        
        {/* Tab Content */}
        <div className="tab-content bg-white rounded-lg shadow-md p-6 border border-gray-300">
          {/* Contact Customer Tab */}
          {activeTab === 'contact' && ticket.workflowStage === 'Ready to Contact Customer' && (
            <div>
              <h2 className="text-lg font-semibold mb-4 border-b pb-2 text-teal-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                Contact Customer
              </h2>
              
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
                <h3 className="text-md font-medium text-teal-800 mb-2">Customer Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name:</p>
                    <p className="font-medium text-gray-800">{ticket.firstName} {ticket.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email:</p>
                    <p className="font-medium text-gray-800">{ticket.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone:</p>
                    <p className="font-medium text-gray-800">{ticket.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="text-md font-medium text-gray-800 mb-2">Verified Address</h3>
                <div className="bg-green-50 p-3 rounded-md border border-green-200 mb-4">
                  <p className="font-medium text-gray-800 whitespace-pre-wrap">{ticket.approvedAddress}</p>
                </div>
                <p className="text-sm text-gray-600 italic">This address has been verified and is ready to be communicated to the customer.</p>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-800 mb-2">Contact Actions</h3>
                
                {/* Signature Request Action */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Signature Request</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Send an automated email to the customer requesting their electronic signature to confirm their approved address.
                  </p>
                  <div className="flex">
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                      onClick={async () => {
                        setIsSubmitting(true);
                        try {
                          showToast('Sending signature request email...', 'info');
                          
                          // Call the API to send the signature request
                          const response = await fetch(`/api/tickets/${ticket._id}/send-signature-request`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            }
                          });
                  
                          if (!response.ok) {
                            const data = await response.json();
                            throw new Error(data.error || 'Failed to send signature request');
                          }
                  
                          // Get the updated ticket data from the response
                          const updatedTicket = await response.json();
                          
                          // Update the local state with the new ticket data
                          setTicket(updatedTicket);
                          
                          showToast('Signature request email sent successfully', 'success');
                        } catch (error) {
                          console.error('Error sending signature request:', error);
                          showToast(`Error: ${error instanceof Error ? error.message : 'Failed to send signature request'}`, 'error');
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      disabled={isSubmitting || ticket.signatureRequested}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      {ticket.signatureRequested ? 'Signature Request Sent' : 'Send Signature Request Email'}
                    </button>
                    

                  </div>
                </div>
                
                {/* Signature Status */}
                {ticket.signatureRequested && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Signature Request Status
                    </h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-800">
                          {ticket.signatureCompleted 
                            ? 'Customer has signed the document' 
                            : 'Waiting for customer signature'}
                        </p>
                        {ticket.signatureRequestedAt && (
                          <p className="text-xs text-gray-600 mt-1">
                            Request sent: {formatDate(ticket.signatureRequestedAt)}
                          </p>
                        )}
                        {ticket.signatureCompletedAt && (
                          <p className="text-xs text-gray-600 mt-1">
                            Signed on: {formatDate(ticket.signatureCompletedAt)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {ticket.signatureCompleted ? (
                          <>
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Signed
                            </span>
                            <button
                              onClick={async () => {
                                if (window.confirm('Are you sure you want to resend the signature request? This will invalidate the previous signature link and reset the signature status.')) {
                                  try {
                                    showToast('Resending signature request...', 'info');
                                    const response = await fetch(`/api/tickets/${ticket._id}/resend-signature-request`, {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      }
                                    });
                                    
                                    if (!response.ok) {
                                      const errorData = await response.json();
                                      throw new Error(errorData.error || 'Failed to resend signature request');
                                    }
                                    
                                    const updatedTicket = await response.json();
                                    setTicket(updatedTicket);
                                    showToast('Signature request resent successfully', 'success');
                                  } catch (error) {
                                    console.error('Error resending signature request:', error);
                                    showToast(error instanceof Error ? error.message : 'Failed to resend signature request', 'error');
                                  }
                                }
                              }}
                              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded flex items-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                              </svg>
                              Resend
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              Pending
                            </span>
                            <button
                              onClick={async () => {
                                if (window.confirm('Are you sure you want to resend the signature request? This will invalidate the previous signature link.')) {
                                  try {
                                    showToast('Resending signature request...', 'info');
                                    const response = await fetch(`/api/tickets/${ticket._id}/resend-signature-request`, {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      }
                                    });
                                    
                                    if (!response.ok) {
                                      const errorData = await response.json();
                                      throw new Error(errorData.error || 'Failed to resend signature request');
                                    }
                                    
                                    const updatedTicket = await response.json();
                                    setTicket(updatedTicket);
                                    showToast('Signature request resent successfully', 'success');
                                  } catch (error) {
                                    console.error('Error resending signature request:', error);
                                    showToast(error instanceof Error ? error.message : 'Failed to resend signature request', 'error');
                                  }
                                }
                              }}
                              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded flex items-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                              </svg>
                              Resend
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Mark as Contacted */}
                <div className="mt-6">
                  <button
                    onClick={async () => {
                      setIsSubmitting(true);
                      try {
                        showToast('Marking ticket as completed...', 'info');
                        
                        // Use the transition API route
                        const response = await fetch(`/api/tickets/${ticket._id}/transition`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            targetStage: 'Completed',
                            note: 'Customer contacted with verified address information',
                            performedById: session?.user?.id || undefined,
                            status: 'Resolved'
                          }),
                        });
                
                        if (!response.ok) {
                          const data = await response.json();
                          throw new Error(data.error || 'Failed to complete ticket');
                        }
                
                        // Get the updated ticket data from the response
                        const updatedTicket = await response.json();
                        
                        // Update the local state with the new ticket data
                        setTicket(updatedTicket);
                        
                        showToast('Ticket marked as completed successfully', 'success');
                        
                        // Update the URL to reflect the new workflow stage without a full refresh
                        const url = new URL(window.location.href);
                        router.push(url.pathname + url.search, { scroll: false });
                      } catch (error) {
                        console.error('Error completing ticket:', error);
                        showToast(`Error: ${error instanceof Error ? error.message : 'Failed to complete ticket'}`, 'error');
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Mark Customer as Contacted & Complete Ticket
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <div>
              <h2 className="text-lg font-semibold mb-4 border-b pb-2 text-gray-800">Personal Information</h2>
              <div className="space-y-3">
                {/* Show full editable view for Addressing and Verification stages */}
                {(ticket.workflowStage === 'Addressing' || ticket.workflowStage === 'Verification') ? (
                  <div className="space-y-4">
                    {/* Contact Information */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        Contact Information
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="mb-3">
                          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                            First Name
                          </label>
                          <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={ticket.firstName || ''}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white"
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name
                          </label>
                          <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={ticket.lastName || ''}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white"
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={ticket.email || ''}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white"
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label htmlFor="mobilePhone" className="block text-sm font-medium text-gray-700 mb-1">
                            Mobile Phone
                          </label>
                          <input
                            type="text"
                            id="mobilePhone"
                            name="mobilePhone"
                            value={ticket.mobilePhone || ''}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white"
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label htmlFor="landlinePhone" className="block text-sm font-medium text-gray-700 mb-1">
                            Landline Phone
                          </label>
                          <input
                            type="text"
                            id="landlinePhone"
                            name="landlinePhone"
                            value={ticket.landlinePhone || ''}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Request Details */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h3 className="text-md font-medium text-blue-700 mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                        </svg>
                        Request Details
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="mb-3">
                          <label htmlFor="requestType" className="block text-sm font-medium text-blue-700 mb-1">
                            Request Type
                          </label>
                          <select
                            id="requestType"
                            name="requestType"
                            value={ticket.requestType || ''}
                            onChange={handleChange}
                            className="w-full p-2 border border-blue-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white"
                          >
                            <option value="New Address">New Address</option>
                            <option value="Verify Existing Address">Verify Existing Address</option>
                          </select>
                        </div>
                        
                        {ticket.requestType === 'Verify Existing Address' && (
                          <div className="mb-3">
                            <label htmlFor="existingAddress" className="block text-sm font-medium text-blue-700 mb-1">
                              Existing Address
                            </label>
                            <input
                              type="text"
                              id="existingAddress"
                              name="existingAddress"
                              value={ticket.existingAddress || ''}
                              onChange={handleChange}
                              className="w-full p-2 border border-blue-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white"
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3">
                        <label htmlFor="additionalInfo" className="block text-sm font-medium text-blue-700 mb-1">
                          Additional Information
                        </label>
                        <textarea
                          id="additionalInfo"
                          name="additionalInfo"
                          value={ticket.additionalInfo || ''}
                          onChange={handleChange}
                          className="w-full p-2 border border-blue-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white"
                          rows={3}
                        />
                      </div>
                    </div>
                    
                    {/* Property Information */}
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h3 className="text-md font-medium text-yellow-700 mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                        Property Information
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="mb-3">
                          <label htmlFor="premiseType" className="block text-sm font-medium text-yellow-700 mb-1">
                            Premise Type
                          </label>
                          <select
                            id="premiseType"
                            name="premiseType"
                            value={ticket.premiseType || ''}
                            onChange={handleChange}
                            className="w-full p-2 border border-yellow-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-gray-800 bg-white"
                          >
                            <option value="Residential">Residential</option>
                            <option value="Commercial">Commercial</option>
                            <option value="Industrial">Industrial</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        
                        <div className="mb-3">
                          <label htmlFor="propertyId" className="block text-sm font-medium text-yellow-700 mb-1">
                            Property ID
                          </label>
                          <input
                            type="text"
                            id="propertyId"
                            name="propertyId"
                            value={ticket.propertyId || ''}
                            onChange={handleChange}
                            className="w-full p-2 border border-yellow-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-gray-800 bg-white"
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label htmlFor="county" className="block text-sm font-medium text-yellow-700 mb-1">
                            County
                          </label>
                          <select
                            id="county"
                            name="county"
                            value={ticket.county || ''}
                            onChange={handleChange}
                            className="w-full p-2 border border-yellow-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-gray-800 bg-white"
                          >
                            <option value="County A">County A</option>
                            <option value="County B">County B</option>
                            <option value="County C">County C</option>
                          </select>
                        </div>
                        
                        <div className="mb-3">
                          <label htmlFor="streetName" className="block text-sm font-medium text-yellow-700 mb-1">
                            Street Name
                          </label>
                          <input
                            type="text"
                            id="streetName"
                            name="streetName"
                            value={ticket.streetName || ''}
                            onChange={handleChange}
                            className="w-full p-2 border border-yellow-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-gray-800 bg-white"
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label htmlFor="closestIntersection" className="block text-sm font-medium text-yellow-700 mb-1">
                            Closest Intersection
                          </label>
                          <input
                            type="text"
                            id="closestIntersection"
                            name="closestIntersection"
                            value={ticket.closestIntersection || ''}
                            onChange={handleChange}
                            className="w-full p-2 border border-yellow-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-gray-800 bg-white"
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label htmlFor="subdivision" className="block text-sm font-medium text-yellow-700 mb-1">
                            Subdivision
                          </label>
                          <input
                            type="text"
                            id="subdivision"
                            name="subdivision"
                            value={ticket.subdivision || ''}
                            onChange={handleChange}
                            className="w-full p-2 border border-yellow-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-gray-800 bg-white"
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label htmlFor="lotNumber" className="block text-sm font-medium text-yellow-700 mb-1">
                            Lot Number
                          </label>
                          <input
                            type="text"
                            id="lotNumber"
                            name="lotNumber"
                            value={ticket.lotNumber || ''}
                            onChange={handleChange}
                            className="w-full p-2 border border-yellow-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-gray-800 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Show full form for other stages */
                  <>
                    {renderFormField('First Name', 'firstName', ticket.firstName)}
                    {renderFormField('Last Name', 'lastName', ticket.lastName)}
                    {renderFormField('Email', 'email', ticket.email, 'email')}
                    {renderFormField('Mobile Phone', 'mobilePhone', ticket.mobilePhone || '')}
                    {renderFormField('Landline Phone', 'landlinePhone', ticket.landlinePhone || '')}
                    {renderFormField('Request Type', 'requestType', ticket.requestType)}
                    {renderFormField('Additional Information', 'additionalInfo', ticket.additionalInfo || '', 'textarea')}
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Addressing Information Tab */}
          {activeTab === 'addressing' && (
            <div>
              <h2 className="text-lg font-semibold mb-4 border-b pb-2 text-gray-800">Addressing Information</h2>
              
              {/* Show highlighted key information for Addressing and Verification stages */}
              {(ticket.workflowStage === 'Addressing' || ticket.workflowStage === 'Verification') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h3 className="text-md font-medium text-yellow-700 mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                      Key Property Details
                    </h3>
                    {ticket.propertyId && (
                      <p className="text-gray-800 mb-2"><span className="font-medium">Property ID:</span> 
                        <span className="bg-yellow-100 px-2 py-1 rounded ml-1">{ticket.propertyId}</span>
                      </p>
                    )}
                    <p className="text-gray-800 mb-2"><span className="font-medium">Premise Type:</span> {ticket.premiseType}</p>
                    <p className="text-gray-800 mb-2"><span className="font-medium">County:</span> {ticket.county}</p>
                    <p className="text-gray-800 mb-2"><span className="font-medium">Street Name:</span> {ticket.streetName}</p>
                    {ticket.closestIntersection && (
                      <p className="text-gray-800 mb-2"><span className="font-medium">Closest Intersection:</span> {ticket.closestIntersection}</p>
                    )}
                    {ticket.subdivision && (
                      <p className="text-gray-800 mb-2"><span className="font-medium">Subdivision:</span> {ticket.subdivision}</p>
                    )}
                    {ticket.lotNumber && (
                      <p className="text-gray-800 mb-2"><span className="font-medium">Lot Number:</span> {ticket.lotNumber}</p>
                    )}
                    {ticket.coordinates && ticket.coordinates.length === 2 && (
                      <p className="text-gray-800 mb-2"><span className="font-medium">Coordinates:</span> Lat: {ticket.coordinates[0].toFixed(6)}, Lng: {ticket.coordinates[1].toFixed(6)}</p>
                    )}
                  </div>
                  
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <h3 className="text-md font-medium text-indigo-700 mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Additional Information
                    </h3>
                    <div className="mb-3">
                      <p className="text-gray-800 mb-2"><span className="font-medium">Request Type:</span> {ticket.requestType}</p>
                      {ticket.requestType === 'Verify Existing Address' && ticket.existingAddress && (
                        <div className="mb-2">
                          <p className="text-gray-800 font-medium mb-1">Existing Address:</p>
                          <p className="text-gray-600 bg-white p-2 rounded border border-indigo-100">{ticket.existingAddress}</p>
                        </div>
                      )}
                    </div>
                    {ticket.additionalInfo && (
                      <div>
                        <p className="text-gray-800 font-medium mb-1">Additional Notes:</p>
                        <p className="text-gray-600 bg-white p-2 rounded border border-indigo-100">{ticket.additionalInfo}</p>
                      </div>
                    )}
                    <div className="mt-3 text-sm text-indigo-600">
                      <p className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Contact: {ticket.firstName} {ticket.lastName} ({ticket.email})
                      </p>
                      {ticket.mobilePhone && (
                        <p className="flex items-center mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                          Phone: {ticket.mobilePhone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                {/* Additional GIS Information - Only show fields not already displayed in the key property details */}
                <div className="p-4 bg-gray-100 rounded-lg border border-gray-300 mb-4">
                  <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                    </svg>
                    GIS Processing Status
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="mb-2">
                      <p className="text-sm text-gray-500 mb-1">Current Workflow Stage</p>
                      <div className="flex items-center">
                        <span className={`inline-block px-3 py-1 text-sm rounded-full ${getWorkflowStageColor(ticket.workflowStage)}`}>
                          {ticket.workflowStage}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <p className="text-sm text-gray-500 mb-1">Assigned To</p>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{ticket.assignedTo?.name || 'Unassigned'}</span>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <p className="text-sm text-gray-500 mb-1">Address Created</p>
                      <div className="flex items-center">
                        {ticket.addressCreated ? (
                          <span className="text-green-600 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Yes
                          </span>
                        ) : (
                          <span className="text-gray-600 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            No
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <p className="text-sm text-gray-500 mb-1">Address Verified</p>
                      <div className="flex items-center">
                        {ticket.addressVerified ? (
                          <span className="text-green-600 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Yes
                          </span>
                        ) : (
                          <span className="text-gray-600 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            No
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Show verification feedback if the ticket was returned from verification */}
                {ticket.workflowStage === 'Addressing' && ticket.verificationNote && ticket.verificationNote !== 'Address verified and approved' && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-md">
                    <h3 className="text-md font-semibold text-yellow-800 mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Verification Feedback
                    </h3>
                    <div className="p-3 bg-white border border-yellow-200 rounded-md text-gray-800">
                      {ticket.verificationNote}
                    </div>
                    <p className="text-xs text-yellow-700 mt-2 italic">
                      This ticket was returned from verification. Please address the issues above before sending it back.
                    </p>
                  </div>
                )}
                
                {/* Show approved address field when in Addressing stage - THIS IS EDITABLE */}
                {ticket.workflowStage === 'Addressing' && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <h3 className="text-md font-semibold text-blue-800 mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Approved Address
                    </h3>
                    <p className="text-sm text-blue-700 mb-3">Enter the final approved address before sending to verification:</p>
                    <textarea
                      id="approvedAddress"
                      name="approvedAddress"
                      value={ticket.approvedAddress || ''}
                      onChange={handleChange}
                      className="w-full p-3 border border-blue-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white"
                      rows={4}
                      placeholder="Enter the complete and final address here..."
                    />
                    <p className="text-xs text-blue-600 mt-2 italic">
                      This is the only editable field in this tab. Make sure the address is complete and accurate.
                    </p>
                    
                    {/* Send to Verification button right below the address field */}
                    {session && session.user?.department === 'GIS' && (
                      <div className="mt-4">
                        <button
                          onClick={async () => {
                            if (!ticket.approvedAddress) {
                              showToast('Please enter the approved address before sending to verification', 'error');
                              return;
                            }
                            
                            setIsSubmitting(true);
                            try {
                              showToast('Sending ticket for verification...', 'info');
                              
                              // Save the ticket first to ensure the address is saved
                              await saveTicket(false);
                              
                              // Use the transition API route
                              const response = await fetch(`/api/tickets/${ticket._id}/transition`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  targetStage: 'Verification',
                                  note: `Address ${ticket.addressCreated ? 'updated' : 'created'}: ${ticket.approvedAddress}. Sent for verification.`,
                                  performedById: session?.user?.id || undefined,
                                  // Always ensure addressCreated is set to true when sending to verification
                                  addressCreated: true,
                                  approvedAddress: ticket.approvedAddress
                                }),
                              });
                    
                              if (!response.ok) {
                                const data = await response.json();
                                throw new Error(data.error || 'Failed to send ticket for verification');
                              }
                    
                              // Get the updated ticket data from the response
                              const updatedTicket = await response.json();
                              
                              // Update the local state with the new ticket data
                              setTicket(updatedTicket);
                              
                              // Show success message
                              showToast('Ticket sent for verification successfully', 'success');
                              
                              // Update the URL to reflect the new workflow stage without a full refresh
                              const url = new URL(window.location.href);
                              router.push(url.pathname + url.search, { scroll: false });
                            } catch (error) {
                              console.error('Error sending ticket for verification:', error);
                              showToast(`Error: ${error instanceof Error ? error.message : 'Failed to send ticket for verification'}`, 'error');
                            } finally {
                              setIsSubmitting(false);
                            }
                          }}
                          disabled={isSubmitting || !ticket.approvedAddress}
                          className="w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {isSubmitting ? 'Sending...' : 'Send to Verification'}
                        </button>
                        <p className="text-xs text-center text-green-700 mt-2">
                          Click to send this ticket to the Verification stage after entering the approved address.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Show the approved address as read-only when in Verification or Completed stage */}
                {(ticket.workflowStage === 'Verification' || ticket.workflowStage === 'Completed' || ticket.workflowStage === 'Ready to Contact Customer') && ticket.approvedAddress && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                    <h3 className="text-md font-semibold text-green-800 mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Approved Address
                    </h3>
                    <div className="p-3 bg-white border border-green-300 rounded-md text-gray-800">
                      {ticket.approvedAddress}
                    </div>
                    
                    {/* Return to GIS buttons for Front Desk users */}
                    {(ticket.workflowStage === 'Completed' || ticket.workflowStage === 'Ready to Contact Customer') && session && session.user?.department === 'Front Desk' && (
                      <div className="mt-4 space-y-4">
                        <h4 className="text-sm font-medium text-gray-700">Return ticket to GIS Department:</h4>
                        
                        {/* Return to Addressing button */}
                        <div>
                          <button
                            onClick={async () => {
                              setIsSubmitting(true);
                              try {
                                showToast('Returning ticket to Addressing...', 'info');
                                
                                // Use the transition API route
                                const response = await fetch(`/api/tickets/${ticket._id}/transition`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    targetStage: 'Addressing',
                                    note: 'Ticket reopened and returned to Addressing by Front Desk',
                                    performedById: session?.user?.id || undefined,
                                    // Reset the addressCreated flag so the ticket can be sent to verification again
                                    addressCreated: false
                                  }),
                                });
                      
                                if (!response.ok) {
                                  const data = await response.json();
                                  throw new Error(data.error || 'Failed to return ticket to Addressing');
                                }
                      
                                showToast('Ticket returned to Addressing successfully', 'success');
                                router.refresh();
                              } catch (error) {
                                console.error('Error returning ticket to Addressing:', error);
                                showToast(`Error: ${error instanceof Error ? error.message : 'Failed to return ticket to Addressing'}`, 'error');
                              } finally {
                                setIsSubmitting(false);
                              }
                            }}
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Return to Addressing
                          </button>
                          <p className="text-xs text-center text-indigo-700 mt-2">
                            Return this ticket to the Addressing stage for address creation or corrections.
                          </p>
                        </div>
                        
                        {/* Return to Verification button */}
                        <div>
                          <button
                            onClick={async () => {
                              setIsSubmitting(true);
                              try {
                                showToast('Returning ticket to Verification...', 'info');
                                
                                // Use the transition API route
                                const response = await fetch(`/api/tickets/${ticket._id}/transition`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    targetStage: 'Verification',
                                    note: 'Ticket reopened and returned to Verification by Front Desk',
                                    performedById: session?.user?.id || undefined
                                  }),
                                });
                      
                                if (!response.ok) {
                                  const data = await response.json();
                                  throw new Error(data.error || 'Failed to return ticket to Verification');
                                }
                      
                                showToast('Ticket returned to Verification successfully', 'success');
                                router.refresh();
                              } catch (error) {
                                console.error('Error returning ticket to Verification:', error);
                                showToast(`Error: ${error instanceof Error ? error.message : 'Failed to return ticket to Verification'}`, 'error');
                              } finally {
                                setIsSubmitting(false);
                              }
                            }}
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-md transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Return to Verification
                          </button>
                          <p className="text-xs text-center text-orange-700 mt-2">
                            Return this ticket to the Verification stage for address verification.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Buttons for tickets in Verification stage - for GIS users */}
                    {ticket.workflowStage === 'Verification' && session && session.user?.department === 'GIS' && (
                      <div className="mt-4 space-y-4">
                        {/* Verification Options */}
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Verification Decision:</h4>
                          
                          {/* Verification Buttons */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            {/* Verified Button */}
                            <button
                              onClick={async () => {
                                setIsSubmitting(true);
                                try {
                                  showToast('Completing verification...', 'info');
                                  
                                  // Use the transition API route
                                  const response = await fetch(`/api/tickets/${ticket._id}/transition`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                      targetStage: 'Ready to Contact Customer',
                                      note: 'Address verified and approved',
                                      performedById: session?.user?.id || undefined,
                                      addressVerified: true,
                                      verificationNote: 'Address verified and approved'
                                    }),
                                  });
                        
                                  if (!response.ok) {
                                    const data = await response.json();
                                    throw new Error(data.error || 'Failed to complete verification');
                                  }
                        
                                  // Get the updated ticket data from the response
                                  const updatedTicket = await response.json();
                                  
                                  // Update the local state with the new ticket data
                                  setTicket(updatedTicket);
                                  
                                  // Show success message
                                  showToast('Verification completed successfully', 'success');
                                  
                                  // Update the URL to reflect the new workflow stage without a full refresh
                                  const url = new URL(window.location.href);
                                  router.push(url.pathname + url.search, { scroll: false });
                                } catch (error) {
                                  console.error('Error completing verification:', error);
                                  showToast(`Error: ${error instanceof Error ? error.message : 'Failed to complete verification'}`, 'error');
                                } finally {
                                  setIsSubmitting(false);
                                }
                              }}
                              disabled={isSubmitting}
                              className="flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Verified
                            </button>
                            
                            {/* Not Verified Button */}
                            <button
                              onClick={() => {
                                // Set a state to show the rejection form
                                setShowRejectionForm(true);
                              }}
                              disabled={isSubmitting || showRejectionForm}
                              className="flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              Not Verified
                            </button>
                          </div>
                          
                          {/* Rejection Form - Only shown when Not Verified is clicked */}
                          {showRejectionForm && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                              <h4 className="text-sm font-medium text-red-800 mb-2">Please specify the issues with this address:</h4>
                              <textarea
                                id="verificationNote"
                                name="verificationNote"
                                value={ticket.verificationNote || ''}
                                onChange={handleChange}
                                className="w-full p-3 border border-red-300 rounded-md focus:ring-red-500 focus:border-red-500 text-gray-800 bg-white"
                                rows={3}
                                placeholder="Explain why this address needs corrections..."
                                autoFocus
                              />
                              
                              <div className="mt-4 flex space-x-3">
                                <button
                                  onClick={async () => {
                                    if (!ticket.verificationNote) {
                                      showToast('Please explain the issues before returning the ticket', 'error');
                                      return;
                                    }
                                    
                                    // Store the verification note in a local variable to ensure it doesn't get lost
                                    const noteText = ticket.verificationNote;
                                    console.log('Verification note captured:', noteText);
                                    
                                    setIsSubmitting(true);
                                    try {
                                      showToast('Returning ticket for corrections...', 'info');
                                      
                                      // Skip the saveTicket call and go directly to the transition API
                                      // This avoids any potential state issues with the verification note
                                      
                                      // Use the transition API route with the captured note
                                      const response = await fetch(`/api/tickets/${ticket._id}/transition`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                          targetStage: 'Addressing',
                                          note: `Verification rejected: ${noteText}`,
                                          performedById: session?.user?.id || undefined,
                                          // Reset the addressCreated flag so the ticket can be sent to verification again
                                          addressCreated: false,
                                          // Explicitly pass the verification note to the API using the local variable
                                          verificationNote: noteText
                                        }),
                                      });
                            
                                      if (!response.ok) {
                                        const data = await response.json();
                                        throw new Error(data.error || 'Failed to return ticket to addressing');
                                      }
                            
                                      // Get the updated ticket data from the response
                                      const updatedTicket = await response.json();
                                      
                                      // Update the local state with the new ticket data
                                      setTicket(updatedTicket);
                                      
                                      // Reset the rejection form
                                      setShowRejectionForm(false);
                                      
                                      // Show success message
                                      showToast('Ticket returned for corrections successfully', 'success');
                                      
                                      // Update the URL to reflect the new workflow stage without a full refresh
                                      const url = new URL(window.location.href);
                                      router.push(url.pathname + url.search, { scroll: false });
                                    } catch (error) {
                                      console.error('Error returning ticket to addressing:', error);
                                      showToast(`Error: ${error instanceof Error ? error.message : 'Failed to return ticket for corrections'}`, 'error');
                                    } finally {
                                      setIsSubmitting(false);
                                    }
                                  }}
                                  disabled={isSubmitting || !ticket.verificationNote}
                                  className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  Return for Corrections
                                </button>
                                
                                <button
                                  onClick={() => {
                                    // Reset the form
                                    setShowRejectionForm(false);
                                    // Clear any entered text
                                    const updatedTicket = { ...ticket, verificationNote: '' };
                                    setTicket(updatedTicket);
                                  }}
                                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md transition-colors duration-200"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
      
      {/* Related Tickets by Property ID */}
      {ticket.propertyId && (
        <RelatedTickets ticketId={ticket._id} propertyId={ticket.propertyId} />
      )}
    </div>
  );
};

export default TicketView;
