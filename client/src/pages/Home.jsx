import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, HomeModernIcon, ShieldCheckIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';

const GUINEA_CITIES = [
  'Conakry', 'Kindia', 'Labé', 'Kankan', 'Nzérékoré', 'Mamou', 'Boké',
  'Guéckédou', 'Macenta', 'Kissidougou', 'Dalaba', 'Siguiri', 'Faranah',
  'Télimélé', 'Pita', 'Forécariah', 'Coyah', 'Fria', 'Dubréka', 'Kérouané',
];

const TYPES = [
  { value: 'apartment', label: 'Appartement' },
  { value: 'house', label: 'Maison' },
  { value: 'villa', label: 'Villa' },
  { value: 'studio', label: 'Studio' },
  { value: 'room', label: 'Chambre' },
];

function CityInput({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const filtered = value.trim()
    ? GUINEA_CITIES.filter(c => c.toLowerCase().startsWith(value.toLowerCase()))
    : GUINEA_CITIES;

  const handleBlur = () => setTimeout(() => setOpen(false), 150);

  return (
    <div className="relative flex-1" ref={ref}>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        placeholder="Toutes les villes"
        autoComplete="off"
        className="w-full input-field bg-white/5 rounded-xl"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-y-auto max-h-[200px] shadow-xl">
          {filtered.map(c => (
            <li
              key={c}
              onMouseDown={() => { onChange(c); setOpen(false); }}
              className="px-4 py-2.5 text-sm text-gray-300 hover:bg-gnYellow/10 hover:text-gnYellow cursor-pointer transition-colors"
            >
              {c}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TypeSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = TYPES.find(t => t.value === value);

  return (
    <div className="relative flex-1" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full input-field bg-white/5 rounded-xl text-left flex items-center justify-between"
      >
        <span className={value ? 'text-white' : 'text-gray-500'}>
          {selected ? selected.label : 'Tout type'}
        </span>
        <svg className="h-4 w-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-xl">
          <li
            onMouseDown={() => { onChange(''); setOpen(false); }}
            className="px-4 py-2.5 text-sm text-gray-400 hover:bg-gnYellow/10 hover:text-gnYellow cursor-pointer transition-colors"
          >
            Tout type
          </li>
          {TYPES.map(t => (
            <li
              key={t.value}
              onMouseDown={() => { onChange(t.value); setOpen(false); }}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${value === t.value ? 'text-gnYellow bg-gnYellow/10' : 'text-gray-300 hover:bg-gnYellow/10 hover:text-gnYellow'}`}
            >
              {t.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [type, setType] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (type) params.set('type', type);
    navigate(`/houses?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-luxuryBlack">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(252,209,22,0.06)_0%,_transparent_60%)]" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="section-label-tag mx-auto w-fit mb-6">Location immobilière en Guinée</div>
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none mb-6">
            Trouvez votre<br />
            <span className="text-gnYellow">maison idéale</span>
          </h1>
          <div className="triline justify-center">
            <span className="t-red" />
            <span className="t-yellow" />
            <span className="t-green" />
          </div>
          <p className="text-gray-400 text-lg mb-12 max-w-xl mx-auto">
            Louez des maisons, appartements et villas entre particuliers partout en Guinée.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="bg-[#111] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto shadow-2xl">
            <CityInput value={city} onChange={setCity} />
            <TypeSelect value={type} onChange={setType} />
            <button type="submit" className="btn-primary gap-2 whitespace-nowrap">
              <MagnifyingGlassIcon className="h-4 w-4" />
              Rechercher
            </button>
          </form>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: HomeModernIcon, title: 'Large choix', desc: 'Maisons, villas, appartements et studios dans toutes les villes de Guinée.' },
              { icon: ShieldCheckIcon, title: 'Sécurisé', desc: 'Profils vérifiés, paiement sécurisé et assistance disponible.' },
              { icon: CurrencyDollarIcon, title: 'Meilleur prix', desc: 'Location directe entre particuliers, sans intermédiaire, au meilleur prix en GNF.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-[#111] border border-white/5 rounded-2xl p-8 hover:border-gnYellow/20 transition-colors">
                <div className="p-3 bg-gnYellow/10 rounded-xl w-fit mb-5">
                  <Icon className="h-6 w-6 text-gnYellow" />
                </div>
                <h3 className="text-white font-black text-lg uppercase tracking-wide mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center bg-[#111] border border-gnYellow/20 rounded-3xl p-12">
          <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-4">Vous avez un bien à louer ?</h2>
          <p className="text-gray-400 mb-8">Publiez votre annonce gratuitement et trouvez des locataires rapidement.</p>
          <button onClick={() => navigate('/post-house')} className="btn-primary text-base px-10 py-4">
            Publier une annonce
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="flex gap-1">
            <span className="w-1.5 h-4 rounded-sm bg-gnRed" />
            <span className="w-1.5 h-4 rounded-sm bg-gnYellow" />
            <span className="w-1.5 h-4 rounded-sm bg-gnGreen" />
          </div>
          <span className="font-black text-white text-sm">GuiLoc<span className="text-gnYellow">House</span></span>
        </div>
        <p className="text-gray-600 text-xs">© {new Date().getFullYear()} GuiLocHouse — Location immobilière en Guinée</p>
      </footer>
    </div>
  );
}
