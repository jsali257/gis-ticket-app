import { NextRequest, NextResponse } from 'next/server';
import { getConnectedModels } from '@/lib/dbConnect';
import { generateAddressLetter } from '@/lib/generateAddressLetter';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    // Get models and connect to the database
    const { Ticket } = await getConnectedModels();
    
    // Extract the token parameter in an async context
    // This is the recommended way to handle dynamic route parameters in Next.js App Router
    const token = await params.token;

    // Use the extracted token parameter
    const signatureToken = token;

    // Parse the request body to get the signature data
    const body = await req.json();
    const { signature } = body;

    if (!signature) {
      return NextResponse.json({ error: 'Signature data is required' }, { status: 400 });
    }

    // Find the ticket with the matching signature token
    const ticket = await Ticket.findOne({ signatureToken });
    if (!ticket) {
      return NextResponse.json({ error: 'Invalid signature token or ticket not found' }, { status: 404 });
    }

    // Check if the signature has already been completed
    if (ticket.signatureCompleted) {
      return NextResponse.json({ error: 'This signature has already been completed' }, { status: 400 });
    }

    // Save the signature image to a file (in a real implementation)
    // For now, we'll just log it
    console.log(`Received signature for ticket ${ticket._id}`);
    
    // In a production environment, you would save the signature to a file or cloud storage
    // For example:
    /*
    const signatureDir = path.join(process.cwd(), 'public', 'signatures');
    if (!fs.existsSync(signatureDir)) {
      fs.mkdirSync(signatureDir, { recursive: true });
    }
    
    const signatureFileName = `${ticket._id}_${Date.now()}.png`;
    const signaturePath = path.join(signatureDir, signatureFileName);
    
    // Remove the data:image/png;base64, part
    const base64Data = signature.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(signaturePath, base64Data, 'base64');
    
    // Save the signature path to the ticket
    ticket.signaturePath = `/signatures/${signatureFileName}`;
    */

    // Save the signature to a file
    let signaturePath = '';
    try {
      const signatureDir = path.join(process.cwd(), 'public', 'signatures');
      if (!fs.existsSync(signatureDir)) {
        fs.mkdirSync(signatureDir, { recursive: true });
      }
      
      const signatureFileName = `${ticket._id}_${Date.now()}.png`;
      const signatureFilePath = path.join(signatureDir, signatureFileName);
      
      // Remove the data:image/png;base64, part
      const base64Data = signature.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(signatureFilePath, base64Data, 'base64');
      
      // Save the signature path to use in the address letter
      signaturePath = `/signatures/${signatureFileName}`;
    } catch (error) {
      console.error('Error saving signature image:', error);
      // Continue even if signature image saving fails
    }

    // Update the ticket to mark the signature as completed
    ticket.signatureCompleted = true;
    ticket.signatureCompletedAt = new Date();
    
    // Add a history entry for the signature completion
    if (!ticket.history) {
      ticket.history = [];
    }
    
    ticket.history.push({
      status: ticket.status,
      workflowStage: ticket.workflowStage,
      assignedTo: ticket.assignedTo,
      notes: 'Customer has signed and confirmed the address',
      actionBy: ticket.signatureRequestedBy, // Use the same user who requested the signature
      timestamp: new Date()
    });

    // Generate the address letter PDF
    let addressLetterPath = '';
    try {
      // Format the current date for the letter
      const formattedDate = format(new Date(), 'MM/dd/yyyy');
      
      // Generate the address letter using our utility function
      addressLetterPath = await generateAddressLetter({
        ticketnumber: ticket.ticketNumber || ticket._id.toString().substring(ticket._id.toString().length - 6),
        requestor_firstname: ticket.firstName,
        requestor_lastname: ticket.lastName,
        approvedaddress: ticket.approvedAddress || '',
        apporterinfo: ticket.propertyId || '',
        noticemessage: '',
        requestors_signature: signaturePath, // Path to the saved signature image
        signature_date: formattedDate
      });
      
      // Save the address letter path to the ticket
      ticket.addressLetterPath = addressLetterPath;
      
      // Add a history entry for the address letter generation
      ticket.history.push({
        status: ticket.status,
        workflowStage: ticket.workflowStage,
        assignedTo: ticket.assignedTo,
        notes: 'Address letter generated automatically',
        actionBy: ticket.signatureRequestedBy,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error generating address letter:', error);
      // Continue even if address letter generation fails
    }

    // Save the updated ticket
    await ticket.save();

    // Return success response with address letter path if available
    return NextResponse.json({
      success: true,
      message: 'Signature completed successfully',
      addressLetterPath: addressLetterPath || null
    });
  } catch (error) {
    console.error('Error completing signature:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to complete signature' },
      { status: 500 }
    );
  }
}
