import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getConnectedModels } from '@/lib/dbConnect';
import { assignTicketToRandomGISVerifier } from '@/lib/ticketUtils';

// POST /api/tickets/[id]/transition - Transition a ticket to a new workflow stage
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Explicitly await the params object as recommended in the error message
    // https://nextjs.org/docs/messages/sync-dynamic-apis
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id.toString();
    
    // Parse the request body
    const body = await req.json();
    const { targetStage, note, performedById, approvedAddress, verificationNote } = body;
    
    // Debug: Log the verification note if present
    if (verificationNote) {
      console.log('Received verification note:', verificationNote);
    }
    
    // Validate required fields
    if (!targetStage) {
      return NextResponse.json(
        { error: 'Target stage is required' },
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
    
    // Get models after ensuring DB connection
    const { Ticket } = await getConnectedModels();
    
    // Find the ticket first to get current data
    const ticket = await Ticket.findById(id);
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }
    
    // Prepare the update data
    const updateData: any = {
      workflowStage: targetStage,
      updatedAt: Date.now()
    };
    
    // Set appropriate status based on target stage
    if (targetStage === 'Completed') {
      updateData.status = 'Resolved';
      updateData.addressVerified = true;
    } else if (targetStage === 'Verification') {
      console.log('===== VERIFICATION TRANSITION DETECTED =====');
      console.log('Ticket ID:', id);
      console.log('Performed by ID:', performedById);
      
      // Get the current ticket to find out who it's currently assigned to
      const currentTicket = await mongoose.model('Ticket').findById(id).lean();
      const currentAssigneeId = currentTicket?.assignedTo?.toString();
      console.log('Current assignee ID:', currentAssigneeId);
      
      // Find all available GIS staff (not just verifiers)
      const User = mongoose.model('User');
      const availableGISStaff = await User.find({
        department: 'GIS',
        isAvailableForAssignment: true,
        ...(currentAssigneeId ? { _id: { $ne: currentAssigneeId } } : {}) // Exclude current assignee if exists
      }).lean();
      
      // First convert to unknown, then to the specific type we need
      const typedGISStaff = (availableGISStaff as unknown) as Array<{
        _id: mongoose.Types.ObjectId;
        name: string;
        email?: string;
      }>;
      
      console.log('Available GIS staff (excluding current assignee):', 
        typedGISStaff.map(s => ({ id: s._id.toString(), name: s.name })));
      
      if (typedGISStaff.length > 0) {
        // Randomly select a different GIS staff member
        const randomIndex = Math.floor(Math.random() * typedGISStaff.length);
        const selectedStaff = typedGISStaff[randomIndex];
        console.log('Selected different GIS staff:', selectedStaff.name);
        
        // Directly assign to the selected staff - separate regular fields from $push
        const regularUpdateData: any = {
          assignedTo: selectedStaff._id,
          status: 'In Progress',
          addressCreated: true,
          workflowStage: 'Verification',
          updatedAt: Date.now()
        };
        
        // Create history entry
        const historyEntry = {
          workflowStage: 'Verification',
          assignedTo: selectedStaff._id,
          notes: `Ticket automatically assigned to ${selectedStaff.name} for verification`,
          actionBy: performedById ? new mongoose.Types.ObjectId(performedById) : undefined,
          timestamp: Date.now()
        };
        
        // First update the regular fields
        const db = mongoose.connection;
        const ticketsCollection = db.collection('tickets');
        
        // Include the approved address if provided
        if (body.approvedAddress) {
          regularUpdateData.approvedAddress = body.approvedAddress;
        }
        
        // Update the regular fields first
        await ticketsCollection.updateOne(
          { _id: new mongoose.Types.ObjectId(id) },
          { $set: regularUpdateData }
        );
        
        // Then push to the history array in a separate operation
        await ticketsCollection.updateOne(
          { _id: new mongoose.Types.ObjectId(id) },
          { $push: { history: historyEntry } as any }
        );
        
        console.log('Direct assignment successful');
        
        // Fetch the updated ticket to return
        const updatedTicket = await mongoose.model('Ticket')
          .findById(id)
          .populate('assignedTo', 'name email')
          .populate('createdBy', 'name email');
          
        // Return the updated ticket
        return NextResponse.json(updatedTicket, { status: 200 });
      } else {
        // If no other GIS staff available, try the original function as fallback
        console.log('No other GIS staff available, trying original function...');
        if (performedById) {
          const assignedTicket = await assignTicketToRandomGISVerifier(id, performedById);
          console.log('Result of assignment:', assignedTicket ? 'Success' : 'Failed');
          
          if (assignedTicket) {
            // If successful, include the approved address and return the assigned ticket
            if (body.approvedAddress) {
              console.log('Updating approved address:', body.approvedAddress);
              // Update the approved address separately since the assignment already happened
              const db = mongoose.connection;
              const ticketsCollection = db.collection('tickets');
              await ticketsCollection.updateOne(
                { _id: new mongoose.Types.ObjectId(id) },
                { $set: { approvedAddress: body.approvedAddress } }
              );
            }
            
            console.log('Returning assigned ticket');
            return NextResponse.json(assignedTicket, { status: 200 });
          } else {
            console.log('Automatic assignment failed, using fallback');
          }
        } else {
          console.log('No performedById provided, cannot assign automatically');
        }
        
        // Fallback if automatic assignment fails
        console.log('Using fallback assignment method');
        updateData.status = 'In Progress';
        updateData.addressCreated = true;
      }
      
      // Include the approved address if provided
      if (body.approvedAddress) {
        updateData.approvedAddress = body.approvedAddress;
      }
    } else if (targetStage === 'Addressing') {
      updateData.status = 'In Progress';
      
      // If returning to Addressing with a verification note, save it
      if (verificationNote) {
        console.log('Saving verification note for Addressing stage:', verificationNote);
        updateData.verificationNote = verificationNote;
      }
    }
    
    // Create history entry
    const historyEntry = {
      workflowStage: targetStage,
      notes: note || `Transitioned to ${targetStage}`,
      actionBy: new mongoose.Types.ObjectId(performedById || '507f1f77bcf86cd799439011'),
      timestamp: Date.now()
    };
    
    // Use direct MongoDB operations to bypass Mongoose validation
    const db = mongoose.connection;
    const ticketsCollection = db.collection('tickets');
    
    // Update the ticket using direct MongoDB operations
    const updateOperation: any = {
      $set: updateData
    };
    
    // Add the history entry
    updateOperation.$push = { history: historyEntry };
    
    const result = await ticketsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      updateOperation
    );
    
    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update ticket' },
        { status: 500 }
      );
    }
    
    // Fetch the updated ticket
    const updatedTicket = await Ticket.findById(id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    
    return NextResponse.json(updatedTicket, { status: 200 });
  } catch (error) {
    console.error('Error transitioning ticket:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Failed to transition ticket', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to transition ticket' },
      { status: 500 }
    );
  }
}
