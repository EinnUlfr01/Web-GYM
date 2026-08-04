import { Request, Response, NextFunction } from 'express';
import { getPool, query, sql } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { sendSuccess } from '../../utils/response';
import {
  addMinutesToTime,
  assertBookingDate,
  assertBookingStartTime,
  assertFutureBooking,
  BookingStatus,
  isFutureLocalDateTime,
  isValidBookingTransition,
  normalizeSqlTime,
} from '../../utils/coachBooking';
import { getCoaches as getPublicCoaches, getCoachAvailability as getPublicCoachAvailability } from '../coaches/coach.controller';

export const getCoaches = getPublicCoaches;
export const getCoachAvailability = getPublicCoachAvailability;

interface NormalizedCreateBooking {
  coach_id: number;
  booking_date: string;
  start_time: string;
  end_time?: string;
  notes?: string;
}

interface BookingRow {
  id: number;
  coach_id: number;
  member_id: number;
  booking_date: string | Date;
  start_time: unknown;
  end_time: unknown;
  status: BookingStatus;
  notes: string | null;
  created_at: string | Date;
  updated_at: string | Date;
  member_name?: string;
  coach_name?: string;
  coach_avatar_url?: string | null;
}

interface CoachRow { id: number }

function sqlConflict(error: unknown): boolean {
  const diagnostic = error as { number?: number };
  return diagnostic.number === 2601 || diagnostic.number === 2627;
}

function dbDateToString(value: string | Date): string {
  if (typeof value === 'string') return value.slice(0, 10);
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`;
}

function bookingSelect(scope: string): string {
  return `SELECT b.id,b.coach_id,b.member_id,b.booking_date,b.start_time,b.end_time,b.status,b.notes,b.created_at,b.updated_at,
                 m.name AS member_name,c.name AS coach_name,c.avatar_url AS coach_avatar_url
          FROM dbo.Bookings b
          JOIN dbo.Users m ON m.id=b.member_id
          JOIN dbo.Users c ON c.id=b.coach_id
          WHERE ${scope}`;
}

function scopeForRole(role: string, userId: number): { clause: string; params: Record<string, unknown> } {
  if (role === 'coach') return { clause: 'b.coach_id=@userId', params: { userId } };
  if (role === 'member') return { clause: 'b.member_id=@userId', params: { userId } };
  if (role === 'admin') return { clause: '1=1', params: {} };
  throw new AppError(403, 'Forbidden');
}

/** Create a real pending appointment. Identity is always derived from the authenticated Member. */
export async function createBooking(req: Request, res: Response, next: NextFunction) {
  const body = req.body as NormalizedCreateBooking;
  const coachId = Number(body.coach_id);
  const memberId = req.user!.userId;
  try {
    assertBookingDate(body.booking_date);
    assertBookingStartTime(body.start_time);
    assertFutureBooking(body.booking_date, body.start_time);
    const endTime = addMinutesToTime(body.start_time, 60);
    if (body.end_time && body.end_time !== endTime) throw new AppError(400, 'Appointments have a fixed 60-minute duration');
    const note = body.notes?.trim() || null;
    const tx = (await getPool()).transaction();
    await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    try {
      const coach = await new sql.Request(tx)
        .input('coachId', sql.Int, coachId)
        .query<CoachRow>(
          `SELECT u.id
           FROM dbo.Users u WITH (UPDLOCK,HOLDLOCK)
           LEFT JOIN dbo.CoachProfiles cp ON cp.coach_id=u.id
           WHERE u.id=@coachId AND u.role=N'coach' AND u.is_active=1
             AND COALESCE(u.coach_status,N'ACTIVE')=N'ACTIVE'
             AND COALESCE(cp.booking_enabled,1)=1`,
        );
      if (!coach.recordset[0]) throw new AppError(404, 'Coach not found or booking is disabled');

      // Range locks protect the overlap checks while the filtered unique index protects exact duplicates.
      const coachConflict = await new sql.Request(tx)
        .input('coachId', sql.Int, coachId)
        .input('bookingDate', sql.Date, body.booking_date)
        .input('startTime', sql.VarChar(5), body.start_time)
        .input('endTime', sql.VarChar(5), endTime)
        .query<{ id: number }>(
          `SELECT TOP 1 id FROM dbo.Bookings WITH (UPDLOCK,HOLDLOCK)
           WHERE coach_id=@coachId AND booking_date=@bookingDate
             AND status IN (N'pending',N'confirmed')
             AND start_time < @endTime AND end_time > @startTime`,
        );
      if (coachConflict.recordset[0]) throw new AppError(409, 'Coach has an overlapping appointment');

      const memberConflict = await new sql.Request(tx)
        .input('memberId', sql.Int, memberId)
        .input('bookingDate', sql.Date, body.booking_date)
        .input('startTime', sql.VarChar(5), body.start_time)
        .input('endTime', sql.VarChar(5), endTime)
        .query<{ id: number }>(
          `SELECT TOP 1 id FROM dbo.Bookings WITH (UPDLOCK,HOLDLOCK)
           WHERE member_id=@memberId AND booking_date=@bookingDate
             AND status IN (N'pending',N'confirmed')
             AND start_time < @endTime AND end_time > @startTime`,
        );
      if (memberConflict.recordset[0]) throw new AppError(409, 'Member has an overlapping appointment');

      const inserted = await new sql.Request(tx)
        .input('coachId', sql.Int, coachId)
        .input('memberId', sql.Int, memberId)
        .input('bookingDate', sql.Date, body.booking_date)
        .input('startTime', sql.VarChar(5), body.start_time)
        .input('endTime', sql.VarChar(5), endTime)
        .input('notes', sql.NVarChar(500), note)
        .query<BookingRow>(
          `INSERT dbo.Bookings(coach_id,member_id,booking_date,start_time,end_time,status,notes,created_at,updated_at)
           OUTPUT INSERTED.*
           VALUES(@coachId,@memberId,@bookingDate,@startTime,@endTime,N'pending',@notes,SYSUTCDATETIME(),SYSUTCDATETIME())`,
        );
      await tx.commit();
      sendSuccess(res, inserted.recordset[0], 'Booking created', 201);
    } catch (error) {
      try { await tx.rollback(); } catch { /* preserve the original error */ }
      if (sqlConflict(error)) throw new AppError(409, 'The selected appointment slot is no longer available');
      throw error;
    }
  } catch (error) {
    next(error);
  }
}

export async function getMyBookings(req: Request, res: Response, next: NextFunction) {
  try {
    const role = req.user!.role;
    const { clause, params } = scopeForRole(role, req.user!.userId);
    const pageValue = Number(req.query.page);
    const limitValue = Number(req.query.limit);
    const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1;
    const limit = Number.isSafeInteger(limitValue) && limitValue > 0 ? Math.min(limitValue, 100) : 50;
    const offset = (page - 1) * limit;
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    const statusFilter = status ? ' AND b.status=@status' : '';
    const list = await query<BookingRow>(
      `${bookingSelect(`${clause}${statusFilter}`)} ORDER BY b.booking_date ASC,b.start_time ASC,b.id ASC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
      { ...params, ...(status ? { status } : {}), offset, limit },
    );
    const total = await query<{ total: number }>(`SELECT COUNT(*) AS total FROM dbo.Bookings b WHERE ${clause}${statusFilter}`, { ...params, ...(status ? { status } : {}) });
    sendSuccess(res, list.recordset, 'Bookings fetched', 200, { pagination: { page, limit, total: Number(total.recordset[0]?.total ?? 0), totalPages: Math.ceil(Number(total.recordset[0]?.total ?? 0) / limit) } });
  } catch (error) {
    next(error);
  }
}

