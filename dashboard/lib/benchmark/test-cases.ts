/**
 * Deterministic Test Case Generator
 * This module provides deterministic test case generation with reproducible results
 */

export interface TestCase {
  id: string;
  name: string;
  description: string;
  category: 'code-generation' | 'pattern-matching' | 'security' | 'analysis' | 'optimization';
  difficulty: 'easy' | 'medium' | 'hard';
  input_prompt: string;
  expected_output?: string;
  validation_rules: ValidationRule[];
  metadata: TestCaseMetadata;
  seed: number; // For reproducibility
}

export interface ValidationRule {
  type: 'length' | 'contains' | 'pattern' | 'not-contains' | 'min-length' | 'max-length' | 'custom';
  value: any;
  message?: string;
}

export interface TestCaseMetadata {
  created_at: Date;
  tags: string[];
  estimated_duration_ms: number;
  claude_model: string;
  complexity_score: number; // 0-100
  memory_usage_mb: number;
}

export interface TestCaseGenerator {
  generate(config: TestGenerationConfig): TestCase[];
  generateFromSeed(seed: number, config: TestGenerationConfig): TestCase;
  generateBatch(configs: TestGenerationConfig[]): TestCase[];
}

export interface TestGenerationConfig {
  category: TestCase['category'];
  difficulty: TestCase['difficulty'];
  count?: number;
  claude_model?: string;
  custom_prompts?: string[];
  validation_rules?: ValidationRule[];
  complexity_range?: [number, number];
  tags?: string[];
}

export interface DeterministicRandom {
  next(): number;
  nextInt(min: number, max: number): number;
  nextFloat(min: number, max: number): number;
  nextBoolean(): boolean;
  nextString(length: number, charset?: string): string;
  reset(seed: number): void;
  getSeed(): number;
}

/**
 * Seeded random number generator for reproducibility
 */
export class SeededRandom implements DeterministicRandom {
  private seed: number;
  private current: number;

  constructor(seed: number) {
    this.seed = seed;
    this.current = seed;
  }

  next(): number {
    this.current = (this.current * 9301 + 49297) % 233280;
    return this.current / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  nextBoolean(): boolean {
    return this.next() < 0.5;
  }

  nextString(length: number, charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(this.nextInt(0, charset.length - 1));
    }
    return result;
  }

  reset(seed: number): void {
    this.seed = seed;
    this.current = seed;
  }

  getSeed(): number {
    return this.seed;
  }
}

/**
 * Test Case Generator with deterministic guarantees
 */
export class DeterministicTestCaseGenerator implements TestCaseGenerator {
  private rng: DeterministicRandom;
  private baseSeed: number;

  constructor(baseSeed: number = Date.now()) {
    this.baseSeed = baseSeed;
    this.rng = new SeededRandom(baseSeed);
  }

  /**
   * Generate test cases from configuration
   */
  generate(config: TestGenerationConfig): TestCase[] {
    const count = config.count || 10;
    const testCases: TestCase[] = [];

    for (let i = 0; i < count; i++) {
      const seed = this.baseSeed + i;
      const testCase = this.generateFromSeed(seed, config);
      testCases.push(testCase);
    }

    return testCases;
  }

  /**
   * Generate a single test case from seed
   */
  generateFromSeed(seed: number, config: TestGenerationConfig): TestCase {
    this.rng.reset(seed);

    const id = `test-${seed}-${Date.now()}`;
    const category = config.category;
    const difficulty = config.difficulty;

    const { name, description, prompt, complexity } = this.generatePrompt(category, difficulty, seed);

    const testCase: TestCase = {
      id,
      name,
      description,
      category,
      difficulty,
      input_prompt: prompt,
      validation_rules: config.validation_rules || this.generateValidationRules(category, difficulty, seed),
      metadata: {
        created_at: new Date(),
        tags: config.tags || [category, difficulty],
        estimated_duration_ms: this.estimateDuration(category, difficulty, complexity),
        claude_model: config.claude_model || 'claude-3-5-sonnet-20241022',
        complexity_score: complexity,
        memory_usage_mb: this.estimateMemoryUsage(complexity),
      },
      seed,
    };

    // Add expected output if provided in config
    if (config.custom_prompts && config.custom_prompts.length > 0) {
      const promptIndex = this.rng.nextInt(0, config.custom_prompts.length - 1);
      testCase.input_prompt = config.custom_prompts[promptIndex];
    }

    return testCase;
  }

  /**
   * Generate batch of test cases from multiple configurations
   */
  generateBatch(configs: TestGenerationConfig[]): TestCase[] {
    const allTestCases: TestCase[] = [];

    for (const config of configs) {
      const testCases = this.generate(config);
      allTestCases.push(...testCases);
    }

    return allTestCases;
  }

