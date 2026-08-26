import { PLANET_ABBR } from '../lib/chartLayout';

/** Renders a planet's chart abbreviation plus compact dignity glyphs as SVG tspans. */
export default function PlanetGlyphs({ planet }) {
  return (
    <>
      {PLANET_ABBR[planet.planet]}
      {planet.retrograde && <tspan className="glyph-retrograde">(R)</tspan>}
      {planet.exalted && <tspan className="glyph-exalted">↑</tspan>}
      {planet.debilitated && <tspan className="glyph-debilitated">↓</tspan>}
      {planet.combust && <tspan className="glyph-combust">⊙</tspan>}
    </>
  );
}
