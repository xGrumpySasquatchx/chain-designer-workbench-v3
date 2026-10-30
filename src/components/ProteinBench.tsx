import { useState, type CSSProperties, type ReactNode } from 'react';
import {
  PROTEIN_FAMILIES,
  PROTEIN_USES,
  PROTEINS,
  familyLabel,
  proteinById,
  proteinSearchText,
  proteinUseLabel,
  type ProteinRecord,
} from '../model/proteins';
import type { ProteinDraft, ProteinFamily, ProteinUse } from '../model/types';

export function ProteinBench({
  drafts,
  activeId,
  expanded,
  wrapStyle,
  fold,
  grip,
  onFold,
  onNew,
  onOpen,
  onDelete,
  onChange,
}: {
  drafts: ProteinDraft[];
  activeId: string | null;
  expanded: boolean;
  wrapStyle: CSSProperties;
  fold: ReactNode;
  grip: ReactNode;
  onFold: () => void;
  onNew: (basisId?: string) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onChange: (draft: ProteinDraft) => void;
}) {
  const [query, setQuery] = useState('');
  const registered = proteinById(activeId ?? '');
  const draft = drafts.find((item) => item.id === activeId);
  return (
    <>
      <div className="statusbar" role="status">
        <span className="mono">{activeId ?? 'Protein'}</span>
        <span>
          {PROTEINS.length} registered · {drafts.length} draft{drafts.length === 1 ? '' : 's'}
        </span>
        <span className="stat-grow" />
        <span>Open a registered receptor or scaffold, or start a new protein</span>
      </div>
      <div className="wrap protein-wrap" style={wrapStyle}>
        <ProteinRail
          drafts={drafts}
          activeId={activeId}
          query={query}
          expanded={expanded}
          fold={fold}
          grip={grip}
          onFold={onFold}
          onQuery={setQuery}
          onNew={() => onNew()}
          onOpen={onOpen}
          onDelete={onDelete}
        />
        <main className="panel list">
          <div className="panel-h">
            <h2>{registered?.name ?? draft?.name ?? 'Protein'}</h2>
            {draft ? (
              <div className="panel-h-act">
                <button className="btn sm" type="button" onClick={() => onDelete(draft.id)}>
                  Delete draft
                </button>
              </div>
            ) : null}
          </div>
          <div className="req-body">
            {registered ? (
              <RegisteredProtein protein={registered} onNew={() => onNew(registered.id)} />
            ) : draft ? (
              <DraftProtein draft={draft} onChange={onChange} />
            ) : (
              <div className="req-empty">
                <p>Open a registered receptor or scaffold, or start a new protein.</p>
                <p className="sm">
                  A registered protein keeps its id. A new one stays a draft until you are ready to build from it.
                  Scaffolds are used for targeted drug delivery, and for receptor antagonism or ligand neutralization.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

function ProteinRail({
  drafts,
  activeId,
  query,
  expanded,
  fold,
  grip,
  onFold,
  onQuery,
  onNew,
  onOpen,
  onDelete,
}: {
  drafts: ProteinDraft[];
  activeId: string | null;
  query: string;
  expanded: boolean;
  fold: ReactNode;
  grip: ReactNode;
  onFold: () => void;
  onQuery: (query: string) => void;
  onNew: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const q = proteinSearchText(query.trim());
  const draftRows = drafts.filter((draft) => {
    if (!q) return true;
    const basis = draft.basisId ? proteinById(draft.basisId) : undefined;
    return proteinSearchText([draft.id, draft.name, draft.note, basis?.name ?? '', familyLabel(draft.family)].join(' ')).includes(
      q,
    );
  });
  return (
    <aside className={`panel rail${expanded ? '' : ' is-folded'}`} aria-label="Proteins">
      <div className="panel-h" onClick={expanded ? undefined : onFold}>
        <h2>Proteins</h2>
        <div className="panel-h-act">
          <button className="btn sm primary" type="button" onClick={onNew}>
            New
          </button>
          {fold}
        </div>
      </div>
      {expanded ? (
        <div className="rail-body">
          <div className="facet">
            <input
              className="search"
              type="search"
              placeholder="Search proteins or ids"
              aria-label="Search proteins"
              value={query}
              onChange={(event) => onQuery(event.target.value)}
            />
          </div>
          <div className="src-folder">
            <div className="src-head" style={{ cursor: 'default' }}>
              <span className="src-name">Drafts</span>
              <span className="src-n">{draftRows.length}</span>
            </div>
            {draftRows.length ? (
              draftRows.map((draft) => (
                <div key={draft.id} className={`req-line${draft.id === activeId ? ' on' : ''}`}>
                  <button type="button" className="req-row" onClick={() => onOpen(draft.id)}>
                    <span className="nm">{draft.name}</span>
                    <span className="sm">
                      {draft.id} · {familyLabel(draft.family)}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="req-del"
                    aria-label={`Delete ${draft.name}`}
                    onClick={() => onDelete(draft.id)}
                  >
                    Delete
                  </button>
                </div>
              ))
            ) : (
              <div className="src-empty">None</div>
            )}
          </div>
          {PROTEIN_FAMILIES.map((family) => {
            const rows = PROTEINS.filter((protein) => protein.family === family.id).filter((protein) => {
              if (!q) return true;
              return proteinSearchText([protein.id, protein.name, protein.origin, protein.summary].join(' ')).includes(q);
            });
            if (q && !rows.length) return null;
            return (
              <div className="src-folder" key={family.id}>
                <div className="src-head" style={{ cursor: 'default' }}>
                  <span className="src-name">{family.label}</span>
                  <span className="src-n">{rows.length}</span>
                </div>
                {rows.length ? (
                  rows.map((protein) => (
                    <button
                      key={protein.id}
                      type="button"
                      className={`req-row${protein.id === activeId ? ' on' : ''}`}
                      onClick={() => onOpen(protein.id)}
                    >
                      <span className="nm">{protein.name}</span>
                      <span className="sm">
                        {protein.id} · {protein.origin}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="src-empty">None</div>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
      {expanded ? grip : null}
    </aside>
  );
}

function RegisteredProtein({ protein, onNew }: { protein: ProteinRecord; onNew: () => void }) {
  return (
    <>
      <p className="mono">{protein.id}</p>
      <p className="sm">{familyLabel(protein.family)} · Registered</p>
      <dl className="infer-dl protein-facts">
        <div>
          <dt>Origin</dt>
          <dd>{protein.origin}</dd>
        </div>
        <div>
          <dt>What it is</dt>
          <dd>{protein.summary}</dd>
        </div>
        <div>
          <dt>Therapeutic areas</dt>
          <dd>{PROTEIN_USES.map((item) => item.label).join('. ')}.</dd>
        </div>
      </dl>
      <div className="req-actions">
        <button className="btn primary" type="button" onClick={onNew}>
          Start a new protein from this
        </button>
      </div>
    </>
  );
}

function DraftProtein({
  draft,
  onChange,
}: {
  draft: ProteinDraft;
  onChange: (draft: ProteinDraft) => void;
}) {
  const basis = draft.basisId ? proteinById(draft.basisId) : undefined;
  return (
    <>
      <p className="mono">{draft.id}</p>
      <p className="sm">Draft. This id stays with the protein when you build from it.</p>
      <div className="protein-fields">
        <label>
          Name
          <input
            className="search"
            value={draft.name}
            onChange={(event) => onChange({ ...draft, name: event.target.value })}
          />
        </label>
        <label>
          Class
          <select
            value={draft.family ?? ''}
            onChange={(event) => {
              const family = (event.target.value || null) as ProteinFamily | null;
              const basisStillFits = basis && basis.family === family;
              onChange({ ...draft, family, basisId: basisStillFits ? draft.basisId : null });
            }}
          >
            <option value="">Choose a class</option>
            {PROTEIN_FAMILIES.map((family) => (
              <option key={family.id} value={family.id}>
                {family.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Start from a registered protein
          <select
            value={draft.basisId ?? ''}
            onChange={(event) => {
              const next = proteinById(event.target.value);
              onChange({
                ...draft,
                basisId: next?.id ?? null,
                family: next?.family ?? draft.family,
              });
            }}
          >
            <option value="">None</option>
            {PROTEIN_FAMILIES.map((family) => (
              <optgroup key={family.id} label={family.label}>
                {PROTEINS.filter((protein) => protein.family === family.id).map((protein) => (
                  <option key={protein.id} value={protein.id}>
                    {protein.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label>
          Therapeutic area
          <select
            value={draft.use ?? ''}
            onChange={(event) => onChange({ ...draft, use: (event.target.value || null) as ProteinUse | null })}
          >
            <option value="">Choose a therapeutic area</option>
            {PROTEIN_USES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Note
          <textarea
            rows={3}
            value={draft.note}
            onChange={(event) => onChange({ ...draft, note: event.target.value })}
          />
        </label>
      </div>
      {basis ? (
        <p className="sm">
          Based on {basis.name} ({basis.id}). {basis.summary}
        </p>
      ) : null}
      <p className="sm">Chosen area: {proteinUseLabel(draft.use)}.</p>
    </>
  );
}
