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
import { initSocketServer, getIO } from './sockets/socketServer.js';

// Models
import User from './models/User.js';
import SkillProfile from './models/SkillProfile.js';
import Connection from './models/Connection.js';
import Meeting from './models/Meeting.js';
import MeetingMessage from './models/MeetingMessage.js';

// Routes
import meetingRoutes from './routes/meetingRoutes.js';

const JWT_SECRET = 'skillswap_test_secret_phase11';
process.env.JWT_SECRET = JWT_SECRET;
process.env.MEETING_DURATION_SECONDS = '1800';

async function runTests() {
  console.log('=== STARTING PHASE 11 WEBRTC, CHAT & MEETING VERIFICATION ===\n');

  // Connect to MongoDB
  const mongoUri =
    process.env.MONGO_URI ||
    'mongodb+srv://aldrinderala24_db_user:WYS393lq72QThvPf@cluster0.5rnpppy.mongodb.net/skillswap_ai?retryWrites=true&w=majority';
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

  // Create temporary test app & HTTP server on random free port
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/meetings', meetingRoutes);

  const testServer = http.createServer(app);
  initSocketServer(testServer);

  await new Promise((resolve) => testServer.listen(0, resolve));
  const port = testServer.address().port;
  console.log(`Test server running on port ${port}`);

  // Create 3 test users in DB: User A (Caller), User B (Receiver), User C (Unauthorized Third Party)
  const timestamp = Date.now();
  const userA = await User.create({
    name: `Caller A_${timestamp}`,
    email: `caller_${timestamp}@example.com`,
    password: 'password123',
  });
  const userB = await User.create({
    name: `Receiver B_${timestamp}`,
    email: `receiver_${timestamp}@example.com`,
    password: 'password123',
  });
  const userC = await User.create({
    name: `ThirdParty C_${timestamp}`,
    email: `thirdparty_${timestamp}@example.com`,
    password: 'password123',
  });

  const tokenA = jwt.sign({ userId: userA._id.toString(), email: userA.email }, JWT_SECRET);
  const tokenB = jwt.sign({ userId: userB._id.toString(), email: userB.email }, JWT_SECRET);
  const tokenC = jwt.sign({ userId: userC._id.toString(), email: userC.email }, JWT_SECRET);

  const serverUrl = `http://localhost:${port}`;

  // Helper fetch
  const apiFetch = async (path, method = 'GET', body = null, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${serverUrl}/api/meetings${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  };

  try {
    // -------------------------------------------------------------
    // TEST 1: User A tries to start meeting with themselves
    // -------------------------------------------------------------
    const resSelf = await apiFetch(`/start/${userA._id}`, 'POST', {}, tokenA);
    if (resSelf.status === 400) {
      console.log('✅ TEST 1 PASSED: Self-calling correctly rejected with status 400');
    } else {
      throw new Error(`TEST 1 FAILED: Expected 400, got ${resSelf.status}`);
    }

    // -------------------------------------------------------------
    // TEST 2: User A tries to call User B before they are connected
    // -------------------------------------------------------------
    const resUnconnected = await apiFetch(`/start/${userB._id}`, 'POST', {}, tokenA);
    if (resUnconnected.status === 403) {
      console.log('✅ TEST 2 PASSED: Unconnected users cannot start meeting (status 403)');
    } else {
      throw new Error(`TEST 2 FAILED: Expected 403, got ${resUnconnected.status}`);
    }

    // Connect User A and User B
    await Connection.create({ user1: userA._id, user2: userB._id });
    console.log('ℹ️  Created active Connection between User A and User B');

    // Connect Sockets for User A and User B
    const socketA = Client(serverUrl, { auth: { token: tokenA }, transports: ['websocket'] });
    const socketB = Client(serverUrl, { auth: { token: tokenB }, transports: ['websocket'] });
    const socketC = Client(serverUrl, { auth: { token: tokenC }, transports: ['websocket'] });

    await Promise.all([
      new Promise((res) => socketA.on('connect', res)),
      new Promise((res) => socketB.on('connect', res)),
      new Promise((res) => socketC.on('connect', res)),
    ]);
    console.log('ℹ️  Connected Sockets for User A, User B, and User C');

    // -------------------------------------------------------------
    // TEST 3: User A starts meeting with User B; User B receives call:incoming
    // -------------------------------------------------------------
    const incomingPromise = new Promise((resolve) => {
      socketB.once('call:incoming', (payload) => {
        resolve(payload);
      });
    });

    const resStart = await apiFetch(`/start/${userB._id}`, 'POST', {}, tokenA);
    if (resStart.status !== 201 || !resStart.data.success) {
      throw new Error(`TEST 3 FAILED: Could not start meeting: ${JSON.stringify(resStart.data)}`);
    }

    const meetingId = resStart.data.meeting.meetingId;
    const incomingPayload = await incomingPromise;

    if (incomingPayload.meetingId === meetingId && incomingPayload.caller.id === userA._id.toString()) {
      console.log('✅ TEST 3 PASSED: Meeting created (201) and call:incoming received by User B');
    } else {
      throw new Error(`TEST 3 FAILED: Incoming payload mismatch: ${JSON.stringify(incomingPayload)}`);
    }

    // -------------------------------------------------------------
    // TEST 4: User B rejects call -> User A receives call:rejected & status is rejected
    // -------------------------------------------------------------
    const rejectedPromise = new Promise((resolve) => {
      socketA.once('call:rejected', (payload) => resolve(payload));
    });

    const resReject = await apiFetch(`/${meetingId}/reject`, 'PUT', {}, tokenB);
    if (resReject.status !== 200) {
      throw new Error(`TEST 4 FAILED: Reject endpoint failed: ${resReject.status}`);
    }

    const rejectedPayload = await rejectedPromise;
    if (rejectedPayload.meetingId === meetingId) {
      console.log('✅ TEST 4 PASSED: User B rejected call and User A received call:rejected');
    } else {
      throw new Error(`TEST 4 FAILED: Reject payload mismatch: ${JSON.stringify(rejectedPayload)}`);
    }

    // -------------------------------------------------------------
    // TEST 5: User A starts a new call; User B accepts -> call:accepted & status is active
    // -------------------------------------------------------------
    const resStart2 = await apiFetch(`/start/${userB._id}`, 'POST', {}, tokenA);
    const meeting2Id = resStart2.data.meeting.meetingId;

    const acceptedPromise = new Promise((resolve) => {
      socketA.once('call:accepted', (payload) => resolve(payload));
    });

    const resAccept = await apiFetch(`/${meeting2Id}/accept`, 'PUT', {}, tokenB);
    if (resAccept.status !== 200) {
      throw new Error(`TEST 5 FAILED: Accept endpoint failed: ${resAccept.status}`);
    }

    const acceptedPayload = await acceptedPromise;
    if (acceptedPayload.meetingId === meeting2Id) {
      console.log('✅ TEST 5 PASSED: User B accepted call and User A received call:accepted');
    } else {
      throw new Error(`TEST 5 FAILED: Accepted payload mismatch: ${JSON.stringify(acceptedPayload)}`);
    }

    // -------------------------------------------------------------
    // TEST 6: Get meeting details & Authoritative Timer
    // -------------------------------------------------------------
    const resGetMeeting = await apiFetch(`/${meeting2Id}`, 'GET', null, tokenA);
    if (
      resGetMeeting.status === 200 &&
      resGetMeeting.data.meeting.status === 'active' &&
      resGetMeeting.data.meeting.remainingSeconds > 0
    ) {
      console.log(
        `✅ TEST 6 PASSED: Get meeting succeeded with active status and ${resGetMeeting.data.meeting.remainingSeconds}s remaining`
      );
    } else {
      throw new Error(`TEST 6 FAILED: ${JSON.stringify(resGetMeeting.data)}`);
    }

    // -------------------------------------------------------------
    // TEST 7: Security - Third Party User C cannot access meeting details (403)
    // -------------------------------------------------------------
    const resUnauthorized = await apiFetch(`/${meeting2Id}`, 'GET', null, tokenC);
    if (resUnauthorized.status === 403) {
      console.log('✅ TEST 7 PASSED: Third-party User C forbidden from meeting details (403)');
    } else {
      throw new Error(`TEST 7 FAILED: Expected 403, got ${resUnauthorized.status}`);
    }

    // -------------------------------------------------------------
    // TEST 8: Socket Security - User C cannot join meeting room
    // -------------------------------------------------------------
    const errorPromise = new Promise((resolve) => {
      socketC.once('meeting:error', (payload) => resolve(payload));
    });
    socketC.emit('meeting:join', { meetingId: meeting2Id });
    const errorPayload = await errorPromise;
    if (errorPayload.message.includes('Unauthorized')) {
      console.log('✅ TEST 8 PASSED: Third-party User C rejected from joining meeting room');
    } else {
      throw new Error(`TEST 8 FAILED: Expected Unauthorized meeting error, got ${JSON.stringify(errorPayload)}`);
    }

    // -------------------------------------------------------------
    // TEST 9: Participants join meeting room and exchange WebRTC signaling
    // -------------------------------------------------------------
    const joinAPromise = new Promise((resolve) => socketA.once('meeting:joined', resolve));
    socketA.emit('meeting:join', { meetingId: meeting2Id });
    await joinAPromise;

    const peerJoinedPromise = new Promise((resolve) => socketA.once('peer:joined', resolve));
    const joinBPromise = new Promise((resolve) => socketB.once('meeting:joined', resolve));
    socketB.emit('meeting:join', { meetingId: meeting2Id });

    await joinBPromise;
    await peerJoinedPromise;
    console.log('✅ TEST 9 PASSED: User A and User B joined meeting room; peer:joined signaled');

    // Test WebRTC Offer -> Answer -> ICE Candidate
    const offerPromise = new Promise((resolve) => {
      socketB.once('webrtc:offer', (payload) => resolve(payload));
    });
    socketA.emit('webrtc:offer', { meetingId: meeting2Id, offer: { type: 'offer', sdp: 'dummy-sdp-offer' } });
    const receivedOffer = await offerPromise;
    if (receivedOffer.offer.sdp !== 'dummy-sdp-offer') throw new Error('WebRTC Offer failed');

    const answerPromise = new Promise((resolve) => {
      socketA.once('webrtc:answer', (payload) => resolve(payload));
    });
    socketB.emit('webrtc:answer', { meetingId: meeting2Id, answer: { type: 'answer', sdp: 'dummy-sdp-answer' } });
    const receivedAnswer = await answerPromise;
    if (receivedAnswer.answer.sdp !== 'dummy-sdp-answer') throw new Error('WebRTC Answer failed');

    const icePromise = new Promise((resolve) => {
      socketB.once('webrtc:ice-candidate', (payload) => resolve(payload));
    });
    socketA.emit('webrtc:ice-candidate', {
      meetingId: meeting2Id,
      candidate: { candidate: 'candidate:1', sdpMid: '0', sdpMLineIndex: 0 },
    });
    const receivedIce = await icePromise;
    if (receivedIce.candidate.candidate !== 'candidate:1') throw new Error('WebRTC ICE Candidate failed');
    console.log('✅ TEST 10 PASSED: WebRTC Offer, Answer, and ICE candidates exchanged accurately');

    // -------------------------------------------------------------
    // TEST 11: Real-time In-Meeting Chat & Validation
    // -------------------------------------------------------------
    const chatMsgPromise = new Promise((resolve) => {
      socketB.once('message:receive', (payload) => resolve(payload));
    });

    // Test sending empty message (should be rejected/ignored)
    socketA.emit('message:send', { meetingId: meeting2Id, message: '   ' });

    // Test sending valid message
    socketA.emit('message:send', { meetingId: meeting2Id, message: 'Hello from User A in WebRTC session!' });
    const receivedChat = await chatMsgPromise;

    if (
      receivedChat.message === 'Hello from User A in WebRTC session!' &&
      receivedChat.sender.id === userA._id.toString()
    ) {
      console.log('✅ TEST 11 PASSED: Real-time chat message validated, persisted, and received');
    } else {
      throw new Error(`TEST 11 FAILED: Chat message mismatch: ${JSON.stringify(receivedChat)}`);
    }

    // -------------------------------------------------------------
    // TEST 12: Chat history retrieval & Unauthorized protection
    // -------------------------------------------------------------
    const resChatHistory = await apiFetch(`/${meeting2Id}/messages`, 'GET', null, tokenB);
    if (resChatHistory.status === 200 && resChatHistory.data.messages.length === 1) {
      console.log('✅ TEST 12 PASSED: Chat history loaded from MongoDB (1 message)');
    } else {
      throw new Error(`TEST 12 FAILED: ${JSON.stringify(resChatHistory.data)}`);
    }

    const resChatUnauthorized = await apiFetch(`/${meeting2Id}/messages`, 'GET', null, tokenC);
    if (resChatUnauthorized.status === 403) {
      console.log('✅ TEST 13 PASSED: Third-party User C forbidden from reading chat (403)');
    } else {
      throw new Error(`TEST 13 FAILED: Expected 403, got ${resChatUnauthorized.status}`);
    }

    // -------------------------------------------------------------
    // TEST 14: Typing Indicators
    // -------------------------------------------------------------
    const typingStartPromise = new Promise((resolve) => {
      socketB.once('typing:start', (payload) => resolve(payload));
    });
    socketA.emit('typing:start', { meetingId: meeting2Id });
    const typingData = await typingStartPromise;
    if (typingData.userId === userA._id.toString()) {
      console.log('✅ TEST 14 PASSED: Typing indicator received by partner');
    } else {
      throw new Error('TEST 14 FAILED');
    }

    // -------------------------------------------------------------
    // TEST 15: End Meeting -> Status 'ended', reason 'user_ended', meeting:ended broadcast
    // -------------------------------------------------------------
    const endedPromise = new Promise((resolve) => {
      socketB.once('meeting:ended', (payload) => resolve(payload));
    });

    const resEnd = await apiFetch(`/${meeting2Id}/end`, 'PUT', {}, tokenA);
    if (resEnd.status !== 200) throw new Error('End meeting endpoint failed');

    const endedPayload = await endedPromise;
    if (endedPayload.meetingId === meeting2Id && endedPayload.endReason === 'user_ended') {
      console.log('✅ TEST 15 PASSED: Meeting ended manually; meeting:ended event received by peer');
    } else {
      throw new Error(`TEST 15 FAILED: ${JSON.stringify(endedPayload)}`);
    }

    // Clean up sockets
    socketA.disconnect();
    socketB.disconnect();
    socketC.disconnect();

    console.log('\n========================================');
    console.log('SUMMARY: ALL 15 / 15 BACKEND TESTS PASSED!');
    console.log('========================================\n');
  } finally {
    // Clean up test users & collections
    await User.deleteMany({ _id: { $in: [userA._id, userB._id, userC._id] } });
    await Connection.deleteMany({ $or: [{ user1: userA._id }, { user2: userA._id }] });
    await Meeting.deleteMany({ $or: [{ caller: userA._id }, { receiver: userA._id }] });
    await MeetingMessage.deleteMany({ $or: [{ sender: userA._id }, { sender: userB._id }] });

    testServer.close();
    await mongoose.disconnect();
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('❌ Phase 11 Test Failure:', err);
  process.exit(1);
});
