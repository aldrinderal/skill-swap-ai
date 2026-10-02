import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import SkillProfile from './models/SkillProfile.js';
import ConnectionRequest from './models/ConnectionRequest.js';
import Connection from './models/Connection.js';
import connectDB from './config/db.js';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'skillswap_super_secret_jwt_key_2026_xYz987!';
const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== STARTING PHASE 9 COMPREHENSIVE VERIFICATION ===\n');

  await connectDB();

  // Find or create Test Users A, B, C
  const usersData = [
    { name: 'User A', email: 'user_a_test@example.com', password: 'password123' },
    { name: 'User B', email: 'user_b_test@example.com', password: 'password123' },
    { name: 'User C', email: 'user_c_test@example.com', password: 'password123' },
  ];

  const tokens = {};
  const userIds = {};

  for (const u of usersData) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      user = await User.create(u);
    }
    userIds[u.name] = user._id.toString();
    tokens[u.name] = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });
  }

  console.log('Test Users Ready:');
  console.log(`- User A: ${userIds['User A']}`);
  console.log(`- User B: ${userIds['User B']}`);
  console.log(`- User C: ${userIds['User C']}\n`);

  // Clean previous test data between these users
  const testIds = [userIds['User A'], userIds['User B'], userIds['User C']];
  await ConnectionRequest.deleteMany({
    $or: [{ sender: { $in: testIds } }, { receiver: { $in: testIds } }],
  });
  await Connection.deleteMany({
    $or: [{ user1: { $in: testIds } }, { user2: { $in: testIds } }],
  });

  // Ensure Skill Profiles exist
  const profiles = [
    {
      userId: userIds['User A'],
      skillToLearn: 'MERN Stack',
      skillToTeach: 'UI/UX Design',
      experienceLevel: 'Intermediate',
      availability: 'Weekends',
      preferredSession: 'Evening',
      bio: 'User A bio for test',
    },
    {
      userId: userIds['User B'],
      skillToLearn: 'UI/UX Design',
      skillToTeach: 'MERN Stack',
      experienceLevel: 'Advanced',
      availability: 'Weekends',
      preferredSession: 'Evening',
      bio: 'User B bio for test',
    },
    {
      userId: userIds['User C'],
      skillToLearn: 'Python',
      skillToTeach: 'MERN Stack',
      experienceLevel: 'Beginner',
      availability: 'Weekdays',
      preferredSession: 'Morning',
      bio: 'User C bio for test',
    },
  ];

  for (const p of profiles) {
    await SkillProfile.findOneAndUpdate({ userId: p.userId }, p, { upsert: true });
  }

  let passedTests = 0;
  let totalTests = 0;

  async function api(path, method = 'GET', body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  // TEST 1: Prevent self request
  totalTests++;
  const test1 = await api(`/connections/request/${userIds['User A']}`, 'POST', null, tokens['User A']);
  if (test1.status === 400 && test1.data.message?.includes('yourself')) {
    console.log('✅ TEST 1 PASSED: Prevent self connection request (400)');
    passedTests++;
  } else {
    console.error('❌ TEST 1 FAILED:', test1);
  }

  // TEST 2: Send connection request A -> B
  totalTests++;
  const test2 = await api(`/connections/request/${userIds['User B']}`, 'POST', null, tokens['User A']);
  let reqABId = test2.data.request?.id;
  if (test2.status === 201 && test2.data.success && test2.data.request?.status === 'pending') {
    console.log('✅ TEST 2 PASSED: Send connection request A -> B (201)');
    passedTests++;
  } else {
    console.error('❌ TEST 2 FAILED:', test2);
  }

  // TEST 3: Duplicate pending request A -> B
  totalTests++;
  const test3 = await api(`/connections/request/${userIds['User B']}`, 'POST', null, tokens['User A']);
  if (test3.status === 409 && test3.data.message?.includes('already sent')) {
    console.log('✅ TEST 3 PASSED: Duplicate pending request prevented (409)');
    passedTests++;
  } else {
    console.error('❌ TEST 3 FAILED:', test3);
  }

  // TEST 4: Reverse request B -> A while A -> B is pending
  totalTests++;
  const test4 = await api(`/connections/request/${userIds['User A']}`, 'POST', null, tokens['User B']);
  if (test4.status === 409 && test4.data.message?.includes('already sent you a connection request')) {
    console.log('✅ TEST 4 PASSED: Reverse pending request handled correctly (409)');
    passedTests++;
  } else {
    console.error('❌ TEST 4 FAILED:', test4);
  }

  // TEST 5: User B checks received requests
  totalTests++;
  const test5 = await api('/connections/requests/received', 'GET', null, tokens['User B']);
  if (
    test5.status === 200 &&
    test5.data.success &&
    test5.data.requests.length === 1 &&
    test5.data.requests[0].sender?.id === userIds['User A'] &&
    test5.data.requests[0].sender?.skillToTeach === 'UI/UX Design'
  ) {
    console.log('✅ TEST 5 PASSED: Get received requests with rich profile info (200)');
    passedTests++;
  } else {
    console.error('❌ TEST 5 FAILED:', test5);
  }

  // TEST 6: User A checks sent requests
  totalTests++;
  const test6 = await api('/connections/requests/sent', 'GET', null, tokens['User A']);
  if (
    test6.status === 200 &&
    test6.data.success &&
    test6.data.requests.length === 1 &&
    test6.data.requests[0].receiver?.id === userIds['User B'] &&
    test6.data.requests[0].status === 'pending'
  ) {
    console.log('✅ TEST 6 PASSED: Get sent requests (200)');
    passedTests++;
  } else {
    console.error('❌ TEST 6 FAILED:', test6);
  }

  // TEST 7: Unauthorized accept (User C tries to accept request sent to User B)
  totalTests++;
  const test7 = await api(`/connections/request/${reqABId}/accept`, 'PUT', null, tokens['User C']);
  if (test7.status === 403 && test7.data.message?.includes('not authorized')) {
    console.log('✅ TEST 7 PASSED: Unauthorized accept blocked (403)');
    passedTests++;
  } else {
    console.error('❌ TEST 7 FAILED:', test7);
  }

  // TEST 8: User B accepts request from User A
  totalTests++;
  const test8 = await api(`/connections/request/${reqABId}/accept`, 'PUT', null, tokens['User B']);
  if (test8.status === 200 && test8.data.success && test8.data.connection?.id) {
    console.log('✅ TEST 8 PASSED: User B accepts request and creates Connection (200)');
    passedTests++;
  } else {
    console.error('❌ TEST 8 FAILED:', test8);
  }

  // TEST 9: Both User A and User B see each other in /connections
  totalTests++;
  const connA = await api('/connections', 'GET', null, tokens['User A']);
  const connB = await api('/connections', 'GET', null, tokens['User B']);
  let activeConnId = connA.data.connections?.[0]?.connectionId;

  if (
    connA.status === 200 &&
    connA.data.connections?.length === 1 &&
    connA.data.connections[0].user?.id === userIds['User B'] &&
    connB.status === 200 &&
    connB.data.connections?.length === 1 &&
    connB.data.connections[0].user?.id === userIds['User A']
  ) {
    console.log('✅ TEST 9 PASSED: Both users see each other in My Connections (200)');
    passedTests++;
  } else {
    console.error('❌ TEST 9 FAILED:', { connA, connB });
  }

  // TEST 10: Already connected (User A attempts to send another request to User B)
  totalTests++;
  const test10 = await api(`/connections/request/${userIds['User B']}`, 'POST', null, tokens['User A']);
  if (test10.status === 409 && test10.data.message?.includes('already connected')) {
    console.log('✅ TEST 10 PASSED: Request blocked when already connected (409)');
    passedTests++;
  } else {
    console.error('❌ TEST 10 FAILED:', test10);
  }

  // TEST 11: Check relationship status
  totalTests++;
  const statusRes = await api(`/connections/status/${userIds['User B']}`, 'GET', null, tokens['User A']);
  if (statusRes.status === 200 && statusRes.data.status === 'connected') {
    console.log('✅ TEST 11 PASSED: Relationship status returns "connected" (200)');
    passedTests++;
  } else {
    console.error('❌ TEST 11 FAILED:', statusRes);
  }

  // TEST 12: User A sends request to User C, User C rejects
  totalTests++;
  const reqAC = await api(`/connections/request/${userIds['User C']}`, 'POST', null, tokens['User A']);
  const rejectAC = await api(`/connections/request/${reqAC.data.request?.id}/reject`, 'PUT', null, tokens['User C']);
  if (rejectAC.status === 200 && rejectAC.data.success) {
    console.log('✅ TEST 12 PASSED: User C rejects request (200)');
    passedTests++;
  } else {
    console.error('❌ TEST 12 FAILED:', rejectAC);
  }

  // TEST 13: User A sends request to User C again, User A cancels
  totalTests++;
  const reqAC2 = await api(`/connections/request/${userIds['User C']}`, 'POST', null, tokens['User A']);
  const cancelAC = await api(`/connections/request/${reqAC2.data.request?.id}/cancel`, 'PUT', null, tokens['User A']);
  if (cancelAC.status === 200 && cancelAC.data.success) {
    console.log('✅ TEST 13 PASSED: User A cancels sent request (200)');
    passedTests++;
  } else {
    console.error('❌ TEST 13 FAILED:', cancelAC);
  }

  // TEST 14: Unauthorized cancel (User B attempts to cancel A -> C request)
  totalTests++;
  const test14 = await api(`/connections/request/${reqAC2.data.request?.id}/cancel`, 'PUT', null, tokens['User B']);
  if (test14.status === 403 && test14.data.message?.includes('not authorized')) {
    console.log('✅ TEST 14 PASSED: Unauthorized cancel blocked (403)');
    passedTests++;
  } else {
    console.error('❌ TEST 14 FAILED:', test14);
  }

  // TEST 15: Unauthorized connection deletion (User C attempts to delete connection between A & B)
  totalTests++;
  const test15 = await api(`/connections/${activeConnId}`, 'DELETE', null, tokens['User C']);
  if (test15.status === 403 && test15.data.message?.includes('not authorized')) {
    console.log('✅ TEST 15 PASSED: Unauthorized connection removal blocked (403)');
    passedTests++;
  } else {
    console.error('❌ TEST 15 FAILED:', test15);
  }

  // TEST 16: User A removes connection with User B
  totalTests++;
  const test16 = await api(`/connections/${activeConnId}`, 'DELETE', null, tokens['User A']);
  if (test16.status === 200 && test16.data.success) {
    console.log('✅ TEST 16 PASSED: User A removes connection (200)');
    passedTests++;
  } else {
    console.error('❌ TEST 16 FAILED:', test16);
  }

  // TEST 17: User A checks /connections after removal -> 0 connections
  totalTests++;
  const test17 = await api('/connections', 'GET', null, tokens['User A']);
  if (test17.status === 200 && test17.data.connections?.length === 0) {
    console.log('✅ TEST 17 PASSED: Connections list empty after removal (200)');
    passedTests++;
  } else {
    console.error('❌ TEST 17 FAILED:', test17);
  }

  // TEST 18: Unauthenticated access blocked
  totalTests++;
  const test18 = await api('/connections', 'GET');
  if (test18.status === 401) {
    console.log('✅ TEST 18 PASSED: Unauthenticated access blocked (401)');
    passedTests++;
  } else {
    console.error('❌ TEST 18 FAILED:', test18);
  }

  // TEST 19: Verify Phase 5/7/8 non-regression
  totalTests++;
  const test19Skills = await api('/skills?search=MERN', 'GET', null, tokens['User A']);
  const test19Matches = await api('/skills/matches', 'GET', null, tokens['User A']);
  if (
    test19Skills.status === 200 &&
    test19Matches.status === 200 &&
    test19Matches.data.matches?.length > 0
  ) {
    console.log('✅ TEST 19 PASSED: Phase 8 Search & Matching regression verified (200)');
    passedTests++;
  } else {
    console.error('❌ TEST 19 FAILED:', { test19Skills, test19Matches });
  }

  console.log(`\n========================================`);
  console.log(`SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED!`);
  console.log(`========================================\n`);

  await mongoose.disconnect();
  process.exit(passedTests === totalTests ? 0 : 1);
}

runTests().catch((err) => {
  console.error('Fatal error in test runner:', err);
  process.exit(1);
});
