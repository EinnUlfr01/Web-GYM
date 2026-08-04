import assert from 'node:assert/strict';
import {
  addMinutesToTime,
  assertBookingDate,
  assertBookingStartTime,
  COACH_BOOKING_DURATION_MINUTES,
  COACH_BOOKING_MAX_DAYS,
  COACH_BOOKING_TIME_ZONE,
  intervalsOverlap,
  isFutureLocalDateTime,
  isValidBookingTransition,
  timeToMinutes,
} from '../utils/coachBooking';
import { todayInTimeZone } from '../utils/timezone';

const now = new Date('2026-08-04T03:00:00.000Z'); // 10:00 in Asia/Ho_Chi_Minh
const today = todayInTimeZone(COACH_BOOKING_TIME_ZONE, now);

assert.equal(today, '2026-08-04');
assert.equal(COACH_BOOKING_DURATION_MINUTES, 60);
assert.equal(timeToMinutes('10:30'), 630);
assert.equal(addMinutesToTime('17:00', 60), '18:00');
assert.equal(intervalsOverlap('10:00', '11:00', '10:30', '11:30'), true);
assert.equal(intervalsOverlap('10:00', '11:00', '11:00', '12:00'), false);
assert.equal(isFutureLocalDateTime('2026-08-04', '11:00', now), true);
assert.equal(isFutureLocalDateTime('2026-08-04', '09:00', now), false);
assert.doesNotThrow(() => assertBookingDate(today, now));
assert.doesNotThrow(() => assertBookingStartTime('17:00'));
assert.throws(() => assertBookingStartTime('10:30'));
assert.throws(() => assertBookingDate('2026-08-03', now));

const maxDate = new Date(Date.parse(`${today}T00:00:00Z`) + COACH_BOOKING_MAX_DAYS * 86400000).toISOString().slice(0, 10);
assert.doesNotThrow(() => assertBookingDate(maxDate, now));
const outsideDate = new Date(Date.parse(`${today}T00:00:00Z`) + (COACH_BOOKING_MAX_DAYS + 1) * 86400000).toISOString().slice(0, 10);
assert.throws(() => assertBookingDate(outsideDate, now));

assert.equal(isValidBookingTransition('pending', 'confirmed'), true);
assert.equal(isValidBookingTransition('pending', 'completed'), false);
assert.equal(isValidBookingTransition('confirmed', 'completed'), true);
assert.equal(isValidBookingTransition('completed', 'cancelled'), false);

console.log('COACH_BOOKING_UNIT PASS');
