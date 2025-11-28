// frontend/src/services/intellisense.ts
export interface Suggestion {
  text: string;
  type: 'keyword' | 'property' | 'value' | 'identifier' | 'snippet';
  description: string;
  insertText: string;
  priority: number;
  detail?: string;
}

export interface CompletionContext {
  lineNumber: number;
  column: number;
  currentLine: string;
  textBeforeCursor: string;
  textAfterCursor: string;
  inBlock?: 'ROLE' | 'USER' | 'RESOURCE' | null;
  partialWord: string;
}

class SPLIntelliSense {
  // These are used in the suggestion logic, so we'll keep them isAfter
  private commonActions = ['read', 'write', 'delete', 'execute', 'modify', 'admin', '*'];
  private commonRoles = ['Administrator', 'Developer', 'Guest', 'Manager', 'Analyst'];
  
  private conditionObjects = {
    'user': ['role', 'name', 'id', 'department', 'clearance', 'location'],
    'time': ['hour', 'minute', 'day', 'month', 'year', 'weekday'],
    'request': ['ip', 'method', 'path', 'headers', 'user_agent'],
    'resource': ['path', 'type', 'owner', 'sensitivity']
  };

  private definedRoles: Set<string> = new Set();
  private definedUsers: Set<string> = new Set();
  private definedResources: Set<string> = new Set();

  public getSuggestions(code: string, cursorPosition: number): Suggestion[] {
    const context = this.analyzeContext(code, cursorPosition);
    this.updateSymbols(code);
    
    if (context.inBlock) {
      return this.getBlockSuggestions(context);
    } else if (this.isAfterColon(context)) {
      return this.getValueSuggestions(context);
    } else if (this.isInCondition(context)) {
      return this.getConditionSuggestions(context);
    } else if (this.isInPolicyStatement(context)) {
      return this.getPolicySuggestions(context);
    } else {
      return this.getTopLevelSuggestions(context);
    }
  }

private analyzeContext(code: string, cursorPosition: number): CompletionContext {
  const textBefore = code.substring(0, cursorPosition);
  const lines = textBefore.split('\n');
  const currentLineNumber = lines.length;
  const currentLine = lines[lines.length - 1];
  const column = currentLine.length;
  
  const inBlock = this.findCurrentBlock(textBefore);
  const partialWord = this.extractPartialWord(currentLine, column);
  
  // Enhanced context detection
  const context: CompletionContext = {
    lineNumber: currentLineNumber,
    column,
    currentLine,
    textBeforeCursor: textBefore,
    textAfterCursor: code.substring(cursorPosition),
    inBlock,
    partialWord
  };
  
  return context;
}

  private findCurrentBlock(textBefore: string): 'ROLE' | 'USER' | 'RESOURCE' | null {
    const openBraces = (textBefore.match(/{/g) || []).length;
    const closeBraces = (textBefore.match(/}/g) || []).length;
    
    if (openBraces > closeBraces) {
      const lines = textBefore.split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line.startsWith('ROLE ')) return 'ROLE';
        if (line.startsWith('USER ')) return 'USER';
        if (line.startsWith('RESOURCE ')) return 'RESOURCE';
      }
    }
    
    return null;
  }

  private extractPartialWord(line: string, column: number): string {
    let start = column;
    while (start > 0 && /[\w.]/.test(line[start - 1])) {
      start--;
    }
    return line.substring(start, column);
  }



