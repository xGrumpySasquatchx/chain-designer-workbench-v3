import { chainVariesPerWell, constructsProduced, type ConstructScheme } from '../model/inference';
import type { Chain } from '../model/types';

export function ConstructCount({
  schemes,
  selected,
  chains,
  moleculeCount,
  onSelect,
}: {
  schemes: ConstructScheme[];
  selected: number;
  chains: Chain[];
  moleculeCount: number;
  onSelect: (count: number) => void;
}) {
  const scheme = schemes.find((item) => item.count === selected) ?? schemes[schemes.length - 1];
  if (!scheme) return null;
  const wells = Math.max(moleculeCount, 1);
  const produced = constructsProduced(chains, scheme, wells);
  const shared = chains.some((chain) => !chainVariesPerWell(chain));
  const groups: string[][] = [];
  if (chains.length === scheme.count * scheme.perPlasmid) {
    for (let index = 0; index < chains.length; index += scheme.perPlasmid) {
      groups.push(chains.slice(index, index + scheme.perPlasmid).map((chain) => chain.name));
    }
  }

  return (
    <section className="ratio-plan" aria-label="How many constructs">
      <h3>Express with</h3>
      <p className="sm">
        {wells > 1
          ? `Each well is its own molecule. The same format still carries a different Fv, so ${scheme.label} produces ${produced} constructs across this panel's ${wells} wells.`
          : 'Each well is its own molecule. The same format still carries a different Fv, so the scheme sets how many constructs that well needs.'}
      </p>
      <div className="construct-count" role="group" aria-label="Construct count">
        {schemes.map((item) => {
          const yieldCount = constructsProduced(chains, item, wells);
          return (
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
              {wells > 1 ? <span className="sm">{yieldCount} in this panel</span> : null}
            </button>
          );
        })}
      </div>
      <p className="sm">{scheme.note}</p>
      {shared ? (
        <p className="sm">
          A fixed chain is built once for the panel. Each well-specific Fv is built again for every well.
        </p>
      ) : null}
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
