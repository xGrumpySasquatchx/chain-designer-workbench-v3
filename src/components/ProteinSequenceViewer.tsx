import { useEffect, useState, type CSSProperties } from 'react';
import {
  PROTEIN_ROLES,
  addProteinAnnotation,
  chainAnnotation,
  chosenTranslation,
  editAminoAcids,
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
  const [cursor, setCursor] = useState(1);
  const [draftAnn, setDraftAnn] = useState({ type: 'Domain', name: '', start: '1', end: '1', note: '' });
  useEffect(() => {
    if (sequence && draft.annotations.length === 0) {
      onChange({ ...draft, annotations: [chainAnnotation(sequence)] });
    }
  }, [draft, onChange, sequence]);
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
  const covering = draft.annotations.filter((annotation) => annotation.start <= at && annotation.end >= at);

  return (
    <section className="gsv" aria-label="Sequence viewer">
      <div className="gsv-head">
        <h3>Sequence viewer</h3>
        <p className="sm">
          Amino acids and the reverse translation. Zoom, annotations, and editing follow the Geneious sequence view.
          The Geneious plugin viewer itself runs inside Geneious Prime, so this is the view in the workbench.
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
      <div className="gsv-track" style={{ '--gsv-cell': `${cell}px` } as CSSProperties}>
        <div className="gsv-row gsv-ruler" aria-hidden="true">
          {[...amino].map((_, index) => (
            <span key={index} className="gsv-res">
              {(index + 1) % 10 === 0 ? index + 1 : ''}
            </span>
          ))}
        </div>
        {showAnnotations ? (
          <div className="gsv-ann" style={{ width: amino.length * cell }}>
            {draft.annotations.map((annotation, index) => (
              <button
                key={annotation.id}
                type="button"
                className={`gsv-ann-bar gsv-ann-${index % 4}`}
                style={{
                  left: (annotation.start - 1) * cell,
                  width: (annotation.end - annotation.start + 1) * cell,
                  top: 4 + (index % 3) * 16,
                }}
                title={annotation.note || annotation.name}
                onClick={() => setCursor(annotation.start)}
              >
                {annotation.name}
              </button>
            ))}
          </div>
        ) : null}
        {showAmino ? (
          <div className="gsv-row" role="list" aria-label="Amino acids">
            {[...amino].map((residue, index) => (
              <button
                key={index}
                type="button"
                role="listitem"
                className={`gsv-res ${residueClass(residue)}${index + 1 === at ? ' on' : ''}`}
                aria-pressed={index + 1 === at}
                onClick={() => setCursor(index + 1)}
              >
                {letters ? THREE[residue] ?? residue : residue}
              </button>
            ))}
          </div>
        ) : null}
        {showDna ? (
          <div className="gsv-row gsv-dna" aria-label="Reverse translation">
            {[...amino].map((_, index) => (
              <span key={index} className={`gsv-res${index + 1 === at ? ' on' : ''}`}>
                {dna.slice(index * 3, index * 3 + 3)}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <TranslationChoice
        draft={draft}
        translations={translations}
        onPick={(id) => onChange({ ...draft, translationId: id })}
      />
      {showAnnotations ? (
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
        />
      ) : null}
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

function AnnotationEditor({
  annotations,
  length,
  draftAnn,
  onDraftAnn,
  onAdd,
  onDelete,
}: {
  annotations: ProteinAnnotation[];
  length: number;
  draftAnn: { type: string; name: string; start: string; end: string; note: string };
  onDraftAnn: (next: { type: string; name: string; start: string; end: string; note: string }) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="gsv-annotations">
      <h4>Annotations</h4>
      <ul className="protein-hits">
        {annotations.map((annotation) => (
          <li key={annotation.id} className="gsv-ann-line">
            <span>
              <span className="nm">
                {annotation.type} · {annotation.name}
              </span>
              <span className="sm">
                {annotation.start}–{annotation.end}
                {annotation.note ? ` · ${annotation.note}` : ''}
              </span>
            </span>
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
