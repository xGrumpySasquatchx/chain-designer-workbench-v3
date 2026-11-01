import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import {
  CODON_METHODS,
  HOSTS,
  SCENARIOS,
  TARGET_CLASSES,
  codonTableName,
  hostById,
  withHost,
} from '../model/expression';
import {
  PROTEIN_FAMILIES,
  PROTEIN_ROLES,
  PROTEIN_SCHEMES,
  PROTEIN_USES,
  PROTEINS,
  aminoAcidSequence,
  applyProteinHit,
  cloningPanel,
  familyLabel,
  proteinById,
  proteinRoleLabel,
  proteinSearchText,
  proteinUseLabel,
  searchInternalProteins,
  searchUniProt,
  chosenTranslation,
  type ProteinLookupHit,
  type ProteinRecord,
  type ProteinSearchBy,
} from '../model/proteins';
import type {
  ExpressionPlan,
  HostId,
  ProteinDraft,
  ProteinFamily,
  ProteinScheme,
  ProteinSequenceRecord,
  ProteinUse,
} from '../model/types';
import { ProteinSequenceViewer } from './ProteinSequenceViewer';

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
  expression,
  scheme,
  onExpression,
  onScheme,
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
  expression: ExpressionPlan;
  scheme: ProteinScheme;
  onExpression: (plan: ExpressionPlan) => void;
  onScheme: (scheme: ProteinScheme) => void;
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
              <DraftProtein draft={draft} drafts={drafts} onChange={onChange} />
            ) : (
              <div className="req-empty">
                <p>Open a registered receptor or scaffold, or start a new protein.</p>
                <p className="sm">
                  A registered protein keeps its id. A new one stays a draft until you are ready to build from it.
                  Scaffolds are used for targeted drug delivery, and for receptor antagonism or ligand neutralization.
                </p>
              </div>
            )}
            <ProteinCloning
              drafts={drafts}
              expression={expression}
              scheme={scheme}
              onOpen={onOpen}
              onChange={onChange}
              onExpression={onExpression}
              onScheme={onScheme}
            />
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
    const sequence = draft.sequence;
    return proteinSearchText(
      [
        draft.id,
        draft.name,
        draft.note,
        basis?.name ?? '',
        familyLabel(draft.family),
        sequence?.accession ?? '',
        sequence?.entryName ?? '',
        sequence?.proteinName ?? '',
        sequence?.gene ?? '',
        sequence?.organism ?? '',
        sequence?.sequence ?? '',
      ].join(' '),
    ).includes(q);
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
                      {draft.id}
                      {draft.sequence?.accession ? ` · ${draft.sequence.accession}` : ` · ${familyLabel(draft.family)}`}
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
  drafts,
  onChange,
}: {
  draft: ProteinDraft;
  drafts: ProteinDraft[];
  onChange: (draft: ProteinDraft) => void;
}) {
  const basis = draft.basisId ? proteinById(draft.basisId) : undefined;
  return (
    <>
      <p className="mono">{draft.id}</p>
      <p className="sm">Draft. This id stays with the protein when you build from it.</p>
      <ProteinLookup draft={draft} drafts={drafts} onChange={onChange} />
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
      {draft.sequence ? <BroughtSequence sequence={draft.sequence} /> : null}
      {draft.sequence ? <ProteinSequenceViewer draft={draft} onChange={onChange} /> : null}
    </>
  );
}

