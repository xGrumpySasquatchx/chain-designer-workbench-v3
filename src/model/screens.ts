/** How a construct is kept, seen, or confirmed. Selection and screening are different jobs. */

export type ScreenGroup = 'color' | 'fluorescence' | 'dna';

export interface ScreenOption {
  id: string;
  group: ScreenGroup;
  /** Genetic markers select. Color, fluorescence, and DNA checks screen or confirm. */
  selects: boolean;
  name: string;
  note: string;
}

export const SCREEN_GROUPS: { id: ScreenGroup; label: string; lead: string }[] = [
  {
    id: 'color',
    label: 'Color',
    lead: 'Chromogenic screening. Every colony can grow. Color marks the ones that carry the insert or the product.',
  },
  {
    id: 'fluorescence',
    label: 'Fluorescence',
    lead: 'Mostly screening. Brightness ranks clones. FACS is the version that sorts at scale.',
  },
  {
    id: 'dna',
    label: 'DNA selection',
    lead: 'Markers kill or block cells that missed the construct. The checks at the bottom confirm the plasmid. They do not select.',
  },
];

export const CONSTRUCT_SCREENS: ScreenOption[] = [
  {
    id: 'lacz',
    group: 'color',
    selects: false,
    name: 'Blue/white (lacZα)',
    note: 'The insert disrupts lacZα. On X-gal plus IPTG, intact lacZα is blue and colonies with the insert are white. Needs a lacZΔM15 host such as DH5α, JM109, or XL1-Blue.',
  },
  {
    id: 'gus',
    group: 'color',
    selects: false,
    name: 'GUS (uidA) with X-Gluc',
    note: 'The plant equivalent of blue/white. A blue product, used heavily in Agrobacterium transformation.',
  },
  {
    id: 'xylE',
    group: 'color',
    selects: false,
    name: 'XylE',
    note: 'Catechol 2,3-dioxygenase. Spray plates with catechol and positive colonies turn bright yellow. Useful where lacZ is unavailable.',
  },
  {
    id: 'chromoprotein',
    group: 'color',
    selects: false,
    name: 'Chromoproteins',
    note: 'amilCP, eforRed, spisPink, and amilGFP. Visible in ambient light with no substrate and no UV, as a cloning indicator or an expression reporter.',
  },
  {
    id: 'crt',
    group: 'color',
    selects: false,
    name: 'Carotenoid pathway (crtEBI)',
    note: 'Pink to orange colonies. A metabolic-engineering readout.',
  },
  {
    id: 'ade2-color',
    group: 'color',
    selects: false,
    name: 'Yeast ade2 red/white',
    note: 'An ade2 mutant accumulates a red pigment. Complementation gives white colonies. The classic red/white sectoring assay.',
  },
  {
    id: 'gfp-fusion',
    group: 'fluorescence',
    selects: false,
    name: 'GFP, sfGFP, or mCherry fusion',
    note: 'The Waldo folding reporter: C-terminal GFP fluoresces when the upstream protein folds soluble, so brightness tracks soluble yield. GFP-His fusions also support in-gel fluorescence and FSEC.',
  },
  {
    id: 'split-gfp',
    group: 'fluorescence',
    selects: false,
    name: 'Split GFP (GFP1-10 / GFP11)',
    note: 'Tag the target with the 16-residue GFP11 strand and complement with GFP1-10 in vitro or in vivo. A minimal tag, so there is no large fusion to cleave.',
  },
  {
    id: 'facs',
    group: 'fluorescence',
    selects: false,
    name: 'FACS',
    note: 'Sort a library by brightness for display work, directed evolution, or clone selection in CHO line development.',
  },
  {
    id: 'flash',
    group: 'fluorescence',
    selects: false,
    name: 'FlAsH/ReAsH',
    note: 'A tetracysteine tag fluoresces when the biarsenical dye is added. Used where the tag has to stay small.',
  },
  {
    id: 'ires-2a',
    group: 'fluorescence',
    selects: false,
    name: 'IRES or 2A-linked fluorescent protein',
    note: 'In a mammalian stable pool, cell fluorescence tracks expression of the untagged product.',
  },
  {
    id: 'bla',
    group: 'dna',
    selects: true,
    name: 'bla',
    note: 'Ampicillin or carbenicillin. Bacterial marker.',
  },
  {
    id: 'aph',
    group: 'dna',
    selects: true,
    name: 'aph',
    note: 'Kanamycin. Bacterial marker.',
  },
  {
    id: 'cat',
    group: 'dna',
    selects: true,
    name: 'cat',
    note: 'Chloramphenicol. Bacterial marker.',
  },
  {
    id: 'tetA',
    group: 'dna',
    selects: true,
    name: 'tetA',
    note: 'Tetracycline. Bacterial marker.',
  },
  {
    id: 'aadA',
    group: 'dna',
    selects: true,
    name: 'aadA',
    note: 'Spectinomycin or streptomycin. Bacterial marker.',
  },
  {
    id: 'ble',
    group: 'dna',
    selects: true,
    name: 'ble',
    note: 'Zeocin. Bacterial marker.',
  },
  {
    id: 'neo',
    group: 'dna',
    selects: true,
    name: 'neo',
    note: 'G418. Mammalian marker.',
  },
  {
    id: 'hph',
    group: 'dna',
    selects: true,
    name: 'hph',
    note: 'Hygromycin. Mammalian marker.',
  },
  {
    id: 'pac',
    group: 'dna',
    selects: true,
    name: 'pac',
    note: 'Puromycin. Mammalian marker.',
  },
  {
    id: 'bsd',
    group: 'dna',
    selects: true,
    name: 'bsd',
    note: 'Blasticidin. Mammalian marker.',
  },
  {
    id: 'auxotrophy',
    group: 'dna',
    selects: true,
    name: 'Auxotrophic complementation',
    note: 'URA3, LEU2, HIS3, TRP1, or ADE2 in yeast, or the equivalent on defined bacterial medium. Antibiotic-free, which matters for GMP.',
  },
  {
    id: 'dhfr',
    group: 'dna',
    selects: true,
    name: 'DHFR with methotrexate',
    note: 'Selects and amplifies copy number. A workhorse for CHO production lines.',
  },
  {
    id: 'gs-msx',
    group: 'dna',
    selects: true,
    name: 'Glutamine synthetase with MSX',
    note: 'Selects and amplifies copy number. A workhorse for CHO production lines.',
  },
  {
    id: 'ccdb',
    group: 'dna',
    selects: true,
    name: 'ccdB counterselection',
    note: 'Gateway. Kills the empty or parental vector rather than rescuing the recombinant.',
  },
  {
    id: 'sacB',
    group: 'dna',
    selects: true,
    name: 'sacB with sucrose',
    note: 'Counterselection. Kills the parental vector.',
  },
  {
    id: 'rpsL',
    group: 'dna',
    selects: true,
    name: 'rpsL with streptomycin',
    note: 'Counterselection against the parental vector.',
  },
  {
    id: 'thyA',
    group: 'dna',
    selects: true,
    name: 'thyA counterselection',
    note: 'Kills the parental vector rather than rescuing the recombinant.',
  },
  {
    id: 'antibiotic-free',
    group: 'dna',
    selects: true,
    name: 'Antibiotic-free systems',
    note: 'Operator-repressor titration, RNA-OUT/sacB, fabI/triclosan, or infA complementation.',
  },
  {
    id: 'colony-pcr',
    group: 'dna',
    selects: false,
    name: 'Colony PCR',
    note: 'Insert-spanning or junction primers. Confirms the construct. It does not select.',
  },
  {
    id: 'digest',
    group: 'dna',
    selects: false,
    name: 'Diagnostic restriction digest',
    note: 'Confirms the construct. It does not select.',
  },
  {
    id: 'sanger',
    group: 'dna',
    selects: false,
    name: 'Sanger sequencing',
    note: 'Sequence the ORF and the junctions. Confirms the construct. It does not select.',
  },
  {
    id: 'plasmid-ngs',
    group: 'dna',
    selects: false,
    name: 'Full-plasmid NGS',
    note: 'For anything going into a cell line or a regulatory filing. Confirms the construct. It does not select.',
  },
];

const BY_ID = new Map(CONSTRUCT_SCREENS.map((option) => [option.id, option]));

export function screenById(id: string): ScreenOption | undefined {
  return BY_ID.get(id);
}

/** Drop anything that is not one of the construct screen methods. */
export function keptScreens(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  const seen = new Set<string>();
  const next: string[] = [];
  ids.forEach((id) => {
    if (typeof id !== 'string' || !BY_ID.has(id) || seen.has(id)) return;
    seen.add(id);
    next.push(id);
  });
  return next;
}

export function toggleScreen(ids: string[], id: string, on: boolean): string[] {
  if (!BY_ID.has(id)) return ids;
  return on ? keptScreens([...ids, id]) : ids.filter((item) => item !== id);
}

export function screenSummary(ids: string[]): string {
  const names = keptScreens(ids).map((id) => BY_ID.get(id)?.name ?? id);
  return names.length ? names.join(' · ') : '';
}
