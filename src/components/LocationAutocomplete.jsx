import { useEffect, useRef, useState } from 'react';
import { searchLocations } from '../lib/geocode';

const DEBOUNCE_MS = 400;

export default function LocationAutocomplete({ value, onSelect }) {
  const [query, setQuery] = useState(value?.label ?? '');
  const [options, setOptions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleChange(e) {
    const next = e.target.value;
    setQuery(next);
    setIsOpen(true);
    onSelect(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (next.trim().length < 2) {
      setOptions([]);
      setStatus('idle');
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus('loading');
      try {
        const results = await searchLocations(next, controller.signal);
        setOptions(results);
        setStatus('idle');
      } catch (err) {
        if (err.name !== 'AbortError') {
          setStatus('error');
          setOptions([]);
        }
      }
    }, DEBOUNCE_MS);
  }

  function handlePick(option) {
    setQuery(option.label);
    setIsOpen(false);
    setOptions([]);
    onSelect(option);
  }

  return (
    <div className="field location-autocomplete" ref={containerRef}>
      <label htmlFor="location">Place of Birth</label>
      <input
        id="location"
        type="text"
        autoComplete="off"
        placeholder="Start typing a city..."
        value={query}
        onChange={handleChange}
        onFocus={() => options.length > 0 && setIsOpen(true)}
      />
      {isOpen && (status === 'loading' || options.length > 0 || status === 'error') && (
        <ul className="location-dropdown">
          {status === 'loading' && <li className="location-status">Searching...</li>}
          {status === 'error' && <li className="location-status">Couldn't search locations. Try again.</li>}
          {options.map((option) => (
            <li key={`${option.lat},${option.lon}`}>
              <button type="button" onClick={() => handlePick(option)}>
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="field-hint">Location search by OpenStreetMap Nominatim</p>
    </div>
  );
}
