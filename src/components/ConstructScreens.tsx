import { useState } from 'react';
import { SrcFolder } from './FacetRail';
import { CONSTRUCT_SCREENS, SCREEN_GROUPS, type ScreenGroup } from '../model/screens';

export function ConstructScreens({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (id: string, on: boolean) => void;
}) {
  const [open, setOpen] = useState<Set<ScreenGroup>>(() => new Set());
  const picked = new Set(selected);
  const toggleOpen = (id: ScreenGroup) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="screen-block" aria-label="Screening and selection">
      <p className="sm screen-lead">
        Selection kills or blocks cells that missed the construct. Color and fluorescence let every colony grow and
        give a visual readout. A typical biologics stack is an antibiotic on the plate, blue/white or a chromoprotein,
        colony PCR plus sequencing, then a GFP folding reporter.
      </p>
      {SCREEN_GROUPS.map((group) => {
        const options = CONSTRUCT_SCREENS.filter((option) => option.group === group.id);
        const chosen = options.filter((option) => picked.has(option.id)).length;
        const markers = options.filter((option) => option.selects);
        const checks = options.filter((option) => !option.selects);
        return (
          <SrcFolder
            key={group.id}
            name={group.label}
            count={chosen ? `${chosen} of ${options.length}` : `(${options.length})`}
            open={open.has(group.id)}
            onToggle={() => toggleOpen(group.id)}
          >
            <p className="sm screen-lead">{group.lead}</p>
            {group.id === 'dna' ? <p className="screen-sub">Genetic selectable markers</p> : null}
            {(group.id === 'dna' ? markers : options).map((option) => (
              <ScreenChoice key={option.id} option={option} on={picked.has(option.id)} onToggle={onToggle} />
            ))}
            {group.id === 'dna' ? (
              <>
                <p className="screen-sub">Verification at the DNA level</p>
                {checks.map((option) => (
                  <ScreenChoice key={option.id} option={option} on={picked.has(option.id)} onToggle={onToggle} />
                ))}
              </>
            ) : null}
          </SrcFolder>
        );
      })}
    </div>
  );
}

function ScreenChoice({
  option,
  on,
  onToggle,
}: {
  option: { id: string; name: string; note: string };
  on: boolean;
  onToggle: (id: string, on: boolean) => void;
}) {
  return (
    <label className="opt src-doc" title={option.note}>
      <input type="checkbox" checked={on} onChange={(event) => onToggle(option.id, event.target.checked)} />
      <span>
        <span className="nm">{option.name}</span>
        <span className="sm">{option.note}</span>
      </span>
    </label>
  );
}
