import { useState } from 'react';
import NorthIndianChart from './NorthIndianChart';
import SouthIndianChart from './SouthIndianChart';

/**
 * @param {Array<{chart: object, title?: string}>} panels - one or more
 *   charts to render side by side, sharing the same North/South Indian
 *   style toggle (e.g. D1 shown next to the currently selected varga).
 */
export default function ChartDisplay({ panels }) {
  const [style, setStyle] = useState('south');

  return (
    <div className="chart-display">
      <div className="chart-style-toggle" role="group" aria-label="Chart style">
        <button
          type="button"
          className={style === 'north' ? 'active' : ''}
          onClick={() => setStyle('north')}
        >
          North Indian
        </button>
        <button
          type="button"
          className={style === 'south' ? 'active' : ''}
          onClick={() => setStyle('south')}
        >
          South Indian
        </button>
      </div>

      <div className="chart-panels">
        {panels.map(({ chart, title }, i) => (
          <div className="chart-panel" key={title ?? i}>
            {title && <p className="chart-panel-title">{title}</p>}
            <div className="chart-wrapper">
              {style === 'north' ? <NorthIndianChart chart={chart} /> : <SouthIndianChart chart={chart} />}
            </div>
          </div>
        ))}
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
