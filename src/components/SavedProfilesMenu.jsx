import { useEffect, useRef, useState } from 'react';
import { formatSavedProfileLabel } from '../lib/savedProfiles';

/**
 * A custom dropdown (not a native <select>) so each saved profile can carry
 * its own inline delete button - a native <select><option> can't contain a
 * second interactive element, which is what made deleting an entry
 * previously require selecting it (loading it into the form) first.
 */
export default function SavedProfilesMenu({ saved, onLoad, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
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

  // Falls back to the placeholder on its own once the selected profile is
  // deleted, since it's just looked up from the current `saved` list rather
  // than tracked as its own copy.
  const selectedProfile = saved.find((p) => p.id === selectedId);

  function handlePick(profile) {
    setSelectedId(profile.id);
    setIsOpen(false);
    onLoad(profile);
  }

  function handleDelete(event, id) {
    event.stopPropagation();
    onDelete(id);
  }

  if (saved.length === 0) return null;

  return (
    <div className="saved-profiles" ref={containerRef}>
      <label htmlFor="saved-profiles-trigger">Saved</label>
      <button
        id="saved-profiles-trigger"
        type="button"
        className="saved-profiles-trigger"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
      >
        <span>{selectedProfile ? formatSavedProfileLabel(selectedProfile) : 'Load a saved profile...'}</span>
        <span className="saved-profiles-caret">{isOpen ? '▾' : '▸'}</span>
      </button>

      {isOpen && (
        <ul className="saved-profiles-dropdown">
          {saved.map((p) => (
            <li key={p.id}>
              <button type="button" className="saved-profile-load" onClick={() => handlePick(p)}>
                {formatSavedProfileLabel(p)}
              </button>
              <button
                type="button"
                className="saved-profile-delete"
                aria-label={`Delete ${p.name}`}
                onClick={(e) => handleDelete(e, p.id)}
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
