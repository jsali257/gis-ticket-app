"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import the MapSelector component to avoid SSR issues with Leaflet
const MapSelector = dynamic(() => import('./MapSelector'), {
  ssr: false, // This will only import the component on the client side
});

type User = {
  _id: string;
  name: string;
  email: string;
};

type TicketFormProps = {
  ticket?: {
    _id?: string;
    status: string;
    priority: string;
    workflowStage?: string;
    assignedTo?: User | null;
    // Contact information
    firstName?: string;
    lastName?: string;
    email?: string;
    mobilePhone?: string;
    landlinePhone?: string;
    // Request details
    requestType?: string;
    existingAddress?: string;
    additionalInfo?: string;
    // Property information
    premiseType?: string;
    propertyId?: string;
    county?: string;
    streetName?: string;
    closestIntersection?: string;
    subdivision?: string;
    lotNumber?: string;
    // GIS Coordinates
    xCoordinate?: number;
    yCoordinate?: number;
  };
  users?: User[];
  isEditing?: boolean;
};

const TicketForm = ({ ticket, users = [], isEditing = false }: TicketFormProps) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    // Basic ticket information
    status: 'Open',
    priority: 'Medium',
    workflowStage: 'Front Desk',
    
    // Contact information
    firstName: '',
    lastName: '',
    email: '',
    mobilePhone: '',
    landlinePhone: '',
    
    // Request details
    requestType: 'New Address',
    existingAddress: '',
    additionalInfo: '',
    
    // Property information
    premiseType: 'Residence',
    propertyId: '',
    county: 'Hidalgo',
    streetName: '',
    closestIntersection: '',
    subdivision: '',
    lotNumber: '',
    
    // GIS Coordinates
    xCoordinate: 0,
    yCoordinate: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ticket) {
      setFormData({
        // Basic ticket information
        status: ticket.status,
        priority: ticket.priority,
        workflowStage: ticket.workflowStage || 'Front Desk',
        
        // Contact information
        firstName: ticket.firstName || '',
        lastName: ticket.lastName || '',
        email: ticket.email || '',
        mobilePhone: ticket.mobilePhone || '',
        landlinePhone: ticket.landlinePhone || '',
        
        // Request details
        requestType: ticket.requestType || 'New Address',
        existingAddress: ticket.existingAddress || '',
        additionalInfo: ticket.additionalInfo || '',
        
        // Property information
        premiseType: ticket.premiseType || 'Residence',
        propertyId: ticket.propertyId || '',
        county: ticket.county || 'Hidalgo',
        streetName: ticket.streetName || '',
        closestIntersection: ticket.closestIntersection || '',
        subdivision: ticket.subdivision || '',
        lotNumber: ticket.lotNumber || '',
        
        // GIS Coordinates
        xCoordinate: ticket.xCoordinate || 0,
        yCoordinate: ticket.yCoordinate || 0,
      });
    }
  }, [ticket]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle map coordinate changes
  const handlePositionChange = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      xCoordinate: lng,  // Longitude is X coordinate
      yCoordinate: lat,  // Latitude is Y coordinate
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const url = isEditing 
        ? `/api/tickets/${ticket?._id}` 
        : '/api/tickets';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      // Add a mock user ID for development purposes
      const submissionData = {
        ...formData,
        // This would normally come from the authenticated user's session
        // Using a valid MongoDB ObjectId format for development
        createdBy: '507f1f77bcf86cd799439011'
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Something went wrong');
      }

      router.push('/tickets');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      

      
      {/* Basic Ticket Information */}
      <div className="border-b border-gray-700 pb-4 mb-4">
        <h3 className="text-lg font-medium text-white mb-4">Ticket Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          {/* Status field removed - will be automatically managed in the backend */}
          
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-white">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#1a1c23] text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>
        
        {/* Removed manual assignment - tickets are automatically assigned to GIS staff */}
      </div>
      
      {/* Contact Information */}
      <div className="border-b border-gray-700 pb-4 mb-4">
        <h3 className="text-lg font-medium text-white mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-white">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#1a1c23] text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-white">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#1a1c23] text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label htmlFor="email" className="block text-sm font-medium text-white">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#1a1c23] text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label htmlFor="mobilePhone" className="block text-sm font-medium text-white">
              Mobile Phone
            </label>
            <input
              type="tel"
              id="mobilePhone"
              name="mobilePhone"
              value={formData.mobilePhone}
              onChange={handleChange}
              placeholder="10 digits, numbers only"
              className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#1a1c23] text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="landlinePhone" className="block text-sm font-medium text-white">
              Landline Phone
            </label>
            <input
              type="tel"
              id="landlinePhone"
              name="landlinePhone"
              value={formData.landlinePhone}
              onChange={handleChange}
              placeholder="10 digits, numbers only"
              className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#1a1c23] text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
      
      {/* Request Details */}
      <div className="border-b border-gray-700 pb-4 mb-4">
        <h3 className="text-lg font-medium text-white mb-4">Request Details</h3>
        <div>
          <label htmlFor="requestType" className="block text-sm font-medium text-white">
            Request Type
          </label>
          <select
            id="requestType"
            name="requestType"
            value={formData.requestType}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#1a1c23] text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="New Address">New Address</option>
            <option value="Verify Existing Address">Verify Existing Address</option>
          </select>
        </div>
        
        {formData.requestType === 'Verify Existing Address' && (
          <div className="mt-4">
            <label htmlFor="existingAddress" className="block text-sm font-medium text-white">
              Existing Address
            </label>
            <input
              type="text"
              id="existingAddress"
              name="existingAddress"
              value={formData.existingAddress}
              onChange={handleChange}
              required={formData.requestType === 'Verify Existing Address'}
              className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#1a1c23] text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
        
        <div className="mt-4">
          <label htmlFor="additionalInfo" className="block text-sm font-medium text-white">
            Additional Information
          </label>
          <textarea
            id="additionalInfo"
            name="additionalInfo"
            value={formData.additionalInfo}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#1a1c23] text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      {/* Property Information */}
      <div className="border-b border-gray-700 pb-4 mb-4">
        <h3 className="text-lg font-medium text-white mb-4">Property Information</h3>
        
        {/* Map for selecting location */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Location
          </label>
          <MapSelector
            initialPosition={[formData.yCoordinate || 26.2034, formData.xCoordinate || -98.2300]}
            onPositionChange={handlePositionChange}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <label htmlFor="xCoordinate" className="block text-sm font-medium text-white">
                X Coordinate (Longitude)
              </label>
              <input
                type="number"
                step="any"
                id="xCoordinate"
                name="xCoordinate"
                value={formData.xCoordinate}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#1a1c23] text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="yCoordinate" className="block text-sm font-medium text-white">
                Y Coordinate (Latitude)
              </label>
              <input
                type="number"
                step="any"
                id="yCoordinate"
                name="yCoordinate"
                value={formData.yCoordinate}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#1a1c23] text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="premiseType" className="block text-sm font-medium text-white">
              Premise Type
            </label>
            <select
              id="premiseType"
              name="premiseType"
              value={formData.premiseType}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#1a1c23] text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Residence">Residence</option>
              <option value="Commercial">Commercial</option>
              <option value="Building Structure">Building Structure</option>
              <option value="Utility">Utility</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="propertyId" className="block text-sm font-medium text-white">
              Property ID
            </label>
            <input
              type="text"
              id="propertyId"
              name="propertyId"
              value={formData.propertyId}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#1a1c23] text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label htmlFor="county" className="block text-sm font-medium text-white">
              County
            </label>
            <select
              id="county"
              name="county"
              value={formData.county}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#1a1c23] text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Hidalgo">Hidalgo</option>
              <option value="Willacy">Willacy</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="streetName" className="block text-sm font-medium text-white">
              Street Name
            </label>
            <input
              type="text"
              id="streetName"
              name="streetName"
              value={formData.streetName}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#1a1c23] text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label htmlFor="closestIntersection" className="block text-sm font-medium text-white">
              Closest Intersection
            </label>
            <input
              type="text"
              id="closestIntersection"
              name="closestIntersection"
              value={formData.closestIntersection}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#1a1c23] text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="subdivision" className="block text-sm font-medium text-white">
              Subdivision
            </label>
            <input
              type="text"
              id="subdivision"
              name="subdivision"
              value={formData.subdivision}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#1a1c23] text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label htmlFor="lotNumber" className="block text-sm font-medium text-white">
            Lot Number
          </label>
          <input
            type="text"
            id="lotNumber"
            name="lotNumber"
            value={formData.lotNumber}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#1a1c23] text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Ticket' : 'Create Ticket'}
        </button>
      </div>
    </form>
  );
};

export default TicketForm;