  /**
   * Generate prompt based on category and difficulty
   */
  private generatePrompt(
    category: TestCase['category'],
    difficulty: TestCase['difficulty'],
    seed: number
  ): { name: string; description: string; prompt: string; complexity: number } {
    const prompts = this.getPromptTemplates(category, difficulty);
    const promptIndex = this.rng.nextInt(0, prompts.length - 1);
    const template = prompts[promptIndex];

    const complexity = this.calculateComplexity(category, difficulty, seed);

    return {
      name: template.name,
      description: template.description,
      prompt: this.fillTemplate(template.prompt, complexity, seed),
      complexity,
    };
  }

  /**
   * Get prompt templates based on category and difficulty
   */
  private getPromptTemplates(category: TestCase['category'], difficulty: TestCase['difficulty']): Array<{
    name: string;
    description: string;
    prompt: string;
  }> {
    const templates: Record<TestCase['category'], Record<TestCase['difficulty'], string[]>> = {
      'code-generation': {
        easy: [
          'Write a function to calculate the sum of two numbers.',
          'Create a simple class to represent a user with name and email.',
          'Implement a function to reverse a string.',
          'Write code to check if a number is even or odd.',
          'Create a function to validate email format.',
        ],
        medium: [
          'Implement a binary search algorithm for sorted arrays.',
          'Create a function to parse and validate JSON data.',
          'Write code to implement a basic HTTP client.',
          'Implement a caching mechanism with TTL support.',
          'Create a function to generate a unique ID.',
        ],
        hard: [
          'Implement a thread-safe queue with blocking operations.',
          'Create a function to optimize SQL queries for large datasets.',
          'Write code to implement a distributed locking mechanism.',
          'Implement a real-time data synchronization system.',
          'Create a function to perform complex data validation with custom rules.',
        ],
      },
      'pattern-matching': {
        easy: [
          'Find all email addresses in the given text.',
          'Identify phone numbers in various formats.',
          'Extract URLs from a text document.',
          'Find all numbers in a string.',
          'Identify date patterns in text.',
        ],
        medium: [
          'Detect and classify API keys in configuration files.',
          'Find potential security vulnerabilities in code.',
          'Identify code quality issues like console.log statements.',
          'Detect hardcoded credentials in source code.',
          'Find TODO comments and categorize them.',
        ],
        hard: [
          'Detect complex patterns involving multiple file types.',
          'Identify obfuscated API keys and secrets.',
          'Find security issues in complex code structures.',
          'Detect anti-patterns in microservices architecture.',
          'Identify performance bottlenecks in distributed systems.',
        ],
      },
      'security': {
        easy: [
          'Review code for basic security issues.',
          'Check for hardcoded API keys.',
          'Identify missing input validation.',
          'Find potential SQL injection vulnerabilities.',
          'Check for sensitive data in logs.',
        ],
        medium: [
          'Analyze code for authentication bypass vulnerabilities.',
          'Identify insecure file upload handling.',
          'Check for insufficient encryption practices.',
          'Find potential XSS vulnerabilities.',
          'Identify insecure session management.',
        ],
        hard: [
          'Detect complex race conditions in concurrent code.',
          'Identify advanced authentication bypass techniques.',
          'Find vulnerabilities in distributed systems.',
          'Analyze code for side-channel attacks.',
          'Identify complex authorization bypass patterns.',
        ],
      },
      'analysis': {
        easy: [
          'Analyze code complexity and suggest improvements.',
          'Review code for maintainability issues.',
          'Identify duplicate code patterns.',
          'Analyze function naming conventions.',
          'Review error handling practices.',
        ],
        medium: [
          'Analyze code performance and identify bottlenecks.',
          'Review architecture patterns and suggest improvements.',
          'Identify potential memory leaks.',
          'Analyze code for scalability issues.',
          'Review database query optimization opportunities.',
        ],
        hard: [
          'Analyze distributed system design for consistency issues.',
          'Identify performance issues in microservices communication.',
          'Review system design for security vulnerabilities.',
          'Analyze code for concurrency problems.',
          'Identify scalability bottlenecks in complex systems.',
        ],
      },
      'optimization': {
        easy: [
          'Optimize a simple function for better performance.',
          'Improve code readability and maintainability.',
          'Reduce memory usage in basic algorithms.',
          'Optimize string operations.',
          'Improve error handling in simple functions.',
        ],
        medium: [
          'Optimize database queries for better performance.',
          'Improve caching strategy for API responses.',
          'Optimize memory usage in data processing.',
          'Reduce latency in API calls.',
          'Improve parallel processing efficiency.',
        ],
        hard: [
          'Optimize distributed system performance.',
          'Improve scalability of high-throughput systems.',
          'Optimize memory usage in large-scale applications.',
          'Reduce latency in real-time data processing.',
          'Improve performance of complex algorithms.',
        ],
      },
    };

    const categoryTemplates = templates[category];
    if (!categoryTemplates) {
      throw new Error(`Unknown category: ${category}`);
    }

    const difficultyTemplates = categoryTemplates[difficulty];
    if (!difficultyTemplates) {
      throw new Error(`Unknown difficulty: ${difficulty}`);
    }

    return difficultyTemplates.map((prompt, index) => ({
      name: `${category}-${difficulty}-${index + 1}`,
      description: `${category} task with ${difficulty} difficulty`,
      prompt,
    }));
  }

