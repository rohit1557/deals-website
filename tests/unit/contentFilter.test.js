// contentFilter.test.js
// Regression tests for deal content filtering
// Filed against: GitHub Issue #6 — editorial headline not filtered

const { isValidDeal } = require('../../src/utils/contentFilter');

describe('Content Filter — editorial/non-deal titles', () => {
  // --- Should FAIL (not a deal) ---
  test('rejects "How to adapt the oil, energy and food crisis"', () => {
    expect(isValidDeal('How to adapt the oil, energy and food crisis')).toBe(false);
  });

  test('rejects titles starting with "How to"', () => {
    expect(isValidDeal('How to save money on groceries')).toBe(false);
  });

  test('rejects titles containing "crisis"', () => {
    expect(isValidDeal('The energy crisis explained')).toBe(false);
  });

  test('rejects "Guide to..." headlines', () => {
    expect(isValidDeal('Guide to surviving inflation')).toBe(false);
  });

  test('rejects "What is..." editorial titles', () => {
    expect(isValidDeal('What is the best way to cut costs?')).toBe(false);
  });

  test('rejects titles with no price and no product signal', () => {
    expect(isValidDeal('Why you should care about energy prices')).toBe(false);
  });

  // --- Should PASS (real deals) ---
  test('accepts deal title with price signal', () => {
    expect(isValidDeal('Sony WH-1000XM5 headphones — $279 (save $70)')).toBe(true);
  });

  test('accepts deal title with discount percentage', () => {
    expect(isValidDeal('Instant Pot Duo 7-in-1, 50% off today only')).toBe(true);
  });

  test('accepts deal title with brand and product name', () => {
    expect(isValidDeal('Nike Air Max 90 — limited time sale')).toBe(true);
  });

  test('accepts deal title with "deal" keyword', () => {
    expect(isValidDeal('Best deal on MacBook Air M2 right now')).toBe(true);
  });
});
