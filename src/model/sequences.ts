import type { Chain, LumaMolecule, PadDesign } from './types';

/** One registered nucleotide string inside a codon category. */
export interface NucleotideRegistration {
  id: string;
  /** 1-based place in the category. The 6th of 7 is `n === 6`. */
  n: number;
  dna: string;
  note: string;
}

/** A codon category for one amino-acid region, already characterized on registered molecules. */
export interface NucleotideTranslation {
  id: string;
  name: string;
  preferred: boolean;
  basis: string;
  molecules: number;
  contribution: string;
  /** Nucleotides of the first registered string in this category. */
  dna?: string;
  /** Every registered string in this category. Length matches `molecules` when the region was built. */
  registrations?: NucleotideRegistration[];
}

interface CatalogEntry {
  id: string;
  name: string;
  preferred: boolean;
  basis: string;
  /** Share of this chain's registered molecules the string was characterized on. */
  share: number;
  contribution: string;
}

/** The common light chain is one protein with more than one characterized nucleotide string. */
const CATALOG: Record<string, CatalogEntry[]> = {
  'CH-20': [
    {
      id: 'nt-cLC-cho',
      name: 'CHO high-frequency',
      preferred: true,
      basis: 'Most frequently used codons for this protein.',
      share: 1,
      contribution: 'Highest titer share of the molecule. Pairing stays fixed because this light chain is universal.',
    },
    {
      id: 'nt-cLC-harmonized',
      name: 'Human harmonized',
      preferred: false,
      basis: 'Codon harmonization against the human germline.',
      share: 0.35,
      contribution: 'Lower titer than the CHO string, with fewer truncated species.',
    },
    {
      id: 'nt-cLC-germline',
      name: 'Germline nucleotides',
      preferred: false,
      basis: 'The nucleotide string of the germline gene, rare codons included.',
      share: 0.15,
      contribution: 'Earliest registration. More aggregation than the CHO string.',
    },
  ],
};

export function isUniversalLight(chain: Chain): boolean {
  return chain.id === 'CH-20' || /common|universal/i.test(chain.name);
}

export function preferredTranslation(list: NucleotideTranslation[]): NucleotideTranslation | undefined {
  return list.find((item) => item.preferred) ?? list[0];
}

/** Nucleotide strings already on record for this chain. Empty when the chain has never been registered. */
export function nucleotideTranslations(chain: Chain, registeredMolecules: number): NucleotideTranslation[] {
  if (registeredMolecules < 1) return [];
  const catalog = CATALOG[chain.id];
  if (catalog) {
    return catalog.map((entry) => ({
      id: entry.id,
      name: entry.name,
      preferred: entry.preferred,
      basis: entry.basis,
      molecules: Math.max(1, Math.round(registeredMolecules * entry.share)),
      contribution: entry.contribution,
    }));
  }
  return [
    {
      id: `nt-${chain.id}-registered`,
      name: 'Registered translation',
      preferred: true,
      basis: 'The nucleotide string already on the registered construct.',
      molecules: registeredMolecules,
      contribution: 'This is the string whose performance is already on record for this chain.',
    },
  ];
}

/** One amino-acid building block on a chain, and the nucleotide strings registered for it. */
export interface FvRegion {
  id: string;
  /** Molecule or panel id this protein inherited. Unique per designed protein. */
  uid: string;
  chainId: string;
  kind: string;
  label: string;
  /** Well this sequence belongs to. Null when every well shares it. */
  well: string | null;
  aminoAcid: string;
  nucleotides: NucleotideTranslation[];
}

interface InsertSpec {
  kind: string;
  label: string;
  shared: boolean;
}

const AA = 'ACDEFGHIKLMNPQRSTVWY';

