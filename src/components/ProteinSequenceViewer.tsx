import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  PROTEIN_ROLES,
  addProteinAnnotation,
  annotationLanes,
  annotationSpan,
  annotationsFromSequence,
  chosenTranslation,
  editAminoAcids,
  sequenceRows,
} from '../model/proteins';
import { characterizedTranslations, preferredTranslation } from '../model/sequences';
import type { NucleotideTranslation } from '../model/sequences';
import type { ProteinAnnotation, ProteinDraft, ProteinRole } from '../model/types';

const ZOOMS = [50, 100, 200, 400];
const THREE: Record<string, string> = {
  A: 'Ala', C: 'Cys', D: 'Asp', E: 'Glu', F: 'Phe', G: 'Gly', H: 'His', I: 'Ile', K: 'Lys', L: 'Leu', M: 'Met',
  N: 'Asn', P: 'Pro', Q: 'Gln', R: 'Arg', S: 'Ser', T: 'Thr', V: 'Val', W: 'Trp', Y: 'Tyr',
};
const ANN_TYPES = ['Chain', 'CDS', 'Domain', 'Signal'];

function residueClass(residue: string): string {
  if ('AVLIMFWP'.includes(residue)) return 'gsv-hydro';
  if ('STYNQC'.includes(residue)) return 'gsv-polar';
  if ('DE'.includes(residue)) return 'gsv-neg';
  if ('KRH'.includes(residue)) return 'gsv-pos';
  return 'gsv-other';
}

