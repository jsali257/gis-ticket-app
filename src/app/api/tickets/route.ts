import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getConnectedModels } from '@/lib/dbConnect';
import { addBusinessDays } from '@/lib/dateUtils';

// GET /api/tickets - Get all tickets
export async function GET(req: NextRequest) {
  try {
    // Get models after ensuring DB connection
    const { Ticket } = await getConnectedModels();
    
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assignedTo');
    
    // Build query
    const query: any = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    
    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    
    return NextResponse.json(tickets, { status: 200 });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

// Generate ticket number in format YYMMDDHHMMSS
const generateTicketNumber = (date: Date): string => {
  const year = date.getFullYear().toString().slice(2); // Get last 2 digits of year
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

// POST /api/tickets - Create a new ticket
export async function POST(req: NextRequest) {
  try {
    // Get models after ensuring DB connection
    const { Ticket } = await getConnectedModels();
    
    const body = await req.json();
    
    // Validate required fields for GIS ticket
    if (!body.firstName || !body.lastName || !body.email || !body.requestType || !body.premiseType || !body.county || !body.streetName || body.xCoordinate === undefined || body.yCoordinate === undefined) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }
    
    // For development purposes, we'll use a valid ObjectId
    // In production, these would be real MongoDB ObjectIds
    const validObjectId = '507f1f77bcf86cd799439011'; // Valid 24-character hex string
    
    // Process phone numbers - only include if they're valid 10-digit numbers
    const processPhoneNumber = (phone: string | undefined) => {
      if (!phone) return undefined;
      const digitsOnly = phone.replace(/\D/g, '');
      return digitsOnly.length === 10 ? digitsOnly : undefined;
    };

    // Calculate due date (5 business days from now)
    const creationDate = new Date();
    const dueDate = addBusinessDays(creationDate, 5);
    
    // Generate ticket number based on creation date
    const ticketNumber = generateTicketNumber(creationDate);
    console.log('Creating ticket with number:', ticketNumber);
    console.log('Creating ticket with due date:', dueDate);
    
    // Create a new ticket with the provided data
    const newTicket = new Ticket({
      // Basic ticket information
      status: 'In Progress', // Automatically set to In Progress
      workflowStage: 'Front Desk',
      priority: body.priority || 'Medium', // Initial priority, will be recalculated daily
      dueDate: dueDate.toISOString(), // Store as ISO string for consistent handling
      timeToResolve: 5, // 5 business days to resolve
      ticketNumber, // Add the generated ticket number
      // Initially no assignment - will be assigned after creation
      createdBy: body.createdBy || validObjectId, // Use provided ID or fallback to valid ObjectId
      
      // Contact information
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      // Only include phone numbers if they're valid
      ...(body.mobilePhone && { mobilePhone: processPhoneNumber(body.mobilePhone) }),
      ...(body.landlinePhone && { landlinePhone: processPhoneNumber(body.landlinePhone) }),
      
      // Request details
      requestType: body.requestType,
      existingAddress: body.existingAddress,
      additionalInfo: body.additionalInfo,
      
      // Property information
      premiseType: body.premiseType,
      propertyId: body.propertyId,
      county: body.county,
      streetName: body.streetName,
      closestIntersection: body.closestIntersection,
      subdivision: body.subdivision,
      lotNumber: body.lotNumber,
      
      // GIS Coordinates
      xCoordinate: body.xCoordinate,
      yCoordinate: body.yCoordinate,
      
      // Initialize history
      history: [{
        workflowStage: 'Front Desk',
        notes: 'Ticket created',
        actionBy: new mongoose.Types.ObjectId(body.createdBy || validObjectId),
        timestamp: Date.now()
      }]
    });
    
    // Save the ticket first
    await newTicket.save();
    
    // Import the ticket assignment utility
    const { assignTicketToRandomGISStaff } = await import('@/lib/ticketUtils');
    
    // Now that we have a ticket ID, we can assign it to a random GIS staff member
    let assignedTicket = null;
    if (newTicket._id) {
      assignedTicket = await assignTicketToRandomGISStaff(
        newTicket._id.toString(),
        body.createdBy || validObjectId
      );
    }
    
    // Return either the assigned ticket or the original ticket
    return NextResponse.json(assignedTicket || newTicket, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}
