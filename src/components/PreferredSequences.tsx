import { useEffect, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import {
  isUniversalLight,
  preferredTranslation,
  rankTone,
  type FvRegion,
  type NucleotideRegistration,
  type NucleotideTranslation,
} from '../model/sequences';
import type { Chain } from '../model/types';

const ID_KEY = 'protein-chain-workbench-v3-seq-id';
const ID_DEFAULT = 360;

function loadIdWidth(): number {
  try {
    const n = Number(localStorage.getItem(ID_KEY));
    if (n >= 180 && n <= 900) return n;
  } catch {
    /* private mode */
  }
  return ID_DEFAULT;
}

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
  const [idW, setIdW] = useState(loadIdWidth);
  useEffect(() => {
    try {
      localStorage.setItem(ID_KEY, String(idW));
    } catch {
      /* private mode or quota */
    }
  }, [idW]);
  if (!shown.length) return null;

  const applyWidth = (clientX: number, list: HTMLElement | null) => {
    if (clientX <= 0) return;
    const box = list?.getBoundingClientRect();
    const max = Math.max(220, (box?.width ?? 800) - 180);
    setIdW(Math.min(max, Math.max(180, Math.round(clientX - (box?.left ?? 0)))));
  };
  const startResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const list = event.currentTarget.parentElement;
    const prevCursor = document.body.style.cursor;
    const prevSelect = document.body.style.userSelect;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const move = (ev: PointerEvent) => applyWidth(ev.clientX, list);
    const up = () => {
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevSelect;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <section className="ratio-plan" aria-label="Preferred sequences" style={{ '--seq-id-w': `${idW}px` } as CSSProperties}>
      <h3>Preferred sequences</h3>
      <p className="sm">
        Each protein uses the id from its panel well. Drag the divider to read the sequence, then check a codon
        category or one registered string. The preferred category stays marked. A variable domain also ranks CDR1,
        CDR2, and CDR3 on their own, and a CDR choice leaves the chain translation as it is.
      </p>
      {shown.map(({ chain, regions }) => {
        const choices = regions.filter((region) => region.nucleotides.length > 1).length;
        return (
          <div className="seq-chain" key={chain.id}>
            <h4>
              {chain.name}
              {isUniversalLight(chain) ? <span className="pref-tag">Universal light chain</span> : null}
              <span className="sm">
                {regions.length} region{regions.length === 1 ? '' : 's'}
                {choices ? ` · ${choices} with a choice` : ''}
              </span>
            </h4>
            <div className="seq-list" role="table" aria-label={`Nucleotide choices for ${chain.name}`}>
              {regions.map((region) => (
                <div className="seq-domain" key={region.id}>
                  <RegionChoice region={region} picks={picks} onPick={onPick} />
                  {region.cdrs.map((cdr) => (
                    <SequenceChoice
                      key={cdr.id}
                      nested
                      pickId={cdr.id}
                      title={cdr.name}
                      detail={`residues ${cdr.start}–${cdr.end}`}
                      aminoAcid={cdr.aminoAcid}
                      nucleotides={cdr.nucleotides}
                      picks={picks}
                      onPick={onPick}
                    />
                  ))}
                </div>
              ))}
              <button
                type="button"
                className="seq-col-grip"
                draggable={true}
                aria-label="Resize protein column"
                title="Drag to read the protein. Double-click to reset."
                onDrag={(event) => applyWidth(event.clientX, event.currentTarget.parentElement)}
                onPointerDown={startResize}
                onDoubleClick={() => setIdW(ID_DEFAULT)}
              />
            </div>
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
  return (
    <SequenceChoice
      pickId={region.id}
      title={region.uid}
      detail={region.label}
      aminoAcid={region.aminoAcid}
      nucleotides={region.nucleotides}
      picks={picks}
      onPick={onPick}
    />
  );
}

function SequenceChoice({
  pickId,
  title,
  detail,
  aminoAcid,
  nucleotides,
  picks,
  onPick,
  nested = false,
}: {
  pickId: string;
  title: string;
  detail: string;
  aminoAcid: string;
  nucleotides: NucleotideTranslation[];
  picks: Record<string, string>;
  onPick: (regionId: string, translationId: string) => void;
  nested?: boolean;
}) {
  const preferred = preferredTranslation(nucleotides);
  const pick = picks[pickId] ?? '';
  return (
    <div className={`seq-row${nested ? ' seq-cdr' : ''}`} role="row">
      <div className="seq-id">
        <span className="nm">{title}</span>
        <span className="sm">{detail}</span>
        <span className="seq-aa">{aminoAcid}</span>
      </div>
      <div className="seq-options" role="group" aria-label={`Nucleotide sequence for ${title}`}>
        <div className="seq-rank-head">
          <span />
          <span>Rank</span>
          <span />
          <span>Used</span>
        </div>
        {nucleotides.map((item, index) => (
          <SequenceCheck
            key={item.id}
            item={item}
            tone={rankTone(index, nucleotides.length)}
            categoryChecked={categoryHolds(item, pick, !pick && item.id === preferred?.id)}
            pick={pick || (item.id === preferred?.id ? item.id : '')}
            onPickCategory={() => onPick(pickId, item.id)}
            onPickString={(id) => onPick(pickId, id)}
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

const RANK_LABEL = { high: 'Highest rank', mid: 'Middle rank', low: 'Lowest rank' } as const;

function SequenceCheck({
  item,
  tone,
  categoryChecked,
  pick,
  onPickCategory,
  onPickString,
}: {
  item: NucleotideTranslation;
  tone: 'high' | 'mid' | 'low';
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
        <span className={`seq-rank ${tone}`} role="img" aria-label={RANK_LABEL[tone]} title={RANK_LABEL[tone]} />
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
          <span />
        )}
        <span
          className="seq-used"
          title={`Used on ${item.molecules} registered molecule${item.molecules === 1 ? '' : 's'}`}
        >
          {item.molecules}
        </span>
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
