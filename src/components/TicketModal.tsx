"use client";

import { useState } from 'react';
import { Ticket, User } from '@/types';
import { format } from 'date-fns';
import { FaUser, FaMapMarkedAlt, FaCheckCircle, FaTimes, FaEdit } from 'react-icons/fa';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import the MapSelector component to avoid SSR issues
const MapSelector = dynamic(() => import('./MapSelector'), { ssr: false });

type TicketModalProps = {
  ticket: Ticket;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (ticket: Ticket) => void;
  users?: User[];
};

const TicketModal = ({ ticket, isOpen, onClose, onSave, users = [] }: TicketModalProps) => {
  console.log('TicketModal props:', { ticket, isOpen, onClose: !!onClose, onSave: !!onSave, usersCount: users.length });
  
  const [activeTab, setActiveTab] = useState('personal');
  
  // Dummy function for the map's onPositionChange prop since we're in read-only mode
  const handlePositionChange = () => {};

  // Check if modal should be displayed
  if (!isOpen || !ticket) {
    console.log('Modal is not open or ticket is null, returning null');
    return null;
  }
  
  console.log('Rendering modal with activeTab:', activeTab);

  const getWorkflowStageColor = (stage: string) => {
    switch (stage) {
      case 'Front Desk': return 'bg-purple-100 text-purple-800';
      case 'GIS Department': return 'bg-indigo-100 text-indigo-800';
      case 'Address Verification': return 'bg-orange-100 text-orange-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-blue-100 text-blue-800';
      case 'High': return 'bg-yellow-100 text-yellow-800';
      case 'Critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Modal header */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-between items-center border-b border-gray-200">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <span className="mr-2">{ticket.firstName} {ticket.lastName}</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getWorkflowStageColor(ticket.workflowStage)}`}>
                  {ticket.workflowStage}
                </span>
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Created {format(new Date(ticket.createdAt), 'PPP')}
              </p>
            </div>
            <div className="flex space-x-2">
              <Link 
                href={`/tickets/${ticket._id}/edit`}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaEdit className="mr-1" /> Edit
              </Link>
              <button
                onClick={onClose}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <FaTimes className="mr-1" /> Close
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('personal')}
                className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'personal' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <FaUser className="inline-block mr-2" />
                Personal Information
              </button>
              <button
                onClick={() => setActiveTab('addressing')}
                className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'addressing' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <FaMapMarkedAlt className="inline-block mr-2" />
                Addressing
              </button>
              <button
                onClick={() => setActiveTab('verification')}
                className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'verification' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <FaCheckCircle className="inline-block mr-2" />
                Verification
              </button>
            </nav>
          </div>

          {/* Tab content */}
          <div className="p-6">
            {/* Personal Information Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h5 className="text-sm font-medium text-gray-500 mb-2">Name</h5>
                      <p className="text-base">{ticket.firstName} {ticket.lastName}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h5 className="text-sm font-medium text-gray-500 mb-2">Email</h5>
                      <p className="text-base">{ticket.email}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h5 className="text-sm font-medium text-gray-500 mb-2">Mobile Phone</h5>
                      <p className="text-base">{ticket.mobilePhone || 'Not provided'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h5 className="text-sm font-medium text-gray-500 mb-2">Landline Phone</h5>
                      <p className="text-base">{ticket.landlinePhone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Request Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h5 className="text-sm font-medium text-gray-500 mb-2">Request Type</h5>
                      <p className="text-base">{ticket.requestType}</p>
                    </div>
                    {ticket.existingAddress && (
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h5 className="text-sm font-medium text-gray-500 mb-2">Existing Address</h5>
                        <p className="text-base">{ticket.existingAddress}</p>
                      </div>
                    )}
                  </div>
                  {ticket.additionalInfo && (
                    <div className="mt-4 bg-gray-50 p-4 rounded-md">
                      <h5 className="text-sm font-medium text-gray-500 mb-2">Additional Information</h5>
                      <p className="text-base whitespace-pre-line">{ticket.additionalInfo}</p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Ticket Status</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h5 className="text-sm font-medium text-gray-500 mb-2">Status</h5>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h5 className="text-sm font-medium text-gray-500 mb-2">Priority</h5>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h5 className="text-sm font-medium text-gray-500 mb-2">Assigned To</h5>
                      <p className="text-base">{ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Addressing Tab */}
            {activeTab === 'addressing' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Property Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h5 className="text-sm font-medium text-gray-500 mb-2">Premise Type</h5>
                      <p className="text-base">{ticket.premiseType}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h5 className="text-sm font-medium text-gray-500 mb-2">County</h5>
                      <p className="text-base">{ticket.county}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h5 className="text-sm font-medium text-gray-500 mb-2">Street Name</h5>
                      <p className="text-base">{ticket.streetName}</p>
                    </div>
                    {ticket.propertyId && (
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h5 className="text-sm font-medium text-gray-500 mb-2">Property ID</h5>
                        <p className="text-base">{ticket.propertyId}</p>
                      </div>
                    )}
                    {ticket.closestIntersection && (
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h5 className="text-sm font-medium text-gray-500 mb-2">Closest Intersection</h5>
                        <p className="text-base">{ticket.closestIntersection}</p>
                      </div>
                    )}
                    {ticket.subdivision && (
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h5 className="text-sm font-medium text-gray-500 mb-2">Subdivision</h5>
                        <p className="text-base">{ticket.subdivision}</p>
                      </div>
                    )}
                    {ticket.lotNumber && (
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h5 className="text-sm font-medium text-gray-500 mb-2">Lot Number</h5>
                        <p className="text-base">{ticket.lotNumber}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Map Section */}
                {(ticket.xCoordinate && ticket.yCoordinate) ? (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Location</h4>
                    <div className="h-80 w-full rounded-md overflow-hidden border border-gray-300">
                      <MapSelector
                        readOnly={true}
                        initialPosition={[ticket.yCoordinate || 0, ticket.xCoordinate || 0]}
                        onPositionChange={handlePositionChange}
                      />
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h5 className="text-sm font-medium text-gray-500 mb-2">X Coordinate (Longitude)</h5>
                        <p className="text-base">{ticket.xCoordinate}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h5 className="text-sm font-medium text-gray-500 mb-2">Y Coordinate (Latitude)</h5>
                        <p className="text-base">{ticket.yCoordinate}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-4 rounded-md">
                    <p className="text-yellow-700">No coordinates provided for this ticket.</p>
                  </div>
                )}
              </div>
            )}

            {/* Verification Tab */}
            {activeTab === 'verification' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Workflow Status</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h5 className="text-sm font-medium text-gray-500 mb-2">Current Stage</h5>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getWorkflowStageColor(ticket.workflowStage)}`}>
                        {ticket.workflowStage}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h5 className="text-sm font-medium text-gray-500 mb-2">Assigned To</h5>
                      <p className="text-base">{ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h5 className="text-sm font-medium text-gray-500 mb-2">Address Created</h5>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ticket.addressCreated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {ticket.addressCreated ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h5 className="text-sm font-medium text-gray-500 mb-2">Address Verified</h5>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ticket.addressVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {ticket.addressVerified ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Verification Notes */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Verification Notes</h4>
                  {ticket.verificationNotes ? (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-base whitespace-pre-line">{ticket.verificationNotes}</p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-gray-500">No verification notes available.</p>
                    </div>
                  )}
                </div>

                {/* Ticket History */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Ticket History</h4>
                  {ticket.history && ticket.history.length > 0 ? (
                    <div className="space-y-4">
                      {ticket.history.map((entry, index) => (
                        <div key={entry._id || index} className="bg-gray-50 p-4 rounded-md">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="text-sm font-medium text-gray-900">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getWorkflowStageColor(entry.workflowStage)}`}>
                                  {entry.workflowStage}
                                </span>
                              </h5>
                              <p className="text-xs text-gray-500 mt-1">
                                {entry.actionBy?.name} - {format(new Date(entry.timestamp), 'PPP p')}
                              </p>
                            </div>
                            {entry.assignedTo && (
                              <div className="text-xs text-gray-500">
                                Assigned to: {entry.assignedTo.name}
                              </div>
                            )}
                          </div>
                          {entry.notes && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-sm text-gray-700 whitespace-pre-line">{entry.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-gray-500">No history available for this ticket.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketModal;