// In SPLIntelliSense class - replace the isAfterColon method
private isAfterColon(context: CompletionContext): boolean {
  const line = context.currentLine.trim();
  
  // Check if we're after a colon that has a property before it
  const colonIndex = line.lastIndexOf(':');
  if (colonIndex === -1) return false;
  
  // Get the text before the colon to identify the property
  const beforeColon = line.substring(0, colonIndex).trim();
  
  // We should suggest values if:
  // 1. We have a known property before the colon (like 'can', 'role', etc.)
  // 2. We're typing after the colon (even if there's already some text)
  const knownProperties = ['can', 'role', 'action', 'path', 'type', 'owner', 'department', 'clearance'];
  const isKnownProperty = knownProperties.some(prop => 
    beforeColon.endsWith(prop) || beforeColon === prop
  );
  
  return isKnownProperty;
}

  private isInCondition(context: CompletionContext): boolean {
    const parts = context.textBeforeCursor.split('IF (');
    if (parts.length < 2) return false;
    
    const afterIf = parts[1];
    return afterIf !== undefined && !afterIf.includes(')');
  }

  private isInPolicyStatement(context: CompletionContext): boolean {
    return context.currentLine.trim().startsWith('ALLOW') || 
           context.currentLine.trim().startsWith('DENY');
  }

  private getTopLevelSuggestions(context: CompletionContext): Suggestion[] {
    const suggestions: Suggestion[] = [
      {
        text: "ROLE",
        type: "snippet",
        description: "Define a new role",
        insertText: "ROLE ${1:RoleName} {\n    can: ${2:read, write}\n}",
        priority: 100,
        detail: "Role definition with permissions"
      },
      {
        text: "USER",
        type: "snippet",
        description: "Define a new user",
        insertText: "USER ${1:UserName} {\n    role: ${2:RoleName}\n}",
        priority: 90,
        detail: "User definition with role assignment"
      },
      {
        text: "RESOURCE",
        type: "snippet",
        description: "Define a new resource",
        insertText: "RESOURCE ${1:ResourceName} {\n    path: \"${2:/path/to/resource}\"\n}",
        priority: 85,
        detail: "Resource definition with path"
      },
      {
        text: "ALLOW",
        type: "snippet",
        description: "Create an ALLOW policy",
        insertText: "ALLOW action: ${1:read} ON RESOURCE: ${2:ResourceName}\nIF (${3:condition})",
        priority: 80,
        detail: "Allow access policy with condition"
      },
      {
        text: "DENY",
        type: "snippet",
        description: "Create a DENY policy",
        insertText: "DENY action: ${1:delete} ON RESOURCE: ${2:ResourceName}\nIF (${3:condition})",
        priority: 75,
        detail: "Deny access policy with condition"
      }
    ];

    return this.filterSuggestions(suggestions, context.partialWord);
  }

  private getBlockSuggestions(context: CompletionContext): Suggestion[] {
    const suggestions: Suggestion[] = [];
    
    switch (context.inBlock) {
      case 'ROLE':
        suggestions.push({
          text: "can",
          type: "property",
          description: "Define permissions for this role",
          insertText: "can: ${1:read, write}",
          priority: 100,
          detail: "List of allowed actions"
        });
        break;
        
      case 'USER':
        suggestions.push(
          {
            text: "role",
            type: "property",
            description: "Assign a role to this user",
            insertText: "role: ${1:RoleName}",
            priority: 100,
            detail: "Role assignment"
          },
          {
            text: "department",
            type: "property",
            description: "User's department",
            insertText: "department: \"${1:Engineering}\"",
            priority: 80
          },
          {
            text: "clearance",
            type: "property",
            description: "Security clearance level",
            insertText: "clearance: ${1:3}",
            priority: 70
          }
        );
        break;
        
      case 'RESOURCE':
        suggestions.push(
          {
            text: "path",
            type: "property",
            description: "Resource path or location",
            insertText: "path: \"${1:/path/to/resource}\"",
            priority: 100
          },
          {
            text: "type",
            type: "property",
            description: "Resource type",
            insertText: "type: \"${1:database}\"",
            priority: 80
          },
          {
            text: "owner",
            type: "property",
            description: "Resource owner",
            insertText: "owner: \"${1:admin}\"",
            priority: 70
          }
        );
        break;
    }
    
    return this.filterSuggestions(suggestions, context.partialWord);
  }

// In SPLIntelliSense class - replace getValueSuggestions method
private getValueSuggestions(context: CompletionContext): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const line = context.currentLine.trim();
  
  // Extract the property name before the colon
  const colonIndex = line.lastIndexOf(':');
  const propertyName = colonIndex !== -1 ? line.substring(0, colonIndex).trim() : '';
  
  // Get text after colon for partial matching
  const afterColonText = colonIndex !== -1 ? line.substring(colonIndex + 1).trim() : '';
  
  switch (propertyName) {
    case 'can':
      // For can property, suggest actions
      this.commonActions.forEach(action => {
        // Only suggest actions that match what user is typing
        if (action.toLowerCase().startsWith(context.partialWord.toLowerCase())) {
          suggestions.push({
            text: action,
            type: "value",
            description: `Action: ${action}`,
            insertText: this.getActionInsertText(action, afterColonText),
            priority: action === '*' ? 100 : 90
          });
        }
      });
      break;
      
    case 'role':
      // Suggest defined roles first, then common roles
      this.definedRoles.forEach(role => {
        if (role.toLowerCase().includes(context.partialWord.toLowerCase())) {
          suggestions.push({
            text: role,
            type: "value",
            description: `Use role: ${role}`,
            insertText: role,
            priority: 100
          });
        }
      });
      
      this.commonRoles.forEach(role => {
        if (!this.definedRoles.has(role) && role.toLowerCase().includes(context.partialWord.toLowerCase())) {
          suggestions.push({
            text: role,
            type: "value",
            description: `Common role: ${role}`,
            insertText: role,
            priority: 50
          });
        }
      });
      break;
      
    case 'action':
      this.commonActions.forEach(action => {
        if (action.toLowerCase().startsWith(context.partialWord.toLowerCase())) {
          suggestions.push({
            text: action,
            type: "value",
            description: `Action: ${action}`,
            insertText: action,
            priority: 80
          });
        }
      });
      break;
      
    default:
      // For other properties, provide appropriate suggestions
      if (propertyName === 'department') {
        const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];
        departments.forEach(dept => {
          if (dept.toLowerCase().includes(context.partialWord.toLowerCase())) {
            suggestions.push({
              text: dept,
              type: "value",
              description: `Department: ${dept}`,
              insertText: `"${dept}"`,
              priority: 80
            });
          }
        });
      } else if (propertyName === 'clearance') {
        const levels = ['1', '2', '3', '4', '5'];
        levels.forEach(level => {
          if (level.startsWith(context.partialWord)) {
            suggestions.push({
              text: level,
              type: "value",
              description: `Clearance level: ${level}`,
              insertText: level,
              priority: 80
            });
          }
        });
      }
  }
  
  return suggestions;
}

