import { notFound } from 'next/navigation';
import { getConnectedModels } from '@/lib/dbConnect';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import TicketView from '@/components/TicketView';

// Define types for our data
type User = {
  _id: string;
  name: string;
  email: string;
};

type Ticket = {
  _id: string;
  status: string;
  priority: string;
  assignedTo?: User | null;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
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
};

// Fetch a ticket by ID from the database
async function getTicket(id: string) {
  try {
    // Get models after ensuring DB connection
    const { Ticket } = await getConnectedModels();
    
    // Validate if the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    
    const ticket = await Ticket.findById(id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .lean();
    
    if (!ticket) {
      return null;
    }
    
    // Safely convert MongoDB document to plain object
    const plainTicket = JSON.parse(JSON.stringify(ticket));
    
    // Ensure createdBy is not null to prevent errors
    if (!plainTicket.createdBy) {
      // Use a valid ObjectId format (24 character hex string) for the fallback
      plainTicket.createdBy = { _id: '000000000000000000000000', name: 'Unknown', email: 'unknown@example.com' };
    }
    
    return plainTicket;
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return null;
  }
}

// Make sure to mark params as a prop with a type
interface PageParams {
  id: string;
}

export default async function TicketPage({ params }: { params: PageParams }) {
  // Explicitly await the params object as recommended in the error message
  // https://nextjs.org/docs/messages/sync-dynamic-apis
  const resolvedParams = await Promise.resolve(params);
  
  // Fetch the ticket from the database
  const ticket = await getTicket(resolvedParams.id);
  
  // If ticket not found, show 404 page
  if (!ticket) {
    notFound();
  }
  
  const session = await getServerSession(options);
  
  // Fetch all users for assignment dropdown
  const { User } = await getConnectedModels();
  const usersData = await User.find({}).lean();
  
  // Convert to properly typed User array
  const users: User[] = JSON.parse(JSON.stringify(usersData));
  
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
  
  return <TicketView ticket={ticket} users={users} session={session} />;
}
