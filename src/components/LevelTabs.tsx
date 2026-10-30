import { levelSteps } from '../model/levels';
import { buildSlots } from '../model/slots';
import type { Grain, Model, Seed } from '../model/types';

export function LevelTabs({
  grain,
  model,
  seed,
  builds,
  requestCount,
  expressionCount,
  chainCount,
  mutationCount,
  onTheFly,
  onGrain,
}: {
  grain: Grain;
  model: Model;
  seed: Seed;
  builds: number;
  requestCount: string;
  expressionCount: string;
  chainCount?: string;
  mutationCount?: string;
  onTheFly: boolean;
  onGrain: (g: Grain) => void;
}) {
  const slots = buildSlots(seed, model.buildV).length;
  const counts: Record<Grain, string> = {
    fmt: requestCount,
    chn: chainCount ?? `${model.buildC.size} / ${model.reachC.size}`,
    var: `${slots} slot${slots === 1 ? '' : 's'}${builds ? ` · ${builds}` : ''}`,
    mut: mutationCount ?? `${model.buildM.size} / ${model.reachM.size}`,
    con: `${model.buildV.size} / ${model.reachV.size}`,
    exp: expressionCount,
  };

  const steps = levelSteps(onTheFly);

  return (
    <div className="tool-tabs" role="tablist" aria-label="Level">
      {steps.map((s) => (
        <button
          key={s.g}
          className="tool"
          data-g={s.g}
          role="tab"
          aria-selected={grain === s.g}
          title={`${s.name} · ${counts[s.g]}`}
          onClick={() => onGrain(s.g)}
        >
          <span className="tool-head">
            {s.lvl ? <span className="tool-lvl">{s.lvl}</span> : null}
            <span className="tool-nm">{s.name}</span>
          </span>
          <span className={`tool-ct${s.lvl ? '' : ' plain'}`}>{counts[s.g]}</span>
        </button>
      ))}
    </div>
  );
}
