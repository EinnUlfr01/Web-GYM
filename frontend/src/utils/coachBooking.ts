export const COACH_BOOKING_TIME_ZONE = 'Asia/Ho_Chi_Minh';

function partsForDate(value: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: COACH_BOOKING_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const values = Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
  return { year: Number(values.year), month: Number(values.month), day: Number(values.day) };
}

export function todayInCoachTimeZone(now = new Date()): string {
  const { year, month, day } = partsForDate(now);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function coachDateOptions(days = 14, now = new Date()): Array<{ value: string; label: string }> {
  const { year, month, day } = partsForDate(now);
  const base = Date.UTC(year, month - 1, day);
  return Array.from({ length: days }, (_, index) => {
    const valueDate = new Date(base + index * 86400000);
    const value = `${valueDate.getUTCFullYear()}-${String(valueDate.getUTCMonth() + 1).padStart(2, '0')}-${String(valueDate.getUTCDate()).padStart(2, '0')}`;
    const label = valueDate.toLocaleDateString('vi-VN', {
      timeZone: COACH_BOOKING_TIME_ZONE,
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
    return { value, label };
  });
}
