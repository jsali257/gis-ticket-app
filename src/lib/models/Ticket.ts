import mongoose from 'mongoose';

// Define and export the Ticket schema
export const TicketSchema = new mongoose.Schema({
  // Basic ticket information
  status: {
    type: String,
    required: [true, 'Please provide a status for this ticket'],
    enum: ['Open', 'In Progress', 'Completed', 'Closed'],
    default: 'Open',
  },
  workflowStage: {
    type: String,
    enum: ['Front Desk', 'Addressing', 'Verification', 'Ready to Contact Customer', 'Completed'],
    default: 'Front Desk',
  },
  priority: {
    type: String,
    required: [true, 'Please provide a priority for this ticket'],
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
  },
  
  // Contact information
  firstName: {
    type: String,
    required: [true, 'Please provide a first name'],
    maxlength: [50, 'First name cannot be more than 50 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Please provide a last name'],
    maxlength: [50, 'Last name cannot be more than 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email address'],
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
  mobilePhone: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
  },
  landlinePhone: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
  },
  
  // Request details
  requestType: {
    type: String,
    required: [true, 'Please specify the request type'],
    enum: ['New Address', 'Verify Existing Address'],
  },
  existingAddress: {
    type: String,
    maxlength: [200, 'Address cannot be more than 200 characters'],
  },
  additionalInfo: {
    type: String,
    maxlength: [1000, 'Additional information cannot be more than 1000 characters'],
  },
  
  // Property information
  premiseType: {
    type: String,
    required: [true, 'Please specify the premise type'],
    enum: ['Residence', 'Commercial', 'Building Structure', 'Utility'],
  },
  propertyId: {
    type: String,
  },
  county: {
    type: String,
    required: [true, 'Please specify the county'],
    enum: ['Hidalgo', 'Willacy'],
  },
  streetName: {
    type: String,
    required: [true, 'Please provide a street name'],
  },
  closestIntersection: {
    type: String,
  },
  subdivision: {
    type: String,
  },
  lotNumber: {
    type: String,
  },
  // GIS Coordinates
  xCoordinate: {
    type: Number,
    required: [true, 'Please provide an X coordinate'],
  },
  yCoordinate: {
    type: Number,
    required: [true, 'Please provide a Y coordinate'],
  },
  
  // Assignment and tracking
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide a user for this ticket'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  // Due date (5 business days from creation)
  dueDate: {
    type: String, // Store as string for consistent handling
  },
  // Time remaining to resolve (in business days)
  timeToResolve: {
    type: Number,
  },
  // Ticket number in format YYMMDDHHMMSS
  ticketNumber: {
    type: String,
    unique: true,
  },
  // Signature tracking fields
  signatureToken: {
    type: String,
  },
  signatureRequested: {
    type: Boolean,
    default: false,
  },
  signatureRequestedAt: {
    type: Date,
  },
  signatureRequestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  signatureCompleted: {
    type: Boolean,
    default: false,
  },
  signatureCompletedAt: {
    type: Date,
  },
  // Path to the generated address letter PDF
  addressLetterPath: {
    type: String,
  },
  // Ticket workflow history
  history: [{
    status: String,
    workflowStage: {
      type: String,
      enum: ['Front Desk', 'Addressing', 'Verification', 'Ready to Contact Customer', 'Completed']
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Verification details
  approvedAddress: {
    type: String,
    trim: true
  },
  addressCreated: {
    type: Boolean,
    default: false
  },
  addressVerified: {
    type: Boolean,
    default: false
  },
  verificationNote: String,
  
  // Signature request fields
  signatureToken: {
    type: String,
    trim: true
  },
  signatureRequested: {
    type: Boolean,
    default: false
  },
  signatureRequestedAt: {
    type: Date
  },
  signatureRequestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  signatureCompleted: {
    type: Boolean,
    default: false
  },
  signatureCompletedAt: {
    type: Date
  },
});

export default mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);