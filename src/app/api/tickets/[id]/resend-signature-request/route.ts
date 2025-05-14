import { NextRequest, NextResponse } from 'next/server';
import { getConnectedModels } from '@/lib/dbConnect';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get models and connect to the database
    const { Ticket } = await getConnectedModels();
    
    // Extract the id parameter in an async context
    // This is the recommended way to handle dynamic route parameters in Next.js App Router
    const id = await params.id;

    // Get the current user session
    const session = await getServerSession(options);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use the extracted id parameter
    const ticketId = id;

    // Find the ticket
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check if the ticket is in the correct stage
    if (ticket.workflowStage !== 'Ready to Contact Customer') {
      return NextResponse.json(
        { error: 'Ticket must be in Ready to Contact Customer stage to resend signature request' },
        { status: 400 }
      );
    }

    // Check if the ticket has an email
    if (!ticket.email) {
      return NextResponse.json(
        { error: 'Ticket does not have an email address to send the signature request to' },
        { status: 400 }
      );
    }

    // Generate a new signature token
    const signatureToken = generateSignatureToken();

    // Update the ticket with the new signature token and reset signature status
    ticket.signatureToken = signatureToken;
    ticket.signatureRequested = true;
    ticket.signatureRequestedAt = new Date();
    ticket.signatureRequestedBy = session.user.id;
    ticket.signatureCompleted = false;
    ticket.signatureCompletedAt = undefined;
    
    // Add a history entry for the resent signature request
    if (!ticket.history) {
      ticket.history = [];
    }
    
    ticket.history.push({
      status: ticket.status,
      workflowStage: ticket.workflowStage,
      assignedTo: ticket.assignedTo,
      notes: 'Signature request resent to customer',
      actionBy: session.user.id, // This is required
      timestamp: new Date()
    });

    // Save the ticket
    await ticket.save();

    // In a real implementation, you would send an email here
    // For now, we'll simulate it by logging the email content
    console.log(`Resending signature request email to ${ticket.email}`);
    console.log(`New signature token: ${signatureToken}`);
    console.log(`Ticket number: ${ticket.ticketNumber || ticket._id.toString().substring(ticket._id.toString().length - 6)}`);
    console.log(`Approved address: ${ticket.approvedAddress}`);

    // Create a signature URL that would be included in the email
    // Use the request's host if NEXTAUTH_URL is not available
    const host = process.env.NEXTAUTH_URL || `http://${req.headers.get('host')}`;
    const signatureUrl = `${host}/signature/${signatureToken}`;
    console.log(`New signature URL: ${signatureUrl}`);
    
    // Example email content that would be sent
    const emailContent = `
Dear ${ticket.firstName} ${ticket.lastName},

This is a reminder that we need your signature to confirm your address.
Your official address is:

${ticket.approvedAddress}

Please click on the link below to sign electronically:

${signatureUrl}

Your ticket number is: ${ticket.ticketNumber || ticket._id.toString().substring(ticket._id.toString().length - 6)}

Once you've signed, we'll generate an official address letter for your records.

Thank you,
GIS Department
`;
    
    console.log('Email content that would be sent:');
    console.log(emailContent);

    // Return success response with the updated ticket
    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error resending signature request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to resend signature request' },
      { status: 500 }
    );
  }
}

// Helper function to generate a random signature token
function generateSignatureToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
