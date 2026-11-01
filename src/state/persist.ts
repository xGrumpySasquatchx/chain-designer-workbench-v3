import { EMPTY_EXPRESSION } from '../model/expression';
import { emptySel } from '../model/selection';
import type {
  CodonMethod,
  ExpressionMode,
  ExpressionPlan,
  ExpressionRegistration,
  Grain,
  HostId,
  LumaMolecule,
  LumaPanel,
  ProteinAnnotation,
  ProteinDraft,
  ProteinFamily,
  ProteinFeature,
  ProteinRole,
  ProteinScheme,
  ProteinSequenceRecord,
  ProteinUse,
  RequestDoc,
  State,
  TargetClass,
} from '../model/types';

const TARGETS: TargetClass[] = ['secreted', 'intracellular', 'membrane'];
const HOST_IDS: HostId[] = ['ecoli', 'yeast', 'insect', 'mammalian', 'cellfree'];
const CODONS: CodonMethod[] = ['adapt', 'harmonize', 'rare', 'keep'];
const MODES: ExpressionMode[] = ['transient', 'stable'];
const PROTEIN_FAMILIES: ProteinFamily[] = ['receptor', 'human', 'nonhuman', 'engineered'];
const PROTEIN_USES: ProteinUse[] = ['delivery', 'antagonism'];
const PROTEIN_ROLES: ProteinRole[] = ['stoichiometry', 'scaffold', 'antigen'];
const PROTEIN_SCHEMES: ProteinScheme[] = ['together', 'separate'];

const KEY = 'protein-chain-workbench-v3';

export function defaultState(): State {
  return {
    kind: 'antibody',
    sel: emptySel(),
    variants: '',
    library: '',
    assign: {},
    presets: [],
    grain: 'fmt',
    hideOut: false,
    panels: [],
    activePanelId: null,
    activeRequestId: null,
    requests: [],
    userPanels: [],
    userMolecules: [],
    expression: EMPTY_EXPRESSION,
    expressionRegistrations: [],
    chainRatios: {},
    constructGroups: {},
    constructCount: null,
    sequencePicks: {},
    proteinDrafts: [],
    activeProteinId: null,
    proteinExpression: EMPTY_EXPRESSION,
    proteinScheme: 'together',
  };
}

export function loadState(): State {
  const base = defaultState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const r = JSON.parse(raw) as Partial<State>;
    if (r.kind === 'protein') base.kind = 'protein';
    if (r.sel && typeof r.sel === 'object') {
      base.sel = {
        fmt: { ...emptySel().fmt, ...r.sel.fmt },
        chn: { ...emptySel().chn, ...r.sel.chn },
        con: { ...emptySel().con, ...r.sel.con },
        mut: { ...emptySel().mut, ...r.sel.mut },
      };
    }
    if (
      r.grain === 'fmt' ||
      r.grain === 'chn' ||
      r.grain === 'var' ||
      r.grain === 'mut' ||
      r.grain === 'con' ||
      r.grain === 'exp'
    ) {
      base.grain = r.grain as Grain;
    }
    if (typeof r.variants === 'string') base.variants = r.variants;
    if (typeof r.library === 'string') base.library = r.library;
    if (Array.isArray(r.presets)) base.presets = r.presets;
    if (typeof r.hideOut === 'boolean') base.hideOut = r.hideOut;
    if (r.assign && typeof r.assign === 'object') base.assign = r.assign;
    if (Array.isArray(r.panels)) base.panels = r.panels.filter((id) => typeof id === 'string');
    if (typeof r.activePanelId === 'string') base.activePanelId = r.activePanelId;
    if (typeof r.activeRequestId === 'string') base.activeRequestId = r.activeRequestId;
    if (Array.isArray(r.requests)) base.requests = r.requests.filter(isRequest);
    if (Array.isArray(r.userPanels)) base.userPanels = r.userPanels.filter(isPanel);
    if (Array.isArray(r.userMolecules)) base.userMolecules = r.userMolecules.filter(isMolecule);
    if (isPlan(r.expression)) base.expression = { ...EMPTY_EXPRESSION, ...r.expression, mode: r.expression.mode ?? null };
    if (Array.isArray(r.expressionRegistrations)) {
      base.expressionRegistrations = r.expressionRegistrations.flatMap((value) => {
        if (!value || typeof value !== 'object') return [];
        const record = value as ExpressionRegistration;
        const mode = oneOf(record.mode, MODES) ?? (record.mode == null ? 'transient' : null);
        if (!mode) return [];
        const next = { ...record, mode };
        return isRegistration(next) ? [next] : [];
      });
    }
    if (isRatioMap(r.chainRatios)) base.chainRatios = r.chainRatios;
    if (isGroupMap(r.constructGroups)) base.constructGroups = r.constructGroups;
    if (typeof r.constructCount === 'number' && Number.isInteger(r.constructCount) && r.constructCount >= 1) {
      base.constructCount = r.constructCount;
    }
    if (isGroupMap(r.sequencePicks)) base.sequencePicks = r.sequencePicks;
    if (Array.isArray(r.proteinDrafts)) {
      base.proteinDrafts = r.proteinDrafts.flatMap((value) => {
        const draft = readProteinDraft(value);
        return draft ? [draft] : [];
      });
    }
    if (typeof r.activeProteinId === 'string') base.activeProteinId = r.activeProteinId;
    if (isPlan(r.proteinExpression)) base.proteinExpression = { ...EMPTY_EXPRESSION, ...r.proteinExpression, mode: r.proteinExpression.mode ?? null };
    const scheme = oneOf(r.proteinScheme, PROTEIN_SCHEMES);
    if (scheme) base.proteinScheme = scheme;
  } catch {
    return defaultState();
  }
  return base;
}

