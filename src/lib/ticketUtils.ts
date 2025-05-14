import { getConnectedModels } from './dbConnect';
import mongoose from 'mongoose';

/**
 * Utility functions for ticket management and workflow
 */

/**
 * Randomly assigns a ticket to an available GIS verifier
 * @param ticketId The ID of the ticket to assign
 * @param performedById The ID of the user performing the assignment
 * @returns The updated ticket or null if assignment failed
 */
export async function assignTicketToRandomGISVerifier(ticketId: string, performedById: string) {
  try {
    console.log('Starting assignTicketToRandomGISVerifier for ticket:', ticketId);
    // Get models after ensuring DB connection
    const { Ticket, User } = await getConnectedModels();
    
    // Find all available GIS verifiers
    console.log('Looking for GIS verifiers...');
    const availableVerifiersResult = await User.find({
      department: 'GIS',
      role: 'gis_verifier',
      isAvailableForAssignment: true
    }).lean();
    
    console.log('Available verifiers found:', availableVerifiersResult);
    
    // As a fallback, if no verifiers are found, look for any GIS staff
    if (!availableVerifiersResult || availableVerifiersResult.length === 0) {
      console.log('No GIS verifiers found, looking for any GIS staff as fallback...');
      const anyGISStaffResult = await User.find({
        department: 'GIS',
        isAvailableForAssignment: true
      }).lean();
      
      console.log('Available GIS staff found as fallback:', anyGISStaffResult);
      
      // Use double type assertion to safely convert MongoDB results
      const availableStaff = anyGISStaffResult as unknown as Array<{
        _id: mongoose.Types.ObjectId;
        name: string;
        email: string;
        department: string;
        role: string;
        isAvailableForAssignment: boolean;
      }>;
      
      if (!availableStaff || availableStaff.length === 0) {
        console.error('No available GIS staff found for assignment');
        return null;
      }
      
      // First, get the current ticket to find out who it's currently assigned to
      const currentTicket = await Ticket.findById(ticketId).populate('assignedTo').lean();
      console.log('Current ticket:', currentTicket);
      
      // Define a type for the populated ticket to handle assignedTo properly
      type PopulatedTicket = {
        _id: mongoose.Types.ObjectId;
        assignedTo?: {
          _id: mongoose.Types.ObjectId;
          name: string;
          email: string;
        } | string | null;
      };
      
      // Cast the ticket to the populated type
      const populatedTicket = currentTicket as unknown as PopulatedTicket;
      
      // Safely access the assignedTo field, which might be a string ID or an object with _id
      const currentAssigneeId = populatedTicket?.assignedTo ? 
        (typeof populatedTicket.assignedTo === 'object' ? 
          (populatedTicket.assignedTo as { _id: mongoose.Types.ObjectId })._id?.toString() : 
          populatedTicket.assignedTo.toString()) : 
        null;
      console.log('Current assignee ID:', currentAssigneeId);
      
      // Filter out the current assignee from the available staff
      const eligibleStaff = currentAssigneeId
        ? availableStaff.filter(staff => staff._id.toString() !== currentAssigneeId)
        : availableStaff;
      
      console.log('Eligible staff after filtering current assignee:', eligibleStaff.map(s => s.name));
      
      // If no eligible staff after filtering, use all available staff as a last resort
      const staffToUse = eligibleStaff.length > 0 ? eligibleStaff : availableStaff;
      
      // Use any GIS staff as fallback
      const randomIndex = Math.floor(Math.random() * staffToUse.length);
      const selectedStaff = staffToUse[randomIndex];
      console.log('Selected GIS staff (fallback):', selectedStaff.name);
      
      // Update the ticket with the new assignment
      const updatedTicket = await Ticket.findByIdAndUpdate(
        ticketId,
        {
          assignedTo: selectedStaff._id,
          status: 'In Progress',
          workflowStage: 'Verification',
          addressCreated: true,
          updatedAt: Date.now(),
          $push: {
            history: {
              workflowStage: 'Verification',
              assignedTo: selectedStaff._id,
              notes: `Ticket automatically assigned to ${selectedStaff.name} for verification (no dedicated verifiers available)`,
              actionBy: new mongoose.Types.ObjectId(performedById),
              timestamp: Date.now()
            }
          }
        },
        { new: true }
      )
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');
      
      console.log('Ticket updated with fallback assignment:', updatedTicket?._id);
      return updatedTicket;
    }
    
    // Use double type assertion to safely convert MongoDB results
    const availableVerifiers = availableVerifiersResult as unknown as Array<{
      _id: mongoose.Types.ObjectId;
      name: string;
      email: string;
      department: string;
      role: string;
      isAvailableForAssignment: boolean;
    }>;
    
    if (!availableVerifiers || availableVerifiers.length === 0) {
      console.error('No available GIS verifiers found for assignment');
      return null;
    }
    
    // First, get the current ticket to find out who it's currently assigned to
    const currentTicket = await Ticket.findById(ticketId).populate('assignedTo').lean();
    console.log('Current ticket:', currentTicket);
    
    // Define a type for the populated ticket to handle assignedTo properly
    type PopulatedTicket = {
      _id: mongoose.Types.ObjectId;
      assignedTo?: {
        _id: mongoose.Types.ObjectId;
        name: string;
        email: string;
      } | string | null;
    };
    
    // Cast the ticket to the populated type
    const populatedTicket = currentTicket as unknown as PopulatedTicket;
    
    // Safely access the assignedTo field, which might be a string ID or an object with _id
    const currentAssigneeId = populatedTicket?.assignedTo ? 
      (typeof populatedTicket.assignedTo === 'object' ? 
        (populatedTicket.assignedTo as { _id: mongoose.Types.ObjectId })._id?.toString() : 
        populatedTicket.assignedTo.toString()) : 
      null;
    console.log('Current assignee ID:', currentAssigneeId);
    
    // Filter out the current assignee from the available verifiers
    const eligibleVerifiers = currentAssigneeId
      ? availableVerifiers.filter(verifier => verifier._id.toString() !== currentAssigneeId)
      : availableVerifiers;
    
    console.log('Eligible verifiers after filtering current assignee:', eligibleVerifiers.map(v => v.name));
    
    // If no eligible verifiers after filtering, use all available verifiers as a last resort
    const verifiersToUse = eligibleVerifiers.length > 0 ? eligibleVerifiers : availableVerifiers;
    
    // Randomly select a verifier
    const randomIndex = Math.floor(Math.random() * verifiersToUse.length);
    const selectedVerifier = verifiersToUse[randomIndex];
    
    // Update the ticket with the new assignment
    const updatedTicket = await Ticket.findByIdAndUpdate(
      ticketId,
      {
        assignedTo: selectedVerifier._id,
        status: 'In Progress',
        workflowStage: 'Verification',
        addressCreated: true,
        updatedAt: Date.now(),
        $push: {
          history: {
            workflowStage: 'Verification',
            assignedTo: selectedVerifier._id,
            notes: `Ticket automatically assigned to ${selectedVerifier.name} for verification`,
            actionBy: new mongoose.Types.ObjectId(performedById),
            timestamp: Date.now()
          }
        }
      },
      { new: true }
    )
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    
    return updatedTicket;
  } catch (error) {
    console.error('Error assigning ticket to GIS verifier:', error);
    return null;
  }
}