/** CHO high-frequency, human-harmonized, and a rarer germline codon for each amino acid. */
const CODONS: Record<string, string>[] = [
  { A: 'GCC', C: 'TGC', D: 'GAC', E: 'GAG', F: 'TTC', G: 'GGC', H: 'CAC', I: 'ATC', K: 'AAG', L: 'CTG', M: 'ATG', N: 'AAC', P: 'CCC', Q: 'CAG', R: 'CGC', S: 'AGC', T: 'ACC', V: 'GTG', W: 'TGG', Y: 'TAC' },
  { A: 'GCT', C: 'TGT', D: 'GAT', E: 'GAA', F: 'TTT', G: 'GGA', H: 'CAT', I: 'ATT', K: 'AAA', L: 'CTC', M: 'ATG', N: 'AAT', P: 'CCT', Q: 'CAA', R: 'CGA', S: 'TCT', T: 'ACT', V: 'GTT', W: 'TGG', Y: 'TAT' },
  { A: 'GCA', C: 'TGC', D: 'GAC', E: 'GAG', F: 'TTC', G: 'GGG', H: 'CAC', I: 'ATA', K: 'AAG', L: 'TTA', M: 'ATG', N: 'AAC', P: 'CCA', Q: 'CAG', R: 'AGA', S: 'TCG', T: 'ACA', V: 'GTA', W: 'TGG', Y: 'TAC' },
];

const CODON_NAMES = [
  { name: 'CHO high-frequency', basis: 'Most frequently used codons for this amino-acid sequence.' },
  { name: 'Human harmonized', basis: 'A second codon choice for the same amino acids.' },
  { name: 'Germline nucleotides', basis: 'An earlier codon choice for the same amino acids, rare codons included.' },
];

/** Synonymous codons. The first of each set is the CHO high-frequency choice. */
const SYNONYMS: Record<string, string[]> = {
  A: ['GCC', 'GCT', 'GCA', 'GCG'],
  C: ['TGC', 'TGT'],
  D: ['GAC', 'GAT'],
  E: ['GAG', 'GAA'],
  F: ['TTC', 'TTT'],
  G: ['GGC', 'GGA', 'GGG', 'GGT'],
  H: ['CAC', 'CAT'],
  I: ['ATC', 'ATT', 'ATA'],
  K: ['AAG', 'AAA'],
  L: ['CTG', 'CTC', 'TTA', 'TTG', 'CTT', 'CTA'],
  M: ['ATG'],
  N: ['AAC', 'AAT'],
  P: ['CCC', 'CCT', 'CCA', 'CCG'],
  Q: ['CAG', 'CAA'],
  R: ['CGC', 'CGA', 'AGA', 'AGG', 'CGG', 'CGT'],
  S: ['AGC', 'TCT', 'TCG', 'TCC', 'TCA', 'AGT'],
  T: ['ACC', 'ACT', 'ACA', 'ACG'],
  V: ['GTG', 'GTT', 'GTA', 'GTC'],
  W: ['TGG'],
  Y: ['TAC', 'TAT'],
};

const GENETIC: Record<string, string> = {};
for (const [residue, codons] of Object.entries(SYNONYMS)) {
  for (const codon of codons) GENETIC[codon] = residue;
}

const REG_NOTES = [
  'Highest titer of this codon set.',
  'Fewer truncated species.',
  'Lower aggregation after protein A.',
  'Earliest lot. More rare codons remain.',
  'Mid-pack titer with the cleanest intact mass.',
  'Later lot with a slightly lower titer.',
  'Clean intact mass and a slower growth rate.',
  'Highest monomer after the second polish.',
  'Stable titer across three shake-flask lots.',
  'Fewest sequence variants by intact mass.',
  'Best viability at harvest.',
  'Lowest host-cell protein in the eluate.',
  'Shortest production run that still cleared spec.',
  'Most consistent titer between the two bioreactors.',
  'Reserved backup. Last lot met spec with a lower yield.',
];

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function fakeProtein(seed: string, length: number): string {
  let h = hash(seed);
  let protein = '';
  for (let i = 0; i < length; i++) {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    protein += AA[h % AA.length];
  }
  return protein;
}

function backTranslate(aminoAcid: string, table: Record<string, string>): string {
  return [...aminoAcid].map((residue) => table[residue] ?? 'NNN').join('');
}

function variantDna(aminoAcid: string, category: number, registration: number, seed: string): string {
  const home = CODONS[Math.min(category, CODONS.length - 1)];
  const canonical = backTranslate(aminoAcid, home);
  if (registration === 0) return canonical;
  const chars = [...aminoAcid];
  const codons = chars.map((residue) => home[residue] ?? 'NNN');
  for (let step = 0; step < chars.length; step++) {
    const at = (registration + step) % chars.length;
    const options = (SYNONYMS[chars[at]] ?? []).filter((codon) => codon !== codons[at]);
    if (!options.length) continue;
    codons[at] = options[hash(`${seed}:${registration}:${at}`) % options.length];
    if (step > 0 && hash(`${seed}:${registration}:stop:${step}`) % 3 === 0) break;
  }
  return codons.join('');
}

