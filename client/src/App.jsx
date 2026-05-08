import { createContext, useContext, useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Pages (à créer)
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Houses from './pages/Houses';
import HouseDetail from './pages/HouseDetail';
import PostHouse from './pages/PostHouse';
import Profile from './pages/Profile';
import MyBookings from './pages/MyBookings';
import MyHouses from './pages/MyHouses';
import Favorites from './pages/Favorites';
import Messages from './pages/Messages';
import Conversation from './pages/Conversation';

// ─── Auth Context ─────────────────────────────────────────────────────────────
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('glh_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/api/auth/me')
        .then(r => setUser(r.data))
        .catch(() => { logout(); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (userData, jwt) => {
    localStorage.setItem('glh_token', jwt);
    axios.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
    setToken(jwt);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('glh_token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  if (loading) return (
    <div className="min-h-screen bg-luxuryBlack flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gnYellow" />
    </div>
  );

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/houses" element={<Houses />} />
        <Route path="/houses/:id" element={<HouseDetail />} />
        <Route path="/post-house" element={<PostHouse />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/bookings" element={<MyBookings />} />
        <Route path="/my-houses" element={<MyHouses />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:id" element={<Conversation />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
