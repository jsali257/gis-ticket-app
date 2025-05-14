import { NextRequest, NextResponse } from 'next/server';
import { getConnectedModels } from '@/lib/dbConnect';

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    // Get models and connect to the database
    const { Ticket } = await getConnectedModels();
    
    // Extract the token parameter in an async context
    // This is the recommended way to handle dynamic route parameters in Next.js App Router
    const token = await params.token;
    const signatureToken = token;

    // Find the ticket with the matching signature token
    const ticket = await Ticket.findOne({ signatureToken });
    if (!ticket) {
      return NextResponse.json({ error: 'Invalid signature token or ticket not found' }, { status: 404 });
    }

    // Check if the signature has already been completed
    if (ticket.signatureCompleted) {
      return NextResponse.json({ error: 'This signature has already been completed' }, { status: 400 });
    }

    // Return a sanitized version of the ticket with only the necessary information
    return NextResponse.json({
      _id: ticket._id,
      firstName: ticket.firstName,
      lastName: ticket.lastName,
      approvedAddress: ticket.approvedAddress,
      ticketNumber: ticket.ticketNumber,
      signatureRequested: ticket.signatureRequested,
      signatureRequestedAt: ticket.signatureRequestedAt
    });
  } catch (error) {
    console.error('Error fetching ticket by signature token:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}
