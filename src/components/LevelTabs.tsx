import { levelSteps } from '../model/levels';
import { buildSlots } from '../model/slots';
import type { Grain, Model, ProteinStep, Seed } from '../model/types';

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

export function ProteinTabs({
  step,
  proteinCount,
  constructCount,
  expressionCount,
  onStep,
}: {
  step: ProteinStep;
  proteinCount: string;
  constructCount: string;
  expressionCount: string;
  onStep: (step: ProteinStep) => void;
}) {
  const steps: { id: ProteinStep; lvl: string; name: string; count: string }[] = [
    { id: 'protein', lvl: '', name: 'Protein', count: proteinCount },
    { id: 'con', lvl: '1', name: 'Construct', count: constructCount },
    { id: 'exp', lvl: '2', name: 'Expression', count: expressionCount },
  ];
  return (
    <div className="tool-tabs" role="tablist" aria-label="Protein level">
      {steps.map((item) => (
        <button
          key={item.id}
          className="tool"
          data-g={item.id === 'protein' ? 'fmt' : item.id}
          role="tab"
          aria-selected={step === item.id}
          title={`${item.name} · ${item.count}`}
          onClick={() => onStep(item.id)}
        >
          <span className="tool-head">
            {item.lvl ? <span className="tool-lvl">{item.lvl}</span> : null}
            <span className="tool-nm">{item.name}</span>
          </span>
          <span className={`tool-ct${item.lvl ? '' : ' plain'}`}>{item.count}</span>
        </button>
      ))}
    </div>
  );
}
