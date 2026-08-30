import { useState } from 'react';
import LocationAutocomplete from './LocationAutocomplete';
import { deleteSavedProfile, listSavedProfiles, saveProfile } from '../lib/savedProfiles';

const initialState = {
  name: '',
  location: null,
  dob: '',
  tob: '',
};

function formatSavedLabel(p) {
  return `${p.name} · ${p.dob} · ${p.location?.label.split(',')[0].trim() ?? ''}`;
}

export default function BirthChartForm({ onSubmit, isSubmitting }) {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(() => listSavedProfiles());
  const [selectedId, setSelectedId] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Please enter a name.');
    if (!form.location) return setError('Please select a place of birth from the dropdown.');
    if (!form.dob) return setError('Please enter the date of birth.');
    if (!form.tob) return setError('Please enter the time of birth.');

    const [year, month, day] = form.dob.split('-').map(Number);
    const [hour, minute] = form.tob.split(':').map(Number);

    saveProfile({ name: form.name.trim(), location: form.location, dob: form.dob, tob: form.tob });
    setSaved(listSavedProfiles());

    onSubmit({
      name: form.name.trim(),
      location: form.location,
      local: { year, month, day, hour, minute },
    });
  }

  function handleLoad(id) {
    const p = saved.find((s) => s.id === id);
    setSelectedId(id);
    if (!p) return;
    setForm({ name: p.name, location: p.location, dob: p.dob, tob: p.tob });
    setError('');
  }

  function handleDelete() {
    if (!selectedId) return;
    deleteSavedProfile(selectedId);
    setSelectedId('');
    setSaved(listSavedProfiles());
  }

  return (
    <>
      {saved.length > 0 && (
        <div className="saved-profiles">
          <label htmlFor="saved-profiles-select">Saved</label>
          <div className="saved-profiles-row">
            <select
              id="saved-profiles-select"
              value={selectedId}
              onChange={(e) => handleLoad(e.target.value)}
            >
              <option value="" disabled>
                Load a saved profile...
              </option>
              {saved.map((p) => (
                <option key={p.id} value={p.id}>
                  {formatSavedLabel(p)}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="saved-profile-delete"
              disabled={!selectedId}
              aria-label="Delete selected saved profile"
              onClick={handleDelete}
            >
              &times;
            </button>
          </div>
        </div>
      )}

      <form className="birth-chart-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <LocationAutocomplete
          key={form.location ? `${form.location.lat},${form.location.lon}` : 'empty'}
          value={form.location}
          onSelect={(location) => setForm({ ...form, location })}
        />

        <div className="field-row">
          <div className="field">
            <label htmlFor="dob">Date of Birth</label>
            <input
              id="dob"
              type="date"
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="tob">Time of Birth</label>
            <input
              id="tob"
              type="time"
              value={form.tob}
              onChange={(e) => setForm({ ...form, tob: e.target.value })}
            />
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Generating...' : 'Generate Birth Chart'}
        </button>
      </form>
    </>
  );
}
