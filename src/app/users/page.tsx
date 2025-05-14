import { Metadata } from 'next';
import UserManagement from '@/components/UserManagement';

export const metadata: Metadata = {
  title: 'User Management - GIS Ticket App',
  description: 'Manage users in the GIS Ticket App',
};

export default function UsersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <UserManagement />
    </div>
  );
}
