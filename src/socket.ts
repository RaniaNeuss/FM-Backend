import { Server } from 'socket.io';
import { createServer } from 'http';
import { Application } from 'express';
import EventEmitter from 'events';
import prisma from './prismaClient';
const initializeSocket = (app: Application) => {
  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: '*', // Replace with your frontend URL or restrict to specific domains
      methods: ['GET', 'POST'],
    },
  });

  const events = new EventEmitter(); // Shared event emitter

  io.on('connection', (socket) => {
    console.log('New Socket.IO connection established.');


// Listen for variable updates and update the database
socket.on('variable-changes', async ({ deviceId, changes }: { deviceId: string, changes: Record<string, { value: any }> }) => {
  console.log(`Received updates for device ${deviceId}`, changes);

  for (const [name, { value }] of Object.entries(changes)) {
    try {
      const existingTag = await prisma.tag.findFirst({
        where: { deviceId, name },
      });

      if (existingTag) {
        await prisma.tag.update({
          where: { id: existingTag.id },
          data: { value, updatedAt: new Date() }
        });
        console.log(`✅ Updated tag '${name}' in database.`);
      } else {
        console.log(`⚠️ Tag '${name}' not found in database.`);
      }
    } catch (error) {
      console.error(`❌ Error updating tag '${name}':`, error);
    }
  }
});




    // Handle client disconnect
    socket.on('disconnect', () => {
      console.log('Socket.IO connection closed.');
    });

    // Handle socket errors
    socket.on('error', (err) => {
      console.error('Socket.IO error:', err);
    });
  });
  

  events.on('variable-changes', ({ deviceId, changes }) => {
    console.log(`Broadcasting variable-changes for deviceId: ${deviceId}`, changes);
    io.emit('variable-changes', { deviceId, changes });
  });


  // Broadcast function for external modules to emit custom events
  const broadcast = (event: string, data: any) => {
    io.emit(event, data);
    console.log(`Broadcasting event "${event}" with data:`, data);
  };


  
  return { io, server, broadcast, events };
};



export default initializeSocket;
