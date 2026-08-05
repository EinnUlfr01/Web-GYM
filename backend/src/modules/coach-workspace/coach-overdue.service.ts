import { query } from '../../config/database';
import { assertIanaTimeZone, todayInTimeZone } from '../../utils/timezone';

export interface CoachOverdueBatchResult {
  selected: number;
  skipped: number;
}

const MAX_BATCH_SIZE = 1000;

const datePart = (value: unknown): string => value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? '').slice(0, 10);

export async function reconcileOverdueSchedules(limit = 100): Promise<CoachOverdueBatchResult> {
  const safeLimit = Math.min(Math.max(1, Math.trunc(limit)), MAX_BATCH_SIZE);
  const candidates = await query<{ id: number; scheduled_date: string | Date; schedule_timezone: string }>(
    `SELECT TOP (@limit) s.id,s.scheduled_date,a.schedule_timezone
     FROM dbo.CoachProgramSchedules s
     JOIN dbo.CoachProgramAssignments a ON a.id=s.assignment_id
     WHERE s.status=N'SCHEDULED'
       AND s.scheduled_date<=DATEADD(day,1,CONVERT(date,SYSUTCDATETIME()))
       AND NOT EXISTS (SELECT 1 FROM dbo.MemberWorkoutSessions ms WHERE ms.schedule_id=s.id)
     ORDER BY s.scheduled_date,s.id`,
    { limit: safeLimit },
  );

  let skipped = 0;
  for (const row of candidates.recordset) {
    assertIanaTimeZone(row.schedule_timezone);
    const scheduledDate = datePart(row.scheduled_date);
    if (scheduledDate >= todayInTimeZone(row.schedule_timezone)) continue;
    const result = await query(
      `UPDATE dbo.CoachProgramSchedules
       SET status=N'SKIPPED',updated_at=SYSUTCDATETIME()
       WHERE id=@scheduleId AND status=N'SCHEDULED' AND scheduled_date=@scheduledDate
         AND NOT EXISTS (SELECT 1 FROM dbo.MemberWorkoutSessions ms WHERE ms.schedule_id=@scheduleId)`,
      { scheduleId: row.id, scheduledDate },
    );
    skipped += Number(result.rowsAffected[0] ?? 0);
  }

  return { selected: candidates.recordset.length, skipped };
}
