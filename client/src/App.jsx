import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import RealtimeToast from './components/RealtimeToast';
import IncomingCallModal from './components/IncomingCallModal';

// Layouts & Guards
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Skills from './pages/Skills';
import RegisterSkill from './pages/RegisterSkill';
import PublicSkillProfile from './pages/PublicSkillProfile';
import Requests from './pages/Requests';
import Connections from './pages/Connections';
import Profile from './pages/Profile';
import Meeting from './pages/Meeting';
import MeetingEnded from './pages/MeetingEnded';
import Admin from './pages/Admin';
import Recommendations from './pages/Recommendations';
import Feedback from './pages/Feedback';

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <RealtimeToast />
          <IncomingCallModal />
          <Routes>
            {/* Main Application Protected Routes (Wrapped in ProtectedRoute) */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<Home />} />
              <Route path="/skills" element={<Skills />} />
              <Route path="/skills/register" element={<RegisterSkill />} />
              <Route path="/skills/user/:userId" element={<PublicSkillProfile />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/requests" element={<Requests />} />
              <Route path="/connections" element={<Connections />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/feedback/:meetingId" element={<Feedback />} />
              <Route path="/meeting-ended" element={<MeetingEnded />} />
              <Route path="/admin" element={<Admin />} />
            </Route>

            {/* Standalone Authentication Pages (Public) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Standalone Fullscreen Meeting Room (Protected) */}
            <Route
              path="/meeting/:meetingId"
              element={
                <ProtectedRoute>
                  <Meeting />
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
