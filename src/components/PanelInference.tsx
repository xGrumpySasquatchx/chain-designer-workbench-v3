import { useState } from 'react';
import {
  USE_CASES,
  classifyFormat,
  hostFit,
  polypeptides,
  rankConstructs,
  findUseCase,
  type UseCaseId,
} from '../model/inference';
import type { Chain, Format, Vector } from '../model/types';

export function PanelInference({
  format,
  chains,
  vectors,
  moleculeCount,
}: {
  format: Format;
  chains: Chain[];
  vectors: Vector[];
  moleculeCount: number;
}) {
  const [useCase, setUseCase] = useState<UseCaseId | null>(null);
  const mine = chains.filter((chain) => format.chains.includes(chain.id));
  const chainsInMolecule = polypeptides(format, mine);
  const formatClass = classifyFormat(format, mine);
  const hosts = hostFit(formatClass.id);
  const ranked = useCase ? rankConstructs(format, mine, vectors, useCase) : [];
  const chosen = useCase ? findUseCase(useCase) : null;
  const instances = moleculeCount * chainsInMolecule.length;

  return (
    <section className="infer" aria-label="Panel inference">
      <h3>Panel inference</h3>
      <p className="sm">
        The registered panel fixes what must be built. Choose a use case and the rules rank the plasmids already in inventory.
      </p>
      <dl className="infer-dl">
        <div>
          <dt>Format</dt>
          <dd>
            {formatClass.id} {formatClass.label}
          </dd>
        </div>
        <div>
          <dt>Chains</dt>
          <dd>
            {chainsInMolecule.length} polypeptide{chainsInMolecule.length === 1 ? '' : 's'} per molecule
            {moleculeCount > 1
              ? `. This panel's ${moleculeCount} molecules are ${instances} chain instances, each well with its own Fv`
              : ''}
            . {chainsInMolecule.map((chain) => chain.name).join('; ')}.
          </dd>
        </div>
        <div>
          <dt>Stoichiometry</dt>
          <dd>{format.ratio || 'Not set'}</dd>
        </div>
      </dl>
      <div className="infer-uses" role="group" aria-label="Use case">
        {USE_CASES.map((item) => (
          <button
            key={item.id}
            type="button"
            className="btn sm"
            aria-pressed={useCase === item.id}
            onClick={() => setUseCase(item.id)}
          >
            {item.id} {item.label}
          </button>
        ))}
      </div>
      {chosen ? (
        <>
          <p className="sm">
            {chosen.hostOrder}. {chosen.decides}
          </p>
          <ul className="infer-hosts">
            {hosts.map((host) => (
              <li key={host.id} className={`fit fit-${host.fit.toLowerCase()}`}>
                <span className="fit-name">{host.label}</span>
                <span className="fit-word">{host.fit}</span>
                <span className="sm">{host.reason}</span>
              </li>
            ))}
          </ul>
          {ranked.length ? (
            <table className="infer-rank">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Vector set</th>
                  <th>H5 markers</th>
                  <th>Rationale</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((row) => (
                  <tr key={row.rank}>
                    <td>Rank {row.rank}</td>
                    <td>
                      <span className="mono">{row.architecture}</span>
                      {row.vectors.map((vector) => (
                        <span key={vector.vectorId} className="infer-vec">
                          {vector.chainName}: {vector.vectorId} ({vector.marker})
                        </span>
                      ))}
                    </td>
                    <td className={`verdict verdict-${row.markers === 'n/a' ? 'na' : row.markers.toLowerCase()}`}>
                      {row.markers}
                    </td>
                    <td>{row.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="sm">No plasmid in inventory covers every chain of this format.</p>
          )}
        </>
      ) : null}
    </section>
  );
}
