import { test, expect } from '@playwright/test';
import { fmtDateRelative } from '../src/lib/utils';

// Pure-logic unit tests — no browser, no fixtures. Only one project runs them
// to avoid 3x duplication for date math that doesn't depend on viewport.
test.describe('fmtDateRelative', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'logic-only test');
  });

  function dateOffset(days: number): string {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  test('today returns "Today"', () => {
    expect(fmtDateRelative(dateOffset(0))).toBe('Today');
  });

  test('tomorrow returns "Tomorrow"', () => {
    expect(fmtDateRelative(dateOffset(1))).toBe('Tomorrow');
  });

  test('yesterday returns "Yesterday"', () => {
    expect(fmtDateRelative(dateOffset(-1))).toBe('Yesterday');
  });

  test('two days out returns weekday + month + day', () => {
    const result = fmtDateRelative(dateOffset(2));
    // Format like "Mon, May 4" — at minimum has a 3-letter weekday and a comma.
    expect(result).toMatch(/^[A-Z][a-z]{2}, [A-Z][a-z]{2} \d{1,2}$/);
  });

  test('a week out returns full date format', () => {
    const result = fmtDateRelative(dateOffset(7));
    expect(result).toMatch(/^[A-Z][a-z]{2}, [A-Z][a-z]{2} \d{1,2}$/);
  });

  test('a month out returns full date format', () => {
    const result = fmtDateRelative(dateOffset(30));
    expect(result).toMatch(/^[A-Z][a-z]{2}, [A-Z][a-z]{2} \d{1,2}$/);
  });

  test('past date beyond yesterday returns full date format', () => {
    const result = fmtDateRelative(dateOffset(-5));
    expect(result).toMatch(/^[A-Z][a-z]{2}, [A-Z][a-z]{2} \d{1,2}$/);
  });
});
