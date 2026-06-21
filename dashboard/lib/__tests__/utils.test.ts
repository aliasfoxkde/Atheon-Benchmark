/**
 * Utility Functions Unit Tests
 * Tests for utility functions in lib/utils.ts
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  cn,
  formatDate,
  formatDateTime,
  formatDuration,
  formatNumber,
  debounce
} from '../utils';

describe('cn (className utility)', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should handle Tailwind class conflicts', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
  });

  it('should handle arrays of classes', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('should handle objects with boolean values', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });
});

describe('formatDate', () => {
  it('should format Date object correctly', () => {
    const date = new Date('2026-06-19T12:00:00Z');
    const result = formatDate(date);
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/2026/);
  });

  it('should format date string correctly', () => {
    const result = formatDate('2026-06-19');
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/2026/);
  });

  it('should handle different date formats', () => {
    const result = formatDate('2026-12-25');
    expect(result).toMatch(/Dec/);
    expect(result).toMatch(/2026/);
  });

  it('should handle leap year dates', () => {
    const result = formatDate('2024-02-29');
    expect(result).toMatch(/Feb/);
    expect(result).toMatch(/2024/);
  });
});

describe('formatDateTime', () => {
  it('should format datetime correctly', () => {
    const date = new Date('2026-06-19T14:30:00Z');
    const result = formatDateTime(date);
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/AM|PM|\d{2}:\d{2}/);
  });

  it('should include time component', () => {
    const date = new Date('2026-06-19T08:45:00Z');
    const result = formatDateTime(date);
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/AM|PM|\d{2}:\d{2}/);
  });

  it('should format datetime string', () => {
    const result = formatDateTime('2026-06-19T12:00:00Z');
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/2026/);
  });
});

describe('formatDuration', () => {
  it('should format milliseconds correctly', () => {
    expect(formatDuration(500)).toBe('500ms');
  });

  it('should format seconds correctly', () => {
    expect(formatDuration(1500)).toBe('1.5s');
  });

  it('should format minutes correctly', () => {
    expect(formatDuration(90000)).toBe('1.5m');
  });

  it('should handle boundary cases', () => {
    expect(formatDuration(999)).toBe('999ms');
    expect(formatDuration(1000)).toBe('1.0s');
    expect(formatDuration(59999)).toBe('60.0s'); // Just under 1 minute
    expect(formatDuration(60000)).toBe('1.0m');
  });

  it('should handle zero duration', () => {
    expect(formatDuration(0)).toBe('0ms');
  });

  it('should handle large durations', () => {
    expect(formatDuration(3600000)).toBe('60.0m'); // 1 hour
  });
});

describe('formatNumber', () => {
  it('should format integers with locale', () => {
    expect(formatNumber(1000)).toBe('1,000');
  });

  it('should format large numbers', () => {
    expect(formatNumber(1000000)).toBe('1,000,000');
  });

  it('should format decimals', () => {
    expect(formatNumber(1234.56)).toBe('1,234.56');
  });

  it('should handle negative numbers', () => {
    expect(formatNumber(-1000)).toBe('-1,000');
  });

  it('should handle zero', () => {
    expect(formatNumber(0)).toBe('0');
  });
});

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should delay function execution', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('test');

    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);

    expect(mockFn).toHaveBeenCalledWith('test');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should cancel previous calls', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('first');
    debouncedFn('second');
    debouncedFn('third');

    jest.advanceTimersByTime(100);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('third');
  });

  it('should handle multiple arguments', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 50);

    debouncedFn('a', 'b', 'c');

    jest.advanceTimersByTime(50);

    expect(mockFn).toHaveBeenCalledWith('a', 'b', 'c');
  });

  it('should reset delay on subsequent calls', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('first');

    jest.advanceTimersByTime(50); // Not enough to trigger
    expect(mockFn).not.toHaveBeenCalled();

    debouncedFn('second'); // Reset timer

    jest.advanceTimersByTime(50); // Still not enough
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(50); // Now it should trigger
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
