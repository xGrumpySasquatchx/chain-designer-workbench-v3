import type { CSSProperties, ReactNode } from 'react';
import { ExpressionBench, ExpressionRail } from './ExpressionBench';
import { ProteinBench } from './ProteinBench';
import { ProteinConstruct, ProteinHandoff } from './ProteinDownstream';
import {
  CODON_METHODS,
  TARGET_CLASSES,
  codonTableName,
  hostById,
  planReady,
  registrationMatches,
  scenarioById,
  withHost,
} from '../model/expression';
import { downloadPdf, textPdf } from '../model/pdf';
import { cloningPanel, PROTEIN_SCHEMES, chosenTranslation, proteinRoleLabel } from '../model/proteins';
import { proteinRecipeLines } from '../model/recipe';
import type {
  ExpressionPlan,
  ExpressionRegistration,
  HostId,
  ProteinDraft,
  ProteinScheme,
  ProteinStep,
} from '../model/types';

function expressionLines(plan: ExpressionPlan, registrations: ExpressionRegistration[]): string[] {
  return [
    plan.targetClass ? (TARGET_CLASSES.find((target) => target.id === plan.targetClass)?.label ?? '') : '',
    plan.mode ? scenarioById(plan.mode).name : '',
    plan.host ? hostById(plan.host).name : '',
    plan.codon ? (CODON_METHODS.find((method) => method.id === plan.codon)?.label ?? '') : '',
    plan.host && plan.codonTable ? codonTableName(plan.host, plan.codonTable) : '',
    ...registrations.map(
      (record) => `${record.id}  ${scenarioById(record.mode).name}  ${hostById(record.host).name}  ${record.registeredAt}`,
    ),
  ].filter(Boolean);
}

