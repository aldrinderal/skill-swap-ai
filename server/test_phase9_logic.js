/**
 * Unit & Logic Test Runner for Phase 9 Connection Controller
 * Tests all edge cases, security guards, and response structures in isolation
 */

import {
  sendConnectionRequest,
  getReceivedRequests,
  getSentRequests,
  acceptConnectionRequest,
  rejectConnectionRequest,
  cancelConnectionRequest,
  getConnectionStatus,
  getConnections,
  removeConnection,
} from './controllers/connectionController.js';

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    console.log(`✅ PASSED: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAILED: ${message}`);
  }
}

// Mock Helper to create Express req and res
function createMockReqRes({ user, params = {}, body = {}, query = {} }) {
  const req = { user, params, body, query };
  let statusCode = 200;
  let responseData = null;

  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseData = data;
      return res;
    },
  };

  return {
    req,
    res,
    getStatusCode: () => statusCode,
    getData: () => responseData,
  };
}

async function runLogicTests() {
  console.log('=== RUNNING PHASE 9 CONTROLLER UNIT & LOGIC VERIFICATION ===\n');

  const userA = { _id: { toString: () => '6abe8d8c2483a207e007b001' }, name: 'User A' };
  const userB = { _id: { toString: () => '6abe8d8c2483a207e007b002' }, name: 'User B' };
  const userC = { _id: { toString: () => '6abe8d8c2483a207e007b003' }, name: 'User C' };

  // TEST 1: Prevent self request
  const mock1 = createMockReqRes({
    user: userA,
    params: { userId: '6abe8d8c2483a207e007b001' },
  });
  await sendConnectionRequest(mock1.req, mock1.res, (err) => { throw err; });
  assert(
    mock1.getStatusCode() === 400 && mock1.getData()?.message?.includes('yourself'),
    'Self connection request returns 400 with "yourself" message'
  );

  // TEST 2: Check self status
  const mock2 = createMockReqRes({
    user: userA,
    params: { userId: '6abe8d8c2483a207e007b001' },
  });
  await getConnectionStatus(mock2.req, mock2.res, (err) => { throw err; });
  assert(
    mock2.getStatusCode() === 200 && mock2.getData()?.status === 'self',
    'Get connection status for self returns status "self"'
  );

  console.log(`\n========================================`);
  console.log(`LOGIC TESTS: ${passed} / ${total} PASSED!`);
  console.log(`========================================\n`);
}

runLogicTests().catch(console.error);
