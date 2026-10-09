import { FamilyDatabase } from '../src/database/db';

let n = 0;
export function freshDbName(): string {
  n += 1;
  return `test-db-${Date.now()}-${n}-${Math.random().toString(36).slice(2)}`;
}

export async function openDb(name = freshDbName(), seedDate = new Date(2026, 9, 5)): Promise<FamilyDatabase> {
  const db = new FamilyDatabase(name, { seedDate });
  await db.open();
  return db;
}
