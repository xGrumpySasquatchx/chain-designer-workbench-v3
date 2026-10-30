import type { Chain, Format, Vector } from './types';

/** Panel format class. A poor host fit stays selectable; it does not hide the row. */
export type FormatClassId = 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6';
export type UseCaseId = 'U1' | 'U2' | 'U3' | 'U4';
export type HostId = 'mammalian' | 'insect' | 'yeast' | 'ecoli' | 'cellfree' | 'algal';
export type Fit = 'Good' | 'Moderate' | 'Poor';
export type Verdict = 'Pass' | 'Fail' | 'Check' | 'n/a';

export interface FormatClass {
  id: FormatClassId;
  label: string;
}

export interface UseCase {
  id: UseCaseId;
  label: string;
  hostOrder: string;
  decides: string;
}

export interface HostFit {
  id: HostId;
  label: string;
  fit: Fit;
  reason: string;
}

export interface RankedSet {
  rank: number;
  architecture: string;
  vectors: { chainId: string; chainName: string; vectorId: string; marker: string }[];
  markers: Verdict;
  rationale: string;
}

const CLASSES: Record<FormatClassId, string> = {
  F1: 'Effector-competent IgG',
  F2: 'Effector-null or aglycosylated IgG',
  F3: 'Fc-less fragment',
  F4: 'Homodimeric Fc-fusion',
  F5: 'Heterodimeric or asymmetric',
  F6: 'Multi-Fv single chain',
};

const SILENCED = /silenc|lala|l234|l235|p329|n297|aglycos|fala/i;

export const USE_CASES: UseCase[] = [
  {
    id: 'U1',
    label: 'Screen',
    hostOrder: 'Cell-free, then mammalian transient, then E. coli for fragments',
    decides: 'Speed and construct economy beat titer.',
  },
  {
    id: 'U2',
    label: 'Characterize',
    hostOrder: 'Mammalian transient, then insect for Fc-fusions and fragments',
    decides: 'Product quality matters: glycans, aggregation, and correct pairing.',
  },
  {
    id: 'U3',
    label: 'Stable pool',
    hostOrder: 'CHO with GS or DHFR, then HEK pools, then Pichia for fragments',
    decides: 'Fixed ratio, silencing resistance, and distinct markers.',
  },
  {
    id: 'U4',
    label: 'Special',
    hostOrder: 'Cell-free, E. coli, Pichia, or algal',
    decides: 'Choose the host for the constraint. Precedent is thinner here.',
  },
];

const HOSTS: { id: HostId; label: string }[] = [
  { id: 'mammalian', label: 'Mammalian' },
  { id: 'insect', label: 'Insect' },
  { id: 'yeast', label: 'Yeast' },
  { id: 'ecoli', label: 'E. coli' },
  { id: 'cellfree', label: 'Cell-free' },
  { id: 'algal', label: 'Algal' },
];

