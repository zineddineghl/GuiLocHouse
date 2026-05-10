import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import {
  UsersIcon,
  HomeModernIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  ShieldExclamationIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';

const TABS = [
  { id: 'stats',    label: 'Stats globales' },
  { id: 'users',    label: 'Utilisateurs' },
  { id: 'houses',   label: 'Annonces' },
  { id: 'bookings', label: 'Réservations' },
];

const STATUS_COLORS = {
  pending:   'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
  confirmed: 'bg-green-500/10  text-green-500  border border-green-500/20',
  rejected:  'bg-red-500/10    text-red-500    border border-red-500/20',
  cancelled: 'bg-gray-500/10   text-gray-400   border border-gray-500/20',
};

const HOUSE_TYPES = ['apartment', 'house', 'villa', 'studio', 'room'];

function StatCard({ icon: Icon, label, value, sub, color = 'text-gnYellow', bgIcon = 'bg-gnYellow/10' }) {
  return (
    <div className="p-6 flex items-center gap-5 border border-white/5 bg-[#111] rounded-2xl shadow-xl">
      <div className={`p-4 rounded-xl ${bgIcon}`}>
        <Icon className={`h-7 w-7 ${color}`} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{label}</p>
        <p className={`text-3xl font-black mt-1 ${color}`}>{value}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">{sub}</p>}
      </div>
    </div>
  );
}

function Pagination({ page, total, limit, onPage }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-6 text-sm text-gray-400 font-bold">
      <span>{total} résultat{total > 1 ? 's' : ''}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-white/5"
        >
          <ChevronLeftIcon className="h-4 w-4 text-white" />
        </button>
        <span className="text-white">Page {page} / {totalPages}</span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-white/5"
        >
          <ChevronRightIcon className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  );
}

