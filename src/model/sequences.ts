import type { Chain } from './types';

/** A nucleotide string for one protein chain, already characterized on registered molecules. */
export interface NucleotideTranslation {
  id: string;
  name: string;
  preferred: boolean;
  basis: string;
  molecules: number;
  contribution: string;
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
