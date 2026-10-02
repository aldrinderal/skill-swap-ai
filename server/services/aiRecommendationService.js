/**
 * AI Recommendation Service (Phase 13)
 * Provides deterministic skill-based matching and optional AI-assisted
 * reciprocal skill exchange recommendations.
 *
 * Designed to be 100% resilient: if no AI key is configured or the AI API
 * is unavailable, the deterministic engine handles all recommendations seamlessly.
 */

// In-memory cache for user recommendations (TTL: 5 minutes)
const recommendationCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Related skills dictionary for semantic compatibility mapping
 */
const RELATED_SKILLS = {
  'mern stack': ['react', 'node.js', 'mongodb', 'express', 'javascript', 'full stack web development', 'web development'],
  'react': ['javascript', 'frontend development', 'mern stack', 'next.js', 'typescript', 'ui/ux design', 'web development'],
  'node.js': ['javascript', 'backend development', 'express', 'mern stack', 'mongodb', 'rest apis'],
  'javascript': ['react', 'node.js', 'typescript', 'frontend development', 'web development', 'mern stack'],
  'typescript': ['javascript', 'react', 'node.js', 'frontend development', 'backend development'],
  'python': ['machine learning', 'data science', 'artificial intelligence', 'django', 'fastapi', 'backend development'],
  'machine learning': ['python', 'artificial intelligence', 'data science', 'deep learning', 'statistics'],
  'artificial intelligence': ['machine learning', 'python', 'deep learning', 'data science', 'natural language processing'],
  'data science': ['python', 'machine learning', 'data analysis', 'sql', 'statistics'],
  'ui/ux design': ['figma', 'user interface design', 'user experience design', 'product design', 'web design', 'wireframing'],
  'figma': ['ui/ux design', 'product design', 'graphic design', 'web design', 'prototyping'],
  'graphic design': ['ui/ux design', 'figma', 'branding', 'illustration', 'digital design'],
  'digital marketing': ['seo', 'content marketing', 'social media marketing', 'analytics', 'growth marketing'],
  'mobile development': ['flutter', 'react native', 'android', 'ios', 'swift', 'kotlin'],
  'flutter': ['mobile development', 'dart', 'react native', 'android', 'ios'],
};

/**
 * Common skill abbreviations and normalizations
 */
const SKILL_ALIASES = {
  'ui ux': 'ui/ux design',
  'ui/ux': 'ui/ux design',
  'ui-ux': 'ui/ux design',
  'ui ux design': 'ui/ux design',
  'ui/ux design': 'ui/ux design',
  'user experience': 'ui/ux design',
  'user interface': 'ui/ux design',
  'product design': 'ui/ux design',
  'mern': 'mern stack',
  'mern stack': 'mern stack',
  'mern stack development': 'mern stack',
  'full stack mern': 'mern stack',
  'full stack': 'mern stack',
  'full stack web development': 'mern stack',
  'fullstack': 'mern stack',
  'reactjs': 'react',
  'react.js': 'react',
  'nodejs': 'node.js',
  'node': 'node.js',
  'js': 'javascript',
  'ts': 'typescript',
  'py': 'python',
  'ml': 'machine learning',
  'ai': 'artificial intelligence',
  'frontend': 'react',
  'backend': 'node.js',
};

/**
 * Normalize skill string for robust comparison
 * e.g., "UI/UX Design" -> "ui/ux design", "MERN Stack Dev" -> "mern stack"
 */
export function normalizeSkill(skill) {
  if (!skill || typeof skill !== 'string') return '';
  const cleaned = skill
    .toLowerCase()
    .trim()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ');

  // Direct alias check
  if (SKILL_ALIASES[cleaned]) return SKILL_ALIASES[cleaned];

  // Key phrase substring search
  for (const [alias, standard] of Object.entries(SKILL_ALIASES)) {
    if (cleaned.includes(alias)) {
      return standard;
    }
  }

  return cleaned;
}

/**
 * Check if two skills are semantically related
 */
export function areSkillsRelated(skillA, skillB) {
  const normA = normalizeSkill(skillA);
  const normB = normalizeSkill(skillB);

  if (normA === normB) return true;

  // Check related skills graph both directions
  if (RELATED_SKILLS[normA] && RELATED_SKILLS[normA].includes(normB)) return true;
  if (RELATED_SKILLS[normB] && RELATED_SKILLS[normB].includes(normA)) return true;

  return false;
}

