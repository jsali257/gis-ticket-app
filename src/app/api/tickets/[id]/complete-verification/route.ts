import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { completeVerificationAndReturnToFrontDesk } from '@/lib/ticketUtils';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get the current session to verify the user is authenticated
    const session = await getServerSession(options);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be signed in to perform this action' },
        { status: 401 }
      );
    }
    
    // Get the ticket ID from the URL parameters
    const id = params.id.toString();
    
    // Get the note from the request body
    const { note } = await req.json();
    
    // Complete verification and return the ticket to the Front Desk
    const updatedTicket = await completeVerificationAndReturnToFrontDesk(
      id,
      note || 'Address verified, returned to Front Desk',
      session.user.id
    );
    
    if (!updatedTicket) {
      return NextResponse.json(
        { error: 'Failed to complete verification' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(updatedTicket, { status: 200 });
  } catch (error: any) {
    console.error('Error completing verification:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete verification' },
      { status: 500 }
    );
  }
}
