import TicketList from '@/components/TicketList';
import { getConnectedModels } from '@/lib/dbConnect';
import { getServerSession } from 'next-auth';
import { options } from '../api/auth/[...nextauth]/options';

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

// Fetch tickets from the database
async function getTickets() {
  try {
    // Get models after ensuring DB connection
    const { Ticket } = await getConnectedModels();
    
    const tickets = await Ticket.find({})
      .sort({ createdAt: -1 })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .lean();
    
    return JSON.parse(JSON.stringify(tickets));
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return [];
  }
}

export default async function TicketsPage() {
  const tickets = await getTickets();
  const session = await getServerSession(options);
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Ticket Management</h1>
      <TicketList tickets={tickets} session={session} />
    </div>
  );
}