/**
 * Generate personalized learning path suggestion based on learning goal (Req 39)
 */
export function generateSkillPath(learningGoal) {
  if (!learningGoal) return null;
  const normGoal = normalizeSkill(learningGoal);

  const related = RELATED_SKILLS[normGoal] || [];
  const suggestions = related.slice(0, 4).map((s) => {
    // Capitalize first letter of each word
    return s.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  });

  return {
    learningGoal: learningGoal.trim(),
    normalizedGoal: normGoal,
    suggestedTopics: suggestions.length > 0 ? suggestions : ['Foundational Concepts', 'Practical Projects', 'Code Review', 'Pair Programming'],
    description: `Suggested complementary areas to explore alongside ${learningGoal.trim()}.`,
  };
}

/**
 * Calculate deterministic compatibility score and rationale between two users (Req 2, 3, 36)
 * Score range: 0 - 100 (Internal recommendation ordering only; not displayed as person rating)
 */
export function calculateSkillCompatibility(myProfile, candidateProfile) {
  const myLearn = myProfile.skillToLearn || '';
  const myTeach = myProfile.skillToTeach || '';
  const otherLearn = candidateProfile.skillToLearn || '';
  const otherTeach = candidateProfile.skillToTeach || '';

  const normMyLearn = normalizeSkill(myLearn);
  const normMyTeach = normalizeSkill(myTeach);
  const normOtherLearn = normalizeSkill(otherLearn);
  const normOtherTeach = normalizeSkill(otherTeach);

  // Match flags
  const exactTeachToLearn = myLearn.toLowerCase().trim() === otherTeach.toLowerCase().trim();
  const exactLearnToTeach = myTeach.toLowerCase().trim() === otherLearn.toLowerCase().trim();

  const normTeachToLearn = normMyLearn === normOtherTeach;
  const normLearnToTeach = normMyTeach === normOtherLearn;

  const relatedTeachToLearn = areSkillsRelated(normMyLearn, normOtherTeach);
  const relatedLearnToTeach = areSkillsRelated(normMyTeach, normOtherLearn);

  let score = 0;
  let compatibilityTier = 'partial'; // 'reciprocal' | 'learning_match' | 'related_match' | 'partial'
  const matchReasons = [];

  // 1. Reciprocal Matching (Both can exchange what each other needs)
  if (exactTeachToLearn && exactLearnToTeach) {
    score = 90;
    compatibilityTier = 'reciprocal';
    matchReasons.push(`Strong reciprocal match: Can teach you ${otherTeach} while learning ${myTeach} from you.`);
  } else if (normTeachToLearn && normLearnToTeach) {
    score = 80;
    compatibilityTier = 'reciprocal';
    matchReasons.push(`Complementary skill swap: Teaches ${otherTeach} (matches your goal: ${myLearn}) and wants to learn ${otherLearn} (matches your expertise: ${myTeach}).`);
  } else if ((normTeachToLearn && relatedLearnToTeach) || (relatedTeachToLearn && normLearnToTeach)) {
    score = 70;
    compatibilityTier = 'reciprocal';
    matchReasons.push(`Complementary skill swap: Has closely related goals in ${otherTeach} and ${otherLearn}.`);
  } else if (exactTeachToLearn || normTeachToLearn) {
    // 2. Direct Learning Match (Candidate can teach current user's goal)
    score = 55;
    compatibilityTier = 'learning_match';
    matchReasons.push(`Can teach you ${otherTeach}, which matches your learning goal.`);
  } else if (relatedTeachToLearn) {
    // 3. Related Learning Match
    score = 40;
    compatibilityTier = 'related_match';
    matchReasons.push(`Teaches ${otherTeach}, which is closely related to your goal of ${myLearn}.`);
  } else if (exactLearnToTeach || normLearnToTeach) {
    // 4. Teaching Match (User can teach candidate)
    score = 30;
    compatibilityTier = 'partial';
    matchReasons.push(`Wants to learn ${otherLearn}, which you can teach.`);
  } else if (relatedLearnToTeach) {
    score = 20;
    compatibilityTier = 'partial';
    matchReasons.push(`Interested in learning ${otherLearn}, related to what you teach.`);
  }

  // Bonus for schedule & availability overlap (up to +10 points)
  if (myProfile.availability && candidateProfile.availability) {
    if (
      myProfile.availability === candidateProfile.availability ||
      myProfile.availability === 'Both' ||
      candidateProfile.availability === 'Both'
    ) {
      score += 5;
      matchReasons.push(`Compatible availability: ${candidateProfile.availability}`);
    }
  }

  if (myProfile.preferredSession && candidateProfile.preferredSession) {
    if (
      myProfile.preferredSession === candidateProfile.preferredSession ||
      myProfile.preferredSession === 'Flexible' ||
      candidateProfile.preferredSession === 'Flexible'
    ) {
      score += 5;
      matchReasons.push(`Compatible session time: ${candidateProfile.preferredSession}`);
    }
  }

  return {
    score,
    compatibilityTier,
    matchReasons,
    isReciprocal: compatibilityTier === 'reciprocal',
  };
}

