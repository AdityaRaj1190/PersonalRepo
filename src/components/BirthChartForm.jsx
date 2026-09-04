import { useState } from 'react';
import LocationAutocomplete from './LocationAutocomplete';
import SavedProfilesMenu from './SavedProfilesMenu';
import { deleteSavedProfile, listSavedProfiles, saveProfile } from '../lib/savedProfiles';

const initialState = {
  name: '',
  location: null,
  dob: '',
  tob: '',
};

export default function BirthChartForm({ onSubmit, isSubmitting }) {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(() => listSavedProfiles());

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

  function handleLoad(profile) {
    setForm({ name: profile.name, location: profile.location, dob: profile.dob, tob: profile.tob });
    setError('');
  }

  function handleDelete(id) {
    deleteSavedProfile(id);
    setSaved(listSavedProfiles());
  }

  return (
    <>
      <SavedProfilesMenu saved={saved} onLoad={handleLoad} onDelete={handleDelete} />

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
