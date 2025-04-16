import express from 'express';
import session from 'express-session';
import passport from './lib/passportConfig';
import cors from 'cors';
import cookieParser from "cookie-parser";
import prisma from './prismaClient'; // Import Prisma Client
import initializeSocket from './socket'; // Import Socket Initialization
import userRoutes from './routes/userRoutes';
import rfpRoutes from './routes/rfpRoutes';
import { PORT } from "./lib/config";





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
      maxAge:  24* 60 * 60 * 1000, 
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser()); // Parse cookies



// Routes
app.use('/api/users', userRoutes);
app.use('/api/rfp', rfpRoutes);


// Initialize Socket.IO
const { io, events,server } = initializeSocket(app);
// Export the Socket.IO instance for use in other modules
export { io };










(async () => {
  try {
    // Run all tasks in parallel
  

    await Promise.all([
     
    ]);

    console.log("✅ All services started successfully.");
  } catch (error) {
    console.error("❌ Error during server startup:", error);
  }
})();


// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