function isRequest(value: unknown): value is RequestDoc {
  if (!value || typeof value !== 'object') return false;
  const r = value as RequestDoc;
  return typeof r.id === 'string' && typeof r.name === 'string' && Array.isArray(r.drafts);
}

function isPanel(value: unknown): value is LumaPanel {
  if (!value || typeof value !== 'object') return false;
  const p = value as LumaPanel;
  return typeof p.id === 'string' && Array.isArray(p.formatIds) && Array.isArray(p.chainIds);
}

function oneOf<T extends string>(value: unknown, list: readonly T[]): T | null {
  return typeof value === 'string' && (list as readonly string[]).includes(value) ? (value as T) : null;
}

function isPlan(value: unknown): value is ExpressionPlan {
  if (!value || typeof value !== 'object') return false;
  const plan = value as ExpressionPlan;
  const targetOk = plan.targetClass === null || oneOf(plan.targetClass, TARGETS) !== null;
  const hostOk = plan.host === null || oneOf(plan.host, HOST_IDS) !== null;
  const codonOk = plan.codon === null || oneOf(plan.codon, CODONS) !== null;
  const tableOk = plan.codonTable === null || typeof plan.codonTable === 'string';
  const modeOk = plan.mode == null || oneOf(plan.mode, MODES) !== null;
  return targetOk && hostOk && codonOk && tableOk && modeOk;
}

function isRegistration(value: unknown): value is ExpressionRegistration {
  if (!value || typeof value !== 'object') return false;
  const record = value as ExpressionRegistration;
  return (
    typeof record.id === 'string' &&
    oneOf(record.targetClass, TARGETS) !== null &&
    oneOf(record.host, HOST_IDS) !== null &&
    typeof record.codonTable === 'string' &&
    oneOf(record.codon, CODONS) !== null &&
    oneOf(record.mode, MODES) !== null &&
    Array.isArray(record.vectorIds) &&
    record.vectorIds.every((id) => typeof id === 'string') &&
    Array.isArray(record.inserts) &&
    record.inserts.every((id) => typeof id === 'string') &&
    typeof record.registeredAt === 'string'
  );
}

function isGroupMap(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.entries(value).every(([key, group]) => typeof key === 'string' && typeof group === 'string' && group.length > 0);
}

function isRatioMap(value: unknown): value is Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.entries(value).every(
    ([key, parts]) => typeof key === 'string' && typeof parts === 'number' && Number.isFinite(parts) && parts >= 0,
  );
}

function readProteinDraft(value: unknown): ProteinDraft | null {
  if (!value || typeof value !== 'object') return null;
  const draft = value as ProteinDraft;
  const sequence = draft.sequence == null ? null : readProteinSequence(draft.sequence);
  if (
    typeof draft.id !== 'string' ||
    typeof draft.name !== 'string' ||
    (draft.family !== null && oneOf(draft.family, PROTEIN_FAMILIES) === null) ||
    (draft.basisId !== null && typeof draft.basisId !== 'string') ||
    (draft.use !== null && oneOf(draft.use, PROTEIN_USES) === null) ||
    typeof draft.note !== 'string'
  ) {
    return null;
  }
  const parts = typeof draft.parts === 'number' && Number.isFinite(draft.parts) && draft.parts >= 0 ? draft.parts : 1;
  return {
    ...draft,
    sequence,
    role: oneOf(draft.role, PROTEIN_ROLES),
    parts,
    translationId: typeof draft.translationId === 'string' ? draft.translationId : null,
    onPanel: draft.onPanel === true,
    annotations: Array.isArray(draft.annotations) ? draft.annotations.flatMap(readProteinAnnotation) : [],
  };
}

function readProteinAnnotation(value: unknown): ProteinAnnotation[] {
  if (!value || typeof value !== 'object') return [];
  const annotation = value as ProteinAnnotation;
  if (
    typeof annotation.id !== 'string' ||
    typeof annotation.type !== 'string' ||
    typeof annotation.name !== 'string' ||
    typeof annotation.note !== 'string' ||
    typeof annotation.start !== 'number' ||
    typeof annotation.end !== 'number'
  ) {
    return [];
  }
  return [{ ...annotation, visible: annotation.visible !== false }];
}

function readProteinSequence(value: unknown): ProteinSequenceRecord | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as ProteinSequenceRecord;
  if (record.origin !== 'internal' && record.origin !== 'uniprot') return null;
  if (
    typeof record.accession !== 'string' ||
    typeof record.entryName !== 'string' ||
    typeof record.proteinName !== 'string' ||
    typeof record.gene !== 'string' ||
    typeof record.organism !== 'string' ||
    typeof record.reviewed !== 'boolean' ||
    typeof record.length !== 'number' ||
    typeof record.sequence !== 'string' ||
    typeof record.functionText !== 'string'
  ) {
    return null;
  }
  return { ...record, features: readProteinFeatures(record.features) };
}

function readProteinFeatures(value: unknown): ProteinFeature[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const feature = item as ProteinFeature;
    if (
      typeof feature.type !== 'string' ||
      typeof feature.name !== 'string' ||
      typeof feature.note !== 'string' ||
      typeof feature.start !== 'number' ||
      typeof feature.end !== 'number'
    ) {
      return [];
    }
    return [feature];
  });
}

function isMolecule(value: unknown): value is LumaMolecule {
  if (!value || typeof value !== 'object') return false;
  const m = value as LumaMolecule;
  return typeof m.id === 'string' && typeof m.formatId === 'string' && Array.isArray(m.chainIds);
}

export function saveState(state: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode or quota */
  }
}
