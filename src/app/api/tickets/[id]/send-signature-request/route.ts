import { NextRequest, NextResponse } from 'next/server';
import { getConnectedModels } from '@/lib/dbConnect';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get models and connect to the database
    const { Ticket } = await getConnectedModels();

    // Get the current user session
    const session = await getServerSession(options);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the ticket ID from the URL params
    const ticketId = params.id;

    // Find the ticket
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check if the ticket is in the correct stage
    if (ticket.workflowStage !== 'Ready to Contact Customer') {
      return NextResponse.json(
        { error: 'Ticket must be in Ready to Contact Customer stage to send signature request' },
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

    // Generate a unique signature token
    const signatureToken = generateSignatureToken();

    // Update the ticket with the signature token and set signatureRequested to true
    ticket.signatureToken = signatureToken;
    ticket.signatureRequested = true;
    ticket.signatureRequestedAt = new Date();
    ticket.signatureRequestedBy = session.user.id;
    
    // Add a history entry for the signature request
    if (!ticket.history) {
      ticket.history = [];
    }
    
    ticket.history.push({
      status: ticket.status,
      workflowStage: ticket.workflowStage,
      assignedTo: ticket.assignedTo,
      notes: 'Signature request sent to customer',
      actionBy: session.user.id, // This is required
      timestamp: new Date()
    });

    // Save the ticket
    await ticket.save();

    // In a real implementation, you would send an email here
    // For now, we'll simulate it by logging the email content
    console.log(`Sending signature request email to ${ticket.email}`);
    console.log(`Signature token: ${signatureToken}`);
    console.log(`Ticket number: ${ticket.ticketNumber || ticket._id.toString().substring(ticket._id.toString().length - 6)}`);
    console.log(`Approved address: ${ticket.approvedAddress}`);

    // Create a signature URL that would be included in the email
    // Use the request's host if NEXTAUTH_URL is not available
    const host = process.env.NEXTAUTH_URL || `http://${req.headers.get('host')}`;
    const signatureUrl = `${host}/signature/${signatureToken}`;
    console.log(`Signature URL: ${signatureUrl}`);
    
    // Example email content that would be sent
    const emailContent = `
Dear ${ticket.firstName} ${ticket.lastName},

We are pleased to inform you that your address request has been processed and verified.
Your official address is:

${ticket.approvedAddress}

To complete the process, we need your signature confirming that you accept this address.
Please click on the link below to sign electronically:

${signatureUrl}

Your ticket number is: ${ticket.ticketNumber || ticket._id.toString().substring(ticket._id.toString().length - 6)}

Once you've signed, we'll generate an official address letter for your records.

Thank you,
GIS Department
`;
    
    console.log('Email content that would be sent:');
    console.log(emailContent);

    // In a production environment, you would use a service like SendGrid, AWS SES, etc.
    // to send the actual email with the signature URL

    // Return success response with the updated ticket
    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error sending signature request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send signature request' },
      { status: 500 }
    );
  }
}

// Helper function to generate a random signature token
function generateSignatureToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
