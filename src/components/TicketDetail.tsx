"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';

type User = {
  _id: string;
  name: string;
  email: string;
};

type HistoryEntry = {
  _id?: string;
  workflowStage: string;
  assignedTo?: User | null;
  actionBy: User;
  notes?: string;
  timestamp: string;
};

type Ticket = {
  _id: string;
  status: string;
  priority: string;
  // Workflow tracking
  workflowStage: string;
  addressCreated: boolean;
  addressVerified: boolean;
  verificationNotes?: string;
  // Assignment
  assignedTo?: User | null;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
  // History
  history?: HistoryEntry[];
  // Ticket number
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
  approvedAddress?: string;
  additionalInfo?: string;
  // Property information
  premiseType: string;
  propertyId?: string;
  county: string;
  streetName: string;
  closestIntersection?: string;
  subdivision?: string;
  lotNumber?: string;
  // GIS Coordinates
  xCoordinate?: number;
  yCoordinate?: number;
};

type TicketDetailProps = {
  ticket: Ticket;
};

// Dynamically import the MapSelector component to avoid SSR issues
const MapSelector = dynamic(() => import('./MapSelector'), { ssr: false });

const TicketDetail = ({ ticket }: TicketDetailProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  
  // Dummy function for the map's onPositionChange prop since we're in read-only mode
  const handlePositionChange = () => {};

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-blue-100 text-blue-800';
      case 'High': return 'bg-yellow-100 text-yellow-800';
      case 'Critical': return 'bg-red-100 text-red-800';
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

  const getWorkflowStageColor = (stage: string) => {
    switch (stage) {
      case 'Front Desk': return 'bg-purple-100 text-purple-800';
      case 'GIS Department': return 'bg-indigo-100 text-indigo-800';
      case 'Address Verification': return 'bg-orange-100 text-orange-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getWorkflowStageIcon = (stage: string) => {
    switch (stage) {
      case 'Front Desk': return '📝';
      case 'GIS Department': return '🗺️';
      case 'Address Verification': return '✅';
      case 'Completed': return '🏁';
      default: return '❓';
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    
    setIsDeleting(true);
    setError('');
    
    try {
      const response = await fetch(`/api/tickets/${ticket._id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete ticket');
      }
      
      router.push('/tickets');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {ticket.firstName} {ticket.lastName}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Created by {ticket.createdBy?.name || 'Unknown'} on {format(new Date(ticket.createdAt), 'PPP')}
          </p>
          
          {/* Workflow Stage Indicator */}
          <div className="mt-2 flex items-center">
            <span className="mr-2 text-sm font-medium text-gray-700">Workflow Stage:</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getWorkflowStageColor(ticket.workflowStage)}`}>
              {getWorkflowStageIcon(ticket.workflowStage)} {ticket.workflowStage}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Link 
            href={`/tickets/${ticket._id}/edit`}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
      
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                {ticket.status}
              </span>
            </dd>
          </div>
          
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Priority</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority}
              </span>
            </dd>
          </div>
          
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {ticket.assignedTo?.name || 'Unassigned'}
            </dd>
          </div>
          
          {/* Contact Information */}
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Contact Information</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Email:</p>
                  <p>{ticket.email}</p>
                </div>
                <div>
                  <p className="font-medium">Mobile Phone:</p>
                  <p>{ticket.mobilePhone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="font-medium">Landline Phone:</p>
                  <p>{ticket.landlinePhone || 'Not provided'}</p>
                </div>
              </div>
            </dd>
          </div>
          
          {/* Request Details */}
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Request Details</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="font-medium">Request Type:</p>
                  <p>{ticket.requestType}</p>
                </div>
                {ticket.existingAddress && (
                  <div>
                    <p className="font-medium">Existing Address:</p>
                    <p>{ticket.existingAddress}</p>
                  </div>
                )}
                {ticket.approvedAddress && (
                  <div className="bg-green-50 p-3 rounded-md border border-green-200">
                    <p className="font-medium text-green-700">Approved Address:</p>
                    <p className="text-green-800">{ticket.approvedAddress}</p>
                  </div>
                )}
                {ticket.additionalInfo && (
                  <div>
                    <p className="font-medium">Additional Information:</p>
                    <p className="whitespace-pre-line">{ticket.additionalInfo}</p>
                  </div>
                )}
              </div>
            </dd>
          </div>
          
          {/* Workflow Status */}
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Workflow Status</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center">
                  <p className="font-medium mr-2">Address Created:</p>
                  <p>{ticket.addressCreated ? '✅ Yes' : '❌ No'}</p>
                </div>
                <div className="flex items-center">
                  <p className="font-medium mr-2">Address Verified:</p>
                  <p>{ticket.addressVerified ? '✅ Yes' : '❌ No'}</p>
                </div>
                {ticket.verificationNotes && (
                  <div>
                    <p className="font-medium">Verification Notes:</p>
                    <p className="whitespace-pre-line">{ticket.verificationNotes}</p>
                  </div>
                )}
              </div>
            </dd>
          </div>
          
          {/* Workflow History */}
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Workflow History</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {ticket.history && ticket.history.length > 0 ? (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {ticket.history.map((entry, index) => (
                      <li key={entry._id || index}>
                        <div className="relative pb-8">
                          {index < ticket.history!.length - 1 && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getWorkflowStageColor(entry.workflowStage)}`}>
                                {getWorkflowStageIcon(entry.workflowStage)}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-500">
                                  <span className="font-medium text-gray-900">{entry.workflowStage}</span>
                                  {entry.assignedTo && 
                                    <span> - Assigned to <span className="font-medium">{entry.assignedTo.name}</span></span>
                                  }
                                </p>
                                {entry.notes && <p className="mt-1 text-sm text-gray-700">{entry.notes}</p>}
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                <time dateTime={entry.timestamp}>
                                  {format(new Date(entry.timestamp), 'PPp')}
                                </time>
                                <div className="text-xs">
                                  by {entry.actionBy?.name || 'System'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>No history available</p>
              )}
            </dd>
          </div>
          
          {/* Property Information */}
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Property Information</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Premise Type:</p>
                  <p>{ticket.premiseType}</p>
                </div>
                <div>
                  <p className="font-medium">County:</p>
                  <p>{ticket.county}</p>
                </div>
                <div>
                  <p className="font-medium">Street Name:</p>
                  <p>{ticket.streetName}</p>
                </div>
                <div>
                  <p className="font-medium">Property ID:</p>
                  <p>{ticket.propertyId || 'Not provided'}</p>
                </div>
                <div>
                  <p className="font-medium">Closest Intersection:</p>
                  <p>{ticket.closestIntersection || 'Not provided'}</p>
                </div>
                <div>
                  <p className="font-medium">Subdivision:</p>
                  <p>{ticket.subdivision || 'Not provided'}</p>
                </div>
                <div>
                  <p className="font-medium">Lot Number:</p>
                  <p>{ticket.lotNumber || 'Not provided'}</p>
                </div>
                
                {ticket.xCoordinate && ticket.yCoordinate && (
                  <div className="col-span-2 mt-4">
                    <p className="font-medium mb-2">Property Location:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">X Coordinate (Longitude):</p>
                        <p>{ticket.xCoordinate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Y Coordinate (Latitude):</p>
                        <p>{ticket.yCoordinate}</p>
                      </div>
                    </div>
                    <div className="h-96 w-full rounded-md overflow-hidden border border-gray-300">
                      <MapSelector
                        initialPosition={[ticket.yCoordinate, ticket.xCoordinate]}
                        onPositionChange={handlePositionChange}
                        readOnly={true}
                      />
                    </div>
                  </div>
                )}
              </div>
            </dd>
          </div>
          
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {format(new Date(ticket.updatedAt), 'PPP p')}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default TicketDetail;