export async function getBookingById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) throw new AppError(400, 'Booking ID must be a positive integer');
    const { clause, params } = scopeForRole(req.user!.role, req.user!.userId);
    const result = await query<BookingRow>(`${bookingSelect(`b.id=@id AND ${clause}`)}`, { id, ...params });
    if (!result.recordset[0]) throw new AppError(404, 'Booking not found');
    sendSuccess(res, result.recordset[0]);
  } catch (error) {
    next(error);
  }
}

export async function updateBookingStatus(req: Request, res: Response, next: NextFunction) {
  const id = Number(req.params.id);
  const requestedStatus = (req.body as { status: BookingStatus }).status;
  try {
    if (!Number.isSafeInteger(id) || id <= 0) throw new AppError(400, 'Booking ID must be a positive integer');
    const role = req.user!.role;
    const tx = (await getPool()).transaction();
    await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    try {
      const ownership = role === 'coach' ? ' AND coach_id=@userId' : role === 'member' ? ' AND member_id=@userId' : role === 'admin' ? '' : ' AND 1=0';
      const current = await new sql.Request(tx)
        .input('id', sql.Int, id)
        .input('userId', sql.Int, req.user!.userId)
        .query<BookingRow>(`SELECT TOP 1 b.* FROM dbo.Bookings b WITH (UPDLOCK,HOLDLOCK) WHERE b.id=@id${ownership}`);
      if (!current.recordset[0]) throw new AppError(404, 'Booking not found');
      const booking = current.recordset[0];
      const currentStatus = booking.status;
      if (role === 'member' && requestedStatus !== 'cancelled') throw new AppError(403, 'Members may only cancel their own bookings');
      if (!isValidBookingTransition(currentStatus, requestedStatus)) throw new AppError(409, 'Invalid booking status transition');

      const date = dbDateToString(booking.booking_date);
      const startTime = normalizeSqlTime(booking.start_time);
      const endTime = normalizeSqlTime(booking.end_time);
      if (requestedStatus === 'confirmed' && !isFutureLocalDateTime(date, startTime)) throw new AppError(409, 'Past bookings cannot be confirmed');
      if (requestedStatus === 'completed' && isFutureLocalDateTime(date, startTime)) throw new AppError(409, 'Booking cannot be completed before its start time');
      if (requestedStatus === 'no_show' && isFutureLocalDateTime(date, endTime)) throw new AppError(409, 'No-show can only be marked after the appointment');

      const update = await new sql.Request(tx)
        .input('id', sql.Int, id)
        .input('status', sql.VarChar(20), requestedStatus)
        .input('currentStatus', sql.VarChar(20), currentStatus)
        .input('userId', sql.Int, req.user!.userId)
        .query<BookingRow>(
          `UPDATE dbo.Bookings
           SET status=@status,updated_at=SYSUTCDATETIME()
           OUTPUT INSERTED.*
           WHERE id=@id AND status=@currentStatus${ownership}`,
        );
      if (!update.recordset[0]) throw new AppError(409, 'Booking was changed by another request');
      await tx.commit();
      sendSuccess(res, update.recordset[0], 'Booking updated');
    } catch (error) {
      try { await tx.rollback(); } catch { /* preserve the original error */ }
      if (sqlConflict(error)) throw new AppError(409, 'Booking was changed by another request');
      throw error;
    }
  } catch (error) {
    next(error);
  }
}
