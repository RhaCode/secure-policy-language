"""
backend/compiler/lexer.py
AuthScript Lexer
Tokenizes SPL source code using PLY (Python Lex-Yacc)
"""

import ply.lex as lex

class SPLLexer:
    """Lexical analyzer for Secure Policy Language"""
    
    # List of token names
    tokens = (
        # Keywords
        'ROLE', 'USER', 'RESOURCE', 'ALLOW', 'DENY',
        'ON', 'IF', 'AND', 'OR', 'NOT',
        'ACTION', 'CAN', 'TRUE', 'FALSE',
        
        # Action tokens
        'READ', 'WRITE', 'DELETE', 'EXECUTE', 'CREATE', 'UPDATE', 'LIST',
        
        # Identifiers and literals
        'IDENTIFIER',
        'STRING',
        'NUMBER',
        
        # Operators
        'EQUALS', 'NOT_EQUALS',
        'LESS_THAN', 'GREATER_THAN',
        'LESS_EQUAL', 'GREATER_EQUAL', 'ASSIGN',
        
        # Delimiters
        'LBRACE', 'RBRACE',
        'LPAREN', 'RPAREN',
        'COMMA', 'COLON',
        'DOT', 'ASTERISK',
    )
    
    # Regular expression rules for simple tokens
    t_EQUALS       = r'=='
    t_NOT_EQUALS   = r'!='
    t_LESS_EQUAL   = r'<='
    t_GREATER_EQUAL = r'>='
    t_LESS_THAN    = r'<'
    t_GREATER_THAN = r'>'
    
    t_LBRACE       = r'\{'
    t_RBRACE       = r'\}'
    t_LPAREN       = r'\('
    t_RPAREN       = r'\)'
    t_COMMA        = r','
    t_COLON        = r':'
    t_DOT          = r'\.'
    t_ASTERISK     = r'\*'
    
    # Reserved keywords mapping
    reserved = {
        # Core keywords (case-sensitive)
        'ROLE': 'ROLE',
        'USER': 'USER',
        'RESOURCE': 'RESOURCE',
        'ALLOW': 'ALLOW',
        'DENY': 'DENY',
        'ON': 'ON',
        'IF': 'IF',
        'AND': 'AND',
        'OR': 'OR',
        'NOT': 'NOT',
        'action': 'ACTION',
        'can': 'CAN',
        'true': 'TRUE',
        'false': 'FALSE',
        
        # Action keywords - case insensitive
        'read': 'READ',
        'READ': 'READ',
        'write': 'WRITE', 
        'WRITE': 'WRITE',
        'delete': 'DELETE',
        'DELETE': 'DELETE',
        'execute': 'EXECUTE',
        'EXECUTE': 'EXECUTE',
        'create': 'CREATE',
        'CREATE': 'CREATE',
        'update': 'UPDATE',
        'UPDATE': 'UPDATE',
        'list': 'LIST',
        'LIST': 'LIST',
    }
    
    # Identifier
    def t_IDENTIFIER(self, t):
        r'[a-zA-Z_][a-zA-Z0-9_]*'
        # Check if it's a reserved keyword - normalize to lowercase for comparison
        # First check exact match in reserved
        if t.value in self.reserved:
            t.type = self.reserved[t.value]
        # Then check lowercase for action keywords
        elif t.value.lower() in self.reserved:
            t.type = self.reserved[t.value.lower()]
        else:
            t.type = 'IDENTIFIER'
        return t
    
    # String literal
    def t_STRING(self, t):
        r'"([^"\\]|\\.)*"|\'([^\'\\]|\\.)*\''
        # Remove quotes
        t.value = t.value[1:-1]
        return t
    
    # Number (integer or float)
    def t_NUMBER(self, t):
        r'\d+(\.\d+)?'
        if '.' in t.value:
            t.value = float(t.value)
        else:
            t.value = int(t.value)
        return t
    
    # Track line numbers
    def t_newline(self, t):
        r'\n+'
        t.lexer.lineno += len(t.value)
    
    # Ignore whitespace and tabs
    t_ignore = ' \t'
    
    # Comment handling (single-line and multi-line)
    def t_COMMENT_SINGLE(self, t):
        r'//.*'
        pass
    
    def t_COMMENT_MULTI(self, t):
        r'/\*(.|\n)*?\*/'
        t.lexer.lineno += t.value.count('\n')
        pass
    
    # Error handling
    def t_error(self, t):
        print(f"Illegal character '{t.value[0]}' at line {t.lineno}")
        t.lexer.skip(1)
    
    def __init__(self):
        """Initialize the lexer"""
        self.lexer = None
        self.tokens_list = []
    
    def build(self, **kwargs):
        """Build the lexer"""
        self.lexer = lex.lex(module=self, **kwargs)
        return self.lexer
    
    def reset(self):
        """Reset lexer state - CRITICAL for fixing line number accumulation"""
        if self.lexer:
            self.lexer.lineno = 1
    
    def tokenize(self, data):
        """
        Tokenize input data and return list of tokens
        
        Args:
            data (str): Source code to tokenize
            
        Returns:
            list: List of tuples (token_type, token_value, line_number)
        """
        if not self.lexer:
            self.build()

        # CRITICAL FIX: Reset line number before each tokenization
        self.reset()

        # Ensure lexer is initialized (helps static analyzers and avoids None.attr errors)
        assert self.lexer is not None, "Lexer failed to build"

        self.lexer.input(data)
        self.tokens_list = []
        
        while True:
            tok = self.lexer.token()
            if not tok:
                break
            self.tokens_list.append((tok.type, tok.value, tok.lineno))
        
        return self.tokens_list
    
    def test_lexer(self, data):
        """
        Test the lexer with sample input
        
        Args:
            data (str): Source code to test
        """
        if not self.lexer:
            self.build()

        # Reset before testing
        self.reset()

        # Ensure lexer is initialized before use
        assert self.lexer is not None, "Lexer failed to build"

        self.lexer.input(data)
        
        print("=" * 60)
        print("LEXICAL ANALYSIS RESULTS")
        print("=" * 60)
        print(f"{'Token Type':<20} {'Value':<25} {'Line'}")
        print("-" * 60)
        
        while True:
            tok = self.lexer.token()
            if not tok:
                break
            print(f"{tok.type:<20} {str(tok.value):<25} {tok.lineno}")
        
        print("=" * 60)


if __name__ == '__main__':
    sample_code = '''
    ROLE Admin {
        can: *
    }
    
    RESOURCE DB_Finance {
        path: "/data/financial"
    }
    
    ALLOW action: read, write ON RESOURCE: DB_Finance
    IF (time.hour >= 9 AND time.hour <= 17)
    
    DENY action: delete ON RESOURCE: DB_Finance
    IF (user.role == "Guest")
    
    USER JaneDoe {
        role: Developer
    }
    '''
    
    lexer = SPLLexer()
    lexer.build()
    lexer.test_lexer(sample_code)
    
    tokens = lexer.tokenize(sample_code)
    print(f"\nTotal tokens generated: {len(tokens)}")