// ── STATS ──────────────────────────────────────────────────────────────────────
function StatsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/admin/stats')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gnYellow" /></div>;
  if (!data) return <p className="text-center text-gray-500 py-8 font-bold">Erreur de chargement</p>;

  const { summary, recent_bookings, recent_users } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={UsersIcon}       label="Utilisateurs"      value={summary.total_users}    sub={`+${summary.new_users_month} ce mois`} />
        <StatCard icon={HomeModernIcon}  label="Annonces"          value={summary.total_houses}   sub={`${summary.active_houses} actives`}   color="text-white"     bgIcon="bg-white/10" />
        <StatCard icon={CalendarDaysIcon} label="Réservations"     value={summary.total_bookings} sub={`${summary.pending_bookings} en attente`} color="text-blue-400" bgIcon="bg-blue-400/10" />
        <StatCard icon={CurrencyDollarIcon} label="Revenus confirmés" value={`${Number(summary.total_revenue).toLocaleString()}`} sub={`${Number(summary.month_revenue).toLocaleString()} GNF ce mois`} color="text-green-400" bgIcon="bg-green-400/10" />
      </div>

      {summary.banned_users > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4 text-sm text-red-500 font-bold flex items-center gap-3">
          <ShieldExclamationIcon className="w-5 h-5" />
          {summary.banned_users} compte{summary.banned_users > 1 ? 's' : ''} suspendu{summary.banned_users > 1 ? 's' : ''}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 border border-white/5 bg-[#111] rounded-2xl">
          <h3 className="font-bold text-gnYellow text-xs uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Dernières réservations</h3>
          <div className="space-y-4">
            {recent_bookings.map(b => (
              <div key={b.id} className="flex items-center justify-between text-sm bg-black/40 p-3 rounded-xl border border-white/5">
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">{b.house_title}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold mt-1 truncate">{b.renter_name} → {b.owner_name}</p>
                </div>
                <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${STATUS_COLORS[b.status]}`}>
                    {b.status}
                  </span>
                  <span className="text-white font-black">{Number(b.total_price)?.toLocaleString()} GNF</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border border-white/5 bg-[#111] rounded-2xl">
          <h3 className="font-bold text-gnYellow text-xs uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Dernières inscriptions</h3>
          <div className="space-y-4">
            {recent_users.map(u => (
              <div key={u.id} className="flex items-center justify-between text-sm bg-black/40 p-3 rounded-xl border border-white/5">
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">{u.name}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold mt-1 truncate">{u.email}</p>
                </div>
                <span className="ml-3 flex-shrink-0 px-3 py-1 bg-white/10 text-white border border-white/10 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── USERS ──────────────────────────────────────────────────────────────────────
function UsersTab() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [bannedFilter, setBannedFilter] = useState('');
  const [confirm, setConfirm] = useState(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (search) params.search = search;
    if (roleFilter) params.role = roleFilter;
    if (bannedFilter !== '') params.banned = bannedFilter;
    axios.get('/api/admin/users', { params })
      .then(r => { setUsers(r.data.users); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, roleFilter, bannedFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const update = async (userId, payload) => {
    await axios.put(`/api/admin/users/${userId}`, payload);
    fetchUsers();
  };

  const deleteUser = async (userId) => {
    await axios.delete(`/api/admin/users/${userId}`);
    setConfirm(null);
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 p-4 bg-[#111] border border-white/5 rounded-2xl">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher nom ou email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:border-gnYellow/50 outline-none transition-colors"
          />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 outline-none appearance-none min-w-[150px]">
          <option value="">Tous les rôles</option>
          <option value="user">Utilisateur</option>
          <option value="owner">Propriétaire</option>
        </select>
        <select value={bannedFilter} onChange={e => { setBannedFilter(e.target.value); setPage(1); }} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 outline-none appearance-none min-w-[150px]">
          <option value="">Tous statuts</option>
          <option value="0">Actifs</option>
          <option value="1">Suspendus</option>
        </select>
      </div>

      <div className="overflow-hidden border border-white/5 bg-[#111] rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-black/40 border-b border-white/5 text-[10px] uppercase font-black text-gray-500 tracking-widest">
              <tr>
                <th className="px-6 py-4">Utilisateur</th>
                <th className="px-6 py-4 text-center">Rôle</th>
                <th className="px-6 py-4 text-center">Annonces</th>
                <th className="px-6 py-4 text-center">Réservations</th>
                <th className="px-6 py-4 text-center">Statut</th>
                <th className="px-6 py-4 text-center">Admin</th>
                <th className="px-6 py-4">Inscrit le</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-500 font-bold">Chargement...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-500 font-bold">Aucun utilisateur</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-white">{u.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{u.email}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-white/10 text-white border border-white/10 rounded-full text-[10px] font-black uppercase tracking-wider">{u.role}</span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400 font-bold">{u.house_count}</td>
                  <td className="px-6 py-4 text-center text-gray-400 font-bold">{u.booking_count}</td>
                  <td className="px-6 py-4 text-center">
                    {u.banned ? (
                      <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-[10px] font-black uppercase tracking-wider">Suspendu</span>
                    ) : (
                      <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full text-[10px] font-black uppercase tracking-wider">Actif</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {u.is_admin ? <ShieldCheckIcon className="h-5 w-5 text-gnYellow mx-auto" /> : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs font-semibold">{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="px-6 py-4">
                    {u.id !== me?.id && (
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => update(u.id, { banned: u.banned ? 0 : 1 })}
                          title={u.banned ? 'Réactiver' : 'Suspendre'}
                          className={`p-2 rounded-xl transition-colors border ${u.banned ? 'text-green-500 bg-green-500/10 border-green-500/20 hover:bg-green-500/20' : 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20'}`}
                        >
                          {u.banned ? <CheckCircleIcon className="h-4 w-4" /> : <ShieldExclamationIcon className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => update(u.id, { is_admin: u.is_admin ? 0 : 1 })}
                          title={u.is_admin ? 'Retirer admin' : 'Rendre admin'}
                          className="p-2 rounded-xl text-gnYellow bg-gnYellow/10 border border-gnYellow/20 hover:bg-gnYellow/20 transition-colors"
                        >
                          <ShieldCheckIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setConfirm({ action: 'delete', userId: u.id, userName: u.name })}
                          className="p-2 rounded-xl text-red-500 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} total={total} limit={20} onPage={setPage} />

      {confirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl p-8 max-w-sm w-full">
            <h3 className="font-black text-white text-xl mb-4">Confirmer la suppression</h3>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              Supprimer <strong className="text-white">{confirm.userName}</strong> ? Cette action est irréversible et supprimera toutes ses annonces et réservations.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setConfirm(null)} className="flex-1 py-3 rounded-xl border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-colors">Annuler</button>
              <button onClick={() => deleteUser(confirm.userId)} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-colors shadow-lg shadow-red-600/20">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── HOUSES TAB ─────────────────────────────────────────────────────────────────
function HousesTab() {
  const [houses, setHouses] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [availableFilter, setAvailableFilter] = useState('');
  const [confirm, setConfirm] = useState(null);

  const fetchHouses = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (search) params.search = search;
    if (typeFilter) params.type = typeFilter;
    if (availableFilter !== '') params.available = availableFilter;
    axios.get('/api/admin/houses', { params })
      .then(r => { setHouses(r.data.houses); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, typeFilter, availableFilter]);

  useEffect(() => { fetchHouses(); }, [fetchHouses]);

  const toggleAvailable = async (house) => {
    await axios.put(`/api/admin/houses/${house.id}`, { available: house.available ? 0 : 1 });
    fetchHouses();
  };

  const deleteHouse = async (houseId) => {
    await axios.delete(`/api/admin/houses/${houseId}`);
    setConfirm(null);
    fetchHouses();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 p-4 bg-[#111] border border-white/5 rounded-2xl">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <input
            type="text"
            placeholder="Titre, ville..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:border-gnYellow/50 outline-none transition-colors"
          />
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 outline-none appearance-none min-w-[150px]">
          <option value="">Tous types</option>
          {HOUSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={availableFilter} onChange={e => { setAvailableFilter(e.target.value); setPage(1); }} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 outline-none appearance-none min-w-[150px]">
          <option value="">Toutes</option>
          <option value="1">Disponibles</option>
          <option value="0">Désactivées</option>
        </select>
      </div>

      <div className="overflow-hidden border border-white/5 bg-[#111] rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-black/40 border-b border-white/5 text-[10px] uppercase font-black text-gray-500 tracking-widest">
              <tr>
                <th className="px-6 py-4">Annonce</th>
                <th className="px-6 py-4">Propriétaire</th>
                <th className="px-6 py-4 text-center">Type</th>
                <th className="px-6 py-4 text-right">Prix/nuit</th>
                <th className="px-6 py-4 text-center">Résa</th>
                <th className="px-6 py-4 text-center">Statut</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-500 font-bold">Chargement...</td></tr>
              ) : houses.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-500 font-bold">Aucune annonce</td></tr>
              ) : houses.map(h => (
                <tr key={h.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {h.images?.[0] ? (
                        <img src={h.images[0]} alt={h.title} className="h-12 w-16 object-cover rounded-xl flex-shrink-0 border border-white/10" onError={e => { e.target.style.display = 'none'; }} />
                      ) : (
                        <div className="h-12 w-16 bg-white/5 rounded-xl flex-shrink-0 flex items-center justify-center text-gray-500 text-xl border border-white/10">
                          <HomeModernIcon className="h-6 w-6" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link to={`/houses/${h.id}`} className="font-bold text-white hover:text-gnYellow transition-colors truncate block">
                          {h.title}
                        </Link>
                        <p className="text-[10px] uppercase font-semibold text-gray-500 mt-1">{h.city}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-white">{h.owner_name}</p>
                    <p className="text-xs text-gray-500 mt-1">{h.owner_email}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-white/10 text-white border border-white/10 rounded-full text-[10px] font-black uppercase tracking-wider">{h.type}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-gnYellow">{Number(h.price_per_night)?.toLocaleString()} GNF</td>
                  <td className="px-6 py-4 text-center text-gray-400 font-bold">{h.booking_count}</td>
                  <td className="px-6 py-4 text-center">
                    {h.available ? (
                      <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full text-[10px] font-black uppercase tracking-wider">Disponible</span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-500/10 border border-gray-500/20 text-gray-400 rounded-full text-[10px] font-black uppercase tracking-wider">Désactivée</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => toggleAvailable(h)}
                        title={h.available ? 'Désactiver' : 'Activer'}
                        className={`p-2 rounded-xl transition-colors border ${h.available ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20' : 'text-green-500 bg-green-500/10 border-green-500/20 hover:bg-green-500/20'}`}
                      >
                        {h.available ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => setConfirm({ houseId: h.id, houseTitle: h.title })}
                        className="p-2 rounded-xl text-red-500 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} total={total} limit={20} onPage={setPage} />

      {confirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl p-8 max-w-sm w-full">
            <h3 className="font-black text-white text-xl mb-4">Supprimer l'annonce</h3>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              Supprimer <strong className="text-white">{confirm.houseTitle}</strong> ? Les réservations associées seront également supprimées.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setConfirm(null)} className="flex-1 py-3 rounded-xl border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-colors">Annuler</button>
              <button onClick={() => deleteHouse(confirm.houseId)} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-colors shadow-lg shadow-red-600/20">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── BOOKINGS TAB ───────────────────────────────────────────────────────────────
function BookingsTab() {
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionModal, setActionModal] = useState(null);

  const fetchBookings = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (statusFilter) params.status = statusFilter;
    axios.get('/api/admin/bookings', { params })
      .then(r => { setBookings(r.data.bookings); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const forceStatus = async (bookingId, status) => {
    await axios.put(`/api/admin/bookings/${bookingId}`, { status });
    setActionModal(null);
    fetchBookings();
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 p-4 bg-[#111] border border-white/5 rounded-2xl">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 outline-none appearance-none min-w-[200px]">
          <option value="">Tous statuts</option>
          <option value="pending">En attente</option>
          <option value="confirmed">Confirmées</option>
          <option value="rejected">Refusées</option>
          <option value="cancelled">Annulées</option>
        </select>
      </div>

      <div className="overflow-hidden border border-white/5 bg-[#111] rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-black/40 border-b border-white/5 text-[10px] uppercase font-black text-gray-500 tracking-widest">
              <tr>
                <th className="px-6 py-4">Logement</th>
                <th className="px-6 py-4">Locataire</th>
                <th className="px-6 py-4">Propriétaire</th>
                <th className="px-6 py-4">Dates</th>
                <th className="px-6 py-4 text-right">Montant</th>
                <th className="px-6 py-4 text-center">Statut</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-500 font-bold">Chargement...</td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-500 font-bold">Aucune réservation</td></tr>
              ) : bookings.map(b => (
                <tr key={b.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-white">{b.house_title}</p>
                    <p className="text-[10px] uppercase font-semibold text-gray-500 mt-1">{b.house_city}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-white">{b.renter_name}</p>
                    <p className="text-xs text-gray-500 mt-1">{b.renter_email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-white">{b.owner_name}</p>
                    <p className="text-xs text-gray-500 mt-1">{b.owner_email}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs font-semibold">
                    {b.start_date}<br /><span className="text-gray-600">→</span> {b.end_date}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-gnYellow">{Number(b.total_price)?.toLocaleString()} GNF</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${STATUS_COLORS[b.status]}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setActionModal({ bookingId: b.id, currentStatus: b.status })}
                      className="text-[10px] text-gnYellow hover:text-black font-black px-3 py-2 border border-gnYellow/20 hover:bg-gnYellow rounded-xl uppercase tracking-widest transition-colors"
                    >
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} total={total} limit={20} onPage={setPage} />

      {actionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl p-8 max-w-sm w-full">
            <h3 className="font-black text-white text-xl mb-2">Modifier le statut</h3>
            <p className="text-gray-400 text-sm mb-6">Statut actuel : <strong className="text-white uppercase tracking-wider text-xs">{actionModal.currentStatus}</strong></p>
            <div className="space-y-3">
              {['pending', 'confirmed', 'rejected', 'cancelled'].filter(s => s !== actionModal.currentStatus).map(s => (
                <button
                  key={s}
                  onClick={() => forceStatus(actionModal.bookingId, s)}
                  className={`w-full text-left px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] ${STATUS_COLORS[s]}`}
                >
                  {s === 'confirmed' ? 'Confirmer' : s === 'rejected' ? 'Refuser' : s === 'cancelled' ? 'Annuler' : 'Remettre en attente'}
                </button>
              ))}
            </div>
            <button onClick={() => setActionModal(null)} className="w-full mt-6 py-4 rounded-2xl border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-colors">Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN ───────────────────────────────────────────────────────────────────────
export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-6 pb-20">
        <ShieldExclamationIcon className="h-24 w-24 text-red-500/50" />
        <h1 className="text-4xl font-black text-white uppercase tracking-widest">Accès refusé</h1>
        <p className="text-gray-400 font-semibold">Cette page est réservée aux administrateurs.</p>
        <Link to="/" className="mt-4 px-8 py-4 bg-gnYellow text-black font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-transform shadow-lg shadow-gnYellow/20">Retour à l'accueil</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10 flex items-center gap-5">
          <div className="p-4 bg-gnYellow/10 border border-gnYellow/20 rounded-2xl">
            <ShieldCheckIcon className="h-10 w-10 text-gnYellow" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Panel Admin</h1>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">Centre de contrôle GuiLocHouse</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-[#111] border border-white/5 p-2 rounded-2xl mb-10 w-full overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gnYellow text-black shadow-lg shadow-gnYellow/20 scale-[1.02]'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {activeTab === 'stats'    && <StatsTab />}
          {activeTab === 'users'    && <UsersTab />}
          {activeTab === 'houses'   && <HousesTab />}
          {activeTab === 'bookings' && <BookingsTab />}
        </div>
      </div>
    </div>
  );
}
