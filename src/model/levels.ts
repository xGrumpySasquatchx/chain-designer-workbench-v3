import type { Grain } from './types';

const STEPS: { g: Grain; name: string; designOnly?: boolean }[] = [
  { g: 'fmt', name: 'Request' },
  { g: 'chn', name: 'Chain' },
  { g: 'var', name: 'Variable regions', designOnly: true },
  { g: 'mut', name: 'Mutations', designOnly: true },
  { g: 'con', name: 'Construct' },
  { g: 'exp', name: 'Expression' },
];

/**
 * Variable regions and mutations stay available while the open panel is still empty,
 * while the Request tab is editing that draft, and after a panel created here has
 * been given a UID. A catalog panel whose molecules already fix the design does not.
 */
export function showDesignSteps(
  grain: Grain,
  activeMoleculeCount: number | null,
  draftMoleculeCount: number | null,
  userPanel = false,
): boolean {
  if (userPanel) return true;
  if (activeMoleculeCount === 0) return true;
  return grain === 'fmt' && draftMoleculeCount === 0;
}

/** Variable regions and mutations are chosen only while a panel is being designed. */
export function levelSteps(onTheFly: boolean): { g: Grain; lvl: string; name: string }[] {
  let level = 0;
  return STEPS.filter((step) => onTheFly || !step.designOnly).map((step) => ({
    g: step.g,
    name: step.name,
    lvl: step.g === 'fmt' ? '' : String(++level),
  }));
}
