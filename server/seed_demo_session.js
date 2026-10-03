import dns from 'node:dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import SkillProfile from './models/SkillProfile.js';
import Meeting from './models/Meeting.js';
import Feedback from './models/Feedback.js';

async function seed() {
  const mongoUri =
    process.env.MONGO_URI ||
    'mongodb+srv://aldrinderala24_db_user:WYS393lq72QThvPf@cluster0.5rnpppy.mongodb.net/skillswap_ai?retryWrites=true&w=majority';
  await mongoose.connect(mongoUri);

  const hashedPassword = await bcrypt.hash('password123', 10);

  // User 1 (Reviewer)
  let user1 = await User.findOne({ email: 'demouser@skillswap.com' });
  if (!user1) {
    user1 = await User.create({
      name: 'Alex Johnson',
      email: 'demouser@skillswap.com',
      password: hashedPassword,
      bio: 'Full stack learner and JavaScript enthusiast.',
    });
  }

  // User 2 (Partner to be reviewed)
  let user2 = await User.findOne({ email: 'sarahpartner@skillswap.com' });
  if (!user2) {
    user2 = await User.create({
      name: 'Sarah Chen',
      email: 'sarahpartner@skillswap.com',
      password: hashedPassword,
      bio: 'UI/UX Designer and Frontend Specialist.',
    });
  }

  // Partner's skill profile
  let partnerProfile = await SkillProfile.findOne({ userId: user2._id });
  if (!partnerProfile) {
    partnerProfile = await SkillProfile.create({
      userId: user2._id,
      skillToTeach: 'UI/UX Design & Figma',
      skillToLearn: 'Full Stack MERN',
      experienceLevel: 'Advanced',
      availability: 'Weekends',
      preferredSession: 'Evening',
    });
  }

  // Completed Meeting
  let meeting = await Meeting.create({
    caller: user1._id,
    receiver: user2._id,
    status: 'completed',
    startedAt: new Date(Date.now() - 1000 * 60 * 30),
    endedAt: new Date(),
    endReason: 'timeout',
  });

  // Make sure no feedback exists for this meeting yet
  await Feedback.deleteMany({ meetingId: meeting._id });

  console.log('DEMO_MEETING_ID=' + meeting._id.toString());
  console.log('DEMO_EMAIL=demouser@skillswap.com');
  console.log('DEMO_PASSWORD=password123');

  await mongoose.disconnect();
}

seed();