  /**
   * Fill template with dynamic content based on complexity
   */
  private fillTemplate(template: string, complexity: number, seed: number): string {
    this.rng.reset(seed);

    let filled = template;

    // Add complexity-specific instructions
    if (complexity > 70) {
      filled += '\n\nAdditional requirements:\n- Include comprehensive error handling\n- Add detailed comments\n- Ensure code is production-ready\n- Include edge case handling';
    } else if (complexity > 40) {
      filled += '\n\nAdditional requirements:\n- Include basic error handling\n- Add some comments\n- Ensure code is readable';
    }

    // Add specific examples based on seed
    const examples = this.generateExamples(complexity, seed);
    if (examples.length > 0) {
      filled += '\n\nExamples:\n' + examples.join('\n');
    }

    return filled;
  }

  /**
   * Generate examples based on complexity
   */
  private generateExamples(complexity: number, seed: number): string[] {
    const examples: string[] = [];

    if (complexity > 60) {
      examples.push('Input: example data');
      examples.push('Output: expected result format');
    }

    return examples;
  }

  /**
   * Calculate complexity score based on category and difficulty
   */
  private calculateComplexity(category: TestCase['category'], difficulty: TestCase['difficulty'], seed: number): number {
    const baseComplexity: Record<TestCase['difficulty'], number> = {
      easy: 20,
      medium: 50,
      hard: 80,
    };

    const categoryMultiplier: Record<TestCase['category'], number> = {
      'code-generation': 1.0,
      'pattern-matching': 1.2,
      'security': 1.5,
      'analysis': 1.3,
      'optimization': 1.4,
    };

    const complexity = baseComplexity[difficulty] * categoryMultiplier[category];
    const variance = this.rng.nextFloat(-5, 5);

    return Math.min(100, Math.max(0, Math.round(complexity + variance)));
  }

  /**
   * Generate validation rules based on category and difficulty
   */
  private generateValidationRules(category: TestCase['category'], difficulty: TestCase['difficulty'], seed: number): ValidationRule[] {
    const rules: ValidationRule[] = [];

    // Basic length validation
    const minLengths: Record<TestCase['difficulty'], number> = {
      easy: 50,
      medium: 100,
      hard: 200,
    };

    rules.push({
      type: 'min-length',
      value: minLengths[difficulty],
      message: `Response must be at least ${minLengths[difficulty]} characters`,
    });

    // Category-specific rules
    if (category === 'code-generation') {
      rules.push({
        type: 'contains',
        value: 'function',
        message: 'Code should contain function definitions',
      });
    }

    if (category === 'pattern-matching') {
      rules.push({
        type: 'contains',
        value: 'pattern',
        message: 'Response should identify patterns',
      });
    }

    if (category === 'security') {
      rules.push({
        type: 'not-contains',
        value: 'API_KEY',
        message: 'Response should not expose API keys',
      });
    }

    return rules;
  }

  /**
   * Estimate execution duration based on category and difficulty
   */
  private estimateDuration(category: TestCase['category'], difficulty: TestCase['difficulty'], complexity: number): number {
    const baseDurations: Record<TestCase['difficulty'], number> = {
      easy: 2000,
      medium: 5000,
      hard: 10000,
    };

    const categoryMultiplier: Record<TestCase['category'], number> = {
      'code-generation': 1.0,
      'pattern-matching': 1.2,
      'security': 1.5,
      'analysis': 1.3,
      'optimization': 1.4,
    };

    return Math.round(baseDurations[difficulty] * categoryMultiplier[category] * (1 + complexity / 100));
  }

  /**
   * Estimate memory usage based on complexity
   */
  private estimateMemoryUsage(complexity: number): number {
    return Math.round(50 + (complexity / 100) * 200); // 50-250 MB
  }

  /**
   * Reset the generator with a new seed
   */
  resetSeed(seed: number): void {
    this.baseSeed = seed;
    this.rng.reset(seed);
  }

  /**
   * Get current seed
   */
  getSeed(): number {
    return this.baseSeed;
  }
}

/**
 * Factory function to create test case generators
 */
export function createTestCaseGenerator(seed?: number): TestCaseGenerator {
  return new DeterministicTestCaseGenerator(seed);
}

/**
 * Predefined test case configurations for common benchmarks
 */
export const PREDEFINED_CONFIGS: Record<string, TestGenerationConfig> = {
  'basic-code-generation': {
    category: 'code-generation',
    difficulty: 'easy',
    count: 10,
    claude_model: 'claude-3-5-sonnet-20241022',
    tags: ['basic', 'code-generation'],
  },
  'security-scan': {
    category: 'security',
    difficulty: 'medium',
    count: 5,
    claude_model: 'claude-3-5-sonnet-20241022',
    tags: ['security', 'scan'],
  },
  'pattern-matching-hard': {
    category: 'pattern-matching',
    difficulty: 'hard',
    count: 3,
    claude_model: 'claude-3-5-sonnet-20241022',
    tags: ['pattern-matching', 'hard'],
  },
};