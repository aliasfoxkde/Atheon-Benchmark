/**
 * Prompt Versioning System
 * Manages versions of prompts used in benchmarks for reproducibility
 */

export interface PromptVersion {
  id: string;
  version: string;
  name: string;
  description?: string;
  category: PromptCategory;
  content: string;
  variables: PromptVariable[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isActive: boolean;
  tags: string[];
}

export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  defaultValue?: string | number | boolean;
  options?: string[];
  description?: string;
  required: boolean;
}

export type PromptCategory =
  | 'general'
  | 'code_generation'
  | 'text_analysis'
  | 'reasoning'
  | 'creative'
  | 'factual'
  | 'custom';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: PromptCategory;
  versions: PromptVersion[];
  currentVersion: string;
  variables: PromptVariable[];
}

const PROMPT_STORAGE_KEY = 'atheon-prompt-templates';

/**
 * Prompt Version Manager
 */
export class PromptVersionManager {
  private templates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(PROMPT_STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        Object.values(data).forEach((t: any) => {
          this.templates.set(t.id, t);
        });
      } catch {
        console.error('[PromptManager] Failed to load prompts from storage');
      }
    }

    // Initialize with default templates if empty
    if (this.templates.size === 0) {
      this.initializeDefaults();
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    const data: Record<string, PromptTemplate> = {};
    this.templates.forEach((template, id) => {
      data[id] = template;
    });
    localStorage.setItem(PROMPT_STORAGE_KEY, JSON.stringify(data));
  }

  /**
   * Initialize with default benchmark prompts
   */
  private initializeDefaults(): void {
    const defaults: PromptTemplate[] = [
      {
        id: 'general-reasoning',
        name: 'General Reasoning',
        description: 'Standard reasoning tasks for baseline benchmarking',
        category: 'reasoning',
        currentVersion: '1.0.0',
        variables: [
          { name: 'topic', type: 'string', description: 'Topic to reason about', required: true },
          { name: 'depth', type: 'select', options: ['shallow', 'medium', 'deep'], defaultValue: 'medium', required: false },
        ],
        versions: [
          {
            id: 'general-reasoning-v1',
            version: '1.0.0',
            name: 'General Reasoning v1',
            description: 'Initial version of general reasoning prompt',
            category: 'reasoning',
            content: 'Analyze the following topic thoroughly and provide a well-structured response.\n\nTopic: {topic}\nDepth: {depth}\n\nConsider multiple perspectives and provide evidence-based conclusions.',
            variables: [
              { name: 'topic', type: 'string', description: 'Topic to reason about', required: true },
              { name: 'depth', type: 'select', options: ['shallow', 'medium', 'deep'], defaultValue: 'medium', required: false },
            ],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            createdBy: 'system',
            isActive: true,
            tags: ['default', 'reasoning'],
          },
        ],
      },
      {
        id: 'code-generation',
        name: 'Code Generation',
        description: 'Programming task generation for coding benchmarks',
        category: 'code_generation',
        currentVersion: '1.0.0',
        variables: [
          { name: 'language', type: 'select', options: ['python', 'javascript', 'go', 'rust', 'java'], defaultValue: 'python', required: true },
          { name: 'task', type: 'string', description: 'Programming task description', required: true },
          { name: 'difficulty', type: 'select', options: ['easy', 'medium', 'hard'], defaultValue: 'medium', required: true },
        ],
        versions: [
          {
            id: 'code-gen-v1',
            version: '1.0.0',
            name: 'Code Generation v1',
            description: 'Initial code generation prompt',
            category: 'code_generation',
            content: 'Write a {difficulty} programming task in {language}.\n\nTask: {task}\n\nRequirements:\n1. Provide complete, working code\n2. Include appropriate error handling\n3. Add comments explaining key sections\n4. Write unit tests',
            variables: [
              { name: 'language', type: 'select', options: ['python', 'javascript', 'go', 'rust', 'java'], defaultValue: 'python', required: true },
              { name: 'task', type: 'string', description: 'Programming task description', required: true },
              { name: 'difficulty', type: 'select', options: ['easy', 'medium', 'hard'], defaultValue: 'medium', required: true },
            ],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            createdBy: 'system',
            isActive: true,
            tags: ['default', 'coding'],
          },
        ],
      },
      {
        id: 'pattern-matching',
        name: 'Pattern Matching',
        description: 'Tests Atheon MCP pattern matching capabilities',
        category: 'factual',
        currentVersion: '1.0.0',
        variables: [
          { name: 'patternType', type: 'select', options: ['security', 'code-quality', 'performance', 'best-practices'], defaultValue: 'security', required: true },
          { name: 'codeSnippet', type: 'string', description: 'Code to analyze', required: true },
        ],
        versions: [
          {
            id: 'pattern-v1',
            version: '1.0.0',
            name: 'Pattern Matching v1',
            description: 'Tests pattern detection in code',
            category: 'factual',
            content: 'Analyze the following code for {patternType} issues.\n\nCode:\n```{language}\n{codeSnippet}\n```\n\nIdentify any patterns that match security vulnerabilities, code quality issues, or best practice violations.',
            variables: [
              { name: 'patternType', type: 'select', options: ['security', 'code-quality', 'performance', 'best-practices'], defaultValue: 'security', required: true },
              { name: 'codeSnippet', type: 'string', description: 'Code to analyze', required: true },
            ],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            createdBy: 'system',
            isActive: true,
            tags: ['default', 'atheon', 'security'],
          },
        ],
      },
    ];

    defaults.forEach(template => {
      this.templates.set(template.id, template);
    });
    this.saveToStorage();
  }

  /**
   * Get all templates
   */
  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: PromptCategory): PromptTemplate[] {
    return this.getAllTemplates().filter(t => t.category === category);
  }

  /**
   * Create a new prompt template
   */
  createTemplate(
    template: Omit<PromptTemplate, 'versions'> & {
      versions: Omit<PromptVersion, 'id' | 'createdAt' | 'updatedAt'>[];
    }
  ): PromptTemplate {
    const now = new Date();
    const versions: PromptVersion[] = template.versions.map((v, i) => ({
      ...v,
      id: `${template.id}-v${i + 1}`,
      createdAt: now,
      updatedAt: now,
    }));

    const newTemplate: PromptTemplate = {
      ...template,
      versions,
    };

    this.templates.set(template.id, newTemplate);
    this.saveToStorage();
    return newTemplate;
  }

  /**
   * Add a new version to an existing template
   */
  addVersion(
    templateId: string,
    version: Omit<PromptVersion, 'id' | 'createdAt' | 'updatedAt'>
  ): PromptVersion | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const now = new Date();
    const newVersion: PromptVersion = {
      ...version,
      id: `${templateId}-v${template.versions.length + 1}`,
      createdAt: now,
      updatedAt: now,
    };

    // Deactivate all other versions
    template.versions.forEach(v => {
      v.isActive = false;
    });

    template.versions.push(newVersion);
    template.currentVersion = newVersion.version;
    this.saveToStorage();
    return newVersion;
  }

  /**
   * Get current active version of a template
   */
  getActiveVersion(templateId: string): PromptVersion | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    return template.versions.find(v => v.isActive) || null;
  }

  /**
   * Render a prompt with variables
   */
  renderPrompt(prompt: PromptVersion, variables: Record<string, any>): string {
    let content = prompt.content;

    prompt.variables.forEach(variable => {
      const value = variables[variable.name] ?? variable.defaultValue ?? '';
      const regex = new RegExp(`\\{${variable.name}\\}`, 'g');
      content = content.replace(regex, String(value));
    });

    return content;
  }

  /**
   * Delete a template
   */
  deleteTemplate(id: string): boolean {
    const deleted = this.templates.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  /**
   * Export templates to JSON
   */
  exportTemplates(): string {
    return JSON.stringify(this.getAllTemplates(), null, 2);
  }

  /**
   * Import templates from JSON
   */
  importTemplates(json: string): { imported: number; errors: string[] } {
    const errors: string[] = [];
    let imported = 0;

    try {
      const templates = JSON.parse(json);
      if (!Array.isArray(templates)) {
        errors.push('Invalid format: expected array');
        return { imported, errors };
      }

      templates.forEach((t: any) => {
        try {
          if (!t.id || !t.name || !t.versions) {
            errors.push(`Template missing required fields: ${JSON.stringify(t).substring(0, 50)}`);
            return;
          }
          this.templates.set(t.id, t);
          imported++;
        } catch (e) {
          errors.push(`Failed to import template: ${e}`);
        }
      });

      this.saveToStorage();
    } catch (e) {
      errors.push(`JSON parse error: ${e}`);
    }

    return { imported, errors };
  }
}

// Singleton instance
let promptManager: PromptVersionManager | null = null;

export function getPromptManager(): PromptVersionManager {
  if (!promptManager) {
    promptManager = new PromptVersionManager();
  }
  return promptManager;
}