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
