/**
 * Tests for WCAG Categorization Logic
 */

import { describe, test, expect } from 'bun:test';
import { parseGeminiResponse } from '../response-parser';
import { calculateMetrics } from '../metrics';
import type { Issue } from '@/types/audit';

describe('WCAG Principle Mapping', () => {
  test('should map criterion 1.x to Perceivable', () => {
    const mockResponse = `
## Issue 1
WCAG Criterion: 1.1.1
Title: Missing alt text
Severity: serious
    `;
    
    const issues = parseGeminiResponse(mockResponse);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].wcag_principle).toBe('perceivable');
    expect(issues[0].wcag_criterion).toBe('1.1.1');
  });

  test('should map criterion 2.x to Operable', () => {
    const mockResponse = `
## Issue 1
WCAG Criterion: 2.4.6
Title: Missing heading
Severity: moderate
    `;
    
    const issues = parseGeminiResponse(mockResponse);
    expect(issues[0].wcag_principle).toBe('operable');
    expect(issues[0].wcag_criterion).toBe('2.4.6');
  });

  test('should map criterion 3.x to Understandable', () => {
    const mockResponse = `
## Issue 1
WCAG Criterion: 3.1.1
Title: Missing language attribute
Severity: serious
    `;
    
    const issues = parseGeminiResponse(mockResponse);
    expect(issues[0].wcag_principle).toBe('understandable');
  });

  test('should map criterion 4.x to Robust', () => {
    const mockResponse = `
## Issue 1
WCAG Criterion: 4.1.2
Title: Invalid ARIA
Severity: critical
    `;
    
    const issues = parseGeminiResponse(mockResponse);
    expect(issues[0].wcag_principle).toBe('robust');
  });
});

describe('Severity Mapping', () => {
  test('should extract critical severity', () => {
    const mockResponse = `
## Issue 1
Title: Critical keyboard issue
Severity: critical
WCAG: 2.1.1
    `;
    
    const issues = parseGeminiResponse(mockResponse);
    expect(issues[0].severity).toBe('critical');
  });

  test('should extract serious severity', () => {
    const mockResponse = `
## Issue 1
Title: Serious contrast issue
Severity: serious
WCAG: 1.4.3
    `;
    
    const issues = parseGeminiResponse(mockResponse);
    expect(issues[0].severity).toBe('serious');
  });

  test('should extract moderate severity', () => {
    const mockResponse = `
## Issue 1
Title: Moderate heading issue
Severity: moderate
WCAG: 2.4.6
    `;
    
    const issues = parseGeminiResponse(mockResponse);
    expect(issues[0].severity).toBe('moderate');
  });

  test('should extract minor severity', () => {
    const mockResponse = `
## Issue 1
Title: Minor label issue
Severity: minor
WCAG: 3.3.2
    `;
    
    const issues = parseGeminiResponse(mockResponse);
    expect(issues[0].severity).toBe('minor');
  });

  test('should default to moderate when severity unclear', () => {
    const mockResponse = `
## Issue 1
Title: Some issue
WCAG: 1.1.1
    `;
    
    const issues = parseGeminiResponse(mockResponse);
    expect(issues[0].severity).toBe('moderate');
  });
});

describe('Metrics Calculation by Principle', () => {
  test('should count issues by WCAG principle', () => {
    const issues: Issue[] = [
      {
        wcag_criterion: '1.1.1',
        wcag_level: 'A',
        wcag_principle: 'perceivable',
        title: 'Issue 1',
        description: 'Test',
        severity: 'serious',
        source: 'ai-heuristic',
        how_to_fix: 'Fix it',
      },
      {
        wcag_criterion: '2.1.1',
        wcag_level: 'A',
        wcag_principle: 'operable',
        title: 'Issue 2',
        description: 'Test',
        severity: 'critical',
        source: 'ai-heuristic',
        how_to_fix: 'Fix it',
      },
      {
        wcag_criterion: '1.4.3',
        wcag_level: 'AA',
        wcag_principle: 'perceivable',
        title: 'Issue 3',
        description: 'Test',
        severity: 'moderate',
        source: 'ai-heuristic',
        how_to_fix: 'Fix it',
      },
    ];

    const metrics = calculateMetrics(issues);
    
    expect(metrics.total_issues).toBe(3);
    expect(metrics.perceivable_issues).toBe(2);
    expect(metrics.operable_issues).toBe(1);
    expect(metrics.understandable_issues).toBe(0);
    expect(metrics.robust_issues).toBe(0);
  });

  test('should count issues by severity', () => {
    const issues: Issue[] = [
      {
        wcag_criterion: '1.1.1',
        wcag_level: 'A',
        wcag_principle: 'perceivable',
        title: 'Issue 1',
        description: 'Test',
        severity: 'critical',
        source: 'ai-heuristic',
        how_to_fix: 'Fix it',
      },
      {
        wcag_criterion: '2.1.1',
        wcag_level: 'A',
        wcag_principle: 'operable',
        title: 'Issue 2',
        description: 'Test',
        severity: 'critical',
        source: 'ai-heuristic',
        how_to_fix: 'Fix it',
      },
      {
        wcag_criterion: '1.4.3',
        wcag_level: 'AA',
        wcag_principle: 'perceivable',
        title: 'Issue 3',
        description: 'Test',
        severity: 'moderate',
        source: 'ai-heuristic',
        how_to_fix: 'Fix it',
      },
    ];

    const metrics = calculateMetrics(issues);
    
    expect(metrics.critical_issues).toBe(2);
    expect(metrics.serious_issues).toBe(0);
    expect(metrics.moderate_issues).toBe(1);
    expect(metrics.minor_issues).toBe(0);
  });
});

describe('JSON Response Parsing', () => {
  test('should parse JSON format response', () => {
    const mockResponse = `
\`\`\`json
{
  "issues": [
    {
      "wcag_criterion": "1.1.1",
      "wcag_level": "A",
      "title": "Missing alt text",
      "description": "Image lacks alternative text",
      "severity": "serious",
      "selector": "img.logo",
      "how_to_fix": "Add alt attribute"
    }
  ]
}
\`\`\`
    `;
    
    const issues = parseGeminiResponse(mockResponse);
    expect(issues.length).toBe(1);
    expect(issues[0].wcag_criterion).toBe('1.1.1');
    expect(issues[0].wcag_principle).toBe('perceivable');
    expect(issues[0].severity).toBe('serious');
    expect(issues[0].element_selector).toBe('img.logo');
  });
});
