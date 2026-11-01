import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  PROTEIN_ROLES,
  addProteinAnnotation,
  annotationLanes,
  annotationSpan,
  annotationTypeCounts,
  annotationTypeLabel,
  annotationsFromSequence,
  chosenTranslation,
  editAminoAcids,
  nextAnnotationStart,
  sequenceRows,
  setAnnotationTypeShown,
  visibleAnnotations,
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
  const [highlight, setHighlight] = useState('');
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
  const hiddenTypes = draft.hiddenAnnotationTypes ?? [];
  const drawn = visibleAnnotations(draft.annotations, hiddenTypes);
  const covering = drawn.filter((annotation) => annotation.start <= at && annotation.end >= at);
  const perLine = wrapped && trackWidth > 0 ? Math.max(8, Math.floor((trackWidth - 16) / cell)) : amino.length;
  const rows = sequenceRows(amino.length, perLine);

  return (
    <section className="gsv" aria-label="Sequence viewer">
      <div className="gsv-head">
        <h3>Sequence viewer</h3>
        <p className="sm">
          Amino acids and the reverse translation. Zoom, annotations, and editing follow the Geneious sequence view.
          The Geneious plugin viewer itself runs inside Geneious Prime, so this is the view in the workbench. Annotations
          and Tracks, to the right, turns each annotation type on or off. The map above the residues draws the types
          that are on. Linear keeps one scrolling row. Wrap fits each row to the viewer.
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
      <div className="gsv-stage">
        <div className="gsv-main">
          {showAnnotations ? (
            <AnnotationOverview
              annotations={drawn}
              length={amino.length}
              highlight={highlight}
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
                  annotations={drawn}
                  highlight={highlight}
                  onCursor={setCursor}
                />
              ))}
            </div>
          </div>
        </div>
        <AnnotationTypes
          annotations={draft.annotations}
          hiddenTypes={hiddenTypes}
          showAnnotations={showAnnotations}
          highlight={highlight}
          onHighlight={setHighlight}
          onShowAnnotations={setShowAnnotations}
          onToggleType={(type, shown) =>
            onChange({ ...draft, hiddenAnnotationTypes: setAnnotationTypeShown(hiddenTypes, type, shown) })
          }
          onJump={(type, direction) => {
            const start = nextAnnotationStart(draft.annotations, type, at, direction);
            if (start != null) focusResidue(trackRef.current, start, setCursor);
          }}
        />
      </div>
      <AnnotationEditor
          annotations={draft.annotations}
          hiddenTypes={hiddenTypes}
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
  highlight,
  onCursor,
}: {
  annotations: ProteinAnnotation[];
  length: number;
  highlight: string;
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
              className={`gsv-ann-bar ${annColor(item.annotation.type)} ${highlightClass(item.annotation, highlight)}`}
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

function highlightClass(annotation: ProteinAnnotation, highlight: string): string {
  const query = highlight.trim().toLowerCase();
  if (!query) return '';
  const haystack = `${annotation.type} ${annotation.name} ${annotation.note}`.toLowerCase();
  return haystack.includes(query) ? 'is-hit' : 'is-dim';
}

function AnnotationTypes({
  annotations,
  hiddenTypes,
  showAnnotations,
  highlight,
  onHighlight,
  onShowAnnotations,
  onToggleType,
  onJump,
}: {
  annotations: ProteinAnnotation[];
  hiddenTypes: string[];
  showAnnotations: boolean;
  highlight: string;
  onHighlight: (value: string) => void;
  onShowAnnotations: (shown: boolean) => void;
  onToggleType: (type: string, shown: boolean) => void;
  onJump: (type: string, direction: 1 | -1) => void;
}) {
  const hidden = new Set(hiddenTypes);
  const types = annotationTypeCounts(annotations);
  return (
    <aside className="gsv-types" aria-label="Annotations and Tracks">
      <h4>Annotations and Tracks</h4>
      <label className="seq-check">
        <input
          type="checkbox"
          checked={showAnnotations}
          onChange={(event) => onShowAnnotations(event.target.checked)}
        />
        <span>Show annotations</span>
      </label>
      <input
        className="search"
        value={highlight}
        placeholder="Highlight name or note"
        aria-label="Highlight annotations"
        onChange={(event) => onHighlight(event.target.value)}
      />
      <p className="sm">Uncheck a type to hide it. The annotations stay on the sequence.</p>
      <ul className="gsv-type-list">
        {types.map((item) => (
          <li key={item.type} className="gsv-type-row">
            <label className="seq-check">
              <input
                type="checkbox"
                checked={!hidden.has(item.type)}
                aria-label={`Show ${annotationTypeLabel(item.type)}`}
                onChange={(event) => onToggleType(item.type, event.target.checked)}
              />
              <span className={`gsv-type-swatch ${annColor(item.type)}`} aria-hidden="true" />
              <span className="gsv-type-name">
                <span className="nm">{annotationTypeLabel(item.type)}</span>
                <span className="n">{item.count}</span>
              </span>
            </label>
            <button type="button" className="btn sm" aria-label={`Previous ${item.type}`} onClick={() => onJump(item.type, -1)}>
              Prev
            </button>
            <button type="button" className="btn sm" aria-label={`Next ${item.type}`} onClick={() => onJump(item.type, 1)}>
              Next
            </button>
          </li>
        ))}
      </ul>
    </aside>
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
  highlight,
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
  highlight: string;
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
              className={`gsv-ann-bar ${annColor(item.annotation.type)} ${highlightClass(item.annotation, highlight)}`}
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
  hiddenTypes,
  length,
  draftAnn,
  onDraftAnn,
  onAdd,
  onDelete,
  onToggle,
}: {
  annotations: ProteinAnnotation[];
  hiddenTypes: string[];
  length: number;
  draftAnn: { type: string; name: string; start: string; end: string; note: string };
  onDraftAnn: (next: { type: string; name: string; start: string; end: string; note: string }) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const ordered = [...annotations].sort((a, b) => a.start - b.start || a.end - b.end || a.name.localeCompare(b.name));
  const shown = visibleAnnotations(annotations, hiddenTypes).length;
  const hidden = new Set(hiddenTypes);
  return (
    <div className="gsv-annotations">
      <h4>Annotations</h4>
      <p className="sm">
        {shown} of {ordered.length} drawn on the sequence. Uncheck one annotation to hide that one. A type that is off
        hides every annotation of that type.
      </p>
      <ul className="protein-hits gsv-ann-list">
        {ordered.map((annotation) => (
          <li key={annotation.id} className={`gsv-ann-line${hidden.has(annotation.type) ? ' is-type-off' : ''}`}>
            <label className="seq-check">
              <input
                type="checkbox"
                checked={annotation.visible !== false}
                aria-label={`Show ${annotation.name}`}
                onChange={() => onToggle(annotation.id)}
              />
              <span>
                <span className="nm">
                  {annotation.name === annotation.type
                    ? annotationTypeLabel(annotation.type)
                    : `${annotationTypeLabel(annotation.type)} · ${annotation.name}`}
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
            {[...new Set([...annotations.map((annotation) => annotation.type), ...ANN_TYPES])]
              .sort((a, b) => annotationTypeLabel(a).localeCompare(annotationTypeLabel(b)))
              .map((type) => (
                <option key={type} value={type}>
                  {annotationTypeLabel(type)}
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
