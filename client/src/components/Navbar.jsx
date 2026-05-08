import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { useState, useEffect } from 'react';
import {
  HomeIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  PlusCircleIcon,
  CalendarDaysIcon,
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  BuildingOfficeIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetch = () => axios.get('/api/messages/unread').then(r => setUnread(r.data.count)).catch(() => {});
    fetch();
    const t = setInterval(fetch, 15000);
    return () => clearInterval(t);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-luxuryBlack/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex gap-1">
              <span className="w-2 h-6 rounded-sm bg-gnRed" />
              <span className="w-2 h-6 rounded-sm bg-gnYellow" />
              <span className="w-2 h-6 rounded-sm bg-gnGreen" />
            </div>
            <span className="font-black text-white text-lg tracking-tight">
              GuiLoc<span className="text-gnYellow">House</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/houses" className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${isActive('/houses') ? 'text-gnYellow' : 'text-gray-400 hover:text-white'}`}>
              Annonces
            </Link>
            {user && (
              <>
                <Link to="/post-house" className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${isActive('/post-house') ? 'text-gnYellow' : 'text-gray-400 hover:text-white'}`}>
                  Publier
                </Link>
                <Link to="/favorites" className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${isActive('/favorites') ? 'text-gnYellow' : 'text-gray-400 hover:text-white'}`}>
                  Favoris
                </Link>
                <Link to="/my-houses" className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${isActive('/my-houses') ? 'text-gnYellow' : 'text-gray-400 hover:text-white'}`}>
                  Mes annonces
                </Link>
                <Link to="/bookings" className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${isActive('/bookings') ? 'text-gnYellow' : 'text-gray-400 hover:text-white'}`}>
                  Réservations
                </Link>
                <Link to="/messages" className={`relative px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${isActive('/messages') ? 'text-gnYellow' : 'text-gray-400 hover:text-white'}`}>
                  Messages
                  {unread > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gnYellow rounded-full flex items-center justify-center text-[9px] font-black text-luxuryBlack">{unread}</span>}
                </Link>
              </>
            )}
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link to="/profile" className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:border-gnYellow/30 transition-colors">
                  <UserCircleIcon className="h-4 w-4 text-gnYellow" />
                  <span className="text-xs font-bold text-white truncate max-w-[100px]">{user.name}</span>
                </Link>
                <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-gnRed transition-colors">
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary btn-sm">Connexion</Link>
                <Link to="/register" className="btn-primary btn-sm">Inscription</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-gray-400 hover:text-white">
            {menuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-luxuryBlack border-t border-white/5 px-4 py-4 space-y-2">
          <Link to="/houses" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-300 hover:text-white hover:bg-white/5">
            <HomeIcon className="h-4 w-4" /> Annonces
          </Link>
          {user ? (
            <>
              <Link to="/post-house" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-300 hover:text-white hover:bg-white/5">
                <PlusCircleIcon className="h-4 w-4" /> Publier une annonce
              </Link>
              <Link to="/favorites" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-300 hover:text-white hover:bg-white/5">
                <HeartIcon className="h-4 w-4" /> Favoris
              </Link>
              <Link to="/my-houses" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-300 hover:text-white hover:bg-white/5">
                <BuildingOfficeIcon className="h-4 w-4" /> Mes annonces
              </Link>
              <Link to="/bookings" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-300 hover:text-white hover:bg-white/5">
                <CalendarDaysIcon className="h-4 w-4" /> Mes réservations
              </Link>
              <Link to="/messages" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-300 hover:text-white hover:bg-white/5">
                <ChatBubbleLeftRightIcon className="h-4 w-4" /> Messages
                {unread > 0 && <span className="ml-auto w-5 h-5 bg-gnYellow rounded-full flex items-center justify-center text-[10px] font-black text-luxuryBlack">{unread}</span>}
              </Link>
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-300 hover:text-white hover:bg-white/5">
                <UserCircleIcon className="h-4 w-4" /> Mon profil
              </Link>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gnRed hover:bg-gnRed/10">
                <ArrowRightOnRectangleIcon className="h-4 w-4" /> Déconnexion
              </button>
            </>
          ) : (
            <div className="flex gap-3 pt-2">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary flex-1 text-center">Connexion</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary flex-1 text-center">Inscription</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
