import {
  calculatePosDiscount,
  discountSelection,
} from './pos-discount-rules.js';
import { promoInput } from '../../admin/promos/promos.service.js';
const lines = [
  { name: 'Haircut', categoryName: 'Hair Services', unit: 15000, quantity: 1 },
  { name: 'Manicure', categoryName: 'Nail Services', unit: 30000, quantity: 1 },
];
const promo = {
  id: 1,
  code: 'HAIR20',
  description: 'Category: Hair Services',
  discount_type: 'PERCENTAGE',
  discount_value: '20.00',
  min_purchase: '0.00',
  usage_limit: 5,
  usage_count: 0,
  is_active: true,
  archived_at: null,
  starts_at: '2026-01-01T00:00:00Z',
  expires_at: '2027-01-01T00:00:00Z',
};
const now = Date.parse('2026-10-28T04:00:00Z'),
  selection = { type: 'PROMO' as const, code: 'HAIR20' };
describe('Staff single-discount rules', () => {
  it('normalizes the promo code and rejects stacked or incomplete selections', () => {
    expect(
      discountSelection({ discountType: 'promo', promoCode: ' hair20 ' }),
    ).toEqual(selection);
    for (const body of [
      { discountType: 'PWD', promoCode: 'HAIR20' },
      { discountType: 'SENIOR', promoCode: 'HAIR20' },
      { discountType: 'PROMO' },
      { discountType: 'MANUAL' },
    ])
      expect(() => discountSelection(body)).toThrow();
  });
  it.each(['PWD', 'SENIOR'] as const)(
    'calculates %s as the approved 20 percent',
    (type) => {
      const r = calculatePosDiscount({ type, code: '' }, lines);
      expect(r).toMatchObject({
        subtotal: 45000,
        discount: 9000,
        total: 36000,
      });
    },
  );
  it('rounds fractional cents once across the complete eligible subtotal', () => {
    expect(
      calculatePosDiscount({ type: 'PWD', code: '' }, [
        { ...lines[0], unit: 101, quantity: 1 },
      ]).discount,
    ).toBe(20);
  });
  it('applies a percentage only to services in the selected category', () => {
    expect(calculatePosDiscount(selection, lines, promo, now)).toMatchObject({
      discount: 3000,
      total: 42000,
      promoId: 1,
    });
  });
  it('caps a fixed discount at the eligible service amount', () => {
    expect(
      calculatePosDiscount(
        selection,
        lines,
        { ...promo, discount_type: 'FIXED', discount_value: '999.00' },
        now,
      ).discount,
    ).toBe(15000);
  });
  it('recognizes the existing hair services free-text scope', () => {
    expect(
      calculatePosDiscount(
        selection,
        lines,
        { ...promo, description: 'hair services' },
        now,
      ).discount,
    ).toBe(3000);
  });
  it('rejects wrong service scopes instead of applying to the whole cart', () => {
    expect(() =>
      calculatePosDiscount(
        selection,
        lines,
        { ...promo, description: 'Unknown promotion' },
        now,
      ),
    ).toThrow('does not apply');
  });
  it.each([
    { is_active: false },
    { archived_at: '2026-01-01' },
    { starts_at: '2027-01-01' },
    { expires_at: '2026-01-01' },
    { usage_count: 5 },
    { min_purchase: '500.00' },
  ])('rejects invalid promo availability %j', (changes) => {
    expect(() =>
      calculatePosDiscount(selection, lines, { ...promo, ...changes }, now),
    ).toThrow();
  });
  it('allows unlimited redemptions when the configured limit is null', () => {
    expect(
      calculatePosDiscount(
        selection,
        lines,
        { ...promo, usage_limit: null, usage_count: 1000 },
        now,
      ).discount,
    ).toBe(3000);
  });
  it('does not turn a full-discount cart into a fabricated positive payment', () => {
    expect(() =>
      calculatePosDiscount(
        selection,
        lines,
        {
          ...promo,
          description: 'All Services',
          discount_type: 'FIXED',
          discount_value: '9999.00',
        },
        now,
      ),
    ).toThrow('no payable');
  });
  it('preserves full Philippine start and end dates for new Admin promos', () => {
    const r = promoInput({
      title: ' new20 ',
      appliesTo: 'All Services',
      discountType: '% Off',
      value: '20',
      minPurchase: '0',
      usageLimit: '10',
      startDate: '2026-11-01',
      endDate: '2026-11-01',
    });
    expect(r).toMatchObject({
      code: 'NEW20',
      value: 20,
      limit: 10,
      start: '2026-10-31T16:00:00.000Z',
      end: '2026-11-01T16:00:00.000Z',
    });
  });
  it('rejects invalid Admin dates, zero/100-percent discounts and invalid limits', () => {
    const dto = {
      title: 'PROMO',
      appliesTo: 'All Services',
      discountType: '% Off',
      value: '20',
      startDate: '2026-11-01',
      endDate: '2026-11-02',
    };
    for (const change of [
      { endDate: '2026-10-01' },
      { value: '0' },
      { value: '100' },
      { usageLimit: '1.5' },
    ])
      expect(() => promoInput({ ...dto, ...change })).toThrow();
  });
});
