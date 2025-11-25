"""
backend/compiler/error_handler.py
Advanced error handling for SPL compiler
Provides specific, actionable error messages with recovery suggestions
"""

import re
from typing import List, Dict, Tuple, Optional


class ErrorContext:
    """Context for error analysis"""
    def __init__(self, code: str):
        self.code = code
        self.lines = code.split('\n')
        self.line_count = len(self.lines)
    
    def get_line(self, line_num: int) -> str:
        """Get line by number (1-indexed)"""
        if 1 <= line_num <= self.line_count:
            return self.lines[line_num - 1]
        return ""
    
    def get_context(self, line_num: int, context_lines: int = 2) -> List[str]:
        """Get lines with context around error"""
        start = max(0, line_num - 1 - context_lines)
        end = min(self.line_count, line_num + context_lines)
        return self.lines[start:end]


class ErrorAnalyzer:
    """Analyzes source code to detect and report specific errors"""
    
    def __init__(self, code: str):
        self.code = code
        self.context = ErrorContext(code)
        self.errors: List[Dict] = []
    
    def analyze(self) -> List[Dict]:
        """Run all error checks"""
        self.errors = []
        
        # Check for specific common errors
        self._check_missing_braces()
        self._check_missing_colons()
        self._check_unterminated_strings()
        self._check_invalid_syntax_patterns()
        self._check_undefined_keywords()
        self._check_condition_syntax()
        
        return self.errors
    
    def _check_missing_braces(self) -> None:
        """Detect missing opening or closing braces"""
        for i, line in enumerate(self.context.lines, 1):
            stripped = line.strip()
            
            # Skip comments and empty lines
            if not stripped or stripped.startswith('#'):
                continue
            
            # Check for keywords that require braces
            if any(stripped.startswith(kw) for kw in ['ROLE', 'USER', 'RESOURCE']):
                # Count braces on this line
                open_count = line.count('{')
                close_count = line.count('}')
                
                if open_count > close_count:
                    # Look ahead for closing brace
                    found_close = False
                    for j in range(i, min(i + 10, self.context.line_count)):
                        if '}' in self.context.lines[j]:
                            found_close = True
                            break
                    
                    if not found_close:
                        self.errors.append({
                            'line': i,
                            'type': 'SYNTAX_ERROR',
                            'message': f"Missing closing brace '}}' for '{stripped.split()[0]}' definition",
                            'severity': 'HIGH',
                            'code': stripped[:50],
                            'suggestion': f"Add '}}' after line {min(i + 5, self.context.line_count)} to close this block"
                        })
                
                elif close_count > open_count:
                    self.errors.append({
                        'line': i,
                        'type': 'SYNTAX_ERROR',
                        'message': f"Extra closing brace '}}' - no matching opening brace",
                        'severity': 'HIGH',
                        'code': stripped[:50],
                        'suggestion': f"Remove the extra '}}' or add '{{' before it"
                    })
    
    def _check_missing_colons(self) -> None:
        """Detect missing colons in property definitions"""
        for i, line in enumerate(self.context.lines, 1):
            stripped = line.strip()
            
            if not stripped or stripped.startswith('#'):
                continue
            
            # Check for property definitions (identifier followed by value without colon)
            # Pattern: identifier value (without colon)
            if re.match(r'^\s*[a-zA-Z_]\w*\s+[a-zA-Z_]', line) and ':' not in line:
                # But exclude keywords
                keywords = ['ROLE', 'USER', 'RESOURCE', 'ALLOW', 'DENY', 'ON', 'IF', 'can']
                if not any(line.strip().startswith(kw) for kw in keywords):
                    match = re.match(r'\s*(\w+)\s+', line)
                    if match:
                        prop_name = match.group(1)
                        self.errors.append({
                            'line': i,
                            'type': 'SYNTAX_ERROR',
                            'message': f"Missing ':' after property '{prop_name}'",
                            'severity': 'HIGH',
                            'code': stripped[:50],
                            'suggestion': f"Change to: {prop_name}: <value>"
                        })
    
    def _check_unterminated_strings(self) -> None:
        """Detect unterminated strings"""
        for i, line in enumerate(self.context.lines, 1):
            # Count quotes
            single_quotes = line.count("'") - line.count("\\'")
            double_quotes = line.count('"') - line.count('\\"')
            
            if single_quotes % 2 != 0:
                self.errors.append({
                    'line': i,
                    'type': 'SYNTAX_ERROR',
                    'message': "Unterminated string - missing closing single quote '",
                    'severity': 'HIGH',
                    'code': line.strip()[:50],
                    'suggestion': "Add closing ' at the end of the string"
                })
            
            if double_quotes % 2 != 0:
                self.errors.append({
                    'line': i,
                    'type': 'SYNTAX_ERROR',
                    'message': 'Unterminated string - missing closing double quote "',
                    'severity': 'HIGH',
                    'code': line.strip()[:50],
                    'suggestion': 'Add closing " at the end of the string'
                })
    
    def _check_invalid_syntax_patterns(self) -> None:
        """Check for common invalid patterns"""
        for i, line in enumerate(self.context.lines, 1):
            stripped = line.strip()
            
            if not stripped or stripped.startswith('#'):
                continue
            
            # Check for ALLOW/DENY without proper action syntax
            if stripped.startswith(('ALLOW', 'DENY')):
                if 'action:' not in line:
                    self.errors.append({
                        'line': i,
                        'type': 'SYNTAX_ERROR',
                        'message': f"Invalid policy syntax - missing 'action:' keyword",
                        'severity': 'HIGH',
                        'code': stripped[:60],
                        'suggestion': f"Format: {stripped.split()[0]} action: <actions> ON RESOURCE: <resource>"
                    })
                
                if 'ON RESOURCE:' not in line:
                    self.errors.append({
                        'line': i,
                        'type': 'SYNTAX_ERROR',
                        'message': f"Invalid policy syntax - missing 'ON RESOURCE:' clause",
                        'severity': 'HIGH',
                        'code': stripped[:60],
                        'suggestion': f"Add: ON RESOURCE: <resource_name>"
                    })
    
    def _check_undefined_keywords(self) -> None:
        """Check for typos in keywords"""
        valid_keywords = {'ROLE', 'USER', 'RESOURCE', 'ALLOW', 'DENY', 'ON', 'RESOURCE', 
                         'IF', 'action', 'can', 'AND', 'OR', 'NOT'}
        
        for i, line in enumerate(self.context.lines, 1):
            tokens = line.split()
            
            for token in tokens:
                # Check if token looks like it should be a keyword but isn't
                if token.isupper() and len(token) > 2:
                    if token not in valid_keywords:
                        # Check for close matches (typos)
                        similar = self._find_similar_keyword(token, valid_keywords)
                        if similar:
                            self.errors.append({
                                'line': i,
                                'type': 'SYNTAX_ERROR',
                                'message': f"Unknown keyword '{token}' - did you mean '{similar}'?",
                                'severity': 'MEDIUM',
                                'code': line.strip()[:60],
                                'suggestion': f"Replace '{token}' with '{similar}'"
                            })
    
    def _check_condition_syntax(self) -> None:
        """Check IF condition syntax"""
        for i, line in enumerate(self.context.lines, 1):
            stripped = line.strip()
            
            if 'IF' in line:
                # Check for balanced parentheses
                open_parens = line.count('(')
                close_parens = line.count(')')
                
                if open_parens != close_parens:
                    self.errors.append({
                        'line': i,
                        'type': 'SYNTAX_ERROR',
                        'message': f"Unbalanced parentheses in condition (found {open_parens} '(' and {close_parens} ')')",
                        'severity': 'HIGH',
                        'code': stripped[:60],
                        'suggestion': "Ensure all opening '(' have matching closing ')'"
                    })
                
                # Check for valid operators
                if 'IF' in line and '(' in line:
                    condition = line[line.index('IF'):].strip()
                    if not any(op in condition for op in ['==', '!=', '>=', '<=', '>', '<']):
                        self.errors.append({
                            'line': i,
                            'type': 'SYNTAX_ERROR',
                            'message': "Condition missing comparison operator",
                            'severity': 'MEDIUM',
                            'code': condition[:60],
                            'suggestion': "Add comparison operator: ==, !=, <, >, <=, >="
                        })
    
    def _find_similar_keyword(self, token: str, valid_keywords: set) -> Optional[str]:
        """Find similar keyword (simple edit distance)"""
        for keyword in valid_keywords:
            if self._edit_distance(token, keyword) <= 2:
                return keyword
        return None
    
    @staticmethod
    def _edit_distance(s1: str, s2: str) -> int:
        """Calculate simple edit distance"""
        if len(s1) < len(s2):
            return ErrorAnalyzer._edit_distance(s2, s1)
        
        if len(s2) == 0:
            return len(s1)
        
        previous_row = range(len(s2) + 1)
        for i, c1 in enumerate(s1):
            current_row = [i + 1]
            for j, c2 in enumerate(s2):
                insertions = previous_row[j + 1] + 1
                deletions = current_row[j] + 1
                substitutions = previous_row[j] + (c1 != c2)
                current_row.append(min(insertions, deletions, substitutions))
            previous_row = current_row
        
        return previous_row[-1]