/**
 * Call external AI API (e.g. Gemini, OpenAI) to refine skill match reasons
 * Returns null if AI is not configured or fails, ensuring seamless fallback.
 */
async function callExternalAiApi(currentUserProfile, candidateProfiles) {
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase().trim();
  const apiKey = process.env.AI_API_KEY || '';
  const model = process.env.AI_MODEL || (provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini');

  // If no API key or provider is 'none', gracefully return null without error
  if (!apiKey || provider === 'none') {
    return null;
  }

  // Build minimal anonymized payload (Req 6: do not send sensitive user data)
  const candidateData = candidateProfiles.map((c) => ({
    userId: c.userId._id.toString(),
    teach: c.skillToTeach,
    learn: c.skillToLearn,
    level: c.experienceLevel,
  }));

  const systemInstruction = `You are an AI skill matching assistant for "Skill Swap AI".
Your ONLY task is to analyze the reciprocal skill-sharing compatibility between the Current User and Candidate Users.
Rules:
1. Focus exclusively on skill compatibility, complementary learning goals, and related topics.
2. NEVER judge or make statements about a person's intelligence, trustworthiness, competence, character, or sensitive traits.
3. Keep reasons objective, friendly, concise, and focused on explicit skills.
4. Output strictly valid JSON matching the format:
{
  "matches": [
    {
      "userId": "<candidate userId string>",
      "reason": "<one clear, encouraging sentence explaining why this is a good skill swap>",
      "compatibilityTier": "reciprocal" | "learning_match" | "related_match" | "partial"
    }
  ]
}`;

  const promptText = `Current User:
- Wants to learn: "${currentUserProfile.skillToLearn}"
- Can teach: "${currentUserProfile.skillToTeach}"
- Experience level: "${currentUserProfile.experienceLevel}"

Candidates:
${JSON.stringify(candidateData, null, 2)}

Provide structured JSON with match reasons for each candidate.`;

  // Timeout controller (5-second max to keep response lightning fast)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    let responseText = '';

    if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\n${promptText}` }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Gemini API returned status ${res.status}`);
      }

      const json = await res.json();
      responseText = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (provider === 'openai' || provider === 'groq') {
      const endpoint = provider === 'groq' 
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: promptText },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      });

      if (!res.ok) {
        throw new Error(`${provider} API returned status ${res.status}`);
      }

      const json = await res.json();
      responseText = json?.choices?.[0]?.message?.content || '';
    } else {
      return null;
    }

    if (!responseText) return null;

    // Parse and validate JSON (Req 10, 41, 42)
    const parsed = JSON.parse(responseText);
    if (!parsed || !Array.isArray(parsed.matches)) return null;

    // Validate returned candidate userIds belong to our candidates set
    const candidateIdSet = new Set(candidateData.map((c) => c.userId));
    const validMatches = parsed.matches.filter(
      (m) => m && m.userId && candidateIdSet.has(m.userId.toString()) && typeof m.reason === 'string'
    );

    return validMatches;
  } catch (error) {
    // Log technical error on server without leaking API keys
    console.warn('[AI Recommendation] AI API unavailable or failed:', error.message);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Main recommendation generator (Req 50)
 * Pipeline:
 * 1. Filter candidates
 * 2. Deterministic compatibility scoring
 * 3. Select top candidates
 * 4. Optional AI analysis & reason enrichment
 * 5. Return sorted recommendations
 */
export async function generateRecommendations({
  currentUser,
  currentProfile,
  candidateProfiles,
  connectedUserIds = new Set(),
  pendingSentUserIds = new Set(),
  pendingReceivedUserIds = new Set(),
  bypassCache = false,
  limit = 10,
}) {
  const currentUserIdStr = currentUser._id.toString();

  // 1. Check in-memory cache if not bypassing
  if (!bypassCache) {
    const cached = recommendationCache.get(currentUserIdStr);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  // 2. Score each candidate deterministically
  const scoredCandidates = [];

  for (const candidate of candidateProfiles) {
    if (!candidate.userId) continue;
    const candidateIdStr = candidate.userId._id ? candidate.userId._id.toString() : candidate.userId.toString();

    // Skip self
    if (candidateIdStr === currentUserIdStr) continue;

    // Skip already connected partners (Req 16)
    if (connectedUserIds.has(candidateIdStr)) continue;

    const compatibility = calculateSkillCompatibility(currentProfile, candidate);

    // Determine connection state
    let connectionStatus = 'none';
    if (pendingSentUserIds.has(candidateIdStr)) {
      connectionStatus = 'pending_sent';
    } else if (pendingReceivedUserIds.has(candidateIdStr)) {
      connectionStatus = 'pending_received';
    }

    scoredCandidates.push({
      profile: candidate,
      candidateIdStr,
      compatibility,
      connectionStatus,
    });
  }

  // 3. Sort deterministically by score descending
  scoredCandidates.sort((a, b) => b.compatibility.score - a.compatibility.score);

  // Take top candidates for recommendation
  const topCandidates = scoredCandidates.slice(0, Math.max(limit, 10));

  // 4. Optional AI analysis for the top candidates (batch analysis)
  let aiMatches = null;
  const isAiConfigured = Boolean(process.env.AI_API_KEY && process.env.AI_PROVIDER !== 'none');

  if (isAiConfigured && topCandidates.length > 0) {
    aiMatches = await callExternalAiApi(
      currentProfile,
      topCandidates.map((c) => c.profile)
    );
  }

  const aiMatchMap = new Map();
  if (aiMatches && Array.isArray(aiMatches)) {
    for (const match of aiMatches) {
      aiMatchMap.set(match.userId.toString(), match);
    }
  }

  // 5. Build final recommendation objects
  const recommendations = topCandidates.map((item) => {
    const p = item.profile;
    const u = p.userId;
    const candidateId = item.candidateIdStr;
    const aiMatch = aiMatchMap.get(candidateId);

    // If AI provided a reason, use it; otherwise use deterministic reasons
    const matchReasons = aiMatch?.reason
      ? [aiMatch.reason, ...item.compatibility.matchReasons.slice(1)]
      : item.compatibility.matchReasons;

    const matchType = aiMatch?.reason ? 'ai-assisted' : 'skill-based';

    return {
      user: {
        id: candidateId,
        name: u.name || 'Skill Partner',
        profileImage: u.profileImage || '',
      },
      canTeach: p.skillToTeach,
      wantsToLearn: p.skillToLearn,
      experienceLevel: p.experienceLevel,
      availability: p.availability,
      preferredSession: p.preferredSession,
      bio: p.bio || u.bio || '',
      matchReasons,
      matchType, // 'ai-assisted' | 'skill-based'
      compatibilityTier: aiMatch?.compatibilityTier || item.compatibility.compatibilityTier,
      isReciprocal: item.compatibility.isReciprocal,
      connectionStatus: item.connectionStatus, // 'none' | 'pending_sent' | 'pending_received'
    };
  });

  // 6. Generate Skill Path for current user
  const skillPath = generateSkillPath(currentProfile.skillToLearn);

  const result = {
    recommendations,
    skillPath,
    engine: aiMatches ? 'ai-assisted' : 'skill-based',
    totalFound: recommendations.length,
    timestamp: Date.now(),
  };

  // 7. Store in cache
  recommendationCache.set(currentUserIdStr, {
    data: result,
    timestamp: Date.now(),
  });

  return result;
}

/**
 * Invalidate user's recommendation cache when their profile or connections change
 */
export function invalidateUserRecommendationCache(userId) {
  if (!userId) return;
  recommendationCache.delete(userId.toString());
}
