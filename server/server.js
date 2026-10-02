import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { initSocketServer } from './sockets/socketServer.js';

// Import Mongoose Models to register schemas
import './models/User.js';
import './models/SkillProfile.js';
import './models/ConnectionRequest.js';
import './models/Connection.js';
import './models/Meeting.js';
import './models/MeetingMessage.js';
import './models/Message.js';

// Route Handlers
import healthRoutes from './routes/healthRoutes.js';
import databaseTestRoutes from './routes/databaseTestRoutes.js';
import authRoutes from './routes/authRoutes.js';
import skillRoutes from './routes/skillRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

// Middlewares
import { notFound } from './middleware/notFoundMiddleware.js';
import { errorHandler } from './middleware/errorMiddleware.js';

// Load environment variables from .env file
dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middleware
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root API Endpoint (Phase 3 Section 10)
app.get('/', (req, res) => {
  res.send('Skill Swap AI API is running');
});

// Health-Check Route (Phase 3 Section 9)
app.use('/api/health', healthRoutes);

// Database Status & Model Test Route (Phase 4 Section 15)
app.use('/api/database-test', databaseTestRoutes);

// Authentication Routes (Phase 5 & 6)
app.use('/api/auth', authRoutes);

// Skill Profile Routes (Phase 7 & 8)
app.use('/api/skills', skillRoutes);

// Connection & Request Routes (Phase 9)
app.use('/api/connections', connectionRoutes);

// Meeting & Video Calling Routes (Phase 11)
app.use('/api/meetings', meetingRoutes);

// AI Skill Recommendations Routes (Phase 13)
app.use('/api/ai', aiRoutes);

/*
 * ========================================================
 * FUTURE API ROUTES ARCHITECTURE
 * (To be connected in subsequent phases)
 * ========================================================
 * app.use('/api/auth', authRoutes);               // Phase 5: Authentication (Register/Login)
 * app.use('/api/users', userRoutes);             // Phase 5: User profile retrieval & update
 * app.use('/api/skills', skillRoutes);           // Phase 7 & 8: Skill registration & search
 * app.use('/api/requests', requestRoutes);       // Phase 9: Connection request lifecycle
 * app.use('/api/connections', connectionRoutes); // Phase 10: Accepted partners
 * app.use('/api/meetings', meetingRoutes);       // Phase 14: 30-min meeting sessions
 * app.use('/api/messages', messageRoutes);       // Phase 13: In-meeting chat history
 * app.use('/api/admin', adminRoutes);            // Phase 16: Admin dashboard statistics
 * ========================================================
 */

// 404 Handler Middleware
app.use(notFound);

// Centralized Error Handling Middleware
app.use(errorHandler);

// Create HTTP server wrapping Express app & initialize Socket.IO (Phase 10 Section 2)
const httpServer = http.createServer(app);
initSocketServer(httpServer);

// Startup Flow: Connect to Database & Start Server
const startServer = async () => {
  try {
    // 1. Connect to MongoDB database first
    await connectDB();

    // 2. Start HTTP & Socket.IO server only after database connection succeeds
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`[Socket.IO] Real-time engine listening on port ${PORT}`);
    });

    httpServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use by another running terminal or process.`);
        console.error(`👉 Run: npx kill-port ${PORT} (or close duplicate terminals) to free it.\n`);
        process.exit(1);
      } else {
        console.error('Server error:', err.message);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

export { app, httpServer };
export default app;
