import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { closePool, getPool } from '../config/database';

async function main(): Promise<void> {
  if (process.env.COACH_BOOKING_ACCEPTANCE !== '1') throw new Error('COACH_BOOKING_ACCEPTANCE=1 is required');
  const pool = await getPool();
  const migrationDir = path.resolve(__dirname, '../../../db/migrations');
  const files = (await fs.readdir(migrationDir)).filter(file => /^\d{4}_.+\.sql$/i.test(file)).sort();
  const rows = await pool.request().query<{ version: string; name: string; checksum: string }>(
    'SELECT version,name,checksum FROM dbo.SchemaMigrations ORDER BY version',
  );
  const stored = new Map(rows.recordset.map(row => [row.version, row]));
  const pending: string[] = [];
  const mismatches: string[] = [];
  for (const filename of files) {
    const version = filename.slice(0, 4);
    const checksum = createHash('sha256').update(await fs.readFile(path.join(migrationDir, filename))).digest('hex');
    const row = stored.get(version);
    if (!row) pending.push(version);
    else if (row.checksum !== checksum) mismatches.push(version);
  }
  const object = await pool.request().query<{ database_name: string; coach_profiles: number; coach_availability_rules: number; coach_availability_exceptions: number; unique_indexes: number; availability_indexes: number }>(
    `SELECT DB_NAME() AS database_name,
            CASE WHEN OBJECT_ID(N'dbo.CoachProfiles',N'U') IS NULL THEN 0 ELSE 1 END AS coach_profiles,
            CASE WHEN OBJECT_ID(N'dbo.CoachAvailabilityRules',N'U') IS NULL THEN 0 ELSE 1 END AS coach_availability_rules,
            CASE WHEN OBJECT_ID(N'dbo.CoachAvailabilityExceptions',N'U') IS NULL THEN 0 ELSE 1 END AS coach_availability_exceptions,
            (SELECT COUNT(*) FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.CoachProfiles') AND is_unique=1) AS unique_indexes,
            (SELECT COUNT(*) FROM sys.indexes WHERE object_id IN (OBJECT_ID(N'dbo.CoachAvailabilityRules'),OBJECT_ID(N'dbo.CoachAvailabilityExceptions')) AND name IN (N'IX_CoachAvailabilityRules_CoachDayActive',N'IX_CoachAvailabilityExceptions_CoachDateActive')) AS availability_indexes`,
  );
  const evidence = {
    ...object.recordset[0],
    applied: rows.recordset.length,
    pending,
    checksum_mismatches: mismatches,
    migration_0010: stored.get('0010') ? 'APPLIED' : 'PENDING',
  };
  console.log(`COACH_MIGRATION_VERIFY ${JSON.stringify(evidence)}`);
  if (evidence.coach_profiles !== 1 || evidence.unique_indexes < 1 || evidence.coach_availability_rules !== 1 || evidence.coach_availability_exceptions !== 1 || evidence.availability_indexes < 2 || pending.length !== 0 || mismatches.length !== 0) {
    throw new Error('Coach migration verification failed');
  }
}

main()
  .catch(error => {
    console.error('[COACH MIGRATION VERIFY FAIL]', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => { await closePool(); });