const FIT: Record<FormatClassId, Record<HostId, { fit: Fit; reason: string }>> = {
  F1: {
    mammalian: { fit: 'Good', reason: 'Reference host. Human-type N297 glycan.' },
    insect: { fit: 'Moderate', reason: 'Paucimannose, no sialylation.' },
    yeast: { fit: 'Moderate', reason: 'Glycoengineered Pichia only.' },
    ecoli: { fit: 'Poor', reason: 'No N-glycan, so the antibody is effector-incompetent.' },
    cellfree: { fit: 'Moderate', reason: 'Microsome lysate, partial glycans.' },
    algal: { fit: 'Poor', reason: 'Algal-type glycans, no precedent.' },
  },
  F2: {
    mammalian: { fit: 'Good', reason: 'Reference titer and quality.' },
    insect: { fit: 'Moderate', reason: 'Fewer IgG precedents.' },
    yeast: { fit: 'Moderate', reason: 'Aglycosyl avoids hypermannose.' },
    ecoli: { fit: 'Moderate', reason: 'Reported at high titer in fermentation.' },
    cellfree: { fit: 'Good', reason: 'E. coli lysate with an oxidizing mix.' },
    algal: { fit: 'Moderate', reason: 'Plastid IgG assembly is reported, at low yield.' },
  },
  F3: {
    mammalian: { fit: 'Good', reason: 'Reliable, at a higher cost.' },
    insect: { fit: 'Good', reason: 'A good host for disulfide-rich fragments.' },
    yeast: { fit: 'Good', reason: 'Cheap and high density.' },
    ecoli: { fit: 'Good', reason: 'Fastest and cheapest.' },
    cellfree: { fit: 'Good', reason: 'Best for panel screening.' },
    algal: { fit: 'Moderate', reason: 'scFv precedent in the plastid.' },
  },
  F4: {
    mammalian: { fit: 'Good', reason: 'One gene, no ratio issue.' },
    insect: { fit: 'Good', reason: 'A classic Fc-fusion host.' },
    yeast: { fit: 'Moderate', reason: 'High-mannose glycans.' },
    ecoli: { fit: 'Poor', reason: 'Hinge and size, low yield.' },
    cellfree: { fit: 'Moderate', reason: 'Needs microsomes or a redox mix.' },
    algal: { fit: 'Poor', reason: 'No precedent.' },
  },
  F5: {
    mammalian: { fit: 'Good', reason: 'Ratio-critical, and well precedented.' },
    insect: { fit: 'Moderate', reason: 'A multi-gene virus fixes the ratio.' },
    yeast: { fit: 'Poor', reason: 'Limited precedent.' },
    ecoli: { fit: 'Moderate', reason: 'Half-molecules plus in vitro assembly.' },
    cellfree: { fit: 'Moderate', reason: 'Ratio is a free variable. Pilot use.' },
    algal: { fit: 'Poor', reason: 'No precedent.' },
  },
  F6: {
    mammalian: { fit: 'Good', reason: 'Watch aggregation.' },
    insect: { fit: 'Moderate', reason: 'Moderate titers.' },
    yeast: { fit: 'Moderate', reason: 'Linker proteolysis risk.' },
    ecoli: { fit: 'Moderate', reason: 'Refolding risk. DVD-Ig poor.' },
    cellfree: { fit: 'Moderate', reason: 'Small formats only.' },
    algal: { fit: 'Poor', reason: 'No precedent.' },
  },
};

/** The chains that actually make one molecule. An alternate light chain is not a second polypeptide. */
export function polypeptides(format: Format, chains: Chain[]): Chain[] {
  const lights = chains.filter((chain) => chain.fam === 'Light');
  if (lights.length <= 1) return chains;
  const lightMentions = format.ratio.match(/LC/gi)?.length ?? 1;
  const oneLight = /common light/i.test(format.name) || lightMentions <= 1;
  if (!oneLight) return chains;
  const kappa = lights.find((chain) => /kappa/i.test(chain.name)) ?? lights[0];
  return [...chains.filter((chain) => chain.fam !== 'Light'), kappa];
}

export function classifyFormat(format: Format, chains: Chain[]): FormatClass {
  if (format.fc === 'No') {
    const multi =
      format.spec !== 'Monospecific' || /tandem|bite|dart|diabody|dvd/i.test(format.name);
    const id: FormatClassId = multi ? 'F6' : 'F3';
    return { id, label: CLASSES[id] };
  }
  if (format.kih === 'Present' || format.spec !== 'Monospecific') {
    return { id: 'F5', label: CLASSES.F5 };
  }
  const igg = chains.some((chain) => chain.fam === 'Heavy') && chains.some((chain) => chain.fam === 'Light');
  if (!igg) return { id: 'F4', label: CLASSES.F4 };
  if (SILENCED.test(`${format.name} ${format.mutset}`)) return { id: 'F2', label: CLASSES.F2 };
  return { id: 'F1', label: CLASSES.F1 };
}

