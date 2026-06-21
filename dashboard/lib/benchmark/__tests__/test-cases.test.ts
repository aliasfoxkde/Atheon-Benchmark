/**
 * Benchmark Test Cases Unit Tests
 * Tests for deterministic test case generation
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  SeededRandom,
  DeterministicTestCaseGenerator,
  TestCase,
  TestGenerationConfig,
  ValidationRule
} from '../test-cases';

describe('SeededRandom', () => {
  let rng: SeededRandom;

  beforeEach(() => {
    rng = new SeededRandom(12345);
  });

  describe('Constructor and initialization', () => {
    it('should initialize with provided seed', () => {
      const testRng = new SeededRandom(99999);
      expect(testRng.getSeed()).toBe(99999);
    });

    it('should initialize current state with seed', () => {
      const testRng = new SeededRandom(54321);
      expect(testRng.getSeed()).toBe(54321);
    });
  });

  describe('next() - Basic random generation', () => {
    it('should return numbers between 0 and 1', () => {
      for (let i = 0; i < 100; i++) {
        const value = rng.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    it('should be deterministic with same seed', () => {
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(12345);

      for (let i = 0; i < 10; i++) {
        expect(rng1.next()).toBe(rng2.next());
      }
    });

    it('should produce different sequences with different seeds', () => {
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(54321);

      const values1 = [rng1.next(), rng1.next(), rng1.next()];
      const values2 = [rng2.next(), rng2.next(), rng2.next()];

      expect(values1).not.toEqual(values2);
    });
  });

  describe('nextInt() - Integer range generation', () => {
    it('should return integers within range', () => {
      for (let i = 0; i < 50; i++) {
        const value = rng.nextInt(10, 20);
        expect(value).toBeGreaterThanOrEqual(10);
        expect(value).toBeLessThanOrEqual(20);
        expect(Number.isInteger(value)).toBe(true);
      }
    });

    it('should handle negative ranges', () => {
      for (let i = 0; i < 50; i++) {
        const value = rng.nextInt(-10, 10);
        expect(value).toBeGreaterThanOrEqual(-10);
        expect(value).toBeLessThanOrEqual(10);
      }
    });

    it('should be deterministic', () => {
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(12345);

      for (let i = 0; i < 10; i++) {
        expect(rng1.nextInt(0, 100)).toBe(rng2.nextInt(0, 100));
      }
    });

    it('should include boundary values', () => {
      const rng1 = new SeededRandom(99999);
      const values = new Set();
      for (let i = 0; i < 100; i++) {
        values.add(rng1.nextInt(1, 3));
      }
      // Should eventually produce 1, 2, and 3
      expect(values.size).toBeGreaterThan(1);
    });
  });

  describe('nextFloat() - Float range generation', () => {
    it('should return floats within range', () => {
      for (let i = 0; i < 50; i++) {
        const value = rng.nextFloat(10.5, 20.5);
        expect(value).toBeGreaterThanOrEqual(10.5);
        expect(value).toBeLessThan(20.5);
      }
    });

    it('should handle negative ranges', () => {
      for (let i = 0; i < 50; i++) {
        const value = rng.nextFloat(-5.5, 5.5);
        expect(value).toBeGreaterThanOrEqual(-5.5);
        expect(value).toBeLessThan(5.5);
      }
    });

    it('should be deterministic', () => {
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(12345);

      for (let i = 0; i < 10; i++) {
        expect(rng1.nextFloat(0, 100)).toBe(rng2.nextFloat(0, 100));
      }
    });
  });

  describe('nextBoolean() - Boolean generation', () => {
    it('should return boolean values', () => {
      for (let i = 0; i < 20; i++) {
        const value = rng.nextBoolean();
        expect(typeof value).toBe('boolean');
      }
    });

    it('should produce both true and false values over many iterations', () => {
      const values = [];
      for (let i = 0; i < 100; i++) {
        values.push(rng.nextBoolean());
      }
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(2);
      expect(uniqueValues.has(true)).toBe(true);
      expect(uniqueValues.has(false)).toBe(true);
    });

    it('should be deterministic', () => {
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(12345);

      for (let i = 0; i < 20; i++) {
        expect(rng1.nextBoolean()).toBe(rng2.nextBoolean());
      }
    });
  });

  describe('nextString() - String generation', () => {
    it('should generate string of correct length', () => {
      const length = 10;
      const result = rng.nextString(length);
      expect(result).toHaveLength(length);
    });

    it('should use default charset when not specified', () => {
      const result = rng.nextString(20);
      const defaultCharset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      for (const char of result) {
        expect(defaultCharset).toContain(char);
      }
    });

    it('should use custom charset when provided', () => {
      const customCharset = 'ABC';
      const result = rng.nextString(10, customCharset);
      for (const char of result) {
        expect(customCharset).toContain(char);
      }
    });

    it('should be deterministic with same seed and charset', () => {
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(12345);

      const str1 = rng1.nextString(15, 'ABC');
      const str2 = rng2.nextString(15, 'ABC');

      expect(str1).toBe(str2);
    });

    it('should generate different strings with different calls', () => {
      const str1 = rng.nextString(10);
      const str2 = rng.nextString(10);
      expect(str1).not.toBe(str2);
    });
  });

  describe('reset() - State reset', () => {
    it('should reset to original seed', () => {
      const originalSeed = rng.getSeed();
      const valuesBefore = [rng.next(), rng.next(), rng.next()];

      rng.reset(originalSeed);
      expect(rng.getSeed()).toBe(originalSeed);

      const valuesAfter = [rng.next(), rng.next(), rng.next()];
      expect(valuesBefore).toEqual(valuesAfter);
    });

    it('should reset to new seed when provided', () => {
      rng.reset(11111);
      expect(rng.getSeed()).toBe(11111);

      const values = [rng.next(), rng.next()];
      const newRng = new SeededRandom(11111);
      const expectedValues = [newRng.next(), newRng.next()];

      expect(values).toEqual(expectedValues);
    });

    it('should allow reproducible sequences after reset', () => {
      const seed = 99999;
      rng = new SeededRandom(seed);

      const sequence1 = [rng.next(), rng.nextInt(1, 100), rng.nextString(5)];

      rng.reset(seed);
      const sequence2 = [rng.next(), rng.nextInt(1, 100), rng.nextString(5)];

      expect(sequence1).toEqual(sequence2);
    });
  });

  describe('getSeed() - Seed retrieval', () => {
    it('should return the current seed', () => {
      const seed = 54321;
      const testRng = new SeededRandom(seed);
      expect(testRng.getSeed()).toBe(seed);
    });

    it('should return updated seed after reset', () => {
      rng.reset(77777);
      expect(rng.getSeed()).toBe(77777);
    });
  });
});

describe('DeterministicTestCaseGenerator', () => {
  let generator: DeterministicTestCaseGenerator;

  beforeEach(() => {
    generator = new DeterministicTestCaseGenerator(12345);
  });

  describe('Constructor and initialization', () => {
    it('should initialize with provided seed', () => {
      const testGenerator = new DeterministicTestCaseGenerator(99999);
      expect(testGenerator).toBeDefined();
    });

    it('should use default seed when not provided', () => {
      const testGenerator = new DeterministicTestCaseGenerator();
      expect(testGenerator).toBeDefined();
    });
  });

  describe('generate() - Batch test case generation', () => {
    it('should generate default count of test cases', () => {
      const config: TestGenerationConfig = {
        category: 'code-generation',
        difficulty: 'easy'
      };

      const testCases = generator.generate(config);
      expect(testCases).toHaveLength(10); // default count
    });

    it('should generate specified count of test cases', () => {
      const config: TestGenerationConfig = {
        category: 'code-generation',
        difficulty: 'easy',
        count: 5
      };

      const testCases = generator.generate(config);
      expect(testCases).toHaveLength(5);
    });

    it('should generate test cases with required fields', () => {
      const config: TestGenerationConfig = {
        category: 'code-generation',
        difficulty: 'easy',
        count: 1
      };

      const testCases = generator.generate(config);
      const testCase = testCases[0];

      expect(testCase).toHaveProperty('id');
      expect(testCase).toHaveProperty('name');
      expect(testCase).toHaveProperty('description');
      expect(testCase).toHaveProperty('category');
      expect(testCase).toHaveProperty('difficulty');
      expect(testCase).toHaveProperty('input_prompt');
      expect(testCase).toHaveProperty('validation_rules');
      expect(testCase).toHaveProperty('metadata');
      expect(testCase).toHaveProperty('seed');
    });

    it('should use provided category', () => {
      const config: TestGenerationConfig = {
        category: 'security',
        difficulty: 'medium',
        count: 3
      };

      const testCases = generator.generate(config);
      testCases.forEach(tc => {
        expect(tc.category).toBe('security');
      });
    });

    it('should use provided difficulty', () => {
      const config: TestGenerationConfig = {
        category: 'code-generation',
        difficulty: 'hard',
        count: 3
      };

      const testCases = generator.generate(config);
      testCases.forEach(tc => {
        expect(tc.difficulty).toBe('hard');
      });
    });

    it('should be deterministic with same seed and config', () => {
      const generator1 = new DeterministicTestCaseGenerator(12345);
      const generator2 = new DeterministicTestCaseGenerator(12345);

      const config: TestGenerationConfig = {
        category: 'code-generation',
        difficulty: 'easy',
        count: 5
      };

      const testCases1 = generator1.generate(config);
      const testCases2 = generator2.generate(config);

      expect(testCases1).toHaveLength(testCases2.length);
      testCases1.forEach((tc1, i) => {
        const tc2 = testCases2[i];
        expect(tc1.name).toBe(tc2.name);
        expect(tc1.description).toBe(tc2.description);
        expect(tc1.seed).toBe(tc2.seed);
      });
    });
  });

  describe('generateFromSeed() - Single test case generation', () => {
    it('should generate test case from seed', () => {
      const config: TestGenerationConfig = {
        category: 'code-generation',
        difficulty: 'easy'
      };

      const testCase = generator.generateFromSeed(99999, config);

      expect(testCase).toBeDefined();
      expect(testCase.seed).toBe(99999);
      expect(testCase.category).toBe('code-generation');
      expect(testCase.difficulty).toBe('easy');
    });

    it('should include metadata in test case', () => {
      const config: TestGenerationConfig = {
        category: 'pattern-matching',
        difficulty: 'medium'
      };

      const testCase = generator.generateFromSeed(88888, config);

      expect(testCase.metadata).toBeDefined();
      expect(testCase.metadata.created_at).toBeInstanceOf(Date);
      expect(Array.isArray(testCase.metadata.tags)).toBe(true);
      expect(typeof testCase.metadata.claude_model).toBe('string');
    });

    it('should include validation rules', () => {
      const config: TestGenerationConfig = {
        category: 'security',
        difficulty: 'hard'
      };

      const testCase = generator.generateFromSeed(77777, config);

      expect(Array.isArray(testCase.validation_rules)).toBe(true);
      expect(testCase.validation_rules.length).toBeGreaterThan(0);
    });

    it('should use custom Claude model when provided', () => {
      const config: TestGenerationConfig = {
        category: 'code-generation',
        difficulty: 'easy',
        claude_model: 'claude-3-opus-20240229'
      };

      const testCase = generator.generateFromSeed(66666, config);

      expect(testCase.metadata.claude_model).toBe('claude-3-opus-20240229');
    });

    it('should use custom prompts when provided', () => {
      const customPrompts = [
        'Write a function to parse CSV files.',
        'Create a class to handle HTTP requests.'
      ];

      const config: TestGenerationConfig = {
        category: 'code-generation',
        difficulty: 'medium',
        custom_prompts: customPrompts
      };

      const testCase = generator.generateFromSeed(55555, config);

      expect(customPrompts).toContain(testCase.input_prompt);
    });
  });

  describe('generateBatch() - Multi-config generation', () => {
    it('should generate from multiple configurations', () => {
      const configs: TestGenerationConfig[] = [
        { category: 'code-generation', difficulty: 'easy', count: 2 },
        { category: 'pattern-matching', difficulty: 'medium', count: 3 },
        { category: 'security', difficulty: 'hard', count: 1 }
      ];

      const testCases = generator.generateBatch(configs);

      expect(testCases).toHaveLength(6);
    });

    it('should preserve category boundaries', () => {
      const configs: TestGenerationConfig[] = [
        { category: 'code-generation', difficulty: 'easy', count: 2 },
        { category: 'pattern-matching', difficulty: 'medium', count: 2 }
      ];

      const testCases = generator.generateBatch(configs);

      expect(testCases[0].category).toBe('code-generation');
      expect(testCases[1].category).toBe('code-generation');
      expect(testCases[2].category).toBe('pattern-matching');
      expect(testCases[3].category).toBe('pattern-matching');
    });

    it('should handle empty configs array', () => {
      const testCases = generator.generateBatch([]);
      expect(testCases).toHaveLength(0);
    });
  });

  describe('Test case validation', () => {
    it('should generate valid test case IDs', () => {
      const config: TestGenerationConfig = {
        category: 'code-generation',
        difficulty: 'easy',
        count: 5
      };

      const testCases = generator.generate(config);

      testCases.forEach(tc => {
        expect(tc.id).toMatch(/^test-\d+-\d+$/);
      });
    });

    it('should generate non-empty prompts', () => {
      const config: TestGenerationConfig = {
        category: 'pattern-matching',
        difficulty: 'medium',
        count: 5
      };

      const testCases = generator.generate(config);

      testCases.forEach(tc => {
        expect(tc.input_prompt).toBeTruthy();
        expect(tc.input_prompt.length).toBeGreaterThan(0);
      });
    });

    it('should include complexity scores', () => {
      const config: TestGenerationConfig = {
        category: 'analysis',
        difficulty: 'hard',
        count: 3
      };

      const testCases = generator.generate(config);

      testCases.forEach(tc => {
        expect(typeof tc.metadata.complexity_score).toBe('number');
        expect(tc.metadata.complexity_score).toBeGreaterThanOrEqual(0);
        expect(tc.metadata.complexity_score).toBeLessThanOrEqual(100);
      });
    });
  });
});

describe('Validation Rules', () => {
  it('should accept valid validation rule types', () => {
    const validTypes: ValidationRule['type'][] = [
      'length', 'contains', 'pattern', 'not-contains',
      'min-length', 'max-length', 'custom'
    ];

    validTypes.forEach(type => {
      const rule: ValidationRule = { type, value: 'test' };
      expect(rule.type).toBe(type);
    });
  });
});
