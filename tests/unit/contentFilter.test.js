
/**
 * Unit tests — Content Filter
 * Covers: editorial/news link rejection, deal validation, title heuristics
 * Filed against: GitHub Issue #4
 */

const { shouldFilterContent } = require('../../src/filters/contentFilter');

describe('Content Filter — editorial/news rejection', () => {
  // --- Titles that MUST be filtered ---
  const nonDealTitles = [
    'How to adapt the oil, energy and food crisis',
    'Why the energy crisis is getting worse',
    'How to survive rising food prices',
    'Adapting to the global oil shortage',
    'Policy response to the food crisis explained',
    'The future of renewable energy — an opinion',
    'Crisis management: what governments should do',
  ];

  test.each(nonDealTitles)(
    'should FILTER editorial title: "%s"',
    (title) => {
      expect(shouldFilterContent({ title, price: null, url: 'https://newssite.com/article' })).toBe(true);
    }
  );

  // --- Titles that MUST NOT be filtered ---
  const dealTitles = [
    { title: 'Sony WH-1000XM5 Headphones — 30% off', price: '$249', url: 'https://amazon.com/dp/123' },
    { title: 'Instant Pot Duo 7-in-1 — $59.99', price: '$59.99', url: 'https://amazon.com/dp/456' },
    { title: 'Nike Air Max — Sale $89', price: '$89', url: 'https://nike.com/sale' },
    { title: 'Energy drink 24-pack — $18.99', price: '$18.99', url: 'https://amazon.com/dp/789' },
    { title: 'Oil diffuser set — 50% off', price: '$14.99', url: 'https://amazon.com/dp/321' },
  ];

  test.each(dealTitles)(
    'should NOT filter legitimate deal: "$title"',
    ({ title, price, url }) => {
      expect(shouldFilterContent({ title, price, url })).toBe(false);
    }
  );

  describe('Edge cases', () => {
    test('should filter when title has no price signal and contains crisis keywords', () => {
      expect(shouldFilterContent({ title: 'Food crisis: how families are coping', price: null, url: 'https://bbc.com/news/article' })).toBe(true);
    });

    test('should filter content from known news domains regardless of title', () => {
      expect(shouldFilterContent({ title: 'Big sale today!', price: null, url: 'https://bbc.com/deal' })).toBe(true);
    });

    test('should handle empty/null title gracefully without throwing', () => {
      expect(() => shouldFilterContent({ title: null, price: null, url: '' })).not.toThrow();
    });

    test('should handle missing fields gracefully', () => {
      expect(() => shouldFilterContent({})).not.toThrow();
    });

    test('should filter title with "how to" pattern and no price', () => {
      expect(shouldFilterContent({ title: 'How to save money on groceries', price: null, url: 'https://randomsite.com' })).toBe(true);
    });
  });
});