/**
 * Randomly assigns a ticket to an available GIS staff member
 * @param ticketId The ID of the ticket to assign
 * @param performedById The ID of the user performing the assignment
 * @returns The updated ticket or null if assignment failed
 */
export async function assignTicketToRandomGISStaff(ticketId: string, performedById: string) {
  try {
    // Get models after ensuring DB connection
    const { Ticket, User } = await getConnectedModels();
    
    // Find all available GIS staff members
    const availableStaffResult = await User.find({
      department: 'GIS',
      role: 'gis_staff',
      isAvailableForAssignment: true
    }).lean();
    
    // Use double type assertion to safely convert MongoDB results
    const availableStaff = availableStaffResult as unknown as Array<{
      _id: mongoose.Types.ObjectId;
      name: string;
      email: string;
      department: string;
      role: string;
      isAvailableForAssignment: boolean;
    }>;
    
    if (!availableStaff || availableStaff.length === 0) {
      console.error('No available GIS staff members found for assignment');
      return null;
    }
    
    // Randomly select a staff member
    const randomIndex = Math.floor(Math.random() * availableStaff.length);
    const selectedStaff = availableStaff[randomIndex];
    
    // Update the ticket with the new assignment
    const updatedTicket = await Ticket.findByIdAndUpdate(
      ticketId,
      {
        assignedTo: selectedStaff._id,
        status: 'In Progress',
        workflowStage: 'Addressing',
        updatedAt: Date.now(),
        $push: {
          history: {
            workflowStage: 'Addressing',
            assignedTo: selectedStaff._id,
            notes: `Ticket automatically assigned to ${selectedStaff.name}`,
            actionBy: new mongoose.Types.ObjectId(performedById),
            timestamp: Date.now()
          }
        }
      },
      { new: true }
    ).populate('assignedTo', 'name email');
    
    return updatedTicket;
  } catch (error) {
    console.error('Error assigning ticket to random GIS staff:', error);
    return null;
  }
}

/**
 * Transfers a ticket to the Address Verification stage
 * @param ticketId The ID of the ticket to transfer
 * @param note Optional note about the address creation
 * @param performedById The ID of the user performing the transfer
 * @returns The updated ticket or null if transfer failed
 */
