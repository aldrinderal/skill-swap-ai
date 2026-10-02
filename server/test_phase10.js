import http from 'http';
import express from 'express';
import jwt from 'jsonwebtoken';
import { io as ClientIO } from '../client/node_modules/socket.io-client/build/esm/index.js';
import { initSocketServer, getOnlineUserIds, isUserOnline } from './sockets/socketServer.js';

const JWT_SECRET = process.env.JWT_SECRET || 'skillswap_super_secret_jwt_key_2026_dev';

async function runPhase10Tests() {
  console.log('=== STARTING PHASE 10 SOCKET.IO COMPREHENSIVE VERIFICATION ===\n');

  // 1. Setup isolated test HTTP server and Socket.IO server on random port
  const app = express();
  const httpServer = http.createServer(app);
  initSocketServer(httpServer);

  await new Promise((resolve) => httpServer.listen(0, resolve));
  const port = httpServer.address().port;
  const socketUrl = `http://localhost:${port}`;

  console.log(`Test Socket.IO Server running on port ${port}`);

  // Test identities
  const userAId = '6abf46d208bddd927566b801';
  const userBId = '6abf46d308bddd927566b802';

  const tokenA = jwt.sign({ userId: userAId, email: 'userA@test.com' }, JWT_SECRET, { expiresIn: '1h' });
  const tokenB = jwt.sign({ userId: userBId, email: 'userB@test.com' }, JWT_SECRET, { expiresIn: '1h' });

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`✅ TEST ${totalTests} PASSED: ${message}`);
      passedTests++;
    } else {
      console.error(`❌ TEST ${totalTests} FAILED: ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Reject unauthenticated socket connection (no token)
    // -------------------------------------------------------------
    await new Promise((resolve) => {
      const client = ClientIO(socketUrl, { autoConnect: true });
      client.on('connect_error', (err) => {
        assert(err.message === 'Authentication required', 'Unauthenticated socket rejected with "Authentication required"');
        client.disconnect();
        resolve();
      });
      client.on('connect', () => {
        assert(false, 'Unauthenticated socket should NOT connect');
        client.disconnect();
        resolve();
      });
    });

    // -------------------------------------------------------------
    // TEST 2: Reject connection with invalid JWT token
    // -------------------------------------------------------------
    await new Promise((resolve) => {
      const client = ClientIO(socketUrl, {
        auth: { token: 'invalid_dummy_token_xyz' },
        autoConnect: true,
      });
      client.on('connect_error', (err) => {
        assert(err.message === 'Invalid authentication token', 'Invalid JWT rejected with "Invalid authentication token"');
        client.disconnect();
        resolve();
      });
      client.on('connect', () => {
        assert(false, 'Invalid JWT socket should NOT connect');
        client.disconnect();
        resolve();
      });
    });

    // -------------------------------------------------------------
    // TEST 3: Authenticated connection with valid JWT (User A)
    // -------------------------------------------------------------
    let clientA1;
    await new Promise((resolve) => {
      clientA1 = ClientIO(socketUrl, {
        auth: { token: tokenA },
        autoConnect: true,
      });
      clientA1.on('connect', () => {
        assert(clientA1.connected, 'Authenticated socket connects successfully with valid JWT');
        resolve();
      });
      clientA1.on('connect_error', (err) => {
        assert(false, `Authenticated socket failed to connect: ${err.message}`);
        resolve();
      });
    });

    // -------------------------------------------------------------
    // TEST 4: Ping / Pong event exchange
    // -------------------------------------------------------------
    await new Promise((resolve) => {
      clientA1.once('pong', (data) => {
        assert(data && typeof data.timestamp === 'number', 'Ping/Pong exchange verified');
        resolve();
      });
      clientA1.emit('ping');
    });

    // -------------------------------------------------------------
    // TEST 5: Online User Tracking
    // -------------------------------------------------------------
    assert(isUserOnline(userAId), 'User A is recognized as online in-memory');

    // -------------------------------------------------------------
    // TEST 6: User B connects and User A receives user:online event
    // -------------------------------------------------------------
    let clientB;
    await new Promise((resolve) => {
      clientA1.once('user:online', (data) => {
        assert(data?.userId === userBId, 'User A receives "user:online" event when User B connects');
      });

      clientB = ClientIO(socketUrl, {
        auth: { token: tokenB },
        autoConnect: true,
      });

      clientB.on('connect', () => {
        resolve();
      });
    });

    // -------------------------------------------------------------
    // TEST 7: Multiple Tab / Device Handling for User A
    // (Open second socket for User A, close first socket -> user remains online)
    // -------------------------------------------------------------
    const clientA2 = ClientIO(socketUrl, {
      auth: { token: tokenA },
      autoConnect: true,
    });
    await new Promise((resolve) => clientA2.on('connect', resolve));

    let offlineEmittedOnTabClose = false;
    clientB.once('user:offline', () => {
      offlineEmittedOnTabClose = true;
    });

    // Close Tab 1 for User A
    clientA1.disconnect();
    await new Promise((r) => setTimeout(r, 200));

    assert(!offlineEmittedOnTabClose && isUserOnline(userAId), 'Closing one tab does NOT mark user offline if second tab is active');

    // -------------------------------------------------------------
    // TEST 8: Real-Time Connection Request Notification (Section 27)
    // -------------------------------------------------------------
    const { emitToUser } = await import('./sockets/socketServer.js');

    await new Promise((resolve) => {
      clientB.once('connection:request', (payload) => {
        assert(
          payload?.requestId === 'req_123' && payload?.sender?.name === 'User A',
          'User B receives real-time "connection:request" notification in private room'
        );
        resolve();
      });

      // Simulate connectionController emitting connection:request to User B
      emitToUser(userBId, 'connection:request', {
        requestId: 'req_123',
        sender: {
          id: userAId,
          name: 'User A',
          profileImage: '',
          skillToTeach: 'UI/UX Design',
          skillToLearn: 'MERN Stack',
        },
      });
    });

    // -------------------------------------------------------------
    // TEST 9: Real-Time Connection Accepted Notification (Section 28)
    // -------------------------------------------------------------
    await new Promise((resolve) => {
      clientA2.once('connection:accepted', (payload) => {
        assert(
          payload?.connectionId === 'conn_456' && payload?.user?.name === 'User B',
          'User A receives real-time "connection:accepted" notification in private room'
        );
        resolve();
      });

      // Simulate connectionController emitting connection:accepted to User A
      emitToUser(userAId, 'connection:accepted', {
        connectionId: 'conn_456',
        user: {
          id: userBId,
          name: 'User B',
          profileImage: '',
        },
      });
    });

    // -------------------------------------------------------------
    // TEST 10: Real-Time Connection Rejected Notification (Section 29)
    // -------------------------------------------------------------
    await new Promise((resolve) => {
      clientA2.once('connection:rejected', (payload) => {
        assert(payload?.requestId === 'req_123', 'User A receives real-time "connection:rejected" notification');
        resolve();
      });

      // Simulate connectionController emitting connection:rejected to User A
      emitToUser(userAId, 'connection:rejected', {
        requestId: 'req_123',
      });
    });

    // -------------------------------------------------------------
    // TEST 11: Final Tab Disconnect emits user:offline
    // -------------------------------------------------------------
    await new Promise((resolve) => {
      clientB.once('user:offline', (data) => {
        assert(data?.userId === userAId, 'User B receives "user:offline" when User A closes their final tab');
        resolve();
      });

      // Disconnect last socket for User A
      clientA2.disconnect();
    });

    // Clean up
    clientB.disconnect();
    httpServer.close();

    console.log(`\n========================================`);
    console.log(`SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED!`);
    console.log(`========================================\n`);

    process.exit(passedTests === totalTests ? 0 : 1);
  } catch (err) {
    console.error('Fatal test error:', err);
    httpServer.close();
    process.exit(1);
  }
}

runPhase10Tests().catch((err) => {
  console.error(err);
  process.exit(1);
});
