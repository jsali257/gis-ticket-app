import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { transferToAddressVerification } from '@/lib/ticketUtils';

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
    
    // Transfer the ticket to the verification stage
    const updatedTicket = await transferToAddressVerification(
      id,
      note || 'Address created, transferred for verification',
      session.user.id
    );
    
    if (!updatedTicket) {
      return NextResponse.json(
        { error: 'Failed to transfer ticket to verification' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(updatedTicket, { status: 200 });
  } catch (error: any) {
    console.error('Error transferring ticket to verification:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to transfer ticket to verification' },
      { status: 500 }
    );
  }
}
