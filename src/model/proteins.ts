import { characterizedTranslations, preferredTranslation } from './sequences';
import type {
  ProteinAnnotation,
  ProteinDraft,
  ProteinFamily,
  ProteinRole,
  ProteinScheme,
  ProteinSequenceRecord,
  ProteinUse,
} from './types';
import type { NucleotideRegistration, NucleotideTranslation } from './sequences';

export const PROTEIN_FAMILIES: { id: ProteinFamily; label: string }[] = [
  { id: 'receptor', label: 'Receptors' },
  { id: 'human', label: 'Human-derived scaffolds' },
  { id: 'nonhuman', label: 'Non-human-derived scaffolds' },
  { id: 'engineered', label: 'Other engineered scaffolds' },
];

export const PROTEIN_USES: { id: ProteinUse; label: string }[] = [
  { id: 'delivery', label: 'Targeted drug delivery' },
  { id: 'antagonism', label: 'Receptor antagonism or ligand neutralization' },
];

export interface ProteinRecord {
  id: string;
  name: string;
  family: ProteinFamily;
  origin: string;
  summary: string;
}

/** Receptors and scaffolds already registered, in the same sense as an antibody panel. */
export const PROTEINS: ProteinRecord[] = [
  {
    id: 'PRT-001',
    name: 'TCR',
    family: 'receptor',
    origin: 'T-cell receptor',
    summary: 'A receptor registered as its own protein. It is not an antibody format.',
  },
  {
    id: 'PRT-002',
    name: 'Anticalins',
    family: 'human',
    origin: 'Lipocalins',
    summary: 'Customizable binding loops similar to antibody CDRs.',
  },
  {
    id: 'PRT-003',
    name: 'DARPins',
    family: 'human',
    origin: 'Ankyrin repeat domains',
    summary: 'Designed ankyrin repeat proteins with high stability and specificity.',
  },
  {
    id: 'PRT-004',
    name: 'Affilin',
    family: 'human',
    origin: 'Ubiquitin or gamma-B-crystallin',
    summary: 'A scaffold engineered from ubiquitin or gamma-B-crystallin.',
  },
  {
    id: 'PRT-005',
    name: 'Adnectins / Monobodies',
    family: 'human',
    origin: 'Fibronectin type III domain',
    summary: 'These proteins mimic antibody binding sites.',
  },
  {
    id: 'PRT-006',
    name: 'Avimers',
    family: 'human',
    origin: 'Natural human domains',
    summary: 'Multivalent proteins engineered from natural human domains.',
  },
  {
    id: 'PRT-007',
    name: 'Kunitz domains',
    family: 'human',
    origin: 'Protease inhibitors',
    summary: 'Proteins with inhibitory properties derived from protease inhibitors.',
  },
  {
    id: 'PRT-008',
    name: 'Affibodies',
    family: 'nonhuman',
    origin: 'Staphylococcus aureus protein A',
    summary: 'Small and highly stable binding proteins.',
  },
  {
    id: 'PRT-009',
    name: 'Nanofitins',
    family: 'nonhuman',
    origin: 'Bacterial DNA-binding proteins',
    summary: 'High affinity and stability from a bacterial DNA-binding scaffold.',
  },
  {
    id: 'PRT-010',
    name: 'Fynomers',
    family: 'engineered',
    origin: 'SH3 domain of the Fyn kinase',
    summary: 'Engineered for ligand binding.',
  },
  {
    id: 'PRT-011',
    name: 'Knottins',
    family: 'engineered',
    origin: 'Knotted cystine scaffold',
    summary: 'Extremely stable proteins with a knotted structure, used for toxin inhibition or receptor targeting.',
  },
  {
    id: 'PRT-012',
    name: 'β-Hairpin mimetics',
    family: 'engineered',
    origin: 'β-hairpin peptide structure',
    summary: 'Designed to mimic β-hairpin structures for ligand binding.',
  },
];

