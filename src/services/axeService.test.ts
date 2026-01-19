import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runAxeAnalysisOnSnippet } from './axeService';
import axe from 'axe-core';

// Mock axe-core
vi.mock('axe-core', () => ({
  default: {
    run: vi.fn(),
  },
}));

describe('axeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should run analysis on snippet and map results', async () => {
    // Mock axe result
    const mockViolations = [
      {
        id: 'color-contrast',
        impact: 'serious',
        tags: ['cat.color', 'wcag2aa', 'wcag143'],
        description: 'Ensure contrast ratio',
        help: 'Elements must have sufficient color contrast',
        helpUrl: 'https://deque.com/rules/color-contrast',
        nodes: [
          {
            html: '<button style="color: grey; background: grey;">Btn</button>',
            target: ['button'],
            failureSummary: 'Fix any of the following...',
          },
        ],
      },
    ];

    (axe.run as any).mockResolvedValue({
      violations: mockViolations,
      passes: [],
      incomplete: [],
      inapplicable: [],
    });

    const snippet = '<button>Test</button>';
    const result = await runAxeAnalysisOnSnippet(snippet);

    expect(result.summary.failed).toBe(1);
    expect(result.summary.serious).toBe(1);
    
    const issue = result.issues[0];
    expect(issue.id).toContain('color-contrast');
    expect(issue.severity).toBe('serious');
    expect(issue.wcagLevel).toBe('AA');
    // Note: The service maps cat.color? Wait, let's see logic in implementation
    // The implementation might default to 'perceivable' if tags don't match list
  });

  it('should handle empty snippet', async () => {
    (axe.run as any).mockResolvedValue({
      violations: [],
      passes: [],
      incomplete: [],
      inapplicable: [],
    });

    const result = await runAxeAnalysisOnSnippet('');
    expect(result.summary.totalIssues).toBe(0);
    expect(result.issues).toHaveLength(0);
  });
});
