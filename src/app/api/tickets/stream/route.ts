import { getConnectedModels } from '@/lib/dbConnect';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Set up SSE headers
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Function to fetch tickets and send them to the client
      const sendTickets = async () => {
        try {
          // Get models after ensuring DB connection
          const { Ticket } = await getConnectedModels();
          
          const tickets = await Ticket.find({})
            .sort({ createdAt: -1 })
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email')
            .lean();
          
          // Convert MongoDB documents to plain objects
          const ticketsData = JSON.parse(JSON.stringify(tickets));
          
          // Debug ticket data
          console.log('First ticket in stream:', ticketsData[0]?._id);
          console.log('First ticket due date:', ticketsData[0]?.dueDate);
          
          // Send the tickets as a JSON string
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(ticketsData)}\n\n`));
        } catch (error) {
          console.error('Error fetching tickets for SSE:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify([])}\n\n`));
        }
      };

      // Send initial data
      await sendTickets();

      // Set up interval to send updates every 5 seconds
      const intervalId = setInterval(sendTickets, 5000);

      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
