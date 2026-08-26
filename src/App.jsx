import { useState } from 'react';
import BirthChartForm from './components/BirthChartForm';
import ChartDisplay from './components/ChartDisplay';
import PlanetTable from './components/PlanetTable';
import { computeBirthChart } from './lib/astro';
import { localToUtc } from './lib/geocode';
import './App.css';

export default function App() {
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit({ name, location, local }) {
    setError('');
    setIsSubmitting(true);
    try {
      const { utcDate, timezone } = localToUtc(local, location.lat, location.lon);
      const chart = computeBirthChart(utcDate, location.lat, location.lon);
      setResult({ name, location, timezone, chart });
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
        <h1>Hindu Birth Chart Generator</h1>
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
            <ChartDisplay chart={result.chart} />
            <PlanetTable chart={result.chart} />
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
