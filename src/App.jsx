import { useMemo, useState } from 'react';
import BirthChartForm from './components/BirthChartForm';
import ChartDisplay from './components/ChartDisplay';
import PlanetTable from './components/PlanetTable';
import { computeBirthChart, computeDivisionalChart } from './lib/astro';
import { localToUtc } from './lib/geocode';
import './App.css';

const VARGAS = [
  { id: 1, label: 'D1 · Rashi' },
  { id: 2, label: 'D2 · Hora' },
  { id: 3, label: 'D3 · Drekkana' },
  { id: 9, label: 'D9 · Navamsa' },
];

export default function App() {
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [varga, setVarga] = useState(1);

  const displayedChart = useMemo(() => {
    if (!result) return null;
    return varga === 1 ? result.chart : computeDivisionalChart(result.chart, varga);
  }, [result, varga]);

  function handleSubmit({ name, location, local }) {
    setError('');
    setIsSubmitting(true);
    try {
      const { utcDate, timezone } = localToUtc(local, location.lat, location.lon);
      const chart = computeBirthChart(utcDate, location.lat, location.lon);
      setResult({ name, location, timezone, chart });
      setVarga(1);
    } catch (err) {
      setError(err.message || 'Something went wrong while generating the chart.');
      setResult(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Birth Chart Generator</h1>
        <p>Generate a sidereal (Vedic) Kundli with Lahiri ayanamsa from name, place, date and time of birth.</p>
      </header>

      <main className="app-main">
        <section className="form-section">
          <BirthChartForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          {error && <p className="form-error">{error}</p>}
        </section>

        {result && (
          <section className="result-section">
            <h2>{result.name}'s Birth Chart</h2>
            <p className="result-meta">
              {result.location.label} &middot; timezone {result.timezone}
            </p>

            <div className="varga-toggle" role="group" aria-label="Divisional chart">
              {VARGAS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className={varga === v.id ? 'active' : ''}
                  onClick={() => setVarga(v.id)}
                >
                  {v.label}
                </button>
              ))}
            </div>

            <ChartDisplay chart={displayedChart} />
            <PlanetTable chart={displayedChart} />
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Planetary positions computed with the astronomy-engine library and an approximate Lahiri
          ayanamsa; intended for informational and educational use.
        </p>
      </footer>
    </div>
  );
}
