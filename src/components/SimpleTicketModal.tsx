"use client";

import { useState } from 'react';
import { Ticket, User } from '@/types';
import { FaTimes } from 'react-icons/fa';

type SimpleTicketModalProps = {
  ticket: Ticket;
  isOpen: boolean;
  onClose: () => void;
};

const SimpleTicketModal = ({ ticket, isOpen, onClose }: SimpleTicketModalProps) => {
  const [activeTab, setActiveTab] = useState('personal');

  if (!isOpen || !ticket) return null;

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
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {ticket.firstName} {ticket.lastName}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <FaTimes className="mr-1" /> Close
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('personal')}
                className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'personal' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Personal Information
              </button>
              <button
                onClick={() => setActiveTab('addressing')}
                className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'addressing' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Addressing
              </button>
              <button
                onClick={() => setActiveTab('verification')}
                className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'verification' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Verification
              </button>
            </nav>
          </div>

          {/* Tab content */}
          <div className="p-6">
            {/* Personal Information Tab */}
            {activeTab === 'personal' && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h4>
                <p>Name: {ticket.firstName} {ticket.lastName}</p>
                <p>Email: {ticket.email}</p>
              </div>
            )}

            {/* Addressing Tab */}
            {activeTab === 'addressing' && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Property Information</h4>
                <p>County: {ticket.county}</p>
                <p>Street Name: {ticket.streetName}</p>
              </div>
            )}

            {/* Verification Tab */}
            {activeTab === 'verification' && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Workflow Status</h4>
                <p>Current Stage: {ticket.workflowStage}</p>
                <p>Address Created: {ticket.addressCreated ? 'Yes' : 'No'}</p>
                <p>Address Verified: {ticket.addressVerified ? 'Yes' : 'No'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleTicketModal;