/** The registered nucleotide strings inside one codon category. Each encodes the same amino acids. */
export function registeredStrings(
  categoryId: string,
  aminoAcid: string,
  category: number,
  count: number,
): NucleotideRegistration[] {
  const total = Math.max(1, count);
  return Array.from({ length: total }, (_, index) => {
    const n = index + 1;
    return {
      id: `${categoryId}-r${n}`,
      n,
      dna: variantDna(aminoAcid, category, index, categoryId),
      note: `${n} of ${total}. ${REG_NOTES[(n - 1) % REG_NOTES.length]}`,
    };
  });
}

/** Translate a nucleotide string with the same codon tables used to build it. */
export function translateDna(dna: string): string {
  let protein = '';
  for (let i = 0; i + 2 < dna.length; i += 3) {
    protein += GENETIC[dna.slice(i, i + 3)] ?? 'X';
  }
  return protein;
}

function proteinLength(kind: string): number {
  if (kind === 'Mutein' || kind === 'De novo' || kind === 'Partner') return 48;
  if (kind === 'scFv') return 42;
  return 30;
}

/** Variable inserts and other building blocks carried by this chain. A fixed germline is shared. */
export function insertsOf(chain: Chain): InsertSpec[] {
  const text = `${chain.name} ${chain.slots} ${chain.note}`;
  if (/fixed germline|fixed IGKV|common \(fixed/i.test(text)) {
    return [{ kind: 'VL', label: 'Fixed germline VL', shared: true }];
  }
  if (/no insert|stock plasmid/i.test(text)) return [];
  const slots = chain.slots;
  if (slots === '0') {
    return /no fv/i.test(chain.note) ? [{ kind: 'Partner', label: 'N-terminal partner', shared: false }] : [];
  }
  if (/mutein ORF/i.test(slots)) return [{ kind: 'Mutein', label: 'Mutein', shared: false }];
  if (/designed protein/i.test(slots)) return [{ kind: 'De novo', label: 'De novo protein', shared: false }];
  if (/VHH/i.test(slots)) return [{ kind: 'VHH', label: 'VHH', shared: false }];
  if (/2 complete Fv/i.test(slots)) {
    return ['Fv1 VH', 'Fv1 VL', 'Fv2 VH', 'Fv2 VL'].map((label) => ({
      kind: label.includes('VH') ? 'VH' : 'VL',
      label,
      shared: false,
    }));
  }
  if (/scFv cassette/i.test(slots)) {
    return [
      { kind: 'VH', label: 'VH', shared: false },
      { kind: 'scFv', label: 'C-terminal scFv', shared: false },
    ];
  }
  if (/VH of A, VL of B/i.test(slots)) {
    return [
      { kind: 'VH', label: 'VH of A', shared: false },
      { kind: 'VL', label: 'VL of B', shared: false },
    ];
  }
  if (/VH of B, VL of A/i.test(slots)) {
    return [
      { kind: 'VH', label: 'VH of B', shared: false },
      { kind: 'VL', label: 'VL of A', shared: false },
    ];
  }
  if (/VH outer, VH inner/i.test(slots)) {
    return [
      { kind: 'VH', label: 'Outer VH', shared: false },
      { kind: 'VH', label: 'Inner VH', shared: false },
    ];
  }
  if (/VL outer, VL inner/i.test(slots)) {
    return [
      { kind: 'VL', label: 'Outer VL', shared: false },
      { kind: 'VL', label: 'Inner VL', shared: false },
    ];
  }
  if (/VH \+ VL/i.test(slots)) {
    return [
      { kind: 'VH', label: 'VH', shared: false },
      { kind: 'VL', label: 'VL', shared: false },
    ];
  }
  if (/1 \(VH/i.test(slots)) return [{ kind: 'VH', label: 'VH', shared: false }];
  if (/1 \(VL/i.test(slots)) return [{ kind: 'VL', label: 'VL', shared: false }];
  return [{ kind: 'ORF', label: slots, shared: false }];
}

/** The id assigned when the panel was built, kept on the protein that well produced. */
function proteinUid(molecule: LumaMolecule, chain: Chain, insert: InsertSpec, inserts: InsertSpec[], index: number): string {
  const chainId = molecule.chainIds.find((id) => id === chain.id || id.endsWith(`-${chain.id}`)) ?? `LCH-${chain.id}`;
  if (insert.shared) return `${molecule.panelId} · ${chainId}`;
  const repeated = inserts.filter((item) => item.label === insert.label).length > 1;
  const slot = inserts.length > 1 ? ` · ${insert.label}${repeated ? ` ${index + 1}` : ''}` : '';
  return `${molecule.id} · ${chainId}${slot}`;
}

function wellOf(molecule: LumaMolecule): string {
  for (const target of molecule.design.targets) {
    const marked = / · ([A-H]\d+)$/.exec(target);
    if (marked) return marked[1];
  }
  return / · ([A-H]\d+)$/.exec(molecule.name)?.[1] ?? molecule.id;
}

function binderOf(design: PadDesign, slotIndex: number, slotCount: number): string {
  const clean = (value: string) => value.replace(/ · [A-H]\d+$/, '').trim();
  const left = clean(design.targets[0] || '');
  const right = clean(design.targets[1] || '');
  if (!left && !right) return 'binder';
  if (slotCount < 2 || !right || right === left) return left || right;
  return slotIndex < Math.ceil(slotCount / 2) ? left || right : right || left;
}

function codonVersions(id: string, aminoAcid: string, variants: number): NucleotideTranslation[] {
  const count = variants;
  return CODON_NAMES.slice(0, count).map((item, index) => {
    const categoryId = `${id}-nt${index}`;
    const molecules = 1 + (hash(`${id}:${index}`) % (index === 0 ? 15 : 5));
    const registrations = registeredStrings(categoryId, aminoAcid, index, molecules);
    return {
      id: categoryId,
      name: item.name,
      preferred: index === 0,
      basis: item.basis,
      molecules,
      contribution:
        index === 0
          ? 'Highest titer share recorded for this amino-acid sequence.'
          : 'Same amino acids, a different nucleotide string, with its own expression history.',
      dna: registrations[0]?.dna,
      registrations,
    };
  });
}

/**
 * Amino-acid Fvs and other building blocks on this chain.
 * A repeated format still gets its own sequence. A fixed germline is one sequence for the panel,
 * and some of those sequences have more than one registered nucleotide string.
 */
export function chainRegions(chain: Chain, molecules: LumaMolecule[]): FvRegion[] {
  const inserts = insertsOf(chain);
  if (!inserts.length || !molecules.length) return [];
  const sources = inserts.every((insert) => insert.shared) ? [molecules[0]] : molecules;
  const regions: FvRegion[] = [];
  for (const molecule of sources) {
    const well = inserts.every((insert) => insert.shared) ? null : wellOf(molecule);
    inserts.forEach((insert, index) => {
      const id = `fv-${chain.id}-${insert.label}-${well ?? 'panel'}-${index}`.replace(/\s+/g, '-');
      const binder = binderOf(molecule.design, index, inserts.length);
      const aminoAcid = fakeProtein(
        `${chain.id}|${insert.label}|${binder}|${well ?? 'panel'}`,
        proteinLength(insert.kind),
      );
      const registered = nucleotideTranslations(chain, Math.max(molecules.length, 1));
      const rolled = hash(id) % 5;
      const variants = !insert.shared && molecule === sources[0] && index === 0 ? 3 : rolled === 0 ? 3 : rolled === 1 ? 2 : 1;
      const nucleotides =
        insert.shared && isUniversalLight(chain)
          ? registered.map((item, codon) => {
              const registrations = registeredStrings(item.id, aminoAcid, codon, item.molecules);
              return { ...item, dna: registrations[0]?.dna, registrations };
            })
          : codonVersions(id, aminoAcid, variants);
      regions.push({
        id,
        uid: proteinUid(molecule, chain, insert, inserts, index),
        chainId: chain.id,
        kind: insert.kind,
        label: well ? `${insert.label} · ${binder} · ${well}` : `${insert.label} · ${binder || 'shared'}`,
        well,
        aminoAcid,
        nucleotides,
      });
    });
  }
  return regions;
}
