# Models
Mongoose schemas and database models:
- User.js (name, email, password, googleId, profileImage, bio, role, createdAt)
- SkillProfile.js (userId, skillToLearn, skillToTeach, experienceLevel, availability, preferredSession, bio)
- ConnectionRequest.js (senderId, receiverId, status: pending/accepted/rejected)
- Meeting.js (requestId, hostId, guestId, roomId, startTime, endTime, duration, status)
- Message.js (meetingId, senderId, message, createdAt)
