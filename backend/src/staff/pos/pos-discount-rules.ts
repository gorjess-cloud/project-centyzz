import { BadRequestException } from '@nestjs/common';
import { cents } from '../../admin/reports/report-math.js';
export type DiscountSelection = {
  type: 'NONE' | 'PWD' | 'SENIOR' | 'PROMO';
  code: string;
};
export function discountSelection(body: any): DiscountSelection {
  const type = String(body?.discountType ?? 'NONE')
    .trim()
    .toUpperCase();
  const code = String(body?.promoCode ?? '')
    .trim()
    .toUpperCase();
  if (!['NONE', 'PWD', 'SENIOR', 'PROMO'].includes(type) || code.length > 50)
    throw new BadRequestException('Choose a valid discount.');
  if (type === 'PROMO' && !code)
    throw new BadRequestException('Enter a promo code.');
  if (type !== 'PROMO' && code)
    throw new BadRequestException('Only one discount may be applied per sale.');
  return { type: type as DiscountSelection['type'], code };
}
export const normalizeScope = (value: string) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');
export function scopeMatches(
  scope: string,
  line: { name: string; categoryName: string },
) {
  const text = String(scope ?? '').trim(),
    normalized = normalizeScope(text);
  if (['all', 'allservice', 'allservices'].includes(normalized)) return true;
  if (/^category:/i.test(text))
    return normalizeScope(text.slice(9)) === normalizeScope(line.categoryName);
  if (/^service:/i.test(text))
    return normalizeScope(text.slice(8)) === normalizeScope(line.name);
  return (
    normalized === normalizeScope(line.name) ||
    normalized === normalizeScope(line.categoryName) ||
    normalized === normalizeScope(line.categoryName).replace(/services?$/, '')
  );
}
export function calculatePosDiscount(
  selection: DiscountSelection,
  lines: {
    name: string;
    categoryName: string;
    unit: number;
    quantity: number;
  }[],
  promo?: any,
  now = Date.now(),
) {
  const subtotal = lines.reduce((n, line) => n + line.unit * line.quantity, 0);
  if (!Number.isSafeInteger(subtotal) || subtotal <= 0)
    throw new BadRequestException('The cart must have a positive total.');
  let discount = 0,
    label = 'No discount',
    promoId: number | null = null;
  const percentage = (value: number, basisPoints: number) =>
    Number((BigInt(value) * BigInt(basisPoints) + 5000n) / 10000n);
  if (selection.type === 'PWD' || selection.type === 'SENIOR') {
    discount = percentage(subtotal, 2000);
    label = selection.type === 'PWD' ? 'PWD (20%)' : 'Senior Citizen (20%)';
  }
  if (selection.type === 'PROMO') {
    if (!promo || String(promo.code).trim().toUpperCase() !== selection.code)
      throw new BadRequestException('Promo code not found.');
    if (!promo.is_active || promo.archived_at)
      throw new BadRequestException('This promo code is inactive.');
    if (promo.starts_at && new Date(promo.starts_at).valueOf() > now)
      throw new BadRequestException('This promo code is not active yet.');
    if (promo.expires_at && new Date(promo.expires_at).valueOf() <= now)
      throw new BadRequestException('This promo code has expired.');
    if (
      promo.usage_limit !== null &&
      Number(promo.usage_count) >= Number(promo.usage_limit)
    )
      throw new BadRequestException(
        'This promo code has reached its usage limit.',
      );
    if (subtotal < cents(promo.min_purchase))
      throw new BadRequestException(
        'The cart does not meet this promo’s minimum purchase.',
      );
    const eligible = lines
      .filter((line) => scopeMatches(promo.description, line))
      .reduce((n, line) => n + line.unit * line.quantity, 0);
    if (!eligible)
      throw new BadRequestException(
        'This promo does not apply to the selected services.',
      );
    const value = cents(promo.discount_value);
    if (value <= 0)
      throw new BadRequestException(
        'This promo has an invalid discount value.',
      );
    if (promo.discount_type === 'PERCENTAGE') {
      if (value > 10000)
        throw new BadRequestException('This promo has an invalid percentage.');
      discount = percentage(eligible, value);
    } else if (promo.discount_type === 'FIXED')
      discount = Math.min(value, eligible);
    else throw new BadRequestException('Unsupported promo discount type.');
    promoId = promo.id;
    label = 'Promo ' + promo.code;
  }
  if (discount >= subtotal)
    throw new BadRequestException('This discount leaves no payable amount.');
  return {
    subtotal,
    discount,
    total: subtotal - discount,
    label,
    promoId,
    type: selection.type,
  };
}