/** Singular and plural forms match, so a search for Affibody finds Affibodies. */
export function proteinSearchText(value: string): string {
  return value.toLowerCase().replace(/ies\b/g, 'y');
}

export function proteinById(id: string): ProteinRecord | undefined {
  return PROTEINS.find((protein) => protein.id === id);
}

export function familyLabel(family: ProteinFamily | null): string {
  return PROTEIN_FAMILIES.find((item) => item.id === family)?.label ?? 'Choose a class';
}

export function proteinUseLabel(use: ProteinUse | null): string {
  return PROTEIN_USES.find((item) => item.id === use)?.label ?? 'Choose a therapeutic area';
}

export function newProteinDraft(drafts: ProteinDraft[], basis?: ProteinRecord): ProteinDraft {
  const n =
    drafts.reduce((max, draft) => {
      const matched = /^PRT-R(\d+)$/.exec(draft.id);
      return matched ? Math.max(max, Number(matched[1])) : max;
    }, 0) + 1;
  return {
    id: `PRT-R${String(n).padStart(3, '0')}`,
    name: basis ? `${basis.name} design` : 'New protein',
    family: basis?.family ?? null,
    basisId: basis?.id ?? null,
    use: null,
    note: '',
    sequence: null,
    role: null,
    parts: 1,
    translationId: null,
    onPanel: false,
    annotations: [],
  };
}

export const PROTEIN_ROLES: { id: ProteinRole; label: string; note: string }[] = [
  { id: 'stoichiometry', label: 'Stoichiometry', note: 'Several chains in a fixed ratio, as with a TCR.' },
  { id: 'scaffold', label: 'Scaffold', note: 'A scaffold to build from.' },
  { id: 'antigen', label: 'Antigen', note: 'A protein to make for an assay.' },
];

export const PROTEIN_SCHEMES: { id: ProteinScheme; label: string; note: string }[] = [
  {
    id: 'together',
    label: 'One co-transfection',
    note: 'Parts are the share of each protein in one transfection mix.',
  },
  {
    id: 'separate',
    label: 'One plasmid per protein',
    note: 'Each protein is its own transfection. Parts still record the planned mix.',
  },
];

const AA_LETTERS = /[^ACDEFGHIKLMNPQRSTVWY]/g;

export function proteinRoleLabel(role: ProteinRole | null): string {
  return PROTEIN_ROLES.find((item) => item.id === role)?.label ?? 'Choose how it is cloned';
}

/** The chain annotation that arrives with a brought-in sequence. */
export function chainAnnotation(sequence: ProteinSequenceRecord): ProteinAnnotation {
  const length = sequence.sequence.length || sequence.length;
  return {
    id: 'chain',
    type: 'Chain',
    name: sequence.proteinName || sequence.accession || 'Chain',
    start: 1,
    end: Math.max(1, length),
    note: sequence.functionText,
  };
}

/** Keep annotations inside the sequence after an edit. */
export function clampAnnotations(annotations: ProteinAnnotation[], length: number): ProteinAnnotation[] {
  return annotations.flatMap((annotation) => {
    const start = Math.max(1, Math.min(length, Math.round(annotation.start)));
    const end = Math.max(start, Math.min(length, Math.round(annotation.end)));
    if (length < 1) return [];
    return [{ ...annotation, start, end }];
  });
}

/** Replace the amino-acid sequence. Reverse translation is derived again from the new residues. */
export function editAminoAcids(draft: ProteinDraft, raw: string): ProteinDraft {
  const sequence = raw.toUpperCase().replace(AA_LETTERS, '');
  if (!sequence || !draft.sequence) return draft;
  const next = { ...draft.sequence, sequence, length: sequence.length };
  return {
    ...draft,
    sequence: next,
    annotations: clampAnnotations(draft.annotations.length ? draft.annotations : [chainAnnotation(next)], sequence.length),
  };
}

