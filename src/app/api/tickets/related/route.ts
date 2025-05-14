import { NextRequest, NextResponse } from 'next/server';
import { getConnectedModels } from '@/lib/dbConnect';

// GET /api/tickets/related - Get tickets related by propertyId
export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get('ticketId');
    const propertyId = searchParams.get('propertyId');
    
    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }
    
    // Get models after ensuring DB connection
    const { Ticket } = await getConnectedModels();
    
    // Find all tickets with the same propertyId, excluding the current ticket
    const query: any = { propertyId };
    
    // Exclude the current ticket if ticketId is provided
    if (ticketId) {
      query._id = { $ne: ticketId };
    }
    
    const relatedTickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .lean();
    
    return NextResponse.json(relatedTickets, { status: 200 });
  } catch (error) {
    console.error('Error fetching related tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch related tickets' },
      { status: 500 }
    );
  }
}
