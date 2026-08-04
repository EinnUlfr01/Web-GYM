import * as bcrypt from 'bcryptjs';
import { closePool, query } from '../config/database';
import { COACH_BOOKING_TIME_ZONE } from '../utils/coachBooking';
import { todayInTimeZone } from '../utils/timezone';

if (process.env.COACH_BOOKING_ACCEPTANCE !== '1' || !process.env.DB_NAME?.startsWith('GYMFIT_DB_COACH_BOOKING_ACCEPTANCE_')) {
  throw new Error('Coach booking acceptance requires COACH_BOOKING_ACCEPTANCE=1 and an isolated GYMFIT_DB_COACH_BOOKING_ACCEPTANCE_* database');
}

const base = process.env.COACH_API_BASE || 'http://localhost:5000/api';
const suffix = `${Date.now()}`;
const password = `CoachBook#${suffix.slice(-8)}`;
const emails = {
  coachA: `coach-booking-a-${suffix}@example.test`,
  coachB: `coach-booking-b-${suffix}@example.test`,
  suspended: `coach-booking-suspended-${suffix}@example.test`,
  memberA: `member-booking-a-${suffix}@example.test`,
  memberB: `member-booking-b-${suffix}@example.test`,
  admin: `admin-booking-${suffix}@example.test`,
  seller: `seller-booking-${suffix}@example.test`,
};

type AccountKey = keyof typeof emails;
type Account = { id: number; email: string; password: string; token?: string };
const accounts = Object.fromEntries(Object.entries(emails).map(([key, email]) => [key, { id: 0, email, password }])) as Record<AccountKey, Account>;
const check = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(`ASSERTION_FAILED ${message}`);
  console.log(`PASS ${message}`);
};

function datePlus(days: number): string {
  const today = todayInTimeZone(COACH_BOOKING_TIME_ZONE);
  const [year, month, day] = today.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day) + days * 86400000);
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`;
}

async function cleanup(): Promise<void> {
  const users = await query<{ id: number }>('SELECT id FROM dbo.Users WHERE email LIKE @prefix', { prefix: `%-${suffix}@example.test` });
  const ids = users.recordset.map(row => Number(row.id));
  if (ids.length === 0) return;
  const csv = ids.join(',');
  await query(`DELETE FROM dbo.Bookings WHERE coach_id IN (${csv}) OR member_id IN (${csv})`);
  await query(`DELETE FROM dbo.CoachProfiles WHERE coach_id IN (${csv})`);
  await query(`DELETE FROM dbo.AuthSessions WHERE user_id IN (${csv})`);
  await query(`DELETE FROM dbo.Users WHERE id IN (${csv})`);
}

async function seed(): Promise<void> {
  await cleanup();
  const hash = await bcrypt.hash(password, 10);
  const roles: Record<AccountKey, string> = {
    coachA: 'coach', coachB: 'coach', suspended: 'coach', memberA: 'member', memberB: 'member', admin: 'admin', seller: 'seller',
  };
  for (const key of Object.keys(emails) as AccountKey[]) {
    const result = await query<{ id: number }>(
      `INSERT dbo.Users(email,password,name,role,is_active,email_verified,token_version,coach_status)
       OUTPUT INSERTED.id VALUES(@email,@password,@name,@role,1,1,0,@coachStatus)`,
      { email: emails[key], password: hash, name: `Booking ${key}`, role: roles[key], coachStatus: key === 'suspended' ? 'SUSPENDED' : roles[key] === 'coach' ? 'ACTIVE' : null },
    );
    accounts[key].id = Number(result.recordset[0].id);
  }
  await query(
    `INSERT dbo.CoachProfiles(coach_id,specialty,bio,experience_years,session_mode,location,booking_enabled)
     VALUES(@coachA,N'Strength',N'Acceptance Coach A',5,N'BOTH',N'GYMFIT',1),
           (@coachB,N'Mobility',N'Acceptance Coach B',4,N'ONLINE',N'Online',1),
           (@suspended,N'Suspended',N'Not publicly bookable',3,N'IN_PERSON',N'GYMFIT',1)`,
    { coachA: accounts.coachA.id, coachB: accounts.coachB.id, suspended: accounts.suspended.id },
  );
}

type ApiResult = { status: number; data: { data?: any; message?: string } };
async function call(method: string, path: string, account?: Account, body?: unknown): Promise<ApiResult> {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(account?.token ? { Authorization: `Bearer ${account.token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let data: ApiResult['data'] = {};
  try { data = JSON.parse(text) as ApiResult['data']; } catch { data = { message: text }; }
  return { status: response.status, data };
}

