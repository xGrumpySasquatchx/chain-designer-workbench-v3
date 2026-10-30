import type { ProductKind } from '../model/types';

export function KindSwitch({ kind, onChange }: { kind: ProductKind; onChange: (kind: ProductKind) => void }) {
  return (
    <div className="kind-switch" role="group" aria-label="What to design">
      <button type="button" aria-pressed={kind === 'antibody'} onClick={() => onChange('antibody')}>
        Antibody
      </button>
      <button type="button" aria-pressed={kind === 'protein'} onClick={() => onChange('protein')}>
        Protein
      </button>
    </div>
  );
}

/** Receptors, scaffolds, and antigens. The antibody path is the one specified first. */
export function ProteinBench() {
  return (
    <main className="panel list protein-bench">
      <div className="panel-h">
        <h2>Protein</h2>
      </div>
      <div className="req-empty">
        <p>Receptors, scaffolds, and antigens used in assays. Cloning through expression for a non-antibody protein starts here.</p>
        <p className="sm">
          The antibody path covers antibodies, multispecifics, and ADCs. A registered panel there fixes the chains, and the use case
          ranks the plasmids.
        </p>
      </div>
    </main>
  );
}
