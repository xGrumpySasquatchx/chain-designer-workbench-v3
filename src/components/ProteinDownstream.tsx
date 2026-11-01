import { useState, type CSSProperties, type ReactNode } from 'react';
import { ConstructScreens } from './ConstructScreens';
import { proteinBuildList, proteinGaalCsv, proteinGaalJobs } from '../model/gaal';
import { cloningPanel, PROTEIN_SCHEMES, chosenTranslation, proteinRoleLabel } from '../model/proteins';
import { screenSummary } from '../model/screens';
import type { ProteinDraft, ProteinScheme } from '../model/types';

function copy(text: string) {
  if (navigator.clipboard) return navigator.clipboard.writeText(text);
  return Promise.reject();
}

export function ProteinConstruct({
  drafts,
  scheme,
  screens,
  wrapStyle,
  expanded,
  fold,
  grip,
  onFold,
  handoff,
  onOpen,
  onChange,
  onScheme,
  onScreens,
}: {
  drafts: ProteinDraft[];
  scheme: ProteinScheme;
  screens: string[];
  wrapStyle: CSSProperties;
  expanded: boolean;
  fold: ReactNode;
  grip: ReactNode;
  onFold: () => void;
  handoff: ReactNode;
  onOpen: (id: string) => void;
  onChange: (draft: ProteinDraft) => void;
  onScheme: (scheme: ProteinScheme) => void;
  onScreens: (id: string, on: boolean) => void;
}) {
  const panel = cloningPanel(drafts);
  const schemeNote = PROTEIN_SCHEMES.find((item) => item.id === scheme)?.note ?? '';
  return (
    <>
      <div className="statusbar" role="status">
        <span className="mono">Construct</span>
        <span>
          {panel.members.length
            ? `${panel.members.length} protein${panel.members.length === 1 ? '' : 's'} · ${panel.ratio}`
            : 'Add a protein from the Protein tab'}
        </span>
        <span className="stat-grow" />
        <span>{[schemeNote, screenSummary(screens)].filter(Boolean).join(' · ')}</span>
      </div>
      <div className="wrap" style={wrapStyle}>
        <aside className={`panel rail${expanded ? '' : ' is-folded'}`} aria-label="Proteins on the panel">
          <div className="panel-h" onClick={expanded ? undefined : onFold}>
            <h2>Panel</h2>
            <div className="panel-h-act">{fold}</div>
          </div>
          {expanded ? (
          <div className="rail-body">
            {panel.members.length ? (
              panel.members.map((draft) => (
                <button key={draft.id} type="button" className="req-row" onClick={() => onOpen(draft.id)}>
                  <span className="nm">{draft.name}</span>
                  <span className="sm">
                    {draft.id} · {draft.parts} part{draft.parts === 1 ? '' : 's'}
                  </span>
                </button>
              ))
            ) : (
              <p className="sm">The cloning panel is empty.</p>
            )}
            <ConstructScreens selected={screens} onToggle={onScreens} />
          </div>
          ) : null}
          {expanded ? grip : null}
        </aside>
        <main className="panel list">
          <div className="panel-h">
            <h2>Construct</h2>
            <span className="sm">Level 1</span>
          </div>
          <div className="req-body">
            {panel.members.length ? (
              <>
                <p className="sm">
                  {schemeNote} The ratio is {panel.ratio || '1'}. No destination backbone is registered, so the GaaL job
                  names each protein and carries its reverse translation.
                </p>
                <div className="protein-lookup-modes">
                  {PROTEIN_SCHEMES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="btn sm"
                      aria-pressed={scheme === item.id}
                      onClick={() => onScheme(item.id)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <ul className="protein-hits">
                  {panel.members.map((draft) => {
                    const chosen = draft.sequence
                      ? chosenTranslation(draft.id, draft.sequence.sequence, draft.translationId)
                      : null;
                    return (
                      <li key={draft.id} className="gsv-ann-line">
                        <button type="button" className="req-row" onClick={() => onOpen(draft.id)}>
                          <span className="nm">{draft.name}</span>
                          <span className="sm">
                            {draft.id}
                            {draft.sequence?.accession ? ` · ${draft.sequence.accession}` : ''} · {proteinRoleLabel(draft.role)}
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
                              if (event.target.value.trim() && Number.isFinite(next) && next >= 0) {
                                onChange({ ...draft, parts: next });
                              }
                            }}
                          />
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <div className="req-empty">
                <p>No protein is on the cloning panel yet.</p>
                <p className="sm">
                  On the Protein tab, bring in a sequence, choose how it is cloned, and add it to the panel.
                </p>
              </div>
            )}
          </div>
        </main>
        {handoff}
      </div>
    </>
  );
}

export function ProteinHandoff({
  drafts,
  scheme,
  expressionLines,
  canRegister,
  registered,
  registerTitle,
  showRegister,
  onRegister,
  onPublish,
  expanded,
  onFold,
  fold,
  grip,
}: {
  drafts: ProteinDraft[];
  scheme: ProteinScheme;
  expressionLines: string[];
  canRegister: boolean;
  registered: boolean;
  registerTitle: string;
  showRegister: boolean;
  onRegister: () => void;
  onPublish: () => void;
  expanded: boolean;
  onFold: () => void;
  fold: ReactNode;
  grip: ReactNode;
}) {
  const [view, setView] = useState<'info' | 'text'>('info');
  const [copied, setCopied] = useState('');
  const panel = cloningPanel(drafts);
  const schemeNote = PROTEIN_SCHEMES.find((item) => item.id === scheme)?.note ?? '';
  const jobs = proteinGaalJobs(drafts, scheme);
  const flash = (label: string, text: string) => {
    copy(text).catch(() => console.log(text));
    setCopied(label);
    window.setTimeout(() => setCopied(''), 1600);
  };
  return (
    <aside className={`panel basket${expanded ? '' : ' is-folded'}`} aria-label="Document viewer">
      <div className="panel-h" onClick={expanded ? undefined : onFold}>
        <h2>Viewer</h2>
        <div className="panel-h-act">{fold}</div>
      </div>
      {expanded ? (
        <>
          <div className="viewer-tabs" role="tablist" aria-label="Viewer">
            {(
              [
                ['info', 'Info'],
                ['text', 'Text'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                className="viewer-tab"
                type="button"
                role="tab"
                aria-selected={view === id}
                onClick={() => setView(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="viewer-body">
            {view === 'info' ? (
              <div className="sec" style={{ borderBottom: 0 }}>
                <h3>Cloning panel</h3>
                <p className="sm">
                  {panel.members.length
                    ? `${panel.members.length} protein${panel.members.length === 1 ? '' : 's'} · ${panel.ratio}. ${schemeNote}`
                    : 'No protein is on the panel yet.'}
                </p>
                {panel.members.map((draft) => (
                  <div className="src-doc viewer-sel" key={draft.id}>
                    <span>{draft.name}</span>
                    <span className="sm">
                      {draft.id} · {proteinRoleLabel(draft.role)} · {draft.parts} part{draft.parts === 1 ? '' : 's'}
                    </span>
                  </div>
                ))}
                <p className="sm">No destination backbone is registered.</p>
                {expressionLines.length ? <p className="sm">{expressionLines.join(' · ')}</p> : null}
                <div className="row">
                  {showRegister ? (
                    <button
                      className="btn primary"
                      type="button"
                      disabled={!canRegister}
                      title={registerTitle}
                      onClick={() => {
                        onRegister();
                        setCopied('Register constructs');
                        window.setTimeout(() => setCopied(''), 1600);
                      }}
                    >
                      {copied === 'Register constructs' || registered ? 'Registered' : 'Register constructs'}
                    </button>
                  ) : null}
                  <button
                    className="btn"
                    type="button"
                    onClick={() => flash('Copy build list', proteinBuildList(drafts, schemeNote, expressionLines))}
                  >
                    {copied === 'Copy build list' ? 'Copied' : 'Copy build list'}
                  </button>
                  <button
                    className="btn"
                    type="button"
                    onClick={() => {
                      onPublish();
                      setCopied('Publish protein Report');
                      window.setTimeout(() => setCopied(''), 1600);
                    }}
                  >
                    {copied === 'Publish protein Report' ? 'Downloaded' : 'Publish protein Report'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="sec" style={{ borderBottom: 0 }}>
                <h3>Text view</h3>
                <p className="sm">
                  {jobs.length
                    ? `${jobs.length} GaaL ${jobs.length === 1 ? 'assembly' : 'assemblies'} · ${panel.members.length} protein insert${panel.members.length === 1 ? '' : 's'}.`
                    : 'Add a protein to the cloning panel before copying a GaaL job.'}{' '}
                  The backbone, enzyme, and overhangs stay empty until a destination plasmid is registered.
                </p>
                <div className="row">
                  <button
                    className="btn sm"
                    type="button"
                    disabled={!jobs.length}
                    onClick={() => flash('Copy GaaL job', JSON.stringify(jobs, null, 2))}
                  >
                    {copied === 'Copy GaaL job' ? 'Copied' : 'Copy GaaL job'}
                  </button>
                  <button
                    className="btn sm"
                    type="button"
                    disabled={!jobs.length}
                    onClick={() => flash('Copy as CSV', proteinGaalCsv(drafts, scheme))}
                  >
                    {copied === 'Copy as CSV' ? 'Copied' : 'Copy as CSV'}
                  </button>
                </div>
                <p className="sm">Emits the assembly spec. Point it at your Geneious Prime library to run the builds.</p>
              </div>
            )}
          </div>
          {grip}
        </>
      ) : null}
    </aside>
  );
}
