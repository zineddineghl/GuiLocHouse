import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';
import Navbar from '../components/Navbar';
import {
  PencilIcon, CheckIcon, XMarkIcon, PhoneIcon, CalendarIcon,
  ShieldCheckIcon, EyeIcon, EyeSlashIcon,
} from '@heroicons/react/24/outline';

const AVATAR_COLORS = [
  'bg-blue-900', 'bg-purple-900', 'bg-emerald-900',
  'bg-orange-900', 'bg-rose-900', 'bg-teal-900',
];

const INPUT = 'w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 focus:ring-1 focus:ring-gnYellow/50 transition-all outline-none placeholder-gray-600';

export default function Profile() {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);

  // Edit profile
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Change password
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState(null);

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    setEditName(user.name || '');
    setEditPhone(user.phone || '');
    axios.get('/api/houses/my').then(r => setListings(r.data)).catch(() => {});
  }, [user]);

  const handleSave = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    setSaveError('');
    try {
      const { data } = await axios.put('/api/auth/profile', { name: editName, phone: editPhone });
      login(data, localStorage.getItem('glh_token'));
      setEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Erreur');
    }
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    if (newPwd !== confirmPwd) { setPwdMsg({ ok: false, text: 'Les mots de passe ne correspondent pas' }); return; }
    if (newPwd.length < 6) { setPwdMsg({ ok: false, text: 'Minimum 6 caractères' }); return; }
    setPwdLoading(true);
    setPwdMsg(null);
    try {
      await axios.put('/api/auth/password', { current_password: currentPwd, new_password: newPwd });
      setPwdMsg({ ok: true, text: 'Mot de passe modifié avec succès' });
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err) {
      setPwdMsg({ ok: false, text: err.response?.data?.error || 'Erreur' });
    }
    setPwdLoading(false);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await axios.delete('/api/auth/me');
      logout();
      navigate('/');
    } catch {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  if (!user) return null;

  const initials = user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const avatarColor = AVATAR_COLORS[(user.name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="bg-luxuryBlack min-h-screen pt-12 pb-20">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">

        {/* ── Carte profil ─────────────────────────────────────────────────── */}
        <div className="bg-luxuryDark rounded-3xl border border-white/5 shadow-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row gap-8 relative z-10">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className={`${avatarColor} w-28 h-28 rounded-full flex items-center justify-center text-white font-black text-4xl border-2 border-white/10 shadow-xl`}>
                {initials}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-4 bg-black/40 p-6 rounded-2xl border border-white/10">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nom complet</label>
                    <input className={INPUT} value={editName} onChange={e => setEditName(e.target.value)} placeholder="Votre nom" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Téléphone</label>
                    <input className={INPUT} value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+224 6xx xx xx xx" />
                  </div>
                  {saveError && <p className="text-gnRed text-xs font-bold bg-gnRed/10 p-3 rounded-lg border border-gnRed/20">{saveError}</p>}
                  <div className="flex gap-3 pt-1">
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-gnYellow text-luxuryBlack text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gnYellow/90 disabled:opacity-50 transition-all">
                      <CheckIcon className="h-4 w-4" />
                      {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                    <button onClick={() => { setEditing(false); setSaveError(''); }} className="flex items-center gap-2 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400 border border-white/20 rounded-xl hover:bg-white/10 transition-colors">
                      <XMarkIcon className="h-4 w-4" />
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h1 className="text-3xl md:text-4xl font-display font-black text-white tracking-tighter">{user.name}</h1>
                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md border border-gnYellow/20 bg-gnYellow/10 text-gnYellow">
                          Membre
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10"
                    >
                      <PencilIcon className="h-4 w-4 text-gnYellow" />
                      Modifier
                    </button>
                  </div>

                  <div className="mt-5 space-y-2 text-sm text-gray-400">
                    {memberSince && (
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-500" />
                        <span>Membre depuis <span className="text-gray-300 font-medium">{memberSince}</span></span>
                      </div>
                    )}
                    {user.phone && (
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-300">{user.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs">{user.email}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4 text-center relative z-10">
            <div className="group">
              <div className="text-3xl font-display font-black text-white group-hover:text-gnYellow transition-colors">{listings.length}</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Annonces</div>
            </div>
            <div className="group border-l border-white/5">
              <div className="text-3xl font-display font-black text-white group-hover:text-gnYellow transition-colors">0</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Réservations reçues</div>
            </div>
          </div>
        </div>

        {/* ── Sécurité ─────────────────────────────────────────────────────── */}
        <div className="bg-luxuryDark rounded-3xl border border-white/5 shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <ShieldCheckIcon className="h-6 w-6 text-gnYellow" />
            <h2 className="font-display font-black text-xl text-white uppercase tracking-wider">Sécurité</h2>
          </div>

          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Mot de passe actuel</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={currentPwd}
                  onChange={e => setCurrentPwd(e.target.value)}
                  placeholder="••••••••"
                  className={INPUT + ' pr-11'}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
                  {showPwd ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nouveau mot de passe</label>
              <input type={showPwd ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="••••••••" className={INPUT} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Confirmer le nouveau mot de passe</label>
              <input type={showPwd ? 'text' : 'password'} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="••••••••" className={INPUT} />
            </div>

            {pwdMsg && (
              <p className={`text-xs font-bold p-3 rounded-lg border ${pwdMsg.ok ? 'text-gnGreen bg-gnGreen/10 border-gnGreen/20' : 'text-gnRed bg-gnRed/10 border-gnRed/20'}`}>{pwdMsg.text}</p>
            )}

            <button
              onClick={handlePasswordChange}
              disabled={pwdLoading || !currentPwd || !newPwd || !confirmPwd}
              className="px-6 py-2.5 bg-gnYellow text-luxuryBlack text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gnYellow/90 disabled:opacity-40 transition-all"
            >
              {pwdLoading ? 'Chargement...' : 'Modifier le mot de passe'}
            </button>
          </div>

          {/* Delete account */}
          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-white text-sm">Supprimer mon compte</p>
              <p className="text-xs text-gray-500 mt-1">Cette action est irréversible. Toutes vos données seront supprimées.</p>
            </div>
            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gnRed border border-gnRed/30 bg-gnRed/5 hover:bg-gnRed/10 rounded-xl transition-colors"
              >
                Supprimer le compte
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gnRed font-bold">Confirmer ?</span>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-gnRed hover:bg-gnRed/80 rounded-xl transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Suppression...' : 'Oui, supprimer'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 border border-white/20 rounded-xl hover:bg-white/10 transition-colors"
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
