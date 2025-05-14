"use client";

import { useState, useEffect } from 'react';
import { Ticket, User } from '@/types';
import { useRouter } from 'next/navigation';
import { useToast } from './ToastProvider';

type BasicTicketModalProps = {
  ticket: Ticket;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (ticket: Ticket) => void;
  users?: User[];
};

const BasicTicketModal = ({ ticket, isOpen, onClose, onSave, users = [] }: BasicTicketModalProps) => {
  const router = useRouter();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(true); // Start in editing mode by default
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Ticket>>({});
  
  // Set the active tab based on the workflow stage when the ticket changes
  useEffect(() => {
    if (ticket) {
      // Initialize form data with ticket data
      setFormData({...ticket});
      
      // Set the active tab based on workflow stage
      if (ticket.workflowStage === 'Addressing') {
        setActiveTab('addressing');
      } else if (ticket.workflowStage === 'Verification') {
        setActiveTab('verification');
      } else {
        setActiveTab('personal');
      }
    }
  }, [ticket]);
  
  if (!isOpen || !ticket) return null;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Ensure createdBy is included in the submission data
      const submissionData = {
        ...formData,
        // Make sure to include the complete createdBy object with all its properties
        createdBy: ticket.createdBy ? {
          _id: ticket.createdBy._id,
          name: ticket.createdBy.name,
          email: ticket.createdBy.email
        } : '507f1f77bcf86cd799439011' // Fallback to a valid ObjectId as string if no createdBy exists
      };
      
      console.log('Submitting ticket update with data:', submissionData);
      
      const response = await fetch(`/api/tickets/${ticket._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update ticket');
      }
      
      const updatedTicket = await response.json();
      
      // Call the onSave callback if provided
      if (onSave) {
        onSave(updatedTicket);
      }
      
      setIsEditing(false);
      showToast('Ticket updated successfully', 'success');
      router.refresh();
    } catch (error: any) {
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Background overlay with blur effect */}
      <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm" onClick={isEditing ? undefined : onClose}></div>
      
      {/* Modal content */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 z-10 overflow-hidden">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
            <h3 className="text-xl font-medium">
              Ticket: {ticket.firstName} {ticket.lastName}
            </h3>
            <div className="flex space-x-2">
              {/* Transfer Button - Context-aware based on workflow stage */}
              {ticket.workflowStage === 'Front Desk' && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      workflowStage: 'Addressing',
                      status: 'In Progress'
                    }));
                    // Auto-save after transfer
                    setTimeout(() => {
                      document.getElementById('save-ticket-button')?.click();
                    }, 100);
                  }}
                  className="px-3 py-1 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 flex items-center"
                >
                  <span className="mr-1">🗺️</span> Transfer to Addressing
                </button>
              )}
              
              {ticket.workflowStage === 'Addressing' && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      workflowStage: 'Verification',
                      addressCreated: true
                    }));
                    // Auto-save after transfer
                    setTimeout(() => {
                      document.getElementById('save-ticket-button')?.click();
                    }, 100);
                  }}
                  className="px-3 py-1 bg-orange-600 text-white rounded text-sm font-medium hover:bg-orange-700 flex items-center"
                >
                  <span className="mr-1">✅</span> Send to Verification
                </button>
              )}
              
              {ticket.workflowStage === 'Verification' && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      workflowStage: 'Completed',
                      addressVerified: true,
                      status: 'Resolved'
                    }));
                    // Auto-save after transfer
                    setTimeout(() => {
                      document.getElementById('save-ticket-button')?.click();
                    }, 100);
                  }}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 flex items-center"
                >
                  <span className="mr-1">🏁</span> Complete Verification
                </button>
              )}
              
              <button 
                type="button"
                onClick={onClose}
                className="text-white hover:text-gray-200 focus:outline-none"
              >
                ✕
              </button>
            </div>
          </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button 
              type="button" // Add type=button to prevent form submission
              onClick={() => setActiveTab('personal')}
              className={`px-6 py-3 ${activeTab === 'personal' ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Personal Info
            </button>
            <button 
              type="button" // Add type=button to prevent form submission
              onClick={() => setActiveTab('addressing')}
              className={`px-6 py-3 ${activeTab === 'addressing' ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Addressing
            </button>
            <button 
              type="button" // Add type=button to prevent form submission
              onClick={() => setActiveTab('verification')}
              className={`px-6 py-3 ${activeTab === 'verification' ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Verification
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Personal Info Tab Content */}
          {activeTab === 'personal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-800 mb-2">First Name</h4>
                {isEditing ? (
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded text-gray-900 font-medium"
                    required
                  />
                ) : (
                  <p className="text-gray-700">{ticket.firstName}</p>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-800 mb-2">Last Name</h4>
                {isEditing ? (
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded text-gray-900 font-medium"
                    required
                  />
                ) : (
                  <p className="text-gray-700">{ticket.lastName}</p>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-800 mb-2">Email</h4>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded text-gray-900 font-medium"
                    required
                  />
                ) : (
                  <p className="text-gray-700">{ticket.email}</p>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-800 mb-2">Mobile Phone</h4>
                {isEditing ? (
                  <input
                    type="tel"
                    name="mobilePhone"
                    value={formData.mobilePhone || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded text-gray-900 font-medium"
                  />
                ) : (
                  <p className="text-gray-700">{ticket.mobilePhone || 'N/A'}</p>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-800 mb-2">Landline Phone</h4>
                {isEditing ? (
                  <input
                    type="tel"
                    name="landlinePhone"
                    value={formData.landlinePhone || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded text-gray-900 font-medium"
                  />
                ) : (
                  <p className="text-gray-700">{ticket.landlinePhone || 'N/A'}</p>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-800 mb-2">Request Type</h4>
                {isEditing ? (
                  <select
                    name="requestType"
                    value={formData.requestType || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded text-gray-900 font-medium"
                    required
                  >
                    <option value="New Address">New Address</option>
                    <option value="Verify Existing Address">Verify Existing Address</option>
                  </select>
                ) : (
                  <p className="text-gray-700">{ticket.requestType}</p>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded md:col-span-2">
                <h4 className="font-medium text-gray-800 mb-2">Additional Information</h4>
                {isEditing ? (
                  <textarea
                    name="additionalInfo"
                    value={formData.additionalInfo || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded text-gray-900 font-medium"
                    rows={3}
                  />
                ) : (
                  <p className="text-gray-700">{ticket.additionalInfo || 'None provided'}</p>
                )}
              </div>
            </div>
          )}
          
          {/* Addressing Tab Content */}
          {activeTab === 'addressing' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-800 mb-2">County</h4>
                {isEditing ? (
                  <select
                    name="county"
                    value={formData.county || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded text-gray-900 font-medium"
                    required
                  >
                    <option value="Hidalgo">Hidalgo</option>
                    <option value="Cameron">Cameron</option>
                    <option value="Willacy">Willacy</option>
                    <option value="Starr">Starr</option>
                  </select>
                ) : (
                  <p className="text-gray-700">{ticket.county}</p>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-800 mb-2">Street Name</h4>
                {isEditing ? (
                  <input
                    type="text"
                    name="streetName"
                    value={formData.streetName || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded text-gray-900 font-medium"
                    required
                  />
                ) : (
                  <p className="text-gray-700">{ticket.streetName}</p>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-800 mb-2">Premise Type</h4>
                {isEditing ? (
                  <select
                    name="premiseType"
                    value={formData.premiseType || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded text-gray-900 font-medium"
                    required
                  >
                    <option value="Residence">Residence</option>
                    <option value="Business">Business</option>
                    <option value="Government">Government</option>
                    <option value="School">School</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <p className="text-gray-700">{ticket.premiseType}</p>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-800 mb-2">Property ID</h4>
                {isEditing ? (
                  <input
                    type="text"
                    name="propertyId"
                    value={formData.propertyId || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded text-gray-900 font-medium"
                  />
                ) : (
                  <p className="text-gray-700">{ticket.propertyId || 'Not provided'}</p>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-800 mb-2">Closest Intersection</h4>
                {isEditing ? (
                  <input
                    type="text"
                    name="closestIntersection"
                    value={formData.closestIntersection || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded text-gray-900 font-medium"
                  />
                ) : (
                  <p className="text-gray-700">{ticket.closestIntersection || 'Not provided'}</p>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-800 mb-2">Subdivision</h4>
                {isEditing ? (
                  <input
                    type="text"
                    name="subdivision"
                    value={formData.subdivision || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded text-gray-900 font-medium"
                  />
                ) : (
                  <p className="text-gray-700">{ticket.subdivision || 'Not provided'}</p>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-800 mb-2">Lot Number</h4>
                {isEditing ? (
                  <input
                    type="text"
                    name="lotNumber"
                    value={formData.lotNumber || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded text-gray-900 font-medium"
                  />
                ) : (
                  <p className="text-gray-700">{ticket.lotNumber || 'Not provided'}</p>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded md:col-span-2">
                <h4 className="font-medium text-gray-800 mb-2">Coordinates</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    {isEditing ? (
                      <div className="mb-1">
                        <label className="text-xs text-gray-500">X Coordinate (Longitude)</label>
                        <input
                          type="number"
                          name="xCoordinate"
                          value={formData.xCoordinate || ''}
                          onChange={handleChange}
                          className="w-full p-2 border border-gray-300 rounded text-gray-900 font-medium"
                          step="any"
                        />
                      </div>
                    ) : (
                      <p className="text-gray-700">X: {ticket.xCoordinate || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    {isEditing ? (
                      <div className="mb-1">
                        <label className="text-xs text-gray-500">Y Coordinate (Latitude)</label>
                        <input
                          type="number"
                          name="yCoordinate"
                          value={formData.yCoordinate || ''}
                          onChange={handleChange}
                          className="w-full p-2 border border-gray-300 rounded text-gray-900 font-medium"
                          step="any"
                        />
                      </div>
                    ) : (
                      <p className="text-gray-700">Y: {ticket.yCoordinate || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Verification Tab Content */}
          {activeTab === 'verification' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-800 mb-2">Workflow Stage</h4>
                {isEditing ? (
                  <select
                    name="workflowStage"
                    value={formData.workflowStage || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded text-gray-900 font-medium"
                    required
                  >
                    <option value="Front Desk">Front Desk</option>
                    <option value="GIS Department">GIS Department</option>
                    <option value="Address Verification">Address Verification</option>
                    <option value="Completed">Completed</option>
                  </select>
                ) : (
                  <p className="text-gray-700">{ticket.workflowStage}</p>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-800 mb-2">Status</h4>
                {isEditing ? (
                  <select
                    name="status"
                    value={formData.status || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded text-gray-900 font-medium"
                    required
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                ) : (
                  <p className="text-gray-700">{ticket.status}</p>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-800 mb-2">Address Created</h4>
                {isEditing ? (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="addressCreated"
                      checked={!!formData.addressCreated}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <span className="ml-2 text-gray-700">{formData.addressCreated ? 'Yes' : 'No'}</span>
                  </div>
                ) : (
                  <p className="text-gray-700">{ticket.addressCreated ? 'Yes' : 'No'}</p>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-800 mb-2">Address Verified</h4>
                {isEditing ? (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="addressVerified"
                      checked={!!formData.addressVerified}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <span className="ml-2 text-gray-700">{formData.addressVerified ? 'Yes' : 'No'}</span>
                  </div>
                ) : (
                  <p className="text-gray-700">{ticket.addressVerified ? 'Yes' : 'No'}</p>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-800 mb-2">Assigned To</h4>
                {isEditing && users.length > 0 ? (
                  <select
                    name="assignedTo"
                    value={formData.assignedTo?._id || ''}
                    onChange={(e) => {
                      const selectedUserId = e.target.value;
                      const selectedUser = users.find(user => user._id === selectedUserId);
                      setFormData(prev => ({
                        ...prev,
                        assignedTo: selectedUserId ? selectedUser : null
                      }));
                    }}
                    className="w-full p-2 border border-gray-300 rounded text-gray-900 font-medium"
                  >
                    <option value="">Unassigned</option>
                    {users.map(user => (
                      <option key={user._id} value={user._id}>{user.name}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-700">{ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'}</p>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-800 mb-2">Created By</h4>
                <p className="text-gray-700">{ticket.createdBy ? ticket.createdBy.name : 'Unknown'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded md:col-span-2">
                <h4 className="font-medium text-gray-800 mb-2">Verification Notes</h4>
                {isEditing ? (
                  <textarea
                    name="verificationNotes"
                    value={formData.verificationNotes || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded text-gray-900 font-medium"
                    rows={3}
                  />
                ) : (
                  <p className="text-gray-700">{ticket.verificationNotes || 'No verification notes'}</p>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Workflow Management Section */}
        {activeTab === 'verification' && (
          <div className="border-t border-gray-200 pt-4 px-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Workflow Management</h3>
            <div className="bg-blue-50 p-4 rounded-md mb-4">
              <h4 className="font-medium text-blue-800 mb-2">Transfer Ticket to Next Stage</h4>
              <p className="text-sm text-blue-700 mb-3">
                Current stage: <span className="font-medium">{formData.workflowStage || ticket.workflowStage}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {ticket.workflowStage === 'Front Desk' && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        workflowStage: 'GIS Department',
                        status: 'In Progress'
                      }));
                    }}
                    className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 flex items-center"
                  >
                    <span className="mr-1">🗺️</span> Transfer to GIS Department
                  </button>
                )}
                
                {ticket.workflowStage === 'GIS Department' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          workflowStage: 'Address Verification',
                          addressCreated: true
                        }));
                      }}
                      className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 flex items-center"
                    >
                      <span className="mr-1">✅</span> Send to Verification
                    </button>
                  </>
                )}
                
                {ticket.workflowStage === 'Address Verification' && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        workflowStage: 'Completed',
                        addressVerified: true,
                        status: 'Resolved'
                      }));
                    }}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center"
                  >
                    <span className="mr-1">🏁</span> Complete Verification
                  </button>
                )}
                
                {ticket.workflowStage === 'Completed' && (
                  <div className="text-green-700 font-medium flex items-center">
                    <span className="mr-1">🎉</span> This ticket has completed the workflow process
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({...ticket}); // Reset form data
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                id="save-ticket-button"
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Close
            </button>
          )}
        </div>
        </form>
      </div>
    </div>
  );
};

export default BasicTicketModal;