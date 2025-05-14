import { NextRequest, NextResponse } from 'next/server';
import { updateTicketPriorities } from '@/lib/ticketPriorityUpdater';

// POST /api/tickets/update-priorities - Update all ticket priorities
export async function POST(req: NextRequest) {
  try {
    // Check for authorization (in a real app, you would validate an API key or admin access)
    const { searchParams } = new URL(req.url);
    const apiKey = searchParams.get('apiKey');
    
    // Simple API key check - in production, use a more secure approach
    if (apiKey !== process.env.PRIORITY_UPDATE_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Update ticket priorities
    const updatedCount = await updateTicketPriorities();
    
    return NextResponse.json({ 
      success: true, 
      message: `Updated priorities for ${updatedCount} tickets`,
      updatedCount 
    }, { status: 200 });
  } catch (error) {
    console.error('Error in priority update API:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket priorities' },
      { status: 500 }
    );
  }
}