function ProteinCloning({
  drafts,
  expression,
  scheme,
  onOpen,
  onChange,
  onExpression,
  onScheme,
}: {
  drafts: ProteinDraft[];
  expression: ExpressionPlan;
  scheme: ProteinScheme;
  onOpen: (id: string) => void;
  onChange: (draft: ProteinDraft) => void;
  onExpression: (plan: ExpressionPlan) => void;
  onScheme: (scheme: ProteinScheme) => void;
}) {
  const panel = cloningPanel(drafts);
  if (!panel.members.length) return null;
  const host = expression.host ? hostById(expression.host) : null;
  const schemeNote = PROTEIN_SCHEMES.find((item) => item.id === scheme)?.note ?? '';
  return (
    <section className="gsv-panel" aria-label="Cloning panel">
      <h3>Cloning panel</h3>
      <p className="sm">
        {panel.members.length} protein{panel.members.length === 1 ? '' : 's'} · {panel.ratio || '1'}. {schemeNote}
      </p>
      <div className="protein-lookup-modes">
        {PROTEIN_SCHEMES.map((item) => (
          <button key={item.id} type="button" className="btn sm" aria-pressed={scheme === item.id} onClick={() => onScheme(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      <ul className="protein-hits">
        {panel.members.map((draft) => {
          const chosen = draft.sequence ? chosenTranslation(draft.id, draft.sequence.sequence, draft.translationId) : null;
          return (
            <li key={draft.id} className="gsv-ann-line">
              <button type="button" className="req-row" onClick={() => onOpen(draft.id)}>
                <span className="nm">{draft.name}</span>
                <span className="sm">
                  {draft.id}
                  {draft.sequence?.accession ? ` · ${draft.sequence.accession}` : ''} · {proteinRoleLabel(draft.role)} ·{' '}
                  {draft.parts} part{draft.parts === 1 ? '' : 's'}
                  {chosen ? ` · ${chosen.category.name}${chosen.registration ? ` · string ${chosen.registration.n}` : ''}` : ''}
                </span>
              </button>
              <label className="protein-reviewed">
                Parts
                <input
                  className="search"
                  inputMode="decimal"
                  aria-label={`Parts for ${draft.name}`}
                  value={String(draft.parts)}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (event.target.value.trim() && Number.isFinite(next) && next >= 0) onChange({ ...draft, parts: next });
                  }}
                />
              </label>
            </li>
          );
        })}
      </ul>
      <div className="protein-fields">
        <label>
          Target class
          <select
            value={expression.targetClass ?? ''}
            onChange={(event) =>
              onExpression({ ...expression, targetClass: (event.target.value || null) as ExpressionPlan['targetClass'] })
            }
          >
            <option value="">Choose a target class</option>
            {TARGET_CLASSES.map((target) => (
              <option key={target.id} value={target.id}>
                {target.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Expression system
          <select
            value={expression.host ?? ''}
            onChange={(event) => onExpression(event.target.value ? withHost(expression, event.target.value as HostId) : { ...expression, host: null, codonTable: null })}
          >
            <option value="">Choose a host</option>
            {HOSTS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        {host ? (
          <label>
            Codon table
            <select
              value={expression.codonTable ?? host.tables[0].id}
              onChange={(event) => onExpression({ ...expression, codonTable: event.target.value })}
            >
              {host.tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label>
          Codon strategy
          <select
            value={expression.codon ?? ''}
            onChange={(event) => onExpression({ ...expression, codon: (event.target.value || null) as ExpressionPlan['codon'] })}
          >
            <option value="">Choose a codon strategy</option>
            {CODON_METHODS.map((method) => (
              <option key={method.id} value={method.id}>
                {method.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Production scenario
          <select
            value={expression.mode ?? ''}
            onChange={(event) => onExpression({ ...expression, mode: (event.target.value || null) as ExpressionPlan['mode'] })}
          >
            <option value="">Choose transient or stable</option>
            {SCENARIOS.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="sm">
        {expression.host ? hostById(expression.host).name : 'Host not chosen'}
        {expression.host && expression.codonTable ? ` · ${codonTableName(expression.host, expression.codonTable)}` : ''}.{' '}
        {panel.members.map((draft) => PROTEIN_ROLES.find((role) => role.id === draft.role)?.label ?? 'Unassigned').join(', ')}.
      </p>
    </section>
  );
}

function ProteinLookup({
  draft,
  drafts,
  onChange,
}: {
  draft: ProteinDraft;
  drafts: ProteinDraft[];
  onChange: (draft: ProteinDraft) => void;
}) {
  const [source, setSource] = useState<'internal' | 'uniprot'>('internal');
  const [by, setBy] = useState<ProteinSearchBy>('name');
  const [text, setText] = useState('');
  const [reviewed, setReviewed] = useState(true);
  const [hits, setHits] = useState<ProteinLookupHit[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setHits([]);
    setMessage('');
    setText('');
    setBusy(false);
  }, [draft.id]);

  function chooseSource(next: 'internal' | 'uniprot') {
    setSource(next);
    setHits([]);
    setMessage('');
  }

  function chooseBy(next: ProteinSearchBy) {
    setBy(next);
    setHits([]);
    setMessage('');
  }

  async function search(event: FormEvent) {
    event.preventDefault();
    const query = text.trim();
    if (query.length < 2) {
      setHits([]);
      setMessage('Enter a name or a sequence.');
      return;
    }
    if (by === 'sequence' && !aminoAcidSequence(query)) {
      setHits([]);
      setMessage('Enter an amino-acid sequence of at least 8 residues.');
      return;
    }
    if (source === 'internal') {
      const found = searchInternalProteins(
        by,
        query,
        drafts.filter((item) => item.id !== draft.id),
      );
      setHits(found);
      setMessage(found.length ? '' : lookupEmpty(source, by));
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const found = await searchUniProt(by, query, reviewed);
      setHits(found);
      setMessage(found.length ? '' : lookupEmpty(source, by));
    } catch (error) {
      setHits([]);
      setMessage(error instanceof Error ? error.message : 'UniProt could not be reached.');
    } finally {
      setBusy(false);
    }
  }

  const placeholder =
    by === 'sequence'
      ? source === 'uniprot'
        ? 'Full amino-acid sequence'
        : 'Amino-acid sequence already stored'
      : source === 'uniprot'
        ? 'Name, gene, or UniProt accession'
        : 'Name, class, or id';

  return (
    <form className="protein-lookup" onSubmit={search}>
      <span className="protein-lookup-label">Find a protein</span>
      <div className="protein-lookup-modes">
        <button type="button" className="btn sm" aria-pressed={source === 'internal'} onClick={() => chooseSource('internal')}>
          Internal
        </button>
        <button type="button" className="btn sm" aria-pressed={source === 'uniprot'} onClick={() => chooseSource('uniprot')}>
          UniProt
        </button>
        <button type="button" className="btn sm" aria-pressed={by === 'name'} onClick={() => chooseBy('name')}>
          Name
        </button>
        <button type="button" className="btn sm" aria-pressed={by === 'sequence'} onClick={() => chooseBy('sequence')}>
          Sequence
        </button>
      </div>
      <p className="sm">{lookupHint(source, by)}</p>
      <input
        className="search"
        type={by === 'sequence' ? 'text' : 'search'}
        aria-label={placeholder}
        placeholder={placeholder}
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      {source === 'uniprot' ? (
        <label className="protein-reviewed">
          <input type="checkbox" checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} />
          Reviewed entries only
        </label>
      ) : null}
      <div>
        <button className="btn sm primary" type="submit" disabled={busy}>
          {busy ? 'Searching UniProt…' : 'Search'}
        </button>
      </div>
      {message ? <p className="sm">{message}</p> : null}
      {hits.length ? (
        <ul className="protein-hits">
          {hits.map((hit) => (
            <li key={hit.key}>
              <button type="button" className="req-row" onClick={() => onChange(applyProteinHit(draft, hit))}>
                <span className="nm">{hit.title}</span>
                <span className="sm">{hit.detail}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}

function BroughtSequence({ sequence }: { sequence: ProteinSequenceRecord }) {
  return (
    <dl className="infer-dl protein-facts">
      <div>
        <dt>Accession</dt>
        <dd>
          {sequence.accession}
          {sequence.entryName ? ` · ${sequence.entryName}` : ''}
          {sequence.reviewed ? ' · Reviewed' : ' · Unreviewed'}
        </dd>
      </div>
      {sequence.gene ? (
        <div>
          <dt>Gene</dt>
          <dd>{sequence.gene}</dd>
        </div>
      ) : null}
      {sequence.organism ? (
        <div>
          <dt>Organism</dt>
          <dd>{sequence.organism}</dd>
        </div>
      ) : null}
      <div>
        <dt>Length</dt>
        <dd>{sequence.length} aa</dd>
      </div>
      {sequence.functionText ? (
        <div>
          <dt>Function</dt>
          <dd>{sequence.functionText}</dd>
        </div>
      ) : null}
      <div>
        <dt>Sequence</dt>
        <dd className="protein-seq">{sequence.sequence}</dd>
      </div>
    </dl>
  );
}

function lookupHint(source: 'internal' | 'uniprot', by: ProteinSearchBy): string {
  if (source === 'internal' && by === 'name') return 'Matches registered receptors and scaffolds, and proteins already brought in.';
  if (source === 'internal') return 'Matches a sequence already stored on a draft.';
  if (by === 'name') return 'Brings the accession, sequence, and metadata from UniProt.';
  return 'Matches the full UniProt sequence. A fragment is found among proteins already stored here.';
}

function lookupEmpty(source: 'internal' | 'uniprot', by: ProteinSearchBy): string {
  if (source === 'internal' && by === 'sequence') {
    return 'No saved protein has this sequence. Search UniProt with the full sequence, or search by name.';
  }
  if (source === 'uniprot' && by === 'sequence') {
    return 'No UniProt entry has this exact sequence. Search by name or accession, or search proteins already stored here.';
  }
  if (source === 'uniprot') return 'No UniProt entry matched.';
  return 'No registered protein or draft matched.';
}