export function addProteinAnnotation(draft: ProteinDraft, annotation: Omit<ProteinAnnotation, 'id'>): ProteinDraft {
  const length = draft.sequence?.sequence.length ?? 0;
  if (length < 1) return draft;
  const n =
    draft.annotations.reduce((max, item) => {
      const matched = /^ann-(\d+)$/.exec(item.id);
      return matched ? Math.max(max, Number(matched[1])) : max;
    }, 0) + 1;
  const [placed] = clampAnnotations([{ ...annotation, id: `ann-${n}` }], length);
  if (!placed) return draft;
  return { ...draft, annotations: [...draft.annotations, placed] };
}

export interface ChosenTranslation {
  category: NucleotideTranslation;
  registration: NucleotideRegistration | null;
  dna: string;
}

/** The preferred codon category, or the registered string the user checked. */
export function chosenTranslation(draftId: string, aminoAcid: string, pick: string | null): ChosenTranslation | null {
  if (!aminoAcid) return null;
  const list = characterizedTranslations(draftId, aminoAcid);
  const preferred = preferredTranslation(list);
  if (!preferred) return null;
  const category =
    list.find((item) => item.id === pick || (item.registrations ?? []).some((registration) => registration.id === pick)) ??
    preferred;
  const registration =
    (category.registrations ?? []).find((item) => item.id === pick) ?? category.registrations?.[0] ?? null;
  return { category, registration, dna: registration?.dna ?? category.dna ?? '' };
}

/** Proteins on the cloning panel, in draft order, with a ratio such as 1:1. */
export function cloningPanel(drafts: ProteinDraft[]): { members: ProteinDraft[]; ratio: string } {
  const members = drafts.filter((draft) => draft.onPanel && draft.sequence);
  const ratio = members.map((draft) => String(draft.parts)).join(':');
  return { members, ratio };
}

export type ProteinSearchBy = 'name' | 'sequence';

/** One row from an internal or UniProt search, ready to copy onto a draft. */
export interface ProteinLookupHit {
  key: string;
  origin: 'internal' | 'uniprot';
  title: string;
  detail: string;
  /** Registered scaffold or receptor, when the hit is one of those classes. */
  basisId: string | null;
  sequence: ProteinSequenceRecord | null;
}

const AMINO_ACIDS = /^[ACDEFGHIKLMNPQRSTVWYXBZUO]+$/;
const CRC_POLY = 0xd8000000;

/** Amino-acid letters only, with FASTA headers and whitespace removed. */
export function aminoAcidSequence(value: string): string | null {
  const body = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('>'))
    .join('');
  const sequence = body.replace(/\s+/g, '').toUpperCase();
  if (sequence.length < 8 || !AMINO_ACIDS.test(sequence)) return null;
  return sequence;
}

/** UniProt CRC64 of an amino-acid sequence. Insulin's canonical sequence is C2C3B23B85E520E5. */
export function crc64(sequence: string): string {
  const tableH = new Uint32Array(256);
  const tableL = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let partL = i;
    let partH = 0;
    for (let bit = 0; bit < 8; bit += 1) {
      const flag = partL & 1;
      partL >>>= 1;
      if (partH & 1) partL |= 0x80000000;
      partH >>>= 1;
      if (flag) partH ^= CRC_POLY;
    }
    tableH[i] = partH;
    tableL[i] = partL;
  }
  let low = 0;
  let high = 0;
  for (let i = 0; i < sequence.length; i += 1) {
    const carry = (high & 0xff) << 24;
    const nextHigh = high >>> 8;
    const nextLow = (low >>> 8) | carry;
    const index = (low ^ sequence.charCodeAt(i)) & 0xff;
    high = (nextHigh ^ tableH[index]) >>> 0;
    low = (nextLow ^ tableL[index]) >>> 0;
  }
  return high.toString(16).toUpperCase().padStart(8, '0') + low.toString(16).toUpperCase().padStart(8, '0');
}

