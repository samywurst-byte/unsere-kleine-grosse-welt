import 'fake-indexeddb/auto';

// Alle Tests laufen in deutscher Zeit, damit Sommerzeitwechsel realistisch geprüft werden.
(globalThis as unknown as { process: { env: Record<string, string> } }).process.env.TZ = 'Europe/Berlin';
