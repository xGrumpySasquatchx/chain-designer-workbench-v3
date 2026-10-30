import type { ConstructScheme } from '../model/inference';

export function ConstructCount({
  schemes,
  selected,
  chainNames,
  onSelect,
}: {
  schemes: ConstructScheme[];
  selected: number;
  chainNames: string[];
  onSelect: (count: number) => void;
}) {
  const scheme = schemes.find((item) => item.count === selected) ?? schemes[schemes.length - 1];
  if (!scheme) return null;
  const groups: string[][] = [];
  if (chainNames.length === scheme.count * scheme.perPlasmid) {
    for (let index = 0; index < chainNames.length; index += scheme.perPlasmid) {
      groups.push(chainNames.slice(index, index + scheme.perPlasmid));
    }
  }

  return (
    <section className="ratio-plan" aria-label="How many constructs">
      <h3>Express with</h3>
      <p className="sm">
        Each well's molecule fixes the chains. Choose how many constructs express that molecule.
      </p>
      <div className="construct-count" role="group" aria-label="Construct count">
        {schemes.map((item) => (
          <button
            key={item.count}
            type="button"
            className="btn sm"
            aria-pressed={item.count === scheme.count}
            onClick={() => onSelect(item.count)}
          >
            <span className="count-n">
              {item.count} construct{item.count === 1 ? '' : 's'}
            </span>
            <span className="sm">{item.label}</span>
          </button>
        ))}
      </div>
      <p className="sm">{scheme.note}</p>
      {scheme.perPlasmid === 1 && groups.length > 1 ? (
        <ul className="construct-split">
          {groups.map((names, index) => (
            <li key={names.join('|')}>
              <span className="mono">Construct {index + 1}</span>
              <span>{names.join(' · ')}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
