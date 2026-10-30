import { isUniversalLight, preferredTranslation, type FvRegion, type NucleotideTranslation } from '../model/sequences';
import type { Chain } from '../model/types';

const OPEN_CHOICES = 4;

export function PreferredSequences({
  groups,
  picks,
  onPick,
}: {
  groups: { chain: Chain; regions: FvRegion[] }[];
  picks: Record<string, string>;
  onPick: (regionId: string, translationId: string) => void;
}) {
  const shown = groups.filter((group) => group.regions.length);
  if (!shown.length) return null;

  return (
    <section className="ratio-plan" aria-label="Preferred sequences">
      <h3>Preferred sequences</h3>
      <p className="sm">
        Each well carries its own amino-acid sequence. When that same sequence has more than one nucleotide
        string on record, choose the one to express. The preferred string stays marked.
      </p>
      {shown.map(({ chain, regions }) => {
        const choices = regions.filter((region) => region.nucleotides.length > 1);
        const singles = regions.filter((region) => region.nucleotides.length === 1);
        const lead = choices.slice(0, OPEN_CHOICES);
        const rest = choices.slice(OPEN_CHOICES);
        return (
          <div className="seq-chain" key={chain.id}>
            <h4>
              {chain.name}
              {isUniversalLight(chain) ? <span className="pref-tag">Universal light chain</span> : null}
            </h4>
            <p className="sm">
              {regions.length} amino-acid region{regions.length === 1 ? '' : 's'}
              {choices.length
                ? `, ${choices.length} with more than one nucleotide sequence`
                : ', each with one registered nucleotide sequence'}
              .
            </p>
            {lead.map((region) => (
              <RegionChoice key={region.id} region={region} picks={picks} onPick={onPick} />
            ))}
            {rest.length ? (
              <details className="seq-more">
                <summary>
                  {rest.length} more region{rest.length === 1 ? '' : 's'} with more than one nucleotide sequence
                </summary>
                {rest.map((region) => (
                  <RegionChoice key={region.id} region={region} picks={picks} onPick={onPick} />
                ))}
              </details>
            ) : null}
            {singles.length ? (
              <p className="sm seq-aa">
                {singles.length} region{singles.length === 1 ? '' : 's'} with one registered nucleotide string.
                {` ${singles[0].label}: ${singles[0].aminoAcid}`}
              </p>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}

function RegionChoice({
  region,
  picks,
  onPick,
}: {
  region: FvRegion;
  picks: Record<string, string>;
  onPick: (regionId: string, translationId: string) => void;
}) {
  const preferred = preferredTranslation(region.nucleotides);
  const selected = region.nucleotides.find((item) => item.id === picks[region.id])?.id ?? preferred?.id ?? '';
  return (
    <div className="seq-region">
      <h5>{region.label}</h5>
      <p className="seq-aa" title={region.aminoAcid}>
        {region.aminoAcid}
      </p>
      <div className="seq-options" role="group" aria-label={`Nucleotide sequence for ${region.label}`}>
        {region.nucleotides.map((item) => (
          <SequenceOption
            key={item.id}
            item={item}
            pressed={item.id === selected}
            onPick={() => onPick(region.id, item.id)}
          />
        ))}
      </div>
    </div>
  );
}

function SequenceOption({
  item,
  pressed,
  onPick,
}: {
  item: NucleotideTranslation;
  pressed: boolean;
  onPick: () => void;
}) {
  const dna = item.dna ? `${item.dna.slice(0, 24)}…` : '';
  return (
    <button type="button" className="seq-option" aria-pressed={pressed} onClick={onPick} title={item.dna}>
      <span className="seq-top">
        <span className="nm">{item.name}</span>
        {item.preferred ? <span className="pref-tag">Preferred</span> : null}
        <span className="sm">
          Characterized on {item.molecules} molecule{item.molecules === 1 ? '' : 's'}
        </span>
      </span>
      <span className="sm">{item.contribution}</span>
      {dna ? <span className="seq-aa">{dna}</span> : <span className="sm">{item.basis}</span>}
    </button>
  );
}
