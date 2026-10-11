import type { HeroLook, HeroProfile } from '../../types';

/** Hilfe-Stand im laufenden Schritt: 1 = kleiner Hinweis, 2 = Momo zeigt den nächsten Schritt, 3 = leichter. */
export interface HelpState {
  level: 0 | 1 | 2 | 3;
  /** Steigt bei jedem „Gemeinsam“. Spiele machen dann den nächsten Schritt vor. */
  tick: number;
}

export interface StepProps {
  childId: string;
  data: Record<string, unknown>;
  setData: (patch: Record<string, unknown>) => void;
  /** Schritt geschafft. `solution` merkt sich den Lösungsweg. */
  onDone: (solution?: string) => void;
  /** Ein Versuch hat nicht geklappt. Momo fragt erst nach einigen Versuchen. */
  onFail: () => void;
  help: HelpState;
  profile: HeroProfile;
  look?: HeroLook;
}
