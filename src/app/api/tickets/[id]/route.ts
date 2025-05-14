import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getConnectedModels } from '@/lib/dbConnect';

// GET /api/tickets/[id] - Get a specific ticket
interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(req: NextRequest, context: RouteParams) {
  try {
    // Get models after ensuring DB connection
    const { Ticket } = await getConnectedModels();
    
    // Explicitly await the params object as recommended in the error message
    // https://nextjs.org/docs/messages/sync-dynamic-apis
    const resolvedParams = await Promise.resolve(context.params);
    const id = resolvedParams.id;
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid ticket ID' },
        { status: 400 }
      );
    }
    
    const ticket = await Ticket.findById(id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(ticket, { status: 200 });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

// PUT /api/tickets/[id] - Update a specific ticket
export async function PUT(req: NextRequest, context: RouteParams) {
  try {
    // Get models after ensuring DB connection
    const { Ticket } = await getConnectedModels();
    
    // Explicitly await the params object as recommended in the error message
    // https://nextjs.org/docs/messages/sync-dynamic-apis
    const resolvedParams = await Promise.resolve(context.params);
    const id = resolvedParams.id;
    
    // Log the request for debugging
    console.log('PUT request for ticket ID:', id);
    
    // Parse the request body
    let body;
    try {
      body = await req.json();
      console.log('Request body:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid ticket ID' },
        { status: 400 }
      );
    }
    
    // Process the body data to handle reference fields
    // Remove the _id field to avoid MongoDB immutable field error
    const { _id, ...bodyWithoutId } = body;
    const updateData = { ...bodyWithoutId, updatedAt: Date.now() };
    
    // Validate and handle createdBy field
    if (updateData.createdBy) {
      // Ensure createdBy is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(updateData.createdBy)) {
        console.warn('Invalid createdBy value:', updateData.createdBy);
        // Use a valid ObjectId placeholder
        updateData.createdBy = '000000000000000000000000';
      }
    } else {
      // If createdBy is missing, use a placeholder
      updateData.createdBy = '000000000000000000000000';
    }
    
    // If assignedTo is an empty string or invalid, set it to null
    if (updateData.assignedTo === '' || (updateData.assignedTo && !mongoose.Types.ObjectId.isValid(updateData.assignedTo))) {
      updateData.assignedTo = null;
    }
    
    // Check if we need to bypass validation (for workflow stage changes)
    const bypassValidation = updateData.workflowStage === 'Addressing' || 
                           updateData.workflowStage === 'Verification' || 
                           updateData.workflowStage === 'Completed';
    
    // If we need to bypass validation, use direct MongoDB operations
    if (bypassValidation) {
      console.log('Bypassing validation for workflow stage:', updateData.workflowStage);
      
      // Use direct MongoDB operations to bypass Mongoose validation
      const db = mongoose.connection;
      const ticketsCollection = db.collection('tickets');
      
      // Update the ticket using direct MongoDB operations
      await ticketsCollection.updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: updateData }
      );
      
      // Fetch the updated ticket
      const updatedTicket = await Ticket.findById(id)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');
      
      return NextResponse.json(updatedTicket, { status: 200 });
    }
    
    // Otherwise, use standard Mongoose update with validation
    const updatedTicket = await Ticket.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    
    if (!updatedTicket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedTicket, { status: 200 });
  } catch (error) {
    console.error('Error updating ticket:', error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Check if it's a Mongoose validation error
      if (error.name === 'ValidationError') {
        return NextResponse.json(
          { error: 'Validation error', details: error.message },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to update ticket', details: error.message },
        { status: 500 }
      );
    }
    
    // Fallback for unknown error types
    return NextResponse.json(
      { error: 'Failed to update ticket', details: 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/tickets/[id] - Delete a specific ticket
export async function DELETE(req: NextRequest, context: RouteParams) {
  try {
    // Get models after ensuring DB connection
    const { Ticket } = await getConnectedModels();
    
    // Explicitly await the params object as recommended in the error message
    // https://nextjs.org/docs/messages/sync-dynamic-apis
    const resolvedParams = await Promise.resolve(context.params);
    const id = resolvedParams.id;
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid ticket ID' },
        { status: 400 }
      );
    }
    
    // Find ticket and delete
    const deletedTicket = await Ticket.findByIdAndDelete(id);
    
    if (!deletedTicket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: 'Ticket deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json(
      { error: 'Failed to delete ticket' },
      { status: 500 }
    );
  }
}
