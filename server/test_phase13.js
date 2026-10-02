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
import SkillProfile from './models/SkillProfile.js';
import Connection from './models/Connection.js';
import ConnectionRequest from './models/ConnectionRequest.js';

// Services & Routes
import aiRoutes from './routes/aiRoutes.js';
import {
  normalizeSkill,
  areSkillsRelated,
  calculateSkillCompatibility,
  generateSkillPath,
  invalidateUserRecommendationCache,
} from './services/aiRecommendationService.js';

const JWT_SECRET = 'skillswap_test_secret_phase13';
process.env.JWT_SECRET = JWT_SECRET;

async function runPhase13Tests() {
  console.log('=== STARTING PHASE 13 AI RECOMMENDATIONS & SKILL MATCHING TESTS ===\n');

  // Connect to MongoDB
  const mongoUri =
    process.env.MONGO_URI ||
    'mongodb+srv://aldrinderala24_db_user:WYS393lq72QThvPf@cluster0.5rnpppy.mongodb.net/skillswap_ai?retryWrites=true&w=majority';
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/ai', aiRoutes);

  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, resolve));
  const port = testServer.address().port;
  console.log(`Test server running on port ${port}`);

  let passedTests = 0;
  let totalTests = 10;

  const timestamp = Date.now();
  const createdUsers = [];

  try {
    // -------------------------------------------------------------
    // Test 1: Unit Tests on Skill Normalization & Related Skills Graph
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Skill Normalization & Related Skills ---');
    const norm1 = normalizeSkill('UI/UX Design');
    const norm2 = normalizeSkill('ui ux');
    const norm3 = normalizeSkill('MERN Stack Development');
    const isRelated = areSkillsRelated('MERN Stack', 'React');

    if (norm1 === 'ui/ux design' && norm2 === 'ui/ux design' && norm3 === 'mern stack' && isRelated) {
      console.log('✅ PASS: Normalization and related skills graph mapped correctly.');
      passedTests++;
    } else {
      console.error('❌ FAIL: Normalization mismatch.', { norm1, norm2, norm3, isRelated });
    }

    // -------------------------------------------------------------
    // Test 2: Unauthorized API Call (Req 62)
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Unauthorized API Call without JWT ---');
    const unauthRes = await fetch(`http://localhost:${port}/api/ai/recommendations`);
    if (unauthRes.status === 401) {
      console.log('✅ PASS: GET /api/ai/recommendations rejected with 401 Unauthorized.');
      passedTests++;
    } else {
      console.error(`❌ FAIL: Expected 401, got ${unauthRes.status}`);
    }

    // -------------------------------------------------------------
    // Setup Test Users & Profiles (User A, B, C, D)
    // User A: Teaches UI/UX Design, Learns MERN Stack
    // User B: Teaches MERN Stack, Learns UI/UX Design (Reciprocal Match)
    // User C: Teaches MERN Stack, Learns Machine Learning (Partial Match)
    // User D: Teaches React, Learns Graphic Design (Related Match)
    // -------------------------------------------------------------
    const userA = await User.create({
      name: `UserA_${timestamp}`,
      email: `usera_${timestamp}@example.com`,
      password: 'password123',
    });
    createdUsers.push(userA);

    const userB = await User.create({
      name: `UserB_${timestamp}`,
      email: `userb_${timestamp}@example.com`,
      password: 'password123',
    });
    createdUsers.push(userB);

    const userC = await User.create({
      name: `UserC_${timestamp}`,
      email: `userc_${timestamp}@example.com`,
      password: 'password123',
    });
    createdUsers.push(userC);

    const userD = await User.create({
      name: `UserD_${timestamp}`,
      email: `userd_${timestamp}@example.com`,
      password: 'password123',
    });
    createdUsers.push(userD);

    const tokenA = jwt.sign({ userId: userA._id }, JWT_SECRET, { expiresIn: '1h' });

    // -------------------------------------------------------------
    // Test 3: Profile Required Guard
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: User Without Profile Guard ---');
    const noProfileRes = await fetch(`http://localhost:${port}/api/ai/recommendations`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const noProfileData = await noProfileRes.json();
    if (noProfileRes.status === 404 && noProfileData.profileRequired === true) {
      console.log('✅ PASS: Correctly informs user to complete skill profile first (404 profileRequired).');
      passedTests++;
    } else {
      console.error('❌ FAIL: Expected 404 profileRequired.', noProfileData);
    }

    // Now create profiles
    const profileA = await SkillProfile.create({
      userId: userA._id,
      skillToTeach: 'UI/UX Design',
      skillToLearn: 'MERN Stack',
      experienceLevel: 'Intermediate',
      availability: 'Weekends',
      preferredSession: 'Evening',
      bio: 'Product designer passionate about web interfaces.',
    });

    const profileB = await SkillProfile.create({
      userId: userB._id,
      skillToTeach: 'MERN Stack',
      skillToLearn: 'UI/UX Design',
      experienceLevel: 'Advanced',
      availability: 'Weekends',
      preferredSession: 'Evening',
      bio: 'Full stack developer building reactive apps.',
    });

    const profileC = await SkillProfile.create({
      userId: userC._id,
      skillToTeach: 'MERN Stack',
      skillToLearn: 'Machine Learning',
      experienceLevel: 'Beginner',
      availability: 'Weekdays',
      preferredSession: 'Morning',
      bio: 'Junior coder exploring data science.',
    });

    const profileD = await SkillProfile.create({
      userId: userD._id,
      skillToTeach: 'React',
      skillToLearn: 'Graphic Design',
      experienceLevel: 'Intermediate',
      availability: 'Both',
      preferredSession: 'Flexible',
      bio: 'Frontend enthusiast.',
    });

    // -------------------------------------------------------------
    // Test 4: Reciprocal Skill Match (Req 55)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Reciprocal Skill Match Verification ---');
    const recRes = await fetch(`http://localhost:${port}/api/ai/recommendations?refresh=true`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const recData = await recRes.json();

    if (recData.success && recData.recommendations.length > 0) {
      const matchB = recData.recommendations.find((r) => r.user.id === userB._id.toString());
      const isReciprocalTier = matchB?.compatibilityTier === 'reciprocal' && matchB?.isReciprocal;

      if (matchB && isReciprocalTier) {
        console.log(`✅ PASS: User B identified as reciprocal match with reciprocal tier.`);
        console.log(`   Top Reason: "${matchB.matchReasons[0]}"`);
        passedTests++;
      } else {
        console.error('❌ FAIL: User B was not detected as reciprocal match.', matchB);
      }
    } else {
      console.error('❌ FAIL: No recommendations returned.', recData);
    }

    // -------------------------------------------------------------
    // Test 5: Partial / Related Skill Match (Req 56)
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Partial & Related Skill Matches ---');
    const userCMatch = recData.recommendations.find((r) => r.user.id === userC._id.toString());
    const userDMatch = recData.recommendations.find((r) => r.user.id === userD._id.toString());

    if (userCMatch && userDMatch) {
      console.log(`✅ PASS: User C (Partial learning match) and User D (Related skill match) detected.`);
      console.log(`   User C Tier: ${userCMatch.compatibilityTier}`);
      console.log(`   User D Tier: ${userDMatch.compatibilityTier}`);
      passedTests++;
    } else {
      console.error('❌ FAIL: Candidate C or D missing from recommendations.', { userCMatch, userDMatch });
    }

    // -------------------------------------------------------------
    // Test 6: Existing Connection Filtering (Req 57)
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Existing Connection Filtering ---');
    // Connect User A and User B
    const u1 = userA._id.toString() < userB._id.toString() ? userA._id : userB._id;
    const u2 = userA._id.toString() < userB._id.toString() ? userB._id : userA._id;
    await Connection.create({ user1: u1, user2: u2 });
    invalidateUserRecommendationCache(userA._id);

    const postConnRes = await fetch(`http://localhost:${port}/api/ai/recommendations?refresh=true`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const postConnData = await postConnRes.json();
    const hasUserB = postConnData.recommendations.some((r) => r.user.id === userB._id.toString());

    if (!hasUserB) {
      console.log('✅ PASS: Connected partner User B is cleanly excluded from recommendations.');
      passedTests++;
    } else {
      console.error('❌ FAIL: Connected partner User B was still recommended.');
    }

    // -------------------------------------------------------------
    // Test 7: Pending Request Status Detection (Req 58)
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Pending Request Status Detection ---');
    await ConnectionRequest.create({
      sender: userA._id,
      receiver: userC._id,
      status: 'pending',
    });
    invalidateUserRecommendationCache(userA._id);

    const pendingRes = await fetch(`http://localhost:${port}/api/ai/recommendations?refresh=true`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const pendingData = await pendingRes.json();
    const matchC = pendingData.recommendations.find((r) => r.user.id === userC._id.toString());

    if (matchC && matchC.connectionStatus === 'pending_sent') {
      console.log('✅ PASS: Pending request detected; connectionStatus set to "pending_sent".');
      passedTests++;
    } else {
      console.error('❌ FAIL: Expected connectionStatus: "pending_sent", got:', matchC?.connectionStatus);
    }

    // -------------------------------------------------------------
    // Test 8: No AI Key Deterministic Engine (Req 59, 66)
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Deterministic Matching Without AI Key ---');
    if (recData.engine === 'skill-based' && recData.recommendations.length > 0) {
      console.log('✅ PASS: System operates deterministically with engine "skill-based" without crashing.');
      passedTests++;
    } else {
      console.error('❌ FAIL: Expected skill-based engine operation.');
    }

    // -------------------------------------------------------------
    // Test 9: Privacy & Data Leak Protection (Req 63)
    // -------------------------------------------------------------
    console.log('\n--- TEST 9: Privacy & Data Protection Verification ---');
    let hasLeak = false;
    for (const rec of recData.recommendations) {
      if (rec.user.password || rec.user.email || rec.user.tokens || rec.user.googleId) {
        hasLeak = true;
        break;
      }
    }
    if (!hasLeak) {
      console.log('✅ PASS: No passwords, emails, tokens, or OAuth secrets exposed in recommendations.');
      passedTests++;
    } else {
      console.error('❌ FAIL: Private data leak detected in recommendations output.');
    }

    // -------------------------------------------------------------
    // Test 10: Personalized Skill Path Suggestions (Req 39)
    // -------------------------------------------------------------
    console.log('\n--- TEST 10: Personalized Skill Path Generation ---');
    const skillPath = generateSkillPath('MERN Stack');
    if (
      skillPath &&
      skillPath.learningGoal === 'MERN Stack' &&
      Array.isArray(skillPath.suggestedTopics) &&
      skillPath.suggestedTopics.length > 0
    ) {
      console.log(`✅ PASS: Skill Path generated with suggested topics:`, skillPath.suggestedTopics);
      passedTests++;
    } else {
      console.error('❌ FAIL: Skill path invalid.', skillPath);
    }

    console.log(`\n=================================================`);
    console.log(`RESULTS: ${passedTests} / ${totalTests} tests passed`);
    console.log(`=================================================\n`);
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    // Cleanup test data
    try {
      const userIds = createdUsers.map((u) => u._id);
      await User.deleteMany({ _id: { $in: userIds } });
      await SkillProfile.deleteMany({ userId: { $in: userIds } });
      await Connection.deleteMany({ $or: [{ user1: { $in: userIds } }, { user2: { $in: userIds } }] });
      await ConnectionRequest.deleteMany({ $or: [{ sender: { $in: userIds } }, { receiver: { $in: userIds } }] });
    } catch {}

    await mongoose.disconnect();
    testServer.close();
  }
}

runPhase13Tests();