export function searchInternalProteins(by: ProteinSearchBy, query: string, drafts: ProteinDraft[]): ProteinLookupHit[] {
  const text = query.trim();
  if (!text) return [];
  if (by === 'sequence') {
    const sequence = aminoAcidSequence(text);
    if (!sequence) return [];
    return drafts.flatMap((draft) => {
      const stored = draft.sequence?.sequence ?? '';
      if (!stored.includes(sequence)) return [];
      return [draftHit(draft, stored === sequence)];
    });
  }
  const needle = proteinSearchText(text);
  const classes = PROTEINS.filter((protein) =>
    proteinSearchText([protein.id, protein.name, protein.origin, protein.summary].join(' ')).includes(needle),
  ).map(
    (protein): ProteinLookupHit => ({
      key: `registry:${protein.id}`,
      origin: 'internal',
      title: protein.name,
      detail: `${protein.id} · ${protein.origin}`,
      basisId: protein.id,
      sequence: null,
    }),
  );
  const saved = drafts
    .filter((draft) => proteinSearchText(draftSearchText(draft)).includes(needle))
    .map((draft) => draftHit(draft, false));
  return [...classes, ...saved];
}

function draftSearchText(draft: ProteinDraft): string {
  const basis = draft.basisId ? proteinById(draft.basisId) : undefined;
  const sequence = draft.sequence;
  return [
    draft.id,
    draft.name,
    draft.note,
    basis?.name ?? '',
    familyLabel(draft.family),
    sequence?.accession ?? '',
    sequence?.entryName ?? '',
    sequence?.proteinName ?? '',
    sequence?.gene ?? '',
    sequence?.organism ?? '',
    sequence?.sequence ?? '',
  ].join(' ');
}

function draftHit(draft: ProteinDraft, exact: boolean): ProteinLookupHit {
  const sequence = draft.sequence;
  const preview = sequence ? sequence.sequence.slice(0, 24) : '';
  return {
    key: `draft:${draft.id}`,
    origin: 'internal',
    title: sequence?.proteinName || draft.name,
    detail: sequence
      ? `${sequence.accession || draft.id} · ${sequence.organism || 'Saved sequence'}${exact ? ' · Exact sequence' : ''} · ${preview}`
      : `${draft.id} · Draft`,
    basisId: draft.basisId,
    sequence,
  };
}

export function applyProteinHit(draft: ProteinDraft, hit: ProteinLookupHit): ProteinDraft {
  const basis = hit.basisId ? proteinById(hit.basisId) : undefined;
  const name = hit.sequence?.proteinName || (hit.basisId && !hit.sequence ? `${hit.title} design` : hit.title);
  const sequence = hit.sequence ?? draft.sequence;
  const replaced = hit.sequence && hit.sequence.sequence !== draft.sequence?.sequence;
  return {
    ...draft,
    name,
    family: basis?.family ?? draft.family,
    basisId: hit.basisId ?? draft.basisId,
    sequence,
    annotations: hit.sequence ? [chainAnnotation(hit.sequence)] : draft.annotations,
    translationId: replaced ? null : draft.translationId,
  };
}

const UNIPROT_SEARCH = 'https://rest.uniprot.org/uniprotkb/search';
const UNIPROT_FIELDS = 'accession,id,protein_name,gene_names,organism_name,length,cc_function,reviewed,sequence';

export function parseUniProtSearch(payload: unknown): ProteinSequenceRecord[] {
  if (!payload || typeof payload !== 'object') return [];
  const results = (payload as { results?: unknown }).results;
  if (!Array.isArray(results)) return [];
  return results.flatMap((entry) => {
    const record = readUniProtEntry(entry);
    return record ? [record] : [];
  });
}

