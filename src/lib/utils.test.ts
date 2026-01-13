import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    const result = cn('bg-red-500', 'text-white');
    expect(result).toBe('bg-red-500 text-white');
  });

  it('should handle tailwind conflicts', () => {
    // block overrides inline
    const result = cn('inline', 'block');
    expect(result).toBe('block');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const isError = false;
    const result = cn(
      'base-class',
      isActive && 'active-class',
      isError && 'error-class'
    );
    expect(result).toBe('base-class active-class');
  });

  it('should handle undefined and null', () => {
    const result = cn('base', undefined, null, 'extra');
    expect(result).toBe('base extra');
  });
});
