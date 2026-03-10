import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';

// Pages
import Dashboard from './pages/Dashboard';
import ProjectCreator from './pages/ProjectCreator';
import ProjectDetail from './pages/ProjectDetail';
import SprintPlanner from './pages/SprintPlanner';
import ResourceManager from './pages/ResourceManager';
import PortfolioDashboard from './pages/PortfolioDashboard';
import AICopilot from './pages/AICopilot';
import AllProjects from './pages/AllProjects';
import ProgramView from './pages/ProgramView';
import ChangeManagementDashboard from './pages/ChangeManagementDashboard';

// Use relative URL in production, env var in development
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

// Theme Context
const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('compassx-theme');
      return saved || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('compassx-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Auth Context (simplified - no login required)
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const AuthProvider = ({ children }) => {
  // Default user - no login required
  const [user] = useState({
    user_id: 'default_user',
    name: 'Guest User',
    email: 'guest@compassx.com'
  });

  const logout = () => {
    // No-op since login is disabled
  };

  return (
    <AuthContext.Provider value={{ user, loading: false, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// App Router - No protected routes needed
const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/create" element={<ProjectCreator />} />
      <Route path="/project/:projectId" element={<ProjectDetail />} />
      <Route path="/sprint" element={<SprintPlanner />} />
      <Route path="/resources" element={<ResourceManager />} />
      <Route path="/portfolio" element={<PortfolioDashboard />} />
      <Route path="/copilot" element={<AICopilot />} />
      <Route path="/projects" element={<AllProjects />} />
      <Route path="/program" element={<ProgramView />} />
      <Route path="/changes" element={<ChangeManagementDashboard />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
          <Toaster position="top-right" />
          <div className="noise-overlay" />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
export { API, BACKEND_URL };
