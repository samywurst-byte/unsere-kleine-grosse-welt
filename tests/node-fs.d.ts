// Minimale Typen für node:fs in den Tests (das Projekt bindet @types/node bewusst nicht ein).
declare module 'node:fs' {
  export function readFileSync(path: string): Uint8Array;
}
