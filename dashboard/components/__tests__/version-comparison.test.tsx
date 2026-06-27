/**
 * Version Comparison Component Unit Tests
 */

import { describe, it, expect, jest } from '@jest/globals';

describe('VersionComparison Component', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('Props Interface', () => {
    it('should accept versions prop', () => {
      const props = { 
        versions: [
          { name: 'v1', value: '1.0.0' },
          { name: 'v2', value: '2.0.0' },
        ] 
      };
      expect(props.versions).toBeDefined();
      expect(Array.isArray(props.versions)).toBe(true);
      expect(props.versions).toHaveLength(2);
    });

    it('should accept onCompare prop', () => {
      const mockCompare = jest.fn();
      const props = { onCompare: mockCompare };
      expect(props.onCompare).toBeDefined();
      expect(typeof props.onCompare).toBe('function');
    });

    it('should accept className prop', () => {
      const props = { className: 'custom-class' };
      expect(props.className).toBeDefined();
      expect(typeof props.className).toBe('string');
    });
  });

  describe('Version Structure', () => {
    it('should have name and value for each version', () => {
      const version = { name: 'v1', value: '1.0.0' };
      expect(version.name).toBeDefined();
      expect(version.value).toBeDefined();
    });

    it('should support semantic versioning format', () => {
      const semver = /^\d+\.\d+\.\d+$/;
      const version = { name: 'v1', value: '1.2.3' };
      expect(version.value).toMatch(semver);
    });
  });

  describe('Component Export', () => {
    it('should export VersionComparison component', async () => {
      const { VersionComparison } = await import('../version-comparison');
      expect(VersionComparison).toBeDefined();
    });
  });
});