async function login(account: Account): Promise<void> {
  const result = await call('POST', '/auth/login', undefined, { email: account.email, password: account.password });
  check(result.status === 200 && typeof result.data.data?.accessToken === 'string', `${account.email} login`);
  account.token = result.data.data.accessToken;
}

async function run(): Promise<void> {
  await seed();
  await Promise.all([accounts.coachA, accounts.coachB, accounts.suspended, accounts.memberA, accounts.memberB, accounts.admin, accounts.seller].map(login));

  const bookingDate = datePlus(2);
  const secondDate = datePlus(3);
  const list = await call('GET', '/coaches');
  check(list.status === 200 && list.data.data.coaches.some((coach: any) => Number(coach.id) === accounts.coachA.id), 'public list returns active Coach');
  check(!list.data.data.coaches.some((coach: any) => Number(coach.id) === accounts.suspended.id), 'suspended Coach is hidden from public list');
  check((await call('GET', `/coaches/${accounts.suspended.id}`)).status === 404, 'suspended Coach detail is 404');
  const availability = await call('GET', `/coaches/${accounts.coachA.id}/availability?date=${bookingDate}`);
  check(availability.status === 200 && availability.data.data.duration_minutes === 60 && availability.data.data.timezone === COACH_BOOKING_TIME_ZONE, 'availability uses canonical timezone and duration');

  check((await call('POST', '/bookings', undefined, { coachId: accounts.coachA.id, date: bookingDate, startTime: '10:00' })).status === 401, 'guest cannot create booking');
  check((await call('POST', '/bookings', accounts.coachA, { coachId: accounts.coachA.id, date: bookingDate, startTime: '10:00' })).status === 403, 'Coach cannot create member booking');
  check((await call('POST', '/bookings', accounts.admin, { coachId: accounts.coachA.id, date: bookingDate, startTime: '10:00' })).status === 403, 'Admin cannot create member booking');
  check((await call('POST', '/bookings', accounts.seller, { coachId: accounts.coachA.id, date: bookingDate, startTime: '10:00' })).status === 403, 'Seller cannot create member booking');

  const created = await call('POST', '/bookings', accounts.memberA, { coachId: accounts.coachA.id, date: bookingDate, startTime: '10:00', note: 'Real pending booking' });
  check(created.status === 201 && created.data.data.status === 'pending' && created.data.data.end_time.slice(0, 5) === '11:00', 'member creates a pending 60-minute booking');
  const bookingId = Number(created.data.data.id);
  check((await call('POST', '/bookings', accounts.memberB, { coachId: accounts.coachA.id, date: bookingDate, startTime: '10:00' })).status === 409, 'exact duplicate/Coach overlap is rejected');
  check((await call('POST', '/bookings', accounts.memberA, { coachId: accounts.suspended.id, date: bookingDate, startTime: '10:00' })).status === 404, 'suspended Coach cannot be booked');
  check((await call('POST', '/bookings', accounts.memberA, { coachId: accounts.coachB.id, date: bookingDate, startTime: '10:00' })).status === 201, 'Member can book a different active Coach');
  check((await call('POST', '/bookings', accounts.memberA, { coachId: accounts.coachB.id, date: bookingDate, startTime: '11:00' })).status === 409, 'Member overlap is rejected');
  check((await call('POST', '/bookings', accounts.memberA, { coachId: accounts.coachB.id, date: bookingDate, startTime: '13:00', note: 'x'.repeat(501) })).status === 400, 'oversized note is rejected');

  const concurrent = await Promise.all([
    call('POST', '/bookings', accounts.memberA, { coachId: accounts.coachB.id, date: secondDate, startTime: '10:00' }),
    call('POST', '/bookings', accounts.memberB, { coachId: accounts.coachB.id, date: secondDate, startTime: '10:00' }),
  ]);
  check(concurrent.map(item => item.status).sort((a, b) => a - b).join(',') === '201,409', 'concurrent same-slot requests are serialized');

  check((await call('GET', `/bookings/${bookingId}`, accounts.memberB)).status === 404, 'Member IDOR read is blocked');
  check((await call('PUT', `/bookings/${bookingId}/status`, accounts.memberB, { status: 'cancelled' })).status === 404, 'Member IDOR mutation is blocked');
  check((await call('GET', `/bookings/${bookingId}`, accounts.coachB)).status === 404, 'Coach IDOR read is blocked');
  check((await call('PUT', `/bookings/${bookingId}/status`, accounts.coachB, { status: 'confirmed' })).status === 404, 'Coach IDOR mutation is blocked');
  check((await call('PUT', `/bookings/${bookingId}/status`, accounts.coachA, { status: 'completed' })).status === 409, 'future booking cannot be completed');
  const confirmed = await call('PUT', `/bookings/${bookingId}/status`, accounts.coachA, { status: 'confirmed' });
  check(confirmed.status === 200 && confirmed.data.data.status === 'confirmed', 'owner Coach confirms pending booking');
  check((await call('PUT', `/bookings/${bookingId}/status`, accounts.coachA, { status: 'confirmed' })).status === 409, 'duplicate state transition is rejected');

  const legacy = await call('POST', '/bookings', accounts.memberB, { coach_id: accounts.coachA.id, booking_date: secondDate, start_time: '13:00', end_time: '14:00' });
  check(legacy.status === 201 && legacy.data.data.status === 'pending', 'legacy snake_case create payload remains compatible');
  const cancelled = await call('PUT', `/bookings/${Number(legacy.data.data.id)}/status`, accounts.memberB, { status: 'cancelled' });
  check(cancelled.status === 200 && cancelled.data.data.status === 'cancelled', 'Member cancels own booking');
  check((await call('PUT', `/bookings/${Number(legacy.data.data.id)}/status`, accounts.coachA, { status: 'confirmed' })).status === 409, 'terminal cancelled booking cannot be confirmed');

  await query(
    `INSERT dbo.Bookings(coach_id,member_id,booking_date,start_time,end_time,status,notes)
     VALUES(@coach,@member,@pastDate,N'09:00',N'10:00',N'confirmed',N'acceptance past completion')`,
    { coach: accounts.coachA.id, member: accounts.memberB.id, pastDate: datePlus(-2) },
  );
  const past = await query<{ id: number }>('SELECT TOP 1 id FROM dbo.Bookings WHERE coach_id=@coach AND member_id=@member AND booking_date=@pastDate ORDER BY id DESC', { coach: accounts.coachA.id, member: accounts.memberB.id, pastDate: datePlus(-2) });
  check((await call('PUT', `/bookings/${Number(past.recordset[0].id)}/status`, accounts.coachA, { status: 'completed' })).status === 200, 'confirmed past booking can be completed');

  console.log(JSON.stringify({ verdict: 'PASS', database: process.env.DB_NAME, bookingId, seededAccountKeys: Object.keys(accounts) }));
}

if (process.argv.includes('--cleanup')) {
  cleanup().then(() => console.log(`COACH_BOOKING_CLEANUP PASS ${process.env.DB_NAME}`)).catch(error => { console.error(error); process.exitCode = 1; }).finally(closePool);
} else {
  run().catch(error => { console.error(error); process.exitCode = 1; }).finally(closePool);
}
