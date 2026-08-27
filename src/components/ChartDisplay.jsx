import { useState } from 'react';
import NorthIndianChart from './NorthIndianChart';
import SouthIndianChart from './SouthIndianChart';

export default function ChartDisplay({ chart }) {
  const [style, setStyle] = useState('south');

  return (
    <div className="chart-display">
      <div className="chart-style-toggle" role="group" aria-label="Chart style">
        <button
          type="button"
          className={style === 'north' ? 'active' : ''}
          onClick={() => setStyle('north')}
        >
          Diamond shaped chart
        </button>
        <button
          type="button"
          className={style === 'south' ? 'active' : ''}
          onClick={() => setStyle('south')}
        >
          Square shaped chart
        </button>
      </div>

      <div className="chart-wrapper">
        {style === 'north' ? <NorthIndianChart chart={chart} /> : <SouthIndianChart chart={chart} />}
      </div>

      <div className="chart-legend">
        <span className="legend-retrograde">(R)</span> Retrograde
        <span className="legend-exalted">↑</span> Exalted
        <span className="legend-debilitated">↓</span> Debilitated
        <span className="legend-combust">⊙</span> Combust
      </div>
    </div>
  );
}