class ErrorFormatter:
    """Formats errors for display"""
    
    @staticmethod
    def format_error(error: Dict, source_code: str = "") -> Dict:
        """Format error with context"""
        context = ErrorContext(source_code) if source_code else None
        
        formatted = {
            'line': error.get('line', 1),
            'type': error.get('type', 'ERROR'),
            'message': error.get('message', 'Unknown error'),
            'severity': error.get('severity', 'MEDIUM'),
            'code': error.get('code', ''),
            'suggestion': error.get('suggestion', 'Review the syntax documentation'),
            'context': []
        }
        
        if context:
            formatted['context'] = context.get_context(error.get('line', 1), 1)
        
        return formatted
    
    @staticmethod
    def format_errors(errors: List[Dict], source_code: str = "") -> List[Dict]:
        """Format multiple errors"""
        # Remove duplicate errors on same line
        seen = set()
        unique_errors = []
        
        for error in errors:
            key = (error.get('line'), error.get('message'))
            if key not in seen:
                seen.add(key)
                unique_errors.append(error)
        
        # Sort by line number and severity
        severity_order = {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2}
        unique_errors.sort(key=lambda e: (
            e.get('line', 999),
            severity_order.get(e.get('severity'), 3)
        ))
        
        return [ErrorFormatter.format_error(error, source_code) for error in unique_errors[:10]]  # Limit to 10


# Example usage and integration
if __name__ == '__main__':
    test_code = '''ROLE Admin { can: * }
ROLE Developer { can: read, write }
RESOURCE DB_Finance { path: "/data/financial"
ALLOW action: read, write ON RESOURCE: DB_Finance
IF (user.role == "Developer" AND time.hour >= 9 AND time.hour <= 17)
DENY action: delete ON RESOURCE: DB_Finance
IF (user.role == "Developer")
USER Alice { role: Admin }
USER Bob { role: Developer }'''
    
    analyzer = ErrorAnalyzer(test_code)
    errors = analyzer.analyze()
    formatted = ErrorFormatter.format_errors(errors, test_code)
    
    for error in formatted:
        print(f"Line {error['line']} [{error['severity']}]: {error['message']}")
        print(f"  Code: {error['code']}")
        print(f"  Suggestion: {error['suggestion']}")
        print()