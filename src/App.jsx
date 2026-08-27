import { useMemo, useState } from 'react';
import BirthChartForm from './components/BirthChartForm';
import BirthSummary from './components/BirthSummary';
import ChartDisplay from './components/ChartDisplay';
import PlanetTable from './components/PlanetTable';
import { computeBirthChart, computeDivisionalChart } from './lib/astro';
import { localToUtc } from './lib/geocode';
import './App.css';

const VARGAS = [
  {
    id: 1,
    label: 'D1 · Rashi',
    description: 'The main birth chart - planet positions and houses exactly as they were at birth.',
  },
  {
    id: 2,
    label: 'D2 · Hora',
    description: 'Wealth and prosperity - splits each sign into two halves ruled by the Sun and Moon.',
  },
  {
    id: 3,
    label: 'D3 · Drekkana',
    description: 'Siblings and courage - splits each sign into three 10-degree segments.',
  },
  {
    id: 9,
    label: 'D9 · Navamsa',
    description: "Marriage and one's inner dharma - splits each sign into nine parts; traditionally read alongside D1 to confirm a planet's true strength.",
  },
];

export default function App() {
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [varga, setVarga] = useState(1);
  const [showD1, setShowD1] = useState(false);

  const displayedChart = useMemo(() => {
    if (!result) return null;
    return varga === 1 ? result.chart : computeDivisionalChart(result.chart, varga);
  }, [result, varga]);

  const chartPanels = useMemo(() => {
    if (!result) return [];
    const vargaLabel = VARGAS.find((v) => v.id === varga).label;
    if (showD1 && varga !== 1) {
      return [
        { chart: result.chart, title: 'D1 · Rashi' },
        { chart: displayedChart, title: vargaLabel },
      ];
    }
    return [{ chart: displayedChart }];
  }, [result, displayedChart, varga, showD1]);

  function handleSubmit({ name, location, local }) {
    setError('');
    setIsSubmitting(true);
    try {
      const { utcDate, timezone, offsetMinutes } = localToUtc(local, location.lat, location.lon);
      const chart = computeBirthChart(utcDate, location.lat, location.lon);
      setResult({ name, location, local, timezone, offsetMinutes, chart });
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

            <BirthSummary
              name={result.name}
              local={result.local}
              location={result.location}
              offsetMinutes={result.offsetMinutes}
              chart={result.chart}
            />

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
            <p className="varga-description">
              {VARGAS.find((v) => v.id === varga).description}
            </p>

            {varga !== 1 && (
              <label className="show-d1-toggle">
                <input
                  type="checkbox"
                  checked={showD1}
                  onChange={(e) => setShowD1(e.target.checked)}
                />
                Show D1 alongside {VARGAS.find((v) => v.id === varga).label}
              </label>
            )}

            <ChartDisplay panels={chartPanels} />
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
