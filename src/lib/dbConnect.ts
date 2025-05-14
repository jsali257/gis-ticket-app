import mongoose from 'mongoose';
import clientPromise from './mongodb';

// Import model schemas from their respective files
import { UserSchema } from './models/User';
import { TicketSchema } from './models/Ticket';

// This is kept for reference but no longer used directly
/* const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    maxlength: [60, 'Name cannot be more than 60 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'gis_staff', 'gis_verifier', 'front_desk'],
    default: 'user',
  },
  department: {
    type: String,
    enum: ['Front Desk', 'GIS', 'Admin', 'Other'],
    default: 'Other',
  },
  isAvailableForAssignment: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const TicketSchema = new mongoose.Schema({
  // Basic ticket information
  status: {
    type: String,
    required: [true, 'Please provide a status for this ticket'],
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open',
  },
  // Workflow stage
  workflowStage: {
    type: String,
    enum: ['Front Desk', 'GIS Department', 'Address Verification', 'Completed'],
    default: 'Front Desk',
  },
  // Address creation and verification status
  addressCreated: {
    type: Boolean,
    default: false,
  },
  addressVerified: {
    type: Boolean,
    default: false,
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
    required: false,
  },
  landlinePhone: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    required: false,
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
  // Ticket history for tracking workflow changes
  history: [{
    workflowStage: {
      type: String,
      enum: ['Front Desk', 'GIS Department', 'Address Verification', 'Completed'],
      required: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    notes: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Verification notes
  verificationNotes: {
    type: String,
    maxlength: [1000, 'Verification notes cannot be more than 1000 characters']
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
*/

// This approach ensures models are only compiled once
export function getModels() {
  // Check if models are already registered
  const User = mongoose.models.User || mongoose.model('User', UserSchema);
  const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);
  
  return { User, Ticket };
}

// Connect to MongoDB
export async function connectDB() {
  try {
    if (mongoose.connection.readyState >= 1) return;
    const client = await clientPromise;
    const uri = process.env.MONGODB_URI as string;
    await mongoose.connect(uri);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

// Helper function to connect and get models
export async function getConnectedModels() {
  await connectDB();
  return getModels();
}
