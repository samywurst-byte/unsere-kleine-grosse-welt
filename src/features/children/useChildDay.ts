import { useMemo } from 'react';
import { useChoreDefinitions, useChores, useRoutineCompletions, useRoutineDefinitions } from '../../hooks/useData';
import { routinesForChild } from '../../services/routines';
import type { ChildProfile, ChoreDefinition, ChoreOccurrence, DateKey, RoutineDefinition, RoutinePhase } from '../../types';

export interface RoutineItem { kind: 'routine'; def: RoutineDefinition; done: boolean }
export interface ChoreItem { kind: 'chore'; occ: ChoreOccurrence; def: ChoreDefinition; done: boolean }

export interface ChildDay {
  byPhase: Record<RoutinePhase, RoutineItem[]>;
  chores: ChoreItem[];
  loaded: boolean;
}

/** Alles, was ein Kind an einem Tag zu tun hat: Routinen nach Tagesphase und Haushaltsaufgaben. */
export function useChildDay(child: ChildProfile | undefined, date: DateKey): ChildDay {
  const defs = useRoutineDefinitions();
  const completions = useRoutineCompletions(date);
  const choreOcc = useChores(date);
  const choreDefs = useChoreDefinitions();

  return useMemo(() => {
    const byPhase: ChildDay['byPhase'] = { morning: [], afternoon: [], evening: [] };
    if (!child || !defs || !completions || !choreOcc || !choreDefs) return { byPhase, chores: [], loaded: false };
    const done = new Set(completions.filter((c) => c.childId === child.id).map((c) => c.definitionId));
    for (const def of routinesForChild(defs, child.id, date)) {
      byPhase[def.phase].push({ kind: 'routine', def, done: done.has(def.id) });
    }
    const defMap = new Map(choreDefs.map((d) => [d.id, d]));
    const chores = choreOcc
      .filter((o) => o.childId === child.id && defMap.has(o.definitionId))
      .map((occ) => ({ kind: 'chore' as const, occ, def: defMap.get(occ.definitionId)!, done: occ.status === 'done' }));
    return { byPhase, chores, loaded: true };
  }, [child, defs, completions, choreOcc, choreDefs, date]);
}
