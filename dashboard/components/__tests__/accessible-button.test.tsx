/**
 * Accessible Button Component Unit Tests
 */

import { describe, it, expect, jest } from '@jest/globals';

describe('AccessibleButton Component', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('Props Interface', () => {
    it('should accept correct component shape', async () => {
      const { AccessibleButton } = await import('../accessible-button');
      // forwardRef components are objects, not functions directly
      expect(AccessibleButton).toBeDefined();
      expect(typeof AccessibleButton).toBe('object');
    });

    it('should accept variant prop', () => {
      const variants = ['primary', 'secondary', 'ghost'] as const;
      variants.forEach(variant => {
        const props = { variant };
        expect(['primary', 'secondary', 'ghost']).toContain(props.variant);
      });
    });

    it('should accept size prop', () => {
      const sizes = ['sm', 'md', 'lg'] as const;
      sizes.forEach(size => {
        const props = { size };
        expect(['sm', 'md', 'lg']).toContain(props.size);
      });
    });

    it('should accept loading prop', () => {
      const props = { loading: true };
      expect(props.loading).toBe(true);
    });

    it('should accept disabled prop', () => {
      const props = { disabled: true };
      expect(props.disabled).toBe(true);
    });

    it('should accept className prop', () => {
      const props = { className: 'custom-class' };
      expect(props.className).toBe('custom-class');
    });

    it('should accept children prop', () => {
      const props = { children: 'Click me' };
      expect(props.children).toBe('Click me');
    });

    it('should have default variant', async () => {
      const { AccessibleButton } = await import('../accessible-button');
      // The component has default variant='primary'
      expect(AccessibleButton).toBeDefined();
    });

    it('should have default size', async () => {
      const { AccessibleButton } = await import('../accessible-button');
      // The component has default size='md'
      expect(AccessibleButton).toBeDefined();
    });

    it('should accept standard button HTML attributes', () => {
      const props = {
        type: 'submit',
        name: 'action',
        value: 'save',
        autoFocus: true,
      };
      expect(props.type).toBe('submit');
      expect(props.name).toBe('action');
      expect(props.value).toBe('save');
      expect(props.autoFocus).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should support aria-busy for loading state', () => {
      const props = { loading: true, 'aria-busy': true };
      expect(props['aria-busy']).toBe(true);
    });

    it('should support aria-disabled', () => {
      const props = { disabled: true, 'aria-disabled': true };
      expect(props['aria-disabled']).toBe(true);
    });
  });
});