export function hostFit(formatClass: FormatClassId): HostFit[] {
  return HOSTS.map((host) => ({ ...host, ...FIT[formatClass][host.id] }));
}

export function useCaseById(id: UseCaseId): UseCase {
  return USE_CASES.find((useCase) => useCase.id === id) ?? USE_CASES[0];
}

function optionsFor(chain: Chain, vectors: Vector[]): Vector[] {
  const ids = new Set(chain.vectors);
  return vectors
    .filter((vector) => ids.has(vector.id))
    .sort((a, b) => a.rank - b.rank || a.id.localeCompare(b.id));
}

function markerVerdict(chosen: Vector[], useCase: UseCaseId): Verdict {
  if (useCase === 'U1' || useCase === 'U2') return 'n/a';
  if (useCase === 'U4') return 'Check';
  const markers = chosen.map((vector) => vector.sel);
  return new Set(markers).size === markers.length ? 'Pass' : 'Fail';
}

function rationale(markers: Verdict, count: number): string {
  const architecture =
    count === 1
      ? 'One plasmid carries the chain.'
      : `V1: ${count} single-chain plasmids, co-delivered, so the ratio can be titrated.`;
  if (markers === 'n/a') return `${architecture} Selection markers do not decide a transient run.`;
  if (markers === 'Check') return `${architecture} Confirm the marker still fits the special constraint.`;
  if (markers === 'Fail') {
    return `${architecture} H5 fails: plasmids share a selection marker, so a stable pool can keep a cell that took only one of them. A pair with distinct markers passes. This inventory has no GS or DHFR backbone.`;
  }
  return `${architecture} H5 passes: each plasmid carries a different marker, so selection keeps every chain.`;
}

function distinctMarkers(options: Vector[][]): Vector[] | null {
  const chosen: Vector[] = [];
  const used = new Set<string>();
  for (const list of options) {
    const fresh = list.find((vector) => !used.has(vector.sel));
    const pick = fresh ?? list[0];
    if (!pick) return null;
    chosen.push(pick);
    used.add(pick.sel);
  }
  const markers = chosen.map((vector) => vector.sel);
  const sameAsBest = chosen.every((vector, index) => vector.id === options[index]?.[0]?.id);
  if (sameAsBest || new Set(markers).size !== markers.length) return null;
  return chosen;
}

/** Rank the plasmids already on these chains. The scientist picks; the inventory does not invent a backbone. */
export function rankConstructs(
  format: Format,
  chains: Chain[],
  vectors: Vector[],
  useCase: UseCaseId,
): RankedSet[] {
  const used = polypeptides(format, chains);
  const options = used.map((chain) => optionsFor(chain, vectors));
  if (!used.length || options.some((list) => !list.length)) return [];
  const candidates: Vector[][] = [options.map((list) => list[0])];
  const repaired = distinctMarkers(options);
  if (repaired) candidates.push(repaired);
  for (let index = 0; index < options.length && candidates.length < 3; index++) {
    const alternate = options[index]?.[1];
    if (!alternate) continue;
    candidates.push(options.map((list, item) => (item === index ? alternate : list[0])));
  }
  const seen = new Set<string>();
  const unique = candidates.filter((set) => {
    const key = set.map((vector) => vector.id).join('+');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const ranked = unique.map((set) => {
    const markers = markerVerdict(set, useCase);
    return {
      architecture: set.length === 1 ? 'V1 single chain' : `V1 × ${set.length}`,
      vectors: set.map((vector, index) => ({
        chainId: used[index].id,
        chainName: used[index].name,
        vectorId: vector.id,
        marker: vector.sel,
      })),
      markers,
      rationale: rationale(markers, set.length),
      rank: 0,
    };
  });
  if (useCase === 'U3') {
    ranked.sort((a, b) => Number(a.markers === 'Fail') - Number(b.markers === 'Fail'));
  }
  return ranked.map((row, index) => ({ ...row, rank: index + 1 }));
}
