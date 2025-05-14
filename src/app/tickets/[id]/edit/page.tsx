import { notFound } from 'next/navigation';
import TicketForm from '@/components/TicketForm';
import { getConnectedModels } from '@/lib/dbConnect';
import mongoose from 'mongoose';

// Define types for our data
type UserType = {
  _id: string;
  name: string;
  email: string;
};

type TicketType = {
  _id: string;
  status: string;
  priority: string;
  assignedTo?: UserType | null;
  createdBy: UserType;
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
    
    return JSON.parse(JSON.stringify(ticket));
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return null;
  }
}

// Fetch all users from the database
async function getUsers() {
  try {
    // Get models after ensuring DB connection
    const { User } = await getConnectedModels();
    
    const users = await User.find({})
      .select('name email')
      .lean();
    
    return JSON.parse(JSON.stringify(users));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

// Make sure to mark params as a prop with a type
interface PageParams {
  id: string;
}

export default async function EditTicketPage({ params }: { params: PageParams }) {
  // Explicitly await the params object as recommended in the error message
  // https://nextjs.org/docs/messages/sync-dynamic-apis
  const resolvedParams = await Promise.resolve(params);
  
  // Fetch the ticket and users from the database
  const [ticket, users] = await Promise.all([
    getTicket(resolvedParams.id),
    getUsers()
  ]);
  
  // If ticket not found, show 404 page
  if (!ticket) {
    notFound();
  }
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Ticket</h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <TicketForm ticket={ticket} users={users} isEditing={true} />
        </div>
      </div>
    </div>
  );
}
