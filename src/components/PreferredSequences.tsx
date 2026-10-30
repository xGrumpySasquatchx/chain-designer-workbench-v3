import { useState } from 'react';
import {
  isUniversalLight,
  preferredTranslation,
  type FvRegion,
  type NucleotideRegistration,
  type NucleotideTranslation,
} from '../model/sequences';
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
        Check a codon category, or open its count and check one registered string. The preferred category stays
        marked.
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
  const pick = picks[region.id] ?? '';
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
            categoryChecked={categoryHolds(item, pick, !pick && item.id === preferred?.id)}
            pick={pick || (item.id === preferred?.id ? item.id : '')}
            onPickCategory={() => onPick(region.id, item.id)}
            onPickString={(id) => onPick(region.id, id)}
          />
        ))}
      </div>
    </div>
  );
}

function categoryHolds(item: NucleotideTranslation, pick: string, fallback: boolean): boolean {
  if (!pick) return fallback;
  if (pick === item.id) return true;
  return (item.registrations ?? []).some((registration) => registration.id === pick);
}

function SequenceCheck({
  item,
  categoryChecked,
  pick,
  onPickCategory,
  onPickString,
}: {
  item: NucleotideTranslation;
  categoryChecked: boolean;
  pick: string;
  onPickCategory: () => void;
  onPickString: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const registrations = item.registrations ?? [];
  const chosen =
    registrations.find((registration) => registration.id === pick) ??
    (categoryChecked ? registrations[0] : undefined);
  const shown = chosen ?? registrations[0];
  return (
    <div className="seq-cat">
      <div className="seq-cat-top">
        <label className="seq-check" title={item.contribution}>
          <input
            type="checkbox"
            checked={categoryChecked}
            onChange={(event) => {
              if (event.target.checked) onPickCategory();
            }}
          />
          <span>{item.name}</span>
          {item.preferred ? <span className="pref-tag">Preferred</span> : null}
        </label>
        {registrations.length ? (
          <button
            type="button"
            className="seq-count"
            aria-expanded={open}
            aria-label={`${registrations.length} registered string${registrations.length === 1 ? '' : 's'} in ${item.name}`}
            onClick={() => setOpen((value) => !value)}
          >
            {registrations.length}
          </button>
        ) : (
          <span className="n">{item.molecules}</span>
        )}
      </div>
      {shown ? (
        <span className="seq-dna" title={shown.dna}>
          {shown.dna}
        </span>
      ) : null}
      {open && registrations.length ? (
        <ul className="seq-regs">
          {registrations.map((registration) => (
            <RegistrationRow
              key={registration.id}
              registration={registration}
              checked={registrationChecked(registration, pick, item.id, categoryChecked)}
              onPick={() => onPickString(registration.id)}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function registrationChecked(
  registration: NucleotideRegistration,
  pick: string,
  categoryId: string,
  categoryChecked: boolean,
): boolean {
  if (pick === registration.id) return true;
  if (!categoryChecked) return false;
  return (pick === categoryId || pick === '') && registration.n === 1;
}

function RegistrationRow({
  registration,
  checked,
  onPick,
}: {
  registration: NucleotideRegistration;
  checked: boolean;
  onPick: () => void;
}) {
  return (
    <li>
      <label className="seq-check" title={registration.dna}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => {
            if (event.target.checked) onPick();
          }}
        />
        <span className="n">{registration.n}</span>
        <span className="seq-dna">{registration.dna}</span>
        <span className="sm">{registration.note}</span>
      </label>
    </li>
  );
}