// Helper method to handle comma-separated values for actions
private getActionInsertText(action: string, existingText: string): string {
  if (!existingText) return action;
  
  // If there's existing text, we need to handle comma separation
  const existingActions = existingText.split(',').map(a => a.trim()).filter(a => a);
  
  // Don't suggest actions that are already present
  if (existingActions.includes(action)) {
    return ''; // Will be filtered out
  }
  
  // If we're in the middle of typing a word, replace it
  if (existingText && !existingText.endsWith(',')) {
    const lastComma = existingText.lastIndexOf(',');
    if (lastComma !== -1) {
      return existingText.substring(0, lastComma + 1) + ' ' + action;
    } else {
      return action; // Replace the current word
    }
  }
  
  // Otherwise, append with comma
  return existingText.endsWith(',') ? ` ${action}` : `, ${action}`;
}

  private getConditionSuggestions(context: CompletionContext): Suggestion[] {
    const suggestions: Suggestion[] = [];
    
    if (!context.partialWord.includes('.')) {
      Object.keys(this.conditionObjects).forEach(objName => {
        suggestions.push({
          text: objName,
          type: "identifier",
          description: `Access ${objName} attributes`,
          insertText: `${objName}.`,
          priority: 100
        });
      });
    } else {
      const [objName] = context.partialWord.split('.');
      if (objName in this.conditionObjects) {
        const objKey = objName as keyof typeof this.conditionObjects;
        this.conditionObjects[objKey].forEach(attr => {
          suggestions.push({
            text: `${objName}.${attr}`,
            type: "identifier",
            description: `${objName} attribute`,
            insertText: attr,
            priority: 100
          });
        });
      }
    }
    
    suggestions.push(
      {
        text: "AND",
        type: "keyword",
        description: "Logical AND operator",
        insertText: "AND ",
        priority: 50
      },
      {
        text: "OR",
        type: "keyword",
        description: "Logical OR operator",
        insertText: "OR ",
        priority: 50
      },
      {
        text: "NOT",
        type: "keyword",
        description: "Logical NOT operator",
        insertText: "NOT ",
        priority: 50
      }
    );
    
    return this.filterSuggestions(suggestions, context.partialWord);
  }

  private getPolicySuggestions(context: CompletionContext): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const line = context.currentLine;
    
    if (!line.includes('ON RESOURCE:')) {
      this.definedResources.forEach(resource => {
        suggestions.push({
          text: resource,
          type: "identifier",
          description: `Resource: ${resource}`,
          insertText: resource,
          priority: 100
        });
      });
    }
    
    return suggestions;
  }

private filterSuggestions(suggestions: Suggestion[], partialWord: string): Suggestion[] {
  if (!partialWord) return suggestions;
  
  return suggestions
    .filter(suggestion => 
      suggestion.text.toLowerCase().includes(partialWord.toLowerCase()) &&
      suggestion.insertText !== '' // Filter out empty insert texts
    )
    .sort((a, b) => {
      // Prioritize exact matches at the start
      const aStartsWith = a.text.toLowerCase().startsWith(partialWord.toLowerCase());
      const bStartsWith = b.text.toLowerCase().startsWith(partialWord.toLowerCase());
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      // Then sort by priority
      return b.priority - a.priority;
    });
}

  private updateSymbols(code: string): void {
    this.definedRoles.clear();
    this.definedUsers.clear();
    this.definedResources.clear();
    
    const lines = code.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('ROLE ')) {
        const name = trimmed.split(/\s+/)[1].replace('{', '').trim();
        if (name) this.definedRoles.add(name);
      } else if (trimmed.startsWith('USER ')) {
        const name = trimmed.split(/\s+/)[1].replace('{', '').trim();
        if (name) this.definedUsers.add(name);
      } else if (trimmed.startsWith('RESOURCE ')) {
        const name = trimmed.split(/\s+/)[1].replace('{', '').trim();
        if (name) this.definedResources.add(name);
      }
    });
  }

  public validateRealtime(code: string): Array<{line: number; type: string; message: string}> {
    const errors: Array<{line: number; type: string; message: string}> = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmed = line.trim();
      
      if (trimmed.includes(':') && !trimmed.includes('{') && !trimmed.includes('}')) {
        const [key, value] = trimmed.split(':');
        if (value && !value.trim()) {
          errors.push({
            line: lineNumber,
            type: 'WARNING',
            message: `Property '${key.trim()}' has no value`
          });
        }
      }
      
      if (trimmed.includes('{') && !trimmed.includes('}')) {
        const remainingText = lines.slice(index).join('\n');
        if (!remainingText.includes('}')) {
          errors.push({
            line: lineNumber,
            type: 'WARNING', 
            message: "Unclosed block - expected '}'"
          });
        }
      }
    });
    
    return errors;
  }
}

// Singleton instance
export const intellisense = new SPLIntelliSense();