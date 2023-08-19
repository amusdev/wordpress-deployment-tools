import { describe, expect, test } from '@jest/globals';
import mathHelper from './math.helper';

describe('Test math helper js', () => {
  test('generate random string', () => {
    expect(mathHelper.random(10, { lower: true, upper: false, numeric: false, symbol: false })).toMatch(/^[a-z]{10}$/);
    expect(mathHelper.random(10, { lower: false, upper: true, numeric: false, symbol: false })).toMatch(/^[A-Z]{10}$/);
    expect(mathHelper.random(10, { lower: false, upper: false, numeric: true, symbol: false })).toMatch(/^[0-9]{10}$/);
    expect(mathHelper.random(10, { lower: false, upper: false, numeric: false, symbol: true })).toMatch(/^[~`!@#$%^&*()_+-={}[\]:";'<>?,./|\\]{10}$/);
  });
});