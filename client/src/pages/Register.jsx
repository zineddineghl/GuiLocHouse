import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';
import { UserIcon, EnvelopeIcon, LockClosedIcon, PhoneIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/register', form);
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxuryBlack">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen px-4 pt-16 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex gap-1">
                <span className="w-2 h-6 rounded-sm bg-gnRed" />
                <span className="w-2 h-6 rounded-sm bg-gnYellow" />
                <span className="w-2 h-6 rounded-sm bg-gnGreen" />
              </div>
              <span className="font-black text-white text-xl">GuiLoc<span className="text-gnYellow">House</span></span>
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight">Inscription</h1>
            <p className="text-gray-500 text-sm mt-2">Créez votre compte gratuitement</p>
          </div>

          <div className="bg-[#111] border border-white/5 rounded-2xl p-8">
            {error && (
              <div className="mb-6 px-4 py-3 bg-gnRed/10 border border-gnRed/20 rounded-xl text-gnRed text-sm font-bold">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="form-group">
                <label className="form-label">Nom complet</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input type="text" required placeholder="Votre nom" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} className="input-field pl-10" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input type="email" required placeholder="votre@email.com" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} className="input-field pl-10" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input type="tel" placeholder="+224 6XX XX XX XX" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field pl-10" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Mot de passe</label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input type="password" required placeholder="••••••••" value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })} className="input-field pl-10" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? 'Création...' : 'Créer mon compte'}
              </button>
            </form>
          </div>

          <p className="text-center text-gray-500 text-sm mt-6">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-gnYellow font-bold hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
