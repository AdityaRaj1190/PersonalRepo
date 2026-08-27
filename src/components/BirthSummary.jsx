import { RASHI_LORDS } from '../lib/astro';

function formatDegreeWords(deg) {
  const d = Math.floor(deg);
  const minutesFloat = (deg - d) * 60;
  const m = Math.floor(minutesFloat);
  const s = Math.round((minutesFloat - m) * 60);
  return `${d} Deg. ${m} Min. ${s} Sec.`;
}

function formatTimeOfBirth(hour, minute) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = ((hour + 11) % 12) + 1;
  return `${String(h12).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00 ${period} Standard Time`;
}

function formatUtcOffset(offsetMinutes) {
  const direction = offsetMinutes >= 0 ? 'East' : 'West';
  const abs = Math.abs(offsetMinutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${direction} of Greenwich`;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDateOfBirth(local) {
  const weekday = WEEKDAYS[new Date(local.year, local.month - 1, local.day).getDay()];
  return `${local.day} ${MONTHS[local.month - 1]}, ${local.year}  ${weekday}`;
}

export default function BirthSummary({ name, local, location, offsetMinutes, chart }) {
  const moon = chart.planets.find((p) => p.planet === 'Moon');
  const placeLabel = location.label.split(',')[0].trim();

  const rows = [
    ['Name', name],
    ['Date of Birth', formatDateOfBirth(local)],
    ['Time of Birth (Hr.Min.Sec)', formatTimeOfBirth(local.hour, local.minute)],
    ['Time Zone (Hrs.Mins)', formatUtcOffset(offsetMinutes)],
    ['Place of Birth', placeLabel],
    ['Ayanamsa', `Lahiri = ${formatDegreeWords(chart.ayanamsa)}`],
    ['Birth Star - Star Pada (Quarter)', `${moon.nakshatra} - ${moon.pada}`],
    ['Birth Rasi - Rasi Lord', `${moon.rashiName} - ${RASHI_LORDS[moon.rashi]}`],
    ['Lagna (Ascendant) - Lagna Lord', `${chart.ascendant.rashiName} - ${RASHI_LORDS[chart.ascendant.rashi]}`],
    ['Thidhi (Lunar Day)', `${chart.tithi.name}, ${chart.tithi.paksha}paksha`],
  ];

  return (
    <div className="birth-summary">
      {rows.map(([label, value]) => (
        <div className="birth-summary-row" key={label}>
          <span className="birth-summary-label">{label}</span>
          <span className="birth-summary-colon">:</span>
          <span className="birth-summary-value">{value}</span>
        </div>
      ))}
    </div>
  );
}
