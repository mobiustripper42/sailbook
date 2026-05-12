import { readFileSync } from 'fs';
import { join } from 'path';
import type { Page } from '@playwright/test';

// Reads the already-installed axe-core lib once at module load.
// axe-core is a transitive dep via eslint-plugin-jsx-a11y; no extra install needed.
const axeSource = readFileSync(
  join(process.cwd(), 'node_modules/axe-core/axe.min.js'),
  'utf-8',
);

export type AxeViolation = {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical' | null;
  description: string;
  help: string;
  helpUrl: string;
  nodes: { html: string; target: string[]; failureSummary: string }[];
};

export type AxeResults = {
  violations: AxeViolation[];
  passes: { id: string }[];
  incomplete: AxeViolation[];
  inapplicable: { id: string }[];
};

/**
 * Inject axe-core into the page and run a WCAG 2.1 AA scan.
 * Returns the full result; callers filter by impact.
 */
export async function runAxe(
  page: Page,
  options: { include?: string; exclude?: string[] } = {},
): Promise<AxeResults> {
  await page.addScriptTag({ content: axeSource });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opts: any = {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  };
  const excludes = ['[data-testid="version-tag"]', ...(options.exclude ?? [])];
  opts.exclude = excludes.map((s) => [s]);

  return await page.evaluate(async ({ opts, include }) => {
    const target = include ?? document;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const axe = (window as any).axe;
    return await axe.run(target, opts);
  }, { opts, include: options.include });
}

/** Filter violations to critical + serious (the bar set by SailBook task 6.5). */
export function criticalOrSerious(violations: AxeViolation[]): AxeViolation[] {
  return violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
}

/** Format violations for readable test output. */
export function formatViolations(violations: AxeViolation[]): string {
  if (violations.length === 0) return 'No violations.';
  return violations
    .map((v) => {
      const targets = v.nodes
        .slice(0, 3)
        .map((n) => `    - ${n.target.join(' ')}\n      ${n.failureSummary.split('\n')[0]}`)
        .join('\n');
      const more = v.nodes.length > 3 ? `\n    ... +${v.nodes.length - 3} more` : '';
      return `[${v.impact}] ${v.id}: ${v.help}\n  ${v.helpUrl}\n${targets}${more}`;
    })
    .join('\n\n');
}
