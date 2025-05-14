import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import TicketModel from '@/models/Ticket';
import UserModel from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type');
    
    // Connect to database
    await dbConnect();
    
    const results = [];
    
    // Parse advanced queries
    let fieldQuery = {};
    let textQuery = query;
    
    // Handle special query formats like field:value
    if (query.includes(':') && !query.startsWith('type:')) {
      const [field, value] = query.split(':', 2);
      
      switch (field.toLowerCase()) {
        case 'status':
          fieldQuery = { status: new RegExp(value, 'i') };
          textQuery = '';
          break;
        case 'priority':
          fieldQuery = { priority: new RegExp(value, 'i') };
          textQuery = '';
          break;
        case 'department':
          if (type === 'user' || !type) {
            fieldQuery = { department: new RegExp(value, 'i') };
            textQuery = '';
          }
          break;
        case 'assignedto':
          if (value.toLowerCase() === 'me') {
            fieldQuery = { 'assignedTo._id': session.user.id };
            textQuery = '';
          }
          break;
        // Add more field queries as needed
      }
    }
    
    // Create text search regex
    const searchRegex = textQuery ? new RegExp(textQuery, 'i') : null;
    
    // Search tickets if no type specified or type is 'ticket'
    if (!type || type === 'ticket') {
      let ticketQuery: any = { ...fieldQuery };
      
      // Add text search if needed
      if (searchRegex) {
        ticketQuery = {
          ...ticketQuery,
          $or: [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { email: searchRegex },
            { phone: searchRegex },
            { requestType: searchRegex },
            { additionalInfo: searchRegex },
            { propertyID: searchRegex },
            { streetName: searchRegex },
            { county: searchRegex },
            { subdivision: searchRegex },
            { lotNumber: searchRegex },
            { closestIntersection: searchRegex },
          ]
        };
      }
      
      const tickets = await TicketModel.find(ticketQuery).limit(20);
      
      results.push(...tickets.map(ticket => {
        // Find the matching field for highlighting
        let highlight = '';
        if (searchRegex) {
          for (const field of ['additionalInfo', 'streetName', 'closestIntersection']) {
            if (ticket[field] && searchRegex.test(ticket[field])) {
              const text = ticket[field];
              const match = text.match(searchRegex);
              if (match) {
                const index = match.index || 0;
                const start = Math.max(0, index - 20);
                const end = Math.min(text.length, index + match[0].length + 20);
                highlight = text.substring(start, end);
                break;
              }
            }
          }
        }
        
        return {
          type: 'ticket',
          id: ticket._id.toString(),
          title: `${ticket.firstName} ${ticket.lastName}`,
          subtitle: `${ticket.requestType} - ${ticket.status} (${ticket.workflowStage})`,
          highlight: highlight || undefined
        };
      }));
    }
    
    // Search users if no type specified or type is 'user'
    if ((!type || type === 'user') && (session.user.role === 'admin' || session.user.role === 'manager')) {
      let userQuery: any = { ...fieldQuery };
      
      // Add text search if needed
      if (searchRegex) {
        userQuery = {
          ...userQuery,
          $or: [
            { name: searchRegex },
            { email: searchRegex },
            { department: searchRegex },
            { role: searchRegex },
          ]
        };
      }
      
      const users = await UserModel.find(userQuery).limit(20);
      
      results.push(...users.map(user => ({
        type: 'user',
        id: user._id.toString(),
        title: user.name,
        subtitle: `${user.email} - ${user.department} (${user.role})`,
      })));
    }
    
    // Search addresses if no type specified or type is 'address'
    if (!type || type === 'address') {
      // For addresses, we'll search tickets but format results differently
      let addressQuery: any = { ...fieldQuery };
      
      // Only include tickets with address information
      addressQuery.streetName = { $exists: true, $ne: '' };
      
      // Add text search if needed
      if (searchRegex) {
        addressQuery = {
          ...addressQuery,
          $or: [
            { streetName: searchRegex },
            { county: searchRegex },
            { subdivision: searchRegex },
            { lotNumber: searchRegex },
            { closestIntersection: searchRegex },
          ]
        };
      }
      
      const addressTickets = await TicketModel.find(addressQuery).limit(20);
      
      results.push(...addressTickets.map(ticket => {
        const addressParts = [];
        if (ticket.streetName) addressParts.push(ticket.streetName);
        if (ticket.county) addressParts.push(ticket.county);
        
        return {
          type: 'address',
          id: ticket._id.toString(),
          title: addressParts.join(', '),
          subtitle: `${ticket.subdivision || ''} ${ticket.lotNumber ? `Lot ${ticket.lotNumber}` : ''}`.trim(),
        };
      }));
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
