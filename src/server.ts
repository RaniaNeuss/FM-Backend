import express from 'express';
import swaggerUi from 'swagger-ui-express';
import session from 'express-session';
import passport from './lib/passportConfig';
import cors from 'cors';
import cookieParser from "cookie-parser";
import swaggerDocument from './swagger.json';
import prisma from './prismaClient'; // Import Prisma Client
import initializeSocket from './socket'; // Import Socket Initialization
import deviceManager from './runtime/devices/deviceManager';
import projectRoutes from './routes/projectRoutes';
import alarmManager from './runtime/alarms/alarmmanager'; // Import alarm manager

import userRoutes from './routes/userRoutes';
import alarmRoutes from './routes/alarmRoutes';
import viewRoutes from './routes/viewRoutes';
import itemRoutes from './routes/itemRoutes';
import notificationRoutes from './routes/notificationRoutes';
import settingsRoutes from './routes/settingsRoutes';
import deviceRoutes from './routes/deviceRoutes';
import { PORT } from "./lib/config";

// import { exit } from 'process';



const app = express();


// Middlewares
app.use(express.json());
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge:  2* 60 * 60 * 1000, 
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser()); // Parse cookies

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/views', viewRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/alarms', alarmRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/devices', deviceRoutes);

// Initialize Socket.IO
const { io, events,server } = initializeSocket(app);
// Export the Socket.IO instance for use in other modules
export { io };

const getexistingdevices = async () => {
  try {
    const devices = await prisma.device.findMany({
      where: { enabled: true }, // Fetch enabled devices
      include: { tags: true }, // Include tags for each device
    });

    console.log('Total enabled devices:', devices.length);

    if (devices.length > 0) {
      return devices;
    }
    return [];
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching devices:', error.message);
    } else {
      console.error('Error fetching devices:', error);
    }
    return []; // Return an empty array if an error occurs
  }
};








(async () => {
  try {
    const devices = await getexistingdevices();
    await deviceManager.initializeAndPollDevices(devices);
    await alarmManager.start(); // Start alarm manager

  } catch (error) {
    console.error('Error during server startup:', error);
  }
})();

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
