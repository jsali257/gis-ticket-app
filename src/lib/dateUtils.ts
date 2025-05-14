/**
 * Utility functions for date calculations
 */

/**
 * Adds a specified number of business days to a date
 * @param date The starting date
 * @param days The number of business days to add
 * @returns A new date with the business days added
 */
export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  let daysAdded = 0;
  
  while (daysAdded < days) {
    // Add one day
    result.setDate(result.getDate() + 1);
    
    // Check if it's a weekend (0 = Sunday, 6 = Saturday)
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysAdded++;
    }
  }
  
  return result;
}

/**
 * Calculates the number of business days between two dates
 * @param startDate The starting date
 * @param endDate The ending date
 * @returns The number of business days between the dates (negative if endDate is before startDate)
 */
export function getBusinessDaysBetween(startDate: Date, endDate: Date): number {
  // Normalize dates to midnight to avoid time-of-day issues
  const start = new Date(startDate.getTime());
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate.getTime());
  end.setHours(0, 0, 0, 0);
  
  // Check if dates are in reverse order (for overdue calculation)
  if (end < start) {
    // Calculate business days in reverse and return negative value
    return -getBusinessDaysBetween(end, start);
  }
  
  let count = 0;
  const curDate = new Date(start.getTime());
  
  while (curDate <= end) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  
  return count;
}

/**
 * Calculates the priority based on remaining business days
 * @param dueDate The due date
 * @param currentDate The current date (defaults to now)
 * @returns The priority based on remaining days
 */
export function calculatePriorityFromDueDate(dueDate: Date, currentDate: Date = new Date()): string {
  const businessDaysRemaining = getBusinessDaysBetween(currentDate, dueDate);
  
  if (businessDaysRemaining <= 0) {
    return 'Critical';
  } else if (businessDaysRemaining === 1) {
    return 'High';
  } else if (businessDaysRemaining <= 3) {
    return 'Medium';
  } else {
    return 'Low';
  }
}
