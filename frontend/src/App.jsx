import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function App() {
  const [brands, setBrands] = useState([]);
  const [textarea, setTextarea] = useState('');
  const [traffic, setTraffic] = useState([]);
  const [ads, setAds] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(`${API}/brands`).then(r => r.json()).then(setBrands);
    fetch(`${API}/traffic/latest`).then(r => r.json()).then(setTraffic);
  }, []);

  const submit = async () => {
    await fetch(`${API}/brands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines: textarea })
    });
    setTextarea('');
    const b = await fetch(`${API}/brands`).then(r => r.json());
    setBrands(b);
  };

  const loadAds = async (brand) => {
    setSelected(brand);
    const a = await fetch(`${API}/ads/${brand.id}`).then(r => r.json());
    setAds(a);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">BrainTracker</h1>

      <section>
        <h2 className="font-semibold mb-2">Importer des marques</h2>
        <textarea value={textarea} onChange={e => setTextarea(e.target.value)} className="border w-full p-2" rows="4" placeholder="Nom,URL\n..." />
        <button onClick={submit} className="mt-2 px-4 py-1 bg-blue-500 text-white rounded">Envoyer</button>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Marques</h2>
        <ul className="space-y-1">
          {brands.map(b => (
            <li key={b.id}>
              <button className="text-blue-600" onClick={() => loadAds(b)}>{b.name}</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Trafic récent</h2>
        <ul className="space-y-1">
          {traffic.map(t => (
            <li key={t.id}>{t.source} - {t.country || 'Global'} : {t.visits}</li>
          ))}
        </ul>
      </section>

      {selected && (
        <section>
          <h2 className="font-semibold mb-2">Ads pour {selected.name}</h2>
          <ul className="space-y-2">
            {ads.map(a => (
              <li key={a.id} className="border p-2">
                <a href={a.media_url} target="_blank" rel="noopener noreferrer">{a.media_type === 'image' ? 'Image' : 'Vidéo'}</a>
                <div>{a.first_seen} → {a.last_seen}</div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
