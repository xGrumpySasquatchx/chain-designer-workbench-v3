import { useEffect, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { rowHasFacet } from '../model/facets';
import type { Grain, Mark, Model } from '../model/types';

export interface Col {
  h: string;
  cls?: string;
  cell: (row: Row) => ReactNode;
  sort?: (row: Row) => string | number;
}

export interface Row {
  id: string;
  rank: number;
  [key: string]: unknown;
}

const BUCKET_LABEL = ['In your build', 'Available', 'Ruled out'];
const LEAD_KEY = 'protein-chain-workbench-v3-lead';
const LEAD_DEFAULT = 240;

function loadLeadHeight(): number {
  try {
    const n = Number(localStorage.getItem(LEAD_KEY));
    if (n >= 96 && n <= 900) return n;
  } catch {
    /* private mode */
  }
  return LEAD_DEFAULT;
}

function bucketOf(grain: Grain, id: string, mark: Mark | undefined, model: Model, tier?: string) {
  if (mark === 'out') return { b: 2 as const, label: BUCKET_LABEL[2] };
  if (grain === 'fmt') {
    if (model.inF.has(id)) return { b: 0 as const, label: BUCKET_LABEL[0] };
    if (model.reachF.has(id)) return { b: 1 as const, label: tier || BUCKET_LABEL[1] };
    return { b: 2 as const, label: BUCKET_LABEL[2] };
  }
  if (grain === 'chn') {
    if (model.buildC.has(id)) return { b: 0 as const, label: BUCKET_LABEL[0] };
    if (model.reachC.has(id)) return { b: 1 as const, label: BUCKET_LABEL[1] };
    return { b: 2 as const, label: BUCKET_LABEL[2] };
  }
  if (grain === 'mut') {
    if (model.buildM.has(id)) return { b: 0 as const, label: BUCKET_LABEL[0] };
    if (model.reachM.has(id)) return { b: 1 as const, label: BUCKET_LABEL[1] };
    return { b: 2 as const, label: BUCKET_LABEL[2] };
  }
  if (model.buildV.has(id)) return { b: 0 as const, label: BUCKET_LABEL[0] };
  if (model.reachV.has(id)) return { b: 1 as const, label: BUCKET_LABEL[1] };
  return { b: 2 as const, label: BUCKET_LABEL[2] };
}

function cmp(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

export function RowTable({
  grain,
  title,
  rows,
  cols,
  model,
  marks,
  query,
  facetSel,
  hideOut,
  text,
  notice,
  lead,
  inferred,
  onMark,
  onHideOut,
}: {
  grain: Grain;
  title: string;
  rows: Row[];
  cols: Col[];
  model: Model;
  marks: Record<string, Mark | undefined>;
  query: string;
  facetSel: Record<string, Set<string>>;
  hideOut: boolean;
  text: (row: Row) => string;
  notice?: string;
  lead?: ReactNode;
  /** The panel's molecule already fixed these rows. */
  inferred?: boolean;
  onMark: (id: string, v: Mark) => void;
  onHideOut: () => void;
}) {
  const [sort, setSort] = useState<{ h: string; dir: 1 | -1 } | null>(null);
  const [leadH, setLeadH] = useState(loadLeadHeight);
  useEffect(() => {
    try {
      localStorage.setItem(LEAD_KEY, String(leadH));
    } catch {
      /* private mode or quota */
    }
  }, [leadH]);
  const startSplit = (event: ReactPointerEvent<HTMLElement>) => {
    event.preventDefault();
    const startY = event.clientY;
    const startH = leadH;
    const parent = event.currentTarget.parentElement;
    const prevCursor = document.body.style.cursor;
    const prevSelect = document.body.style.userSelect;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    const limit = () => {
      const height = parent?.getBoundingClientRect().height ?? 640;
      return Math.max(160, height - 120);
    };
    const move = (ev: PointerEvent) => {
      setLeadH(Math.min(limit(), Math.max(96, Math.round(startH + ev.clientY - startY))));
    };
    const up = () => {
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevSelect;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  const q = String(query ?? '').trim().toLowerCase();
  const items = rows
    .filter((r) => {
      const { b } = bucketOf(grain, r.id, marks[r.id], model, String(r.tier ?? ''));
      if (!inferred && hideOut && b === 2) return false;
      for (const k of Object.keys(facetSel)) {
        const st = facetSel[k];
        if (st && st.size && !rowHasFacet(r, k, st)) return false;
      }
      if (q && !text(r).toLowerCase().includes(q)) return false;
      return true;
    })
    .map((r) =>
      inferred
        ? { r, b: 0 as const, label: 'Inferred from each well' }
        : { r, ...bucketOf(grain, r.id, marks[r.id], model, String(r.tier ?? '')) },
    )
    .sort((a, z) => {
      if (a.b !== z.b) return a.b - z.b;
      if (sort) {
        const col = cols.find((c) => c.h === sort.h);
        const av = col?.sort ? col.sort(a.r) : a.r.id;
        const zv = col?.sort ? col.sort(z.r) : z.r.id;
        const d = cmp(av, zv);
        if (d) return d * sort.dir;
      }
      return (a.r.rank || 999) - (z.r.rank || 999) || a.r.id.localeCompare(z.r.id);
    });

  const nOut = inferred ? 0 : rows.filter((r) => bucketOf(grain, r.id, marks[r.id], model).b === 2).length;
  const ncol = cols.length + (inferred ? 1 : 2);

  let lastGroup: string | null = null;
  const body: ReactNode[] = [];
  items.forEach((it) => {
    if (it.label !== lastGroup) {
      lastGroup = it.label;
      body.push(
        <tr key={`g-${it.b}-${it.label}-${body.length}`} className={`grp ${it.b === 2 ? 'o' : it.b === 0 ? 'b' : ''}`}>
          <td colSpan={ncol}>{it.label}</td>
        </tr>,
      );
    }
    const s = inferred ? undefined : marks[it.r.id];
    const claimed = inferred
      ? false
      :
      grain === 'chn'
        ? model.claimC.has(it.r.id)
        : grain === 'con'
          ? model.claimV.has(it.r.id)
          : grain === 'mut'
            ? model.claimM.has(it.r.id)
            : false;
    let status: ReactNode = null;
    if (it.b === 2 && s !== 'out') {
      status =
        grain === 'chn' ? (
          <span className="pill blk">Not on this panel</span>
        ) : grain === 'con' ? (
          <span className="pill blk">No chain in play needs this</span>
        ) : grain === 'mut' ? (
          <span className="pill blk">Not used by this panel</span>
        ) : (
          <span className="pill blk">Blocked by a rule-out</span>
        );
    } else if (claimed && s !== 'in') {
      status = <span className="pill imp">Comes with the panel</span>;
    } else if (grain === 'mut' && it.r.partner && it.r.partner !== 'None' && s !== 'out' && it.b < 2) {
      status = <span className="pill on">Needs {String(it.r.partner)}</span>;
    }
    const dis = it.b === 2 && s !== 'out';
    const st = s === 'out' ? 'out' : it.b === 2 ? 'unreach' : s === 'in' ? 'in' : claimed ? 'claim' : '';
    const inferredStatus = <span className="pill">Inferred</span>;
    body.push(
      <tr key={it.r.id} data-s={inferred ? 'claim' : st}>
        {inferred ? null : (
          <td>
            <span className={`tri ${claimed && s !== 'in' ? 'claimed' : ''}`}>
              <button
                type="button"
                data-v="in"
                aria-pressed={s === 'in'}
                disabled={dis}
                title="Add"
                onClick={() => onMark(it.r.id, 'in')}
              >
                ✓
              </button>
              <button
                type="button"
                data-v="out"
                aria-pressed={s === 'out'}
                title="Rule out"
                onClick={() => onMark(it.r.id, 'out')}
              >
                ×
              </button>
            </span>
          </td>
        )}
        {cols.map((c) => (
          <td key={c.h} className={c.cls || ''}>
            {c.cell(it.r)}
          </td>
        ))}
        <td>{inferred ? inferredStatus : status}</td>
      </tr>,
    );
  });

  return (
    <main className={`panel list${lead ? ' is-split' : ''}`}>
      <div className="pathbar" aria-label="Folder path">
        <span>Local</span>
        <span className="path-sep" aria-hidden="true">
          ▸
        </span>
        <span>{title}</span>
      </div>
      <div className="panel-h">
        <h2>{title}</h2>
        <span className="count">
          {inferred
            ? `${rows.length} inferred`
            : nOut
              ? `${rows.length - nOut} available, ${nOut} ruled out`
              : `${rows.length} documents`}
        </span>
        <span className="flex-1" />
        {nOut > 0 && (
          <button className="btn sm" type="button" onClick={onHideOut}>
            {hideOut ? 'Show the ruled out' : 'Hide the ruled out'}
          </button>
        )}
      </div>
      {lead ? (
        <>
          <div className="lead-pane" style={{ height: leadH }}>
            {lead}
          </div>
          <button
            type="button"
            className="split-grip"
            draggable={true}
            aria-label="Resize sequence pane"
            title="Drag to give the sequences or the table more room. Double-click to reset."
            onDragStart={(event) => event.preventDefault()}
            onPointerDown={startSplit}
            onDoubleClick={() => setLeadH(LEAD_DEFAULT)}
          />
        </>
      ) : null}
      <div className="rows">
        <table>
          <thead>
            <tr>
              {inferred ? null : <th style={{ width: 86 }}>In / out</th>}
              {cols.map((c) => {
                const active = sort?.h === c.h;
                const aria = active ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none';
                return (
                  <th key={c.h} aria-sort={aria}>
                    <button
                      type="button"
                      className="th-sort"
                      onClick={() =>
                        setSort((s) =>
                          s?.h === c.h ? (s.dir === 1 ? { h: c.h, dir: -1 } : null) : { h: c.h, dir: 1 },
                        )
                      }
                    >
                      {c.h}
                      <span className="th-dir" aria-hidden="true">
                        {active ? (sort.dir === 1 ? '↑' : '↓') : ''}
                      </span>
                    </button>
                  </th>
                );
              })}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {body.length ? (
              body
            ) : (
              <tr>
                <td colSpan={ncol} style={{ padding: '14px 13px', color: 'var(--ink-3)' }}>
                  {notice ?? 'Nothing matches those filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
