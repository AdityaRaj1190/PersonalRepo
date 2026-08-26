import { useState } from 'react';
import NorthIndianChart from './NorthIndianChart';
import SouthIndianChart from './SouthIndianChart';

export default function ChartDisplay({ chart }) {
  const [style, setStyle] = useState('north');

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

      <div className="chart-wrapper">
        {style === 'north' ? <NorthIndianChart chart={chart} /> : <SouthIndianChart chart={chart} />}
      </div>
    </div>
  );
}
