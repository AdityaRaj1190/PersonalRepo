const STORAGE_KEY = 'birthChartProfiles';

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(profiles) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) - saving is best-effort.
  }
}

export function listSavedProfiles() {
  return readAll().sort((a, b) => b.savedAt - a.savedAt);
}

/** Save (or update, matching on name+dob+tob+location) a profile from submitted form fields. */
export function saveProfile({ name, location, dob, tob }) {
  const profiles = readAll();
  const key = (p) => `${p.name}|${p.dob}|${p.tob}|${p.location?.lat}|${p.location?.lon}`;
  const entry = { id: crypto.randomUUID(), name, location, dob, tob, savedAt: Date.now() };
  const filtered = profiles.filter((p) => key(p) !== key(entry));
  writeAll([entry, ...filtered]);
}

export function deleteSavedProfile(id) {
  writeAll(readAll().filter((p) => p.id !== id));
}

export function formatSavedProfileLabel(p) {
  return `${p.name} · ${p.dob} ${p.tob} · ${p.location?.label.split(',')[0].trim() ?? ''}`;
}
