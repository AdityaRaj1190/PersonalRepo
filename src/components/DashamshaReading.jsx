import { useMemo } from 'react';
import { computeDashamshaReading } from '../lib/astro';

function PlacementList({ title, note, entries, tone, alsoCount = 0 }) {
  return (
    <div className="dashamsha-list">
      <h4 className={`dashamsha-list-title dashamsha-tone-${tone}`}>{title}</h4>
      {entries.length === 0 ? (
        <p className="dashamsha-empty">{note}</p>
      ) : (
        <ul>
          {entries.map((e) => (
            <li key={e.planet}>
              <p className="dashamsha-entry-headline">{e.headline}</p>
              <p className="dashamsha-entry-reasons">
                {e.reasons.map((r, i) => (
                  <span key={r} className={`dashamsha-chip dashamsha-tone-${tone}`}>
                    {i > 0 && ' '}
                    {r}
                  </span>
                ))}
              </p>
              <p className="dashamsha-entry-detail">{e.detail}</p>
            </li>
          ))}
        </ul>
      )}
      {alsoCount > 0 && (
        <p className="dashamsha-empty">
          {alsoCount} further placement{alsoCount > 1 ? 's are' : ' is'} mildly supportive; see the
          table above for the full picture.
        </p>
      )}
    </div>
  );
}

/**
 * Plain-language reading of a D10 chart: which grahas support the career
 * and which have to be worked for. Rendered under the D10 planet table,
 * so it deliberately repeats none of the table's columns - it only says
 * what the placements mean.
 */
export default function DashamshaReading({ chart }) {
  const reading = useMemo(() => computeDashamshaReading(chart), [chart]);
  // A lord that also appears in a list below would otherwise print the same
  // "Brings ..." sentence twice on one screen, so the pointer card drops it.
  const listed = useMemo(
    () => new Set([...reading.supportive, ...reading.needsEffort].map((e) => e.planet)),
    [reading],
  );

  return (
    <section className="dashamsha-reading">
      <h3>What supports your career</h3>
      <p className="dashamsha-summary">{reading.summary}</p>

      <div className="dashamsha-pointers">
        {reading.pointers.map((p) => (
          <div className="dashamsha-pointer" key={p.role}>
            <p className="dashamsha-pointer-role">
              {p.role} &middot; {p.lord}
            </p>
            <p className={`dashamsha-pointer-verdict dashamsha-tone-${p.verdict}`}>{p.verdictLabel}</p>
            <p className="dashamsha-pointer-body">
              Rules {p.roleDetail}, and sits in the {p.houseLabel}.
            </p>
            {!listed.has(p.planet) && <p className="dashamsha-entry-detail">{p.detail}</p>}
          </div>
        ))}
      </div>

      <div className="dashamsha-lists">
        <PlacementList
          title="Strong and supportive"
          note="Nothing in this D10 is strongly placed; progress comes from effort rather than an inbuilt advantage."
          entries={reading.supportive}
          alsoCount={reading.alsoSupportiveCount}
          tone="favorable"
        />
        <PlacementList
          title="Needs effort"
          note="Nothing in this D10 is badly placed, so no part of the career is working against you."
          entries={reading.needsEffort}
          tone="challenging"
        />
      </div>

      <p className="dashamsha-footnote">
        Read alongside the D1 chart; the D10 shows how a career unfolds, not whether it happens.
      </p>
    </section>
  );
}
