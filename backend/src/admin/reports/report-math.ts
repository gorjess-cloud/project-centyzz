import { BadRequestException } from '@nestjs/common';
export const PH = 'Asia/Manila';
export const reportToday = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: PH,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
export const moveDay = (date: string, days: number) =>
  new Date(Date.parse(date + 'T00:00:00Z') + days * 86400000)
    .toISOString()
    .slice(0, 10);
export function reportDate(value: unknown) {
  if (
    typeof value !== 'string' ||
    !/^20\d{2}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value + 'T00:00:00Z')) ||
    new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) !== value
  )
    throw new BadRequestException('Choose a valid calendar date.');
  return value;
}
export function reportRange(
  from: unknown,
  to?: unknown,
  today = reportToday(),
  enforceWindow = true,
) {
  const start = reportDate(from ?? today),
    end = reportDate(to ?? start);
  if (
    start > end ||
    Date.parse(end + 'T00:00:00Z') - Date.parse(start + 'T00:00:00Z') >
      29 * 86400000
  )
    throw new BadRequestException('Choose an ordered range of up to 30 days.');
  if (enforceWindow && (start < moveDay(today, -29) || end > today))
    throw new BadRequestException(
      'Reports are available for the latest 30 days.',
    );
  return { start, end };
}
export function cents(value: unknown) {
  const text = String(value ?? 0);
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(text))
    throw new BadRequestException('A stored monetary amount is invalid.');
  const negative = text.startsWith('-'),
    [whole, fraction = ''] = text.replace(/^-/, '').split('.');
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(result))
    throw new BadRequestException(
      'A stored amount is outside the supported range.',
    );
  return negative ? -result : result;
}
export const amount = (value: number) => value / 100;
export const peso = (value: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(
    amount(value),
  );
export type Sale = {
  id: string;
  txnId: string;
  date: string;
  time: string;
  cashier: string;
  cashierId: number | null;
  service: string;
  method: string;
  amountCents: number;
  cashCents: number;
  digitalCents: number;
  otherCents: number;
  status: string;
  source: 'legacy' | 'transaction';
  legacyId?: number;
  unlinked: boolean;
  signature: string;
};
export function salesTotals(rows: Sale[]) {
  let gross = 0,
    refunds = 0,
    voided = 0,
    cashGross = 0,
    digitalGross = 0,
    otherGross = 0,
    cashRefunds = 0,
    digitalRefunds = 0,
    otherRefunds = 0,
    completedCount = 0,
    refundCount = 0;
  for (const row of rows) {
    if (row.status === 'COMPLETED') {
      if (row.amountCents < 0)
        throw new BadRequestException(
          'A completed sale has a negative amount.',
        );
      gross += row.amountCents;
      cashGross += row.cashCents;
      digitalGross += row.digitalCents;
      otherGross += row.otherCents;
      completedCount++;
    } else if (row.status === 'REFUNDED') {
      refunds += Math.abs(row.amountCents);
      cashRefunds += Math.abs(row.cashCents);
      digitalRefunds += Math.abs(row.digitalCents);
      otherRefunds += Math.abs(row.otherCents);
      refundCount++;
    } else if (row.status === 'VOIDED') voided += Math.abs(row.amountCents);
  }
  return {
    gross,
    refunds,
    voided,
    net: gross - refunds,
    cash: cashGross - cashRefunds,
    digital: digitalGross - digitalRefunds,
    other: otherGross - otherRefunds,
    completedCount,
    refundCount,
  };
}
export function csvCell(value: unknown) {
  let text = String(value ?? '');
  if (!/^-?\d+(?:\.\d+)?$/.test(text) && /^[\s]*[=+\-@\t\r]/.test(text))
    text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
