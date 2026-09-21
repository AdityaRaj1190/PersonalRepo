import { useMemo } from 'react';
import { computeVargaReading } from '../lib/astro';

function PlacementList({ title, note, entries, tone, alsoCount = 0 }) {
  return (
    <div className="varga-reading-list">
      <h4 className={`varga-reading-list-title varga-reading-tone-${tone}`}>{title}</h4>
      {entries.length === 0 ? (
        <p className="varga-reading-empty">{note}</p>
      ) : (
        <ul>
          {entries.map((e) => (
            <li key={e.planet}>
              <p className="varga-reading-entry-headline">{e.headline}</p>
              <p className="varga-reading-entry-reasons">
                {e.reasons.map((r, i) => (
                  <span key={r} className={`varga-reading-chip varga-reading-tone-${tone}`}>
                    {i > 0 && ' '}
                    {r}
                  </span>
                ))}
              </p>
              <p className="varga-reading-entry-detail">{e.detail}</p>
            </li>
          ))}
        </ul>
      )}
      {alsoCount > 0 && (
        <p className="varga-reading-empty">
          {alsoCount} further placement{alsoCount > 1 ? 's are' : ' is'} mildly supportive; see the
          table above for the full picture.
        </p>
      )}
    </div>
  );
}

/**
 * Plain-language reading of whichever chart is on screen: which grahas
 * support that chart's own subject (the whole life for D1, wealth for D2,
 * courage and siblings for D3, marriage and dharma for D9, career for
 * D10) and which have to be worked for. Rendered under the planet table,
 * so it deliberately repeats none of the table's columns - it only says
 * what the placements mean.
 */
export default function VargaReading({ chart, varga }) {
  const reading = useMemo(() => computeVargaReading(chart, varga), [chart, varga]);
  // A lord that also appears in a list below would otherwise print the same
  // "Brings ..." sentence twice on one screen, so the pointer card drops it.
  const listed = useMemo(
    () => new Set([...reading.supportive, ...reading.needsEffort].map((e) => e.planet)),
    [reading],
  );

  return (
    <section className="varga-reading">
      <h3>{reading.heading}</h3>
      <p className="varga-reading-summary">{reading.summary}</p>

      <div className="varga-reading-pointers">
        {reading.pointers.map((p) => (
          <div className="varga-reading-pointer" key={p.role}>
            <p className="varga-reading-pointer-role">
              {p.role} &middot; {p.lord}
            </p>
            <p className={`varga-reading-pointer-verdict varga-reading-tone-${p.verdict}`}>{p.verdictLabel}</p>
            <p className="varga-reading-pointer-body">
              Rules {p.roleDetail}, and sits in the {p.houseLabel}.
            </p>
            {!listed.has(p.planet) && <p className="varga-reading-entry-detail">{p.detail}</p>}
          </div>
        ))}
      </div>

      <div className="varga-reading-lists">
        <PlacementList
          title="Strong and supportive"
          note={reading.emptySupportive}
          entries={reading.supportive}
          alsoCount={reading.alsoSupportiveCount}
          tone="favorable"
        />
        <PlacementList
          title="Needs effort"
          note={reading.emptyNeedsEffort}
          entries={reading.needsEffort}
          tone="challenging"
        />
      </div>

      <p className="varga-reading-footnote">{reading.footnote}</p>
    </section>
  );
}
