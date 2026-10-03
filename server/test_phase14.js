import dns from 'node:dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

import http from 'http';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Models
import User from './models/User.js';
import Meeting from './models/Meeting.js';
import Feedback from './models/Feedback.js';

// Routes
import feedbackRoutes from './routes/feedbackRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';

const JWT_SECRET = 'skillswap_test_secret_phase14';
process.env.JWT_SECRET = JWT_SECRET;

async function runPhase14Tests() {
  console.log('=== STARTING PHASE 14 POST-MEETING FEEDBACK & RATINGS TESTS ===\n');

  const mongoUri =
    process.env.MONGO_URI ||
    'mongodb+srv://aldrinderala24_db_user:WYS393lq72QThvPf@cluster0.5rnpppy.mongodb.net/skillswap_ai?retryWrites=true&w=majority';
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/feedback', feedbackRoutes);
  app.use('/api/meetings', meetingRoutes);

  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, resolve));
  const port = testServer.address().port;
  console.log(`Test server running on port ${port}`);

  const timestamp = Date.now();
  const createdUserIds = [];
  const createdMeetingIds = [];

  const apiFetch = async (endpoint, method = 'GET', body = null, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`http://localhost:${port}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  };

  try {
    // Setup Test Users: User A (Host), User B (Guest), User C (Unauthorized Third Party)
    const userA = await User.create({
      name: `User A Phase14_${timestamp}`,
      email: `userA_${timestamp}@example.com`,
      password: 'password123',
    });
    const userB = await User.create({
      name: `User B Phase14_${timestamp}`,
      email: `userB_${timestamp}@example.com`,
      password: 'password123',
    });
    const userC = await User.create({
      name: `User C Phase14_${timestamp}`,
      email: `userC_${timestamp}@example.com`,
      password: 'password123',
    });

    createdUserIds.push(userA._id, userB._id, userC._id);

    const tokenA = jwt.sign({ userId: userA._id }, JWT_SECRET, { expiresIn: '1h' });
    const tokenB = jwt.sign({ userId: userB._id }, JWT_SECRET, { expiresIn: '1h' });
    const tokenC = jwt.sign({ userId: userC._id }, JWT_SECRET, { expiresIn: '1h' });

    console.log('✓ Created test users: User A, User B, User C');

    // -------------------------------------------------------------------------
    // TEST 1: Completed Meeting Verification
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 1: Completed Meeting ---');
    const meeting1 = await Meeting.create({
      caller: userA._id,
      receiver: userB._id,
      status: 'active',
      startedAt: new Date(Date.now() - 1000 * 60 * 10),
    });
    createdMeetingIds.push(meeting1._id);

    // Call endMeeting API
    const endRes = await apiFetch(`/api/meetings/${meeting1._id}/end`, 'PUT', {}, tokenA);
    const updatedMeeting1 = await Meeting.findById(meeting1._id);

    if (endRes.status === 200 && updatedMeeting1.status === 'completed') {
      console.log('✅ TEST 1 PASSED: Meeting successfully completed; meeting.status = completed');
    } else {
      throw new Error(`TEST 1 FAILED: Expected status completed, got ${updatedMeeting1?.status}`);
    }

    // -------------------------------------------------------------------------
    // TEST 2: Check Feedback Route Initial State
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: Check Feedback Initial State ---');
    const checkResBefore = await apiFetch(`/api/feedback/check/${meeting1._id}`, 'GET', null, tokenA);
    if (checkResBefore.status === 200 && checkResBefore.data.hasSubmitted === false) {
      console.log('✅ TEST 2 PASSED: checkFeedback returns hasSubmitted: false before submission');
    } else {
      throw new Error(`TEST 2 FAILED: ${JSON.stringify(checkResBefore.data)}`);
    }

    // -------------------------------------------------------------------------
    // TEST 3 & 4: Rating (5 stars) and Comment Submission
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3 & 4: Submit Rating (5 Stars) & Comment ---');
    const submitRes = await apiFetch(
      '/api/feedback',
      'POST',
      {
        meetingId: meeting1._id.toString(),
        rating: 5,
        comment: 'Very useful session. I learned a lot.',
      },
      tokenA
    );

    if (submitRes.status === 201 && submitRes.data.success) {
      const fbInDb = await Feedback.findById(submitRes.data.feedback._id);
      if (
        fbInDb &&
        fbInDb.rating === 5 &&
        fbInDb.comment === 'Very useful session. I learned a lot.' &&
        fbInDb.reviewerId.toString() === userA._id.toString() &&
        fbInDb.reviewedUserId.toString() === userB._id.toString()
      ) {
        console.log('✅ TEST 3 & 4 PASSED: 5-star rating and comment stored accurately in MongoDB');
      } else {
        throw new Error(`TEST 3 & 4 FAILED: DB feedback document mismatch`);
      }
    } else {
      throw new Error(`TEST 3 & 4 FAILED: ${JSON.stringify(submitRes.data)}`);
    }

    // Verify checkFeedback now returns true
    const checkResAfter = await apiFetch(`/api/feedback/check/${meeting1._id}`, 'GET', null, tokenA);
    if (checkResAfter.status === 200 && checkResAfter.data.hasSubmitted === true) {
      console.log('✅ checkFeedback returns hasSubmitted: true after submission');
    } else {
      throw new Error('checkFeedback did not reflect submitted state');
    }

    // -------------------------------------------------------------------------
    // TEST 5: Duplicate Submission Prevention
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: Duplicate Submission ---');
    const dupRes = await apiFetch(
      '/api/feedback',
      'POST',
      {
        meetingId: meeting1._id.toString(),
        rating: 4,
        comment: 'Trying to submit again',
      },
      tokenA
    );

    if (
      dupRes.status === 400 &&
      dupRes.data.message === 'You have already submitted feedback for this meeting'
    ) {
      console.log('✅ TEST 5 PASSED: Duplicate feedback submission rejected with 400');
    } else {
      throw new Error(`TEST 5 FAILED: Expected 400 with duplicate message, got ${dupRes.status}: ${JSON.stringify(dupRes.data)}`);
    }

    // -------------------------------------------------------------------------
    // TEST 6: Unauthorized Meeting Submission
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: Unauthorized Meeting (Non-Participant) ---');
    const unauthRes = await apiFetch(
      '/api/feedback',
      'POST',
      {
        meetingId: meeting1._id.toString(),
        rating: 5,
        comment: 'Third party intruder review',
      },
      tokenC
    );

    if (
      unauthRes.status === 403 &&
      unauthRes.data.message === 'You were not a participant in this meeting'
    ) {
      console.log('✅ TEST 6 PASSED: Unauthorized user feedback rejected with 403');
    } else {
      throw new Error(`TEST 6 FAILED: Expected 403, got ${unauthRes.status}: ${JSON.stringify(unauthRes.data)}`);
    }

    // -------------------------------------------------------------------------
    // TEST 7: Self Review Prevention
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 7: Self Review Prevention ---');
    const selfMeeting = await Meeting.create({
      caller: userA._id,
      receiver: userA._id,
      status: 'completed',
    });
    createdMeetingIds.push(selfMeeting._id);

    const selfRes = await apiFetch(
      '/api/feedback',
      'POST',
      {
        meetingId: selfMeeting._id.toString(),
        rating: 5,
        comment: 'Reviewing myself',
      },
      tokenA
    );

    if (
      selfRes.status === 400 &&
      selfRes.data.message === 'You cannot review yourself'
    ) {
      console.log('✅ TEST 7 PASSED: Self-review rejected with 400');
    } else {
      throw new Error(`TEST 7 FAILED: Expected 400 'You cannot review yourself', got ${selfRes.status}`);
    }

    // -------------------------------------------------------------------------
    // TEST 8: Incomplete Meeting Submission Prevention
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 8: Incomplete Meeting ---');
    const incompleteMeeting = await Meeting.create({
      caller: userA._id,
      receiver: userB._id,
      status: 'active', // not completed
    });
    createdMeetingIds.push(incompleteMeeting._id);

    const incompleteRes = await apiFetch(
      '/api/feedback',
      'POST',
      {
        meetingId: incompleteMeeting._id.toString(),
        rating: 5,
        comment: 'Review before meeting ends',
      },
      tokenA
    );

    if (
      incompleteRes.status === 400 &&
      incompleteRes.data.message === 'Feedback can only be submitted after the meeting is completed'
    ) {
      console.log('✅ TEST 8 PASSED: Feedback for incomplete meeting rejected with 400');
    } else {
      throw new Error(`TEST 8 FAILED: Expected 400, got ${incompleteRes.status}: ${JSON.stringify(incompleteRes.data)}`);
    }

    // -------------------------------------------------------------------------
    // TEST 9: Rating Validation (0, 6, -1, 10, non-integer)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 9: Rating Validation ---');
    const invalidRatings = [0, 6, -1, 10, 3.5, '5', null];
    for (const badRating of invalidRatings) {
      const badRes = await apiFetch(
        '/api/feedback',
        'POST',
        {
          meetingId: meeting1._id.toString(),
          rating: badRating,
          comment: 'Invalid rating test',
        },
        tokenB // User B hasn't submitted yet for meeting1
      );

      if (
        badRes.status !== 400 ||
        badRes.data.message !== 'Rating must be between 1 and 5'
      ) {
        throw new Error(`TEST 9 FAILED for rating ${badRating}: Expected 400 'Rating must be between 1 and 5', got ${badRes.status}`);
      }
    }
    console.log('✅ TEST 9 PASSED: Ratings [0, 6, -1, 10, 3.5, string, null] all correctly rejected');

    // -------------------------------------------------------------------------
    // TEST 10: Rating Calculation & Aggregate Statistics
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 10: Rating Calculation & User Feedback Stats ---');
    // Target user to receive reviews: User B
    // We already have 1 review for User B from User A (rating: 5).
    // Let's create more completed meetings and reviews for User B:
    // Ratings: 5 (existing), 4, 5, 4 -> Average = (5 + 4 + 5 + 4) / 4 = 18 / 4 = 4.5
    const meeting2 = await Meeting.create({ caller: userC._id, receiver: userB._id, status: 'completed' });
    const meeting3 = await Meeting.create({ caller: userA._id, receiver: userB._id, status: 'completed' });
    const meeting4 = await Meeting.create({ caller: userC._id, receiver: userB._id, status: 'completed' });
    createdMeetingIds.push(meeting2._id, meeting3._id, meeting4._id);

    await apiFetch('/api/feedback', 'POST', { meetingId: meeting2._id.toString(), rating: 4, comment: 'Good' }, tokenC);
    await apiFetch('/api/feedback', 'POST', { meetingId: meeting3._id.toString(), rating: 5, comment: 'Excellent' }, tokenA);
    await apiFetch('/api/feedback', 'POST', { meetingId: meeting4._id.toString(), rating: 4, comment: 'Helpful' }, tokenC);

    const userBStatsRes = await apiFetch(`/api/feedback/user/${userB._id}`, 'GET', null, tokenA);
    if (
      userBStatsRes.status === 200 &&
      userBStatsRes.data.totalReviews === 4 &&
      userBStatsRes.data.averageRating === 4.5 &&
      userBStatsRes.data.feedback.length === 4
    ) {
      console.log('✅ TEST 10 PASSED: Average rating (4.5 ★) and total reviews (4) calculated accurately from MongoDB');
    } else {
      throw new Error(`TEST 10 FAILED: Expected 4 reviews & 4.5 avg, got: ${JSON.stringify(userBStatsRes.data)}`);
    }

    // -------------------------------------------------------------------------
    // TEST 11: Skip Behavior Verification
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 11: Skip Verification ---');
    const meetingSkip = await Meeting.create({
      caller: userA._id,
      receiver: userB._id,
      status: 'completed',
    });
    createdMeetingIds.push(meetingSkip._id);

    // Simulate skip: User chooses not to submit feedback
    const checkSkip = await apiFetch(`/api/feedback/check/${meetingSkip._id}`, 'GET', null, tokenA);
    const feedbackCountForMeeting = await Feedback.countDocuments({ meetingId: meetingSkip._id });

    if (checkSkip.data.hasSubmitted === false && feedbackCountForMeeting === 0) {
      console.log('✅ TEST 11 PASSED: Skipping does not create fake feedback; user retains ability to review later');
    } else {
      throw new Error('TEST 11 FAILED');
    }

    // -------------------------------------------------------------------------
    // TEST 12: Platform-wide Stats & Meeting Feedback Endpoint Security
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 12: Platform Stats & Meeting Feedback Security ---');
    const platformStats = await apiFetch('/api/feedback/stats', 'GET', null, tokenA);
    if (platformStats.status === 200 && platformStats.data.totalReviews >= 4) {
      console.log(`✅ Platform stats verified: ${platformStats.data.totalReviews} total reviews, avg: ${platformStats.data.averagePlatformRating} ★`);
    } else {
      throw new Error('Platform stats failed');
    }

    // Meeting feedback endpoint: User A (participant) can view meeting1 feedback
    const meetingFbRes = await apiFetch(`/api/feedback/meeting/${meeting1._id}`, 'GET', null, tokenA);
    if (meetingFbRes.status === 200 && meetingFbRes.data.count >= 1) {
      console.log('✅ Participant User A can view meeting feedback');
    } else {
      throw new Error('Meeting feedback retrieval failed');
    }

    // Meeting feedback endpoint: User C (non-participant) is forbidden (403)
    const meetingFbUnauth = await apiFetch(`/api/feedback/meeting/${meeting1._id}`, 'GET', null, tokenC);
    if (meetingFbUnauth.status === 403) {
      console.log('✅ Non-participant User C forbidden from meeting feedback (403)');
    } else {
      throw new Error('Meeting feedback security failed');
    }

    console.log('\n========================================');
    console.log('SUMMARY: ALL PHASE 14 BACKEND TESTS PASSED!');
    console.log('========================================\n');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exitCode = 1;
  } finally {
    // Clean up created test data
    try {
      if (createdMeetingIds.length > 0) {
        await Feedback.deleteMany({ meetingId: { $in: createdMeetingIds } });
        await Meeting.deleteMany({ _id: { $in: createdMeetingIds } });
      }
      if (createdUserIds.length > 0) {
        await User.deleteMany({ _id: { $in: createdUserIds } });
      }
      console.log('✓ Cleaned up test database records');
    } catch (cleanErr) {
      console.error('Error during cleanup:', cleanErr.message);
    }

    await mongoose.disconnect();
    testServer.close();
    process.exit(process.exitCode || 0);
  }
}

runPhase14Tests();
