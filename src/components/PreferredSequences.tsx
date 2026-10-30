import { isUniversalLight, preferredTranslation, type FvRegion, type NucleotideTranslation } from '../model/sequences';
import type { Chain } from '../model/types';

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
        Check the nucleotide string to express for each amino-acid sequence. The preferred string stays marked.
      </p>
      {shown.map(({ chain, regions }) => {
        const choices = regions.filter((region) => region.nucleotides.length > 1);
        const singles = regions.filter((region) => region.nucleotides.length === 1);
        return (
          <div className="seq-chain" key={chain.id}>
            <h4>
              {chain.name}
              {isUniversalLight(chain) ? <span className="pref-tag">Universal light chain</span> : null}
              <span className="sm">
                {regions.length} region{regions.length === 1 ? '' : 's'}
                {choices.length ? ` · ${choices.length} with a choice` : ''}
              </span>
            </h4>
            {choices.length ? (
              <div className="seq-list" role="table" aria-label={`Nucleotide choices for ${chain.name}`}>
                {choices.map((region) => (
                  <RegionChoice key={region.id} region={region} picks={picks} onPick={onPick} />
                ))}
              </div>
            ) : null}
            {singles.length ? (
              <p className="sm seq-single" title={singles.map((region) => `${region.label}: ${region.aminoAcid}`).join('\n')}>
                {singles.length} region{singles.length === 1 ? '' : 's'} with one registered string.
                {` ${singles[0].label}`}
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
    <div className="seq-row" role="row">
      <div className="seq-id">
        <span className="nm">{region.label}</span>
        <span className="seq-aa" title={region.aminoAcid}>
          {region.aminoAcid}
        </span>
      </div>
      <div className="seq-options" role="group" aria-label={`Nucleotide sequence for ${region.label}`}>
        {region.nucleotides.map((item) => (
          <SequenceCheck
            key={item.id}
            item={item}
            checked={item.id === selected}
            onPick={() => onPick(region.id, item.id)}
          />
        ))}
      </div>
    </div>
  );
}

function SequenceCheck({
  item,
  checked,
  onPick,
}: {
  item: NucleotideTranslation;
  checked: boolean;
  onPick: () => void;
}) {
  const detail = [
    `Characterized on ${item.molecules} molecule${item.molecules === 1 ? '' : 's'}`,
    item.contribution,
    item.dna ?? item.basis,
  ].join('\n');
  return (
    <label className="seq-check" title={detail}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => {
          if (event.target.checked) onPick();
        }}
      />
      <span>{item.name}</span>
      {item.preferred ? <span className="pref-tag">Preferred</span> : null}
      <span className="n">{item.molecules}</span>
    </label>
  );
}