export async function transferToAddressVerification(ticketId: string, note: string, performedById: string) {
  try {
    // Get models after ensuring DB connection
    const { Ticket, User } = await getConnectedModels();
    
    // Find available GIS verifiers
    const availableVerifiersResult = await User.find({
      department: 'GIS',
      role: 'gis_verifier',
      isAvailableForAssignment: true
    }).lean();
    
    // Use double type assertion to safely convert MongoDB results
    const availableVerifiers = availableVerifiersResult as unknown as Array<{
      _id: mongoose.Types.ObjectId;
      name: string;
      email: string;
      department: string;
      role: string;
      isAvailableForAssignment: boolean;
    }>;
    
    // If no verifiers are available, still proceed but leave unassigned
    let selectedVerifier = null;
    let assignmentNote = '';
    
    if (!availableVerifiers || availableVerifiers.length === 0) {
      console.warn('No available GIS verifiers found for assignment. Ticket will be unassigned.');
      assignmentNote = 'Transferred to verification stage. No available verifiers for automatic assignment.';
    } else {
      // Randomly select a verifier
      const randomIndex = Math.floor(Math.random() * availableVerifiers.length);
      selectedVerifier = availableVerifiers[randomIndex];
      assignmentNote = `Assigned to ${selectedVerifier.name} for verification`;
    }
    
    // Update the ticket with the new assignment
    const updateData: any = {
      status: 'In Progress',
      workflowStage: 'Verification',
      addressCreated: true,
      updatedAt: Date.now(),
      $push: {
        history: {
          workflowStage: 'Verification',
          notes: note || 'Address created, transferred for verification',
          actionBy: new mongoose.Types.ObjectId(performedById),
          timestamp: Date.now()
        }
      }
    };
    
    // Add assignedTo field only if we have a verifier
    if (selectedVerifier) {
      updateData.assignedTo = selectedVerifier._id;
      // Add assignedTo to history as well
      updateData.$push.history.assignedTo = selectedVerifier._id;
    } else {
      // If no verifier is available, set assignedTo to null
      updateData.assignedTo = null;
    }
    
    // Update the ticket
    const updatedTicket = await Ticket.findByIdAndUpdate(
      ticketId,
      updateData,
      { new: true }
    ).populate('assignedTo', 'name email');
    
    return updatedTicket;
  } catch (error) {
    console.error('Error transferring ticket to address verification:', error);
    return null;
  }
}

/**
 * Completes the verification process and returns the ticket to the Front Desk
 * @param ticketId The ID of the ticket to complete
 * @param note Optional verification note
 * @param performedById The ID of the user performing the completion
 * @returns The updated ticket or null if completion failed
 */
export async function completeVerificationAndReturnToFrontDesk(ticketId: string, note: string, performedById: string) {
  try {
    // Get models after ensuring DB connection
    const { Ticket, User } = await getConnectedModels();
    
    // Find front desk staff to return the ticket to
    const frontDeskStaff = await User.findOne({
      department: 'Front Desk',
      role: 'front_desk',
      isAvailableForAssignment: true
    }).lean() as { _id: mongoose.Types.ObjectId; name: string; } | null;
    
    // If no front desk staff is available, just mark as completed without assignment
    const assignTo = frontDeskStaff ? frontDeskStaff._id : null;
    let assignmentNote = '';
    
    if (frontDeskStaff) {
      assignmentNote = `Verification completed. Returned to ${frontDeskStaff.name} at Front Desk.`;
    } else {
      assignmentNote = 'Verification completed. No Front Desk staff available for automatic assignment.';
      console.warn('No available Front Desk staff found for assignment. Ticket will be unassigned.');
    }
    
    // Update the ticket
    const updatedTicket = await Ticket.findByIdAndUpdate(
      ticketId,
      {
        assignedTo: assignTo,
        status: 'Completed',
        workflowStage: 'Ready to Contact Customer',
        addressVerified: true,
        verificationNotes: note || 'Address verified',
        updatedAt: Date.now(),
        $push: {
          history: {
            workflowStage: 'Ready to Contact Customer',
            assignedTo: assignTo,
            notes: note || assignmentNote,
            actionBy: new mongoose.Types.ObjectId(performedById),
            timestamp: Date.now()
          }
        }
      },
      { new: true }
    ).populate('assignedTo', 'name email');
    
    return updatedTicket;
  } catch (error) {
    console.error('Error completing verification and returning to front desk:', error);
    return null;
  }
}

/**
 * Closes a completed ticket
 * @param ticketId The ID of the ticket to close
 * @param note Optional closing note
 * @param performedById The ID of the user closing the ticket
 * @returns The updated ticket or null if closing failed
 */
export async function closeTicket(ticketId: string, note: string, performedById: string) {
  try {
    // Get models after ensuring DB connection
    const { Ticket } = await getConnectedModels();
    
    // Update the ticket
    const updatedTicket = await Ticket.findByIdAndUpdate(
      ticketId,
      {
        status: 'Closed',
        updatedAt: Date.now(),
        $push: {
          history: {
            workflowStage: 'Completed',
            notes: note || 'Ticket closed',
            actionBy: new mongoose.Types.ObjectId(performedById),
            timestamp: Date.now()
          }
        }
      },
      { new: true }
    );
    
    return updatedTicket;
  } catch (error) {
    console.error('Error closing ticket:', error);
    return null;
  }
}
