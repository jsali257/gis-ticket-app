import { getConnectedModels } from './dbConnect';
import { calculatePriorityFromDueDate, getBusinessDaysBetween } from './dateUtils';

/**
 * Updates the priority of all active tickets based on their due date
 * @returns The number of tickets updated
 */
export async function updateTicketPriorities(): Promise<number> {
  try {
    // Get models after ensuring DB connection
    const { Ticket } = await getConnectedModels();
    
    // Get current date
    const currentDate = new Date();
    
    // Find all active tickets (not Completed or Closed)
    const activeTickets = await Ticket.find({
      status: { $nin: ['Completed', 'Closed'] },
      dueDate: { $exists: true }
    });
    
    let updatedCount = 0;
    
    // Update each ticket's priority based on due date
    for (const ticket of activeTickets) {
      const newPriority = calculatePriorityFromDueDate(ticket.dueDate, currentDate);
      
      // Only update if priority has changed
      if (ticket.priority !== newPriority) {
        ticket.priority = newPriority;
        await ticket.save();
        updatedCount++;
      }
      
      // Also update timeToResolve field (business days remaining)
      // Calculate business days between current date and due date, excluding weekends
      const dueDate = new Date(ticket.dueDate);
      const businessDaysRemaining = Math.max(0, getBusinessDaysBetween(currentDate, dueDate));
      
      if (ticket.timeToResolve !== businessDaysRemaining) {
        ticket.timeToResolve = businessDaysRemaining;
        await ticket.save();
      }
    }
    
    return updatedCount;
  } catch (error) {
    console.error('Error updating ticket priorities:', error);
    return 0;
  }
}
