import { test } from 'node:test';
import assert from 'node:assert/strict';
import { monthlyPriceCents } from '../src/auth/subscription';
test('monthly ARS amount converts decimal text to integer cents without rounding', () => {
  for (const [text, cents] of [['15000,50', 1500050], ['15000.5', 1500050], ['0', 0], ['1,01', 101], ['9999999,99', 999999999]] as const) assert.equal(monthlyPriceCents(text), cents);
});
test('monthly amount rejects negative, exponent, ambiguous separators and oversized prices', () => {
  for (const value of ['', '-1', '1e5', '15.000,50', '1.234', 'NaN', 'Infinity', '10000000', '4,123', '1,2,3', '<script>']) assert.throws(() => monthlyPriceCents(value));
});
