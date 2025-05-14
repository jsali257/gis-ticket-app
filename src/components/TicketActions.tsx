"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from './ToastProvider';
import { FaMapMarkerAlt, FaCheckCircle, FaFlag, FaArrowCircleLeft } from 'react-icons/fa';

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
  approvedAddress?: string;
  verificationNote?: string;
  assignedTo?: User | null;
  createdBy: User;
};

type TicketActionsProps = {
  ticket: Ticket;
  userRole?: string;
  userDepartment?: string;
  userId?: string;
  users: User[];
  session?: any;
};

const TicketActions = ({ ticket, userRole, userDepartment, userId, users, session }: TicketActionsProps) => {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>(ticket.assignedTo?._id || '');
  const [reopenStage, setReopenStage] = useState<'Addressing' | 'Verification'>('Addressing');
  const [showReopenModal, setShowReopenModal] = useState(false);
  
  const isAdmin = userRole === 'admin';
  const isGisDepartment = userDepartment === 'GIS';
  const isFrontDesk = userDepartment === 'Front Desk';
  const isAssignedToUser = ticket.assignedTo && ticket.assignedTo._id === userId;
  
  const canTransferToGis = isFrontDesk && ticket.workflowStage === 'Front Desk';
  const canSendToVerification = isGisDepartment && ticket.workflowStage === 'Addressing';
  const canCompleteVerification = isGisDepartment && ticket.workflowStage === 'Verification';
  const canRejectVerification = isGisDepartment && ticket.workflowStage === 'Verification';
  const canReopenTicket = isFrontDesk && (ticket.workflowStage === 'Completed' || ticket.status === 'Resolved' || ticket.status === 'Closed');
  
  const handleTransferToGis = async () => {
    await updateTicket({
      workflowStage: 'Addressing',
      status: 'In Progress',
      assignedTo: selectedAssignee || undefined
    });
  };
  
  const handleSendToVerification = async () => {
    setIsSubmitting(true);
    try {
      // Check if approvedAddress is filled in
      if (!ticket.approvedAddress) {
        setError('Please enter the approved address before sending to verification');
        setIsSubmitting(false);
        showToast('Approved address is required', 'error');
        return;
      }
      
      showToast('Sending ticket for verification...', 'info');
      
      // Use the new transition API route instead of the standard update
      const response = await fetch(`/api/tickets/${ticket._id}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetStage: 'Verification',
          note: `Address created: ${ticket.approvedAddress}. Sent for verification.`,
          performedById: session?.user?.id || undefined,
          // Remove assignedTo to allow automatic assignment to a GIS verifier
          addressCreated: true,
          approvedAddress: ticket.approvedAddress
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send ticket for verification');
      }

      showToast('Ticket sent for verification successfully', 'success');
      // Refresh the page to show the updated ticket
      router.refresh();
    } catch (error) {
      console.error('Error sending ticket for verification:', error);
      setError(error instanceof Error ? error.message : 'Failed to send ticket for verification');
      showToast(`Error: ${error instanceof Error ? error.message : 'Failed to send ticket for verification'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCompleteVerification = async () => {
    setIsSubmitting(true);
    try {
      showToast('Completing verification...', 'info');
      
      // Use the new transition API route instead of the standard update
      const response = await fetch(`/api/tickets/${ticket._id}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetStage: 'Ready to Contact Customer',
          note: 'Address verified, ready to contact customer',
          performedById: session?.user?.id || undefined
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete verification');
      }

      showToast('Verification completed successfully', 'success');
      // Refresh the page to show the updated ticket
      router.refresh();
    } catch (error) {
      console.error('Error completing verification:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete verification');
      showToast(`Error: ${error instanceof Error ? error.message : 'Failed to complete verification'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRejectVerification = async () => {
    setIsSubmitting(true);
    try {
      showToast('Returning ticket for corrections...', 'info');
      
      // Use the new transition API route instead of the standard update
      const response = await fetch(`/api/tickets/${ticket._id}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetStage: 'Addressing',
          note: 'Verification rejected, returned to addressing',
          performedById: session?.user?.id || undefined
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reject verification');
      }

      showToast('Ticket returned for corrections successfully', 'success');
      // Refresh the page to show the updated ticket
      router.refresh();
    } catch (error) {
      console.error('Error rejecting verification:', error);
      setError(error instanceof Error ? error.message : 'Failed to reject verification');
      showToast(`Error: ${error instanceof Error ? error.message : 'Failed to return ticket for corrections'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleReopenTicket = async () => {
    setIsSubmitting(true);
    try {
      showToast(`Reopening ticket and sending to ${reopenStage}...`, 'info');
      
      // Use the new transition API route instead of the standard update
      const response = await fetch(`/api/tickets/${ticket._id}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetStage: reopenStage,
          note: `Ticket reopened and sent back to ${reopenStage}`,
          performedById: session?.user?.id || undefined
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reopen ticket');
      }

      showToast(`Ticket reopened and sent to ${reopenStage} successfully`, 'success');
      // Close the modal and refresh the page
      setShowReopenModal(false);
      router.refresh();
    } catch (error) {
      console.error('Error reopening ticket:', error);
      setError(error instanceof Error ? error.message : 'Failed to reopen ticket');
      showToast(`Error: ${error instanceof Error ? error.message : 'Failed to reopen ticket'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAssign = async () => {
    if (!selectedAssignee) {
      showToast('Please select a user to assign', 'error');
      return;
    }
    
    await updateTicket({
      assignedTo: selectedAssignee
    });
  };
  
  const updateTicket = async (updates: any) => {
    setIsSubmitting(true);
    
    try {
      // Prepare the ticket data with only the fields we want to update
      const ticketData = {
        ...ticket,
        ...updates,
        // Ensure we're sending the ID for createdBy, not the whole object
        createdBy: '000000000000000000000000', // Use a valid ObjectId placeholder
        // Handle assignedTo properly
        assignedTo: updates.assignedTo || null
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
      
      showToast('Ticket updated successfully', 'success');
      router.refresh();
    } catch (error: any) {
      console.error('Update error:', error);
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <div className="mt-4 bg-gray-800 rounded-lg shadow-sm border border-gray-700">
        <div className="border-b border-gray-700 px-4 py-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            Assign Ticket
          </h2>
          {isSubmitting && (
            <span className="text-blue-400 text-xs flex items-center">
              <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          )}
        </div>
        
        {/* Toolbar */}
        <div className="p-4">
          {/* Assignment Section */}
          {users.length > 0 && (
            <div className="p-3">
              <div className="flex flex-row items-center space-x-2">
                <div className="flex-grow">
                  <select
                    id="assignee"
                    value={selectedAssignee}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                    className="w-full p-1.5 text-sm border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-gray-100"
                  >
                    <option value="">Select a user...</option>
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAssign}
                  disabled={isSubmitting || !selectedAssignee}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-800 disabled:text-gray-300 transition-colors"
                >
                  {isSubmitting ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reopen Ticket Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="flex items-center justify-center min-h-screen p-4">
            {/* Modal panel */}
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto relative" onClick={(e) => e.stopPropagation()}>
              {/* Close button */}
              <button 
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-500"
                onClick={() => setShowReopenModal(false)}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Header */}
              <div className="px-6 py-4 border-b">
                <div className="flex items-center">
                  <div className="bg-yellow-100 rounded-full p-2 mr-3">
                    <FaArrowCircleLeft className="text-yellow-600 text-xl" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Reopen Ticket
                  </h3>
                </div>
              </div>
              
              {/* Body */}
              <div className="px-6 py-4">
                <p className="text-sm text-gray-500 mb-4">
                  Please select which stage you want to reopen this ticket to:
                </p>
                
                <div className="space-y-3">
                  <label 
                    className={`flex items-center p-3 border rounded-md cursor-pointer ${reopenStage === 'Addressing' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                    onClick={() => setReopenStage('Addressing')}
                  >
                    <input
                      type="radio"
                      name="reopenStageModal"
                      value="Addressing"
                      checked={reopenStage === 'Addressing'}
                      onChange={() => setReopenStage('Addressing')}
                      className="h-4 w-4 text-blue-600"
                    />
                    <div className="ml-3">
                      <span className="block text-sm font-medium text-gray-700">Addressing</span>
                      <span className="block text-xs text-gray-500">Send to GIS department for address creation</span>
                    </div>
                  </label>
                  
                  <label 
                    className={`flex items-center p-3 border rounded-md cursor-pointer ${reopenStage === 'Verification' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                    onClick={() => setReopenStage('Verification')}
                  >
                    <input
                      type="radio"
                      name="reopenStageModal"
                      value="Verification"
                      checked={reopenStage === 'Verification'}
                      onChange={() => setReopenStage('Verification')}
                      className="h-4 w-4 text-blue-600"
                    />
                    <div className="ml-3">
                      <span className="block text-sm font-medium text-gray-700">Verification</span>
                      <span className="block text-xs text-gray-500">Send directly to verification step</span>
                    </div>
                  </label>
                </div>
              </div>
              
              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleReopenTicket();
                    setShowReopenModal(false);
                  }}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:bg-yellow-400"
                >
                  {isSubmitting ? 'Processing...' : `Reopen & Send to ${reopenStage}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TicketActions;