export function ProteinStage({
  drafts,
  activeId,
  step,
  expression,
  scheme,
  screens,
  registrations,
  expandedLeft,
  expandedRight,
  wrapStyle,
  foldLeft,
  gripLeft,
  foldRight,
  gripRight,
  onFoldLeft,
  onFoldRight,
  onNew,
  onOpen,
  onDelete,
  onChange,
  onExpression,
  onScheme,
  onScreens,
  onRegister,
}: {
  drafts: ProteinDraft[];
  activeId: string | null;
  step: ProteinStep;
  expression: ExpressionPlan;
  scheme: ProteinScheme;
  screens: string[];
  registrations: ExpressionRegistration[];
  expandedLeft: boolean;
  expandedRight: boolean;
  wrapStyle: CSSProperties;
  foldLeft: ReactNode;
  gripLeft: ReactNode;
  foldRight: ReactNode;
  gripRight: ReactNode;
  onFoldLeft: () => void;
  onFoldRight: () => void;
  onNew: (basisId?: string) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onChange: (draft: ProteinDraft) => void;
  onExpression: (plan: ExpressionPlan) => void;
  onScheme: (scheme: ProteinScheme) => void;
  onScreens: (id: string, on: boolean) => void;
  onRegister: () => void;
}) {
  const panel = cloningPanel(drafts);
  const ids = panel.members.map((draft) => draft.id).sort();
  const registered = registrations.some((record) => registrationMatches(record, expression, ids));
  const ready = planReady(expression);
  const canRegister = ready && ids.length > 0 && !registered;
  const registerTitle = !ready
    ? 'Choose a target class, an expression system, a codon table, a codon strategy, and transient or stable.'
    : ids.length === 0
      ? 'Add a protein to the cloning panel before registering the constructs.'
      : registered
        ? 'These proteins are already registered with this expression choice.'
        : 'Register the current proteins with this expression system and codon method.';
  const lines = expressionLines(expression, registrations);
  const handoff = (
    <ProteinHandoff
      drafts={drafts}
      scheme={scheme}
      expressionLines={lines}
      canRegister={canRegister}
      registered={registered}
      registerTitle={registerTitle}
      showRegister={step === 'con' && panel.members.length > 0}
      onRegister={onRegister}
      onPublish={() => {
        const schemeNote = PROTEIN_SCHEMES.find((item) => item.id === scheme)?.note ?? '';
        const bytes = textPdf(
          proteinRecipeLines({
            generatedOn: new Date().toISOString().slice(0, 10),
            schemeNote,
            ratio: panel.ratio,
            members: panel.members.map((draft) => {
              const chosen = draft.sequence
                ? chosenTranslation(draft.id, draft.sequence.sequence, draft.translationId)
                : null;
              return {
                id: draft.id,
                name: draft.name,
                accession: draft.sequence?.accession ?? '',
                role: proteinRoleLabel(draft.role),
                parts: draft.parts,
                translation: chosen
                  ? `${chosen.category.name}${chosen.registration ? ` string ${chosen.registration.n}` : ''}`
                  : '',
              };
            }),
            expressionLines: lines,
          }),
        );
        const fileId = panel.members.length === 1 ? panel.members[0].id : 'panel';
        downloadPdf(`protein-recipe-${fileId}.pdf`, bytes);
      }}
      expanded={expandedRight}
      onFold={onFoldRight}
      fold={foldRight}
      grip={gripRight}
    />
  );
  const setHost = (host: HostId) => onExpression(withHost(expression, host));
  if (step === 'con') {
    return (
      <ProteinConstruct
        drafts={drafts}
        scheme={scheme}
        wrapStyle={wrapStyle}
        expanded={expandedLeft}
        fold={foldLeft}
        grip={gripLeft}
        onFold={onFoldLeft}
        onOpen={onOpen}
        onChange={onChange}
        onScheme={onScheme}
        screens={screens}
        onScreens={onScreens}
        handoff={handoff}
      />
    );
  }
  if (step === 'exp') {
    return (
      <>
        <div className="statusbar" role="status">
          <span className="mono">Expression</span>
          <span>
            {[
              expression.mode ? scenarioById(expression.mode).name : 'Choose transient or stable',
              expression.host ? hostById(expression.host).name : 'choose an expression system',
              expression.codon
                ? (CODON_METHODS.find((method) => method.id === expression.codon)?.label ?? '')
                : 'choose a codon method',
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
          <span className="stat-grow" />
          <span>
            {panel.members.length
              ? `${panel.members.length} protein insert${panel.members.length === 1 ? '' : 's'}`
              : 'No protein on the panel'}
          </span>
        </div>
        <div className="wrap" style={wrapStyle}>
          <ExpressionRail
            plan={expression}
            expanded={expandedLeft}
            onFold={onFoldLeft}
            fold={foldLeft}
            grip={gripLeft}
            onTarget={(targetClass) => onExpression({ ...expression, targetClass })}
            onHost={setHost}
            onMode={(mode) => onExpression({ ...expression, mode })}
          />
          <ExpressionBench
            plan={expression}
            level="Level 2"
            emptyInserts="Add a protein to the cloning panel. Its sequence is what this codon table recodes."
            slots={panel.members.map((draft) => {
              const chosen = draft.sequence
                ? chosenTranslation(draft.id, draft.sequence.sequence, draft.translationId)
                : null;
              return {
                key: draft.id,
                insert: draft.name,
                label: proteinRoleLabel(draft.role),
                domain: chosen?.category.name ?? 'Reverse translation',
                vector: draft.id,
              };
            })}
            registrations={registrations}
            onTarget={(targetClass) => onExpression({ ...expression, targetClass })}
            onHost={setHost}
            onCodonTable={(codonTable) => onExpression({ ...expression, codonTable })}
            onCodon={(codon) => onExpression({ ...expression, codon })}
            onMode={(mode) => onExpression({ ...expression, mode })}
          />
          {handoff}
        </div>
      </>
    );
  }
  return (
    <ProteinBench
      drafts={drafts}
      activeId={activeId}
      scheme={scheme}
      expanded={expandedLeft}
      wrapStyle={wrapStyle}
      onFold={onFoldLeft}
      fold={foldLeft}
      grip={gripLeft}
      onNew={onNew}
      onOpen={onOpen}
      onDelete={onDelete}
      onChange={onChange}
      viewer={handoff}
    />
  );
}
