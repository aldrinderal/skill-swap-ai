import dns from 'node:dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

import http from 'http';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { io as Client } from '../client/node_modules/socket.io-client/build/esm/index.js';
import { initSocketServer } from './sockets/socketServer.js';

// Models
import User from './models/User.js';
import Connection from './models/Connection.js';
import Meeting from './models/Meeting.js';

// Routes
import meetingRoutes from './routes/meetingRoutes.js';

const JWT_SECRET = 'skillswap_test_secret_phase12';
process.env.JWT_SECRET = JWT_SECRET;

async function runPhase12Tests() {
  console.log('=== STARTING PHASE 12 SCREEN SHARING BACKEND VERIFICATION ===\n');

  // Connect to MongoDB
  const mongoUri =
    process.env.MONGO_URI ||
    'mongodb+srv://aldrinderala24_db_user:WYS393lq72QThvPf@cluster0.5rnpppy.mongodb.net/skillswap_ai?retryWrites=true&w=majority';
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/meetings', meetingRoutes);

  const testServer = http.createServer(app);
  initSocketServer(testServer);

  await new Promise((resolve) => testServer.listen(0, resolve));
  const port = testServer.address().port;
  console.log(`Test server running on port ${port}`);

  const timestamp = Date.now();
  const userA = await User.create({
    name: `User A_${timestamp}`,
    email: `usera_${timestamp}@example.com`,
    password: 'password123',
  });
  const userB = await User.create({
    name: `User B_${timestamp}`,
    email: `userb_${timestamp}@example.com`,
    password: 'password123',
  });
  const userC = await User.create({
    name: `User C_${timestamp}`,
    email: `userc_${timestamp}@example.com`,
    password: 'password123',
  });

  const tokenA = jwt.sign({ userId: userA._id.toString(), email: userA.email }, JWT_SECRET);
  const tokenB = jwt.sign({ userId: userB._id.toString(), email: userB.email }, JWT_SECRET);
  const tokenC = jwt.sign({ userId: userC._id.toString(), email: userC.email }, JWT_SECRET);

  const serverUrl = `http://localhost:${port}`;

  // Establish connection and active meeting between User A and User B
  await Connection.create({ user1: userA._id, user2: userB._id });
  const meeting = await Meeting.create({
    caller: userA._id,
    receiver: userB._id,
    status: 'active',
    startedAt: new Date(),
    duration: 30,
  });

  const meetingId = meeting._id.toString();

  // Connect Sockets
  const socketA = Client(serverUrl, { auth: { token: tokenA }, transports: ['websocket'] });
  const socketB = Client(serverUrl, { auth: { token: tokenB }, transports: ['websocket'] });
  const socketC = Client(serverUrl, { auth: { token: tokenC }, transports: ['websocket'] });

  await Promise.all([
    new Promise((res) => socketA.on('connect', res)),
    new Promise((res) => socketB.on('connect', res)),
    new Promise((res) => socketC.on('connect', res)),
  ]);

  try {
    // Both A and B join the meeting room
    const joinAPromise = new Promise((resolve) => socketA.once('meeting:joined', resolve));
    socketA.emit('meeting:join', { meetingId });
    await joinAPromise;

    const joinBPromise = new Promise((resolve) => socketB.once('meeting:joined', resolve));
    socketB.emit('meeting:join', { meetingId });
    await joinBPromise;

    // -------------------------------------------------------------
    // TEST 1: User A starts screen sharing -> User B receives screen:share:start
    // -------------------------------------------------------------
    const startPromise = new Promise((resolve) => {
      socketB.once('screen:share:start', (payload) => resolve(payload));
    });

    socketA.emit('screen:share:start', { meetingId });
    const startPayload = await startPromise;

    if (startPayload.meetingId === meetingId && startPayload.userId === userA._id.toString()) {
      console.log('✅ TEST 1 PASSED: User A screen:share:start received by User B');
    } else {
      throw new Error(`TEST 1 FAILED: Unexpected payload: ${JSON.stringify(startPayload)}`);
    }

    // -------------------------------------------------------------
    // TEST 2: User A stops screen sharing -> User B receives screen:share:stop
    // -------------------------------------------------------------
    const stopPromise = new Promise((resolve) => {
      socketB.once('screen:share:stop', (payload) => resolve(payload));
    });

    socketA.emit('screen:share:stop', { meetingId });
    const stopPayload = await stopPromise;

    if (stopPayload.meetingId === meetingId && stopPayload.userId === userA._id.toString()) {
      console.log('✅ TEST 2 PASSED: User A screen:share:stop received by User B');
    } else {
      throw new Error(`TEST 2 FAILED: Unexpected payload: ${JSON.stringify(stopPayload)}`);
    }

    // -------------------------------------------------------------
    // TEST 3: Security - User C cannot send screen:share:start to A+B meeting (Section 48)
    // -------------------------------------------------------------
    let unauthorizedReceived = false;
    socketB.once('screen:share:start', () => {
      unauthorizedReceived = true;
    });

    socketC.emit('screen:share:start', { meetingId });
    await new Promise((r) => setTimeout(r, 400));

    if (!unauthorizedReceived) {
      console.log('✅ TEST 3 PASSED: Third-party User C blocked from sending screen:share:start');
    } else {
      throw new Error('TEST 3 FAILED: Unauthorized user C was able to emit screen:share:start!');
    }

    console.log('\n========================================');
    console.log('SUMMARY: ALL PHASE 12 BACKEND TESTS PASSED!');
    console.log('========================================\n');
  } finally {
    socketA.disconnect();
    socketB.disconnect();
    socketC.disconnect();

    await User.deleteMany({ _id: { $in: [userA._id, userB._id, userC._id] } });
    await Connection.deleteMany({ $or: [{ user1: userA._id }, { user2: userA._id }] });
    await Meeting.deleteMany({ _id: meeting._id });

    testServer.close();
    await mongoose.disconnect();
    process.exit(0);
  }
}

runPhase12Tests().catch((err) => {
  console.error('❌ Phase 12 Test Failure:', err);
  process.exit(1);
});
