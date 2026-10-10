// Minimale Typen für node:fs in den Tests (das Projekt bindet @types/node bewusst nicht ein).
declare module 'node:fs' {
  export function readFileSync(path: string): Uint8Array;
}
declare module 'node:fs' {
  export function writeFileSync(path: string, data: Uint8Array): void;
}
declare const process: { env: Record<string, string | undefined> };