export function uniProtHits(records: ProteinSequenceRecord[]): ProteinLookupHit[] {
  return records.map((sequence) => ({
    key: `uniprot:${sequence.accession}`,
    origin: 'uniprot' as const,
    title: sequence.proteinName || sequence.accession,
    detail: [
      sequence.accession,
      sequence.entryName,
      sequence.gene,
      sequence.organism,
      sequence.reviewed ? 'Reviewed' : 'Unreviewed',
      sequence.length ? `${sequence.length} aa` : '',
      sequence.sequence.slice(0, 24),
    ]
      .filter(Boolean)
      .join(' · '),
    basisId: null,
    sequence,
  }));
}

/** Name, gene, or accession search, or an exact full-sequence match by UniProt CRC64. */
export async function searchUniProt(by: ProteinSearchBy, query: string, reviewed: boolean): Promise<ProteinLookupHit[]> {
  const text = query.trim();
  if (text.length < 2) return [];
  let expression = text;
  if (by === 'sequence') {
    const sequence = aminoAcidSequence(text);
    if (!sequence) throw new Error('Paste an amino-acid sequence of at least 8 residues.');
    expression = `checksum:${crc64(sequence)}`;
  }
  if (reviewed && !/reviewed\s*:/i.test(expression)) expression = `${expression} AND reviewed:true`;
  const url = new URL(UNIPROT_SEARCH);
  url.searchParams.set('query', expression);
  url.searchParams.set('fields', UNIPROT_FIELDS);
  url.searchParams.set('format', 'json');
  url.searchParams.set('size', '8');
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error('UniProt could not be reached.');
  }
  if (!response.ok) throw new Error(`UniProt returned ${response.status}.`);
  return uniProtHits(parseUniProtSearch(await response.json()));
}

function readUniProtEntry(entry: unknown): ProteinSequenceRecord | null {
  if (!entry || typeof entry !== 'object') return null;
  const row = entry as {
    primaryAccession?: unknown;
    uniProtkbId?: unknown;
    entryType?: unknown;
    organism?: { scientificName?: unknown };
    proteinDescription?: {
      recommendedName?: { fullName?: { value?: unknown } };
      submissionNames?: { fullName?: { value?: unknown } }[];
    };
    genes?: { geneName?: { value?: unknown } }[];
    comments?: { commentType?: unknown; texts?: { value?: unknown }[] }[];
    sequence?: { value?: unknown; length?: unknown };
  };
  const accession = typeof row.primaryAccession === 'string' ? row.primaryAccession : '';
  if (!accession) return null;
  const recommended = row.proteinDescription?.recommendedName?.fullName?.value;
  const submitted = row.proteinDescription?.submissionNames?.[0]?.fullName?.value;
  const proteinName = typeof recommended === 'string' ? recommended : typeof submitted === 'string' ? submitted : accession;
  const gene = (row.genes ?? [])
    .map((item) => (typeof item.geneName?.value === 'string' ? item.geneName.value : ''))
    .filter(Boolean)
    .join(', ');
  const organism = typeof row.organism?.scientificName === 'string' ? row.organism.scientificName : '';
  const functionText = (row.comments ?? [])
    .filter((comment) => comment.commentType === 'FUNCTION')
    .flatMap((comment) => comment.texts ?? [])
    .map((item) => (typeof item.value === 'string' ? item.value : ''))
    .filter(Boolean)
    .join(' ');
  const sequence = typeof row.sequence?.value === 'string' ? row.sequence.value : '';
  const length = typeof row.sequence?.length === 'number' ? row.sequence.length : sequence.length;
  const entryType = typeof row.entryType === 'string' ? row.entryType : '';
  return {
    origin: 'uniprot',
    accession,
    entryName: typeof row.uniProtkbId === 'string' ? row.uniProtkbId : '',
    proteinName,
    gene,
    organism,
    reviewed: entryType.toLowerCase().includes('reviewed') && !entryType.toLowerCase().includes('unreviewed'),
    length,
    sequence,
    functionText,
  };
}
