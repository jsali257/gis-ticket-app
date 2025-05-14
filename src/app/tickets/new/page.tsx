import TicketForm from '@/components/TicketForm';

// Define types for our mock data
type User = {
  _id: string;
  name: string;
  email: string;
};

// Mock users data with valid MongoDB ObjectId format
const mockUsers: User[] = [
  { _id: '507f1f77bcf86cd799439011', name: 'John Doe', email: 'john@example.com' },
  { _id: '507f1f77bcf86cd799439012', name: 'Jane Smith', email: 'jane@example.com' },
  { _id: '507f1f77bcf86cd799439013', name: 'Alex Johnson', email: 'alex@example.com' },
  { _id: '507f1f77bcf86cd799439014', name: 'Mike Wilson', email: 'mike@example.com' }
];

export default function NewTicketPage() {
  // In a real app, we would fetch users from the API and check authentication
  const users = mockUsers;
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-white">Create New Ticket</h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-[#2a2b33] shadow overflow-hidden sm:rounded-lg p-6">
          <TicketForm users={users} />
        </div>
      </div>
    </div>
  );
}
