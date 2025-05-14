// Common types used throughout the application

export type User = {
  _id: string;
  name: string;
  email: string;
  role?: string;
  department?: string;
};

export type HistoryEntry = {
  _id?: string;
  workflowStage: string;
  assignedTo?: User | null;
  actionBy: User;
  notes?: string;
  timestamp: string;
};

export type Ticket = {
  _id: string;
  status: string;
  priority: string;
  // Workflow tracking
  workflowStage: string;
  approvedAddress?: string;
  addressCreated: boolean;
  addressVerified: boolean;
  verificationNote?: string;
  // Signature tracking
  signatureToken?: string;
  signatureRequested?: boolean;
  signatureRequestedAt?: Date | string;
  signatureRequestedBy?: string;
  signatureCompleted?: boolean;
  signatureCompletedAt?: Date | string;
  addressLetterPath?: string;
  // Assignment
  assignedTo?: User | null;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
  // History
  history?: HistoryEntry[];
  // Resolution tracking
  dueDate?: Date | string;
  timeToResolve?: number;
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
  xCoordinate?: number;
  yCoordinate?: number;
};

export type ToastType = 'success' | 'error' | 'loading' | 'info';