export function ProteinSequenceViewer({
  draft,
  onChange,
}: {
  draft: ProteinDraft;
  onChange: (draft: ProteinDraft) => void;
}) {
  const sequence = draft.sequence;
  const [zoom, setZoom] = useState(100);
  const [editing, setEditing] = useState(false);
  const [showAmino, setShowAmino] = useState(true);
  const [showDna, setShowDna] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [wrapped, setWrapped] = useState(false);
  const [trackWidth, setTrackWidth] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState(1);
  const [draftAnn, setDraftAnn] = useState({ type: 'Domain', name: '', start: '1', end: '1', note: '' });
  useEffect(() => {
    if (sequence && draft.annotations.length === 0) {
      onChange({ ...draft, annotations: annotationsFromSequence(sequence) });
    }
  }, [draft, onChange, sequence]);
  useEffect(() => {
    const node = trackRef.current;
    if (!node) return;
    const update = () => setTrackWidth(node.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [sequence?.accession, sequence?.sequence]);
  if (!sequence) return null;

  const amino = sequence.sequence;
  const translations = characterizedTranslations(draft.id, amino);
  const chosen = chosenTranslation(draft.id, amino, draft.translationId);
  const dna = chosen?.dna ?? '';
  const zoomIndex = Math.max(0, ZOOMS.indexOf(zoom));
  const letters = zoom >= 200 && !editing;
  const cell = letters ? Math.round((zoom / 100) * 28) : Math.round((zoom / 100) * 18);
  const at = Math.min(amino.length, Math.max(1, cursor));
  const codon = dna.slice((at - 1) * 3, at * 3);
  const covering = draft.annotations.filter(
    (annotation) => annotation.visible !== false && annotation.start <= at && annotation.end >= at,
  );
  const perLine = wrapped && trackWidth > 0 ? Math.max(8, Math.floor((trackWidth - 16) / cell)) : amino.length;
  const rows = sequenceRows(amino.length, perLine);

  return (
    <section className="gsv" aria-label="Sequence viewer">
      <div className="gsv-head">
        <h3>Sequence viewer</h3>
        <p className="sm">
          Amino acids and the reverse translation. Zoom, annotations, and editing follow the Geneious sequence view.
          The Geneious plugin viewer itself runs inside Geneious Prime, so this is the view in the workbench. The map
          above the residues draws every annotation across the whole sequence. Linear keeps one scrolling row. Wrap
          fits each row to the viewer. Uncheck an annotation to hide it.
        </p>
      </div>
      <div className="gsv-toolbar">
        <button type="button" className="btn sm" onClick={() => setZoom(ZOOMS[Math.max(0, zoomIndex - 1)])} disabled={zoomIndex <= 0}>
          Zoom out
        </button>
        <span className="mono">{zoom}%</span>
        <button
          type="button"
          className="btn sm"
          onClick={() => setZoom(ZOOMS[Math.min(ZOOMS.length - 1, zoomIndex + 1)])}
          disabled={zoomIndex >= ZOOMS.length - 1}
        >
          Zoom in
        </button>
        <button type="button" className="btn sm" aria-pressed={editing} onClick={() => setEditing((value) => !value)}>
          {editing ? 'Done editing' : 'Edit sequence'}
        </button>
        <button type="button" className="btn sm" aria-pressed={showAmino} onClick={() => setShowAmino((value) => !value)}>
          Amino acids
        </button>
        <button type="button" className="btn sm" aria-pressed={showDna} onClick={() => setShowDna((value) => !value)}>
          Reverse translation
        </button>
        <button type="button" className="btn sm" aria-pressed={showAnnotations} onClick={() => setShowAnnotations((value) => !value)}>
          Annotations
        </button>
        <button type="button" className="btn sm" aria-pressed={!wrapped} onClick={() => setWrapped(false)}>
          Linear
        </button>
        <button type="button" className="btn sm" aria-pressed={wrapped} onClick={() => setWrapped(true)}>
          Wrap
        </button>
      </div>
      <p className="sm gsv-inspect">
        {at} {THREE[amino[at - 1]] ?? amino[at - 1]} {codon}
        {covering.length ? ` · ${covering.map((annotation) => annotation.name).join(', ')}` : ''}
        {chosen ? ` · ${chosen.category.name}${chosen.registration ? ` · string ${chosen.registration.n}` : ''}` : ''}
      </p>
      {editing ? (
        <label className="gsv-edit">
          Amino-acid sequence
          <textarea
            rows={4}
            value={amino}
            aria-label="Edit amino-acid sequence"
            onChange={(event) => onChange(editAminoAcids(draft, event.target.value))}
          />
        </label>
      ) : null}
      {showAnnotations ? (
        <AnnotationOverview
          annotations={draft.annotations}
          length={amino.length}
          onCursor={(position) => focusResidue(trackRef.current, position, setCursor)}
        />
      ) : null}
      <div
        ref={trackRef}
        className={`gsv-track${wrapped ? ' wrap' : ' linear'}`}
        style={{ '--gsv-cell': `${cell}px` } as CSSProperties}
      >
        <div className="gsv-lines">
          {rows.map((row) => (
            <SequenceLine
              key={row.start}
              row={row}
              amino={amino}
              dna={dna}
              letters={letters}
              cursor={at}
              wrapped={wrapped}
              showAmino={showAmino}
              showDna={showDna}
              showAnnotations={showAnnotations}
              annotations={draft.annotations}
              onCursor={setCursor}
            />
          ))}
        </div>
      </div>
      <AnnotationEditor
          annotations={draft.annotations}
          length={amino.length}
          draftAnn={draftAnn}
          onDraftAnn={setDraftAnn}
          onAdd={() => {
            const start = Number(draftAnn.start);
            const end = Number(draftAnn.end);
            if (!draftAnn.name.trim() || !Number.isFinite(start) || !Number.isFinite(end)) return;
            onChange(
              addProteinAnnotation(draft, {
                type: draftAnn.type,
                name: draftAnn.name.trim(),
                start,
                end,
                note: draftAnn.note.trim(),
              }),
            );
            setDraftAnn({ type: 'Domain', name: '', start: '1', end: String(amino.length), note: '' });
          }}
          onDelete={(id) => onChange({ ...draft, annotations: draft.annotations.filter((item) => item.id !== id) })}
          onToggle={(id) =>
            onChange({
              ...draft,
              annotations: draft.annotations.map((item) =>
                item.id === id ? { ...item, visible: item.visible === false } : item,
              ),
            })
          }
        />
      <TranslationChoice
        draft={draft}
        translations={translations}
        onPick={(id) => onChange({ ...draft, translationId: id })}
      />
      <div className="protein-fields gsv-clone">
        <label>
          Cloning role
          <select
            value={draft.role ?? ''}
            onChange={(event) => onChange({ ...draft, role: (event.target.value || null) as ProteinRole | null })}
          >
            <option value="">Choose how it is cloned</option>
            {PROTEIN_ROLES.map((role) => (
              <option key={role.id} value={role.id}>
                {role.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Parts in the mix
          <input
            className="search"
            inputMode="decimal"
            aria-label="Parts in the transfection mix"
            value={String(draft.parts)}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (event.target.value.trim() && Number.isFinite(next) && next >= 0) onChange({ ...draft, parts: next });
            }}
          />
        </label>
        <p className="sm">
          {PROTEIN_ROLES.find((role) => role.id === draft.role)?.note ??
            'A stoichiometry, such as a TCR, keeps each chain’s parts. A scaffold or an antigen is usually one part.'}
        </p>
        <div>
          <button
            className="btn sm primary"
            type="button"
            onClick={() => onChange({ ...draft, onPanel: !draft.onPanel })}
          >
            {draft.onPanel ? 'Remove from cloning panel' : 'Add to cloning panel'}
          </button>
        </div>
      </div>
    </section>
  );
}

function TranslationChoice({
  draft,
  translations,
  onPick,
}: {
  draft: ProteinDraft;
  translations: NucleotideTranslation[];
  onPick: (id: string) => void;
}) {
  const preferred = preferredTranslation(translations);
  const pick = draft.translationId ?? '';
  return (
    <div className="gsv-translations">
      <h4>Preferred translation</h4>
      <p className="sm">
        A registered protein keeps the codon categories already characterized for it. Check a category, or open it and
        check one string. The preferred category stays marked.
      </p>
      <div className="seq-options" role="group" aria-label={`Nucleotide sequence for ${draft.id}`}>
        {translations.map((item) => {
          const categoryChecked = !pick ? item.id === preferred?.id : pick === item.id || (item.registrations ?? []).some((registration) => registration.id === pick);
          const open = categoryChecked;
          return (
            <div key={item.id} className="gsv-category">
              <label className="seq-check">
                <input type="checkbox" checked={categoryChecked} onChange={() => onPick(item.id)} />
                <span>
                  <span className="nm">{item.name}</span>
                  {item.preferred ? <span className="pref-tag">Preferred</span> : null}
                  <span className="sm">
                    {item.registrations?.length ?? 0} registered · {(item.registrations?.[0]?.dna ?? item.dna ?? '').slice(0, 24)}
                  </span>
                </span>
              </label>
              {open
                ? (item.registrations ?? []).map((registration) => (
                    <label key={registration.id} className="seq-check gsv-string">
                      <input
                        type="checkbox"
                        checked={
                          pick === registration.id ||
                          ((pick === item.id || (!pick && item.preferred)) && registration.n === 1)
                        }
                        onChange={() => onPick(registration.id)}
                      />
                      <span>
                        <span className="nm">String {registration.n}</span>
                        <span className="sm">{registration.note}</span>
                        <span className="seq-aa">
                          {registration.dna.slice(0, 36)}
                          {registration.dna.length > 36 ? '…' : ''}
                        </span>
                      </span>
                    </label>
                  ))
                : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function focusResidue(track: HTMLDivElement | null, position: number, onCursor: (position: number) => void) {
  onCursor(position);
  const node = track?.querySelector(`[data-aa="${position}"]`);
  if (!track || !(node instanceof HTMLElement)) return;
  const trackBox = track.getBoundingClientRect();
  const box = node.getBoundingClientRect();
  track.scrollLeft += box.left - trackBox.left - track.clientWidth / 2 + box.width / 2;
}

function AnnotationOverview({
  annotations,
  length,
  onCursor,
}: {
  annotations: ProteinAnnotation[];
  length: number;
  onCursor: (position: number) => void;
}) {
  const lanes = annotationLanes(annotations);
  const laneCount = lanes.reduce((max, item) => Math.max(max, item.lane + 1), 0);
  if (!laneCount) return null;
  return (
    <div className="gsv-overview" aria-label="All annotations">
      <p className="sm">{lanes.length} annotations across the whole sequence</p>
      <div className="gsv-ann gsv-overview-map" style={{ height: laneCount * 18 }}>
        {lanes.map((item) => {
          const span = annotationSpan(item.start, item.end, length);
          return (
            <button
              key={item.annotation.id}
              type="button"
              className={`gsv-ann-bar ${annColor(item.annotation.type)}`}
              style={{
                left: `${span.left * 100}%`,
                width: `max(${span.width * 100}%, 6px)`,
                top: item.lane * 18 + 2,
              }}
              title={`${item.annotation.type} · ${item.annotation.name} · ${item.annotation.start}–${item.annotation.end}${item.annotation.note ? ` · ${item.annotation.note}` : ''}`}
              onClick={() => onCursor(item.annotation.start)}
            >
              {item.annotation.name}
            </button>
          );
        })}
      </div>
      <div className="gsv-overview-scale" aria-hidden="true">
        <span>1</span>
        <span>{length}</span>
      </div>
    </div>
  );
}

function annColor(type: string): string {
  let hash = 0;
  for (let index = 0; index < type.length; index += 1) hash = (hash + type.charCodeAt(index)) % 4;
  return `gsv-ann-${hash}`;
}

function SequenceLine({
  row,
  amino,
  dna,
  letters,
  cursor,
  wrapped,
  showAmino,
  showDna,
  showAnnotations,
  annotations,
  onCursor,
}: {
  row: { start: number; end: number };
  amino: string;
  dna: string;
  letters: boolean;
  cursor: number;
  wrapped: boolean;
  showAmino: boolean;
  showDna: boolean;
  showAnnotations: boolean;
  annotations: ProteinAnnotation[];
  onCursor: (position: number) => void;
}) {
  const residues: number[] = [];
  for (let position = row.start; position <= row.end; position += 1) residues.push(position);
  const lanes = showAnnotations ? annotationLanes(annotations, row) : [];
  const laneCount = lanes.reduce((max, item) => Math.max(max, item.lane + 1), 0);
  const span = `calc(${residues.length} * var(--gsv-cell))`;
  return (
    <div className="gsv-line">
      {wrapped ? <div className="gsv-line-no">{row.start}</div> : null}
      <div className="gsv-row gsv-ruler" aria-hidden="true">
        {residues.map((position) => (
          <span key={position} className="gsv-res">
            {position % 10 === 0 ? position : ''}
          </span>
        ))}
      </div>
      {laneCount > 0 ? (
        <div className="gsv-ann" style={{ height: laneCount * 18, width: span }}>
          {lanes.map((item) => (
            <button
              key={item.annotation.id}
              type="button"
              className={`gsv-ann-bar ${annColor(item.annotation.type)}`}
              style={{
                left: `calc(${item.start - row.start} * var(--gsv-cell))`,
                width: `calc(${item.end - item.start + 1} * var(--gsv-cell))`,
                top: item.lane * 18 + 2,
              }}
              title={`${item.annotation.type} · ${item.annotation.name} · ${item.annotation.start}–${item.annotation.end}${item.annotation.note ? ` · ${item.annotation.note}` : ''}`}
              onClick={() => onCursor(item.annotation.start)}
            >
              {item.annotation.name}
            </button>
          ))}
        </div>
      ) : null}
      {showAmino ? (
        <div className="gsv-row" role="list" aria-label="Amino acids">
          {residues.map((position) => {
            const residue = amino[position - 1] ?? '';
            return (
              <button
                key={position}
                type="button"
                role="listitem"
                data-aa={position}
                className={`gsv-res ${residueClass(residue)}${position === cursor ? ' on' : ''}`}
                aria-pressed={position === cursor}
                onClick={() => onCursor(position)}
              >
                {letters ? THREE[residue] ?? residue : residue}
              </button>
            );
          })}
        </div>
      ) : null}
      {showDna ? (
        <div className="gsv-row gsv-dna" aria-label="Reverse translation">
          {residues.map((position) => (
            <span key={position} className={`gsv-res${position === cursor ? ' on' : ''}`}>
              {dna.slice((position - 1) * 3, position * 3)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AnnotationEditor({
  annotations,
  length,
  draftAnn,
  onDraftAnn,
  onAdd,
  onDelete,
  onToggle,
}: {
  annotations: ProteinAnnotation[];
  length: number;
  draftAnn: { type: string; name: string; start: string; end: string; note: string };
  onDraftAnn: (next: { type: string; name: string; start: string; end: string; note: string }) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const ordered = [...annotations].sort((a, b) => a.start - b.start || a.end - b.end || a.name.localeCompare(b.name));
  const shown = ordered.filter((annotation) => annotation.visible !== false).length;
  return (
    <div className="gsv-annotations">
      <h4>Annotations</h4>
      <p className="sm">
        {shown} of {ordered.length} drawn on the sequence. Uncheck one to hide it.
      </p>
      <ul className="protein-hits gsv-ann-list">
        {ordered.map((annotation) => (
          <li key={annotation.id} className="gsv-ann-line">
            <label className="seq-check">
              <input
                type="checkbox"
                checked={annotation.visible !== false}
                aria-label={`Show ${annotation.name}`}
                onChange={() => onToggle(annotation.id)}
              />
              <span>
                <span className="nm">
                  {annotation.name === annotation.type ? annotation.type : `${annotation.type} · ${annotation.name}`}
                </span>
                <span className="sm">
                  {annotation.start}–{annotation.end}
                  {annotation.note ? ` · ${annotation.note}` : ''}
                </span>
              </span>
            </label>
            <button type="button" className="btn sm" onClick={() => onDelete(annotation.id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="protein-fields">
        <label>
          Type
          <select value={draftAnn.type} onChange={(event) => onDraftAnn({ ...draftAnn, type: event.target.value })}>
            {ANN_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label>
          Name
          <input className="search" value={draftAnn.name} onChange={(event) => onDraftAnn({ ...draftAnn, name: event.target.value })} />
        </label>
        <label>
          Start
          <input
            className="search"
            inputMode="numeric"
            value={draftAnn.start}
            onChange={(event) => onDraftAnn({ ...draftAnn, start: event.target.value })}
          />
        </label>
        <label>
          End
          <input
            className="search"
            inputMode="numeric"
            aria-label="Annotation end"
            placeholder={String(length)}
            value={draftAnn.end}
            onChange={(event) => onDraftAnn({ ...draftAnn, end: event.target.value })}
          />
        </label>
        <div>
          <button className="btn sm" type="button" onClick={onAdd}>
            Add annotation
          </button>
        </div>
      </div>
    </div>
  );
}
