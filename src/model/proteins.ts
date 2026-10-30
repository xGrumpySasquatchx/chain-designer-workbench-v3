import type { ProteinDraft, ProteinFamily, ProteinUse } from './types';

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
  };
}
