"""
backend/compiler/parser.py
AuthScript Parser
Performs syntax analysis and builds Abstract Syntax Tree (AST)
"""

import ply.yacc as yacc
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from backend.compiler.lexer import SPLLexer
from backend.compiler.ast_nodes import *


class SPLParser:
    """Parser for Secure Policy Language using PLY"""
    
    def __init__(self):
        self.lexer = SPLLexer()
        self.lexer.build()
        self.tokens = self.lexer.tokens
        self.parser = None
        self.errors = []
    
    precedence = (
        ('left', 'OR'),
        ('left', 'AND'),
        ('right', 'NOT'),
        ('left', 'EQUALS', 'NOT_EQUALS'),
        ('left', 'LESS_THAN', 'GREATER_THAN', 'LESS_EQUAL', 'GREATER_EQUAL'),
    )
    
    def p_program(self, p):
        '''program : statement_list'''
        p[0] = ProgramNode(p[1])
    
    def p_statement_list(self, p):
        '''statement_list : statement_list statement
                         | statement'''
        if len(p) == 3:
            p[0] = p[1] + [p[2]]
        else:
            p[0] = [p[1]]
    
    def p_statement(self, p):
        '''statement : role_definition
                    | user_definition
                    | resource_definition
                    | policy_rule'''
        p[0] = p[1]
    
    def p_role_definition(self, p):
        '''role_definition : ROLE IDENTIFIER LBRACE property_list RBRACE'''
        p[0] = RoleNode(p[2], p[4], p.lineno(1))
    
    def p_user_definition(self, p):
        '''user_definition : USER IDENTIFIER LBRACE property_list RBRACE'''
        p[0] = UserNode(p[2], p[4], p.lineno(1))
    
    def p_resource_definition(self, p):
        '''resource_definition : RESOURCE IDENTIFIER LBRACE property_list RBRACE'''
        p[0] = ResourceNode(p[2], p[4], p.lineno(1))
    
    def p_property_list(self, p):
        '''property_list : property_list COMMA property
                        | property
                        | empty'''
        if len(p) == 4:
            p[0] = {**p[1], **p[3]}
        elif len(p) == 2 and p[1] is not None:
            p[0] = p[1]
        else:
            p[0] = {}
    
    def p_property(self, p):
        '''property : IDENTIFIER COLON value_or_list
                   | CAN COLON action_value_or_list'''
        # Handle 'can' keyword specially - must use action values only
        if p[1] == 'can':
            key = 'can'
            p[0] = {key: p[3]}
        else:
            key = p[1]
            p[0] = {key: p[3]}
    
    def p_value_or_list(self, p):
        '''value_or_list : value_list
                        | value'''
        p[0] = p[1]
    
    def p_action_value_or_list(self, p):
        '''action_value_or_list : action_value_list
                               | action_value'''
        p[0] = p[1]
    
    def p_action_value_list(self, p):
        '''action_value_list : action_value_list COMMA action_value
                            | action_value COMMA action_value'''
        if len(p) == 4:
            if isinstance(p[1], list):
                p[0] = p[1] + [p[3]]
            else:
                p[0] = [p[1], p[3]]
    
    def p_action_value(self, p):
        '''action_value : READ
                       | WRITE
                       | DELETE
                       | EXECUTE
                       | CREATE
                       | UPDATE
                       | LIST
                       | ASTERISK'''
        if p[1] == '*':
            p[0] = '*'
        else:
            p[0] = p[1].lower()
    
    def p_value_list(self, p):
        '''value_list : value_list COMMA value
                     | value COMMA value'''
        if len(p) == 4:
            if isinstance(p[1], list):
                p[0] = p[1] + [p[3]]
            else:
                p[0] = [p[1], p[3]]
    
    def p_policy_rule_with_condition(self, p):
        '''policy_rule : policy_type ACTION COLON action_list ON RESOURCE COLON resource_spec IF condition'''
        p[0] = PolicyNode(p[1], p[4], p[8], p[10], p.lineno(1))
    
    def p_policy_rule_no_condition(self, p):
        '''policy_rule : policy_type ACTION COLON action_list ON RESOURCE COLON resource_spec'''
        p[0] = PolicyNode(p[1], p[4], p[8], None, p.lineno(1))
    
    def p_policy_type(self, p):
        '''policy_type : ALLOW
                      | DENY'''
        p[0] = p[1]
    
    def p_action_list(self, p):
        '''action_list : action_list COMMA action
                      | action
                      | ASTERISK'''
        if len(p) == 4:
            p[0] = p[1] + [p[3]]
        else:
            p[0] = [p[1]]
    
    def p_action(self, p):
        '''action : READ
                 | WRITE
                 | DELETE
                 | EXECUTE
                 | CREATE
                 | UPDATE
                 | LIST'''
        # Return lowercase for consistency
        p[0] = p[1].lower()
    
    def p_resource_spec(self, p):
        '''resource_spec : IDENTIFIER
                        | STRING
                        | path_expression'''
        p[0] = p[1]
    
    def p_path_expression(self, p):
        '''path_expression : path_expression DOT IDENTIFIER
                          | path_expression DOT ASTERISK
                          | IDENTIFIER DOT IDENTIFIER
                          | IDENTIFIER DOT ASTERISK'''
        if len(p) == 4:
            p[0] = f"{p[1]}.{p[3]}"
        else:
            p[0] = f"{p[1]}.{p[3]}"
    
    def p_condition(self, p):
        '''condition : LPAREN expression RPAREN'''
        p[0] = p[2]
    
    def p_expression_binop(self, p):
        '''expression : expression AND expression
                     | expression OR expression
                     | expression EQUALS expression
                     | expression NOT_EQUALS expression
                     | expression LESS_THAN expression
                     | expression GREATER_THAN expression
                     | expression LESS_EQUAL expression
                     | expression GREATER_EQUAL expression'''
        p[0] = BinaryOpNode(p[2], p[1], p[3], p.lineno(2))
    
    def p_expression_not(self, p):
        '''expression : NOT expression'''
        p[0] = UnaryOpNode(p[1], p[2], p.lineno(1))
    
    def p_expression_group(self, p):
        '''expression : LPAREN expression RPAREN'''
        p[0] = p[2]
    
    def p_expression_attribute(self, p):
        '''expression : IDENTIFIER DOT IDENTIFIER'''
        p[0] = AttributeNode(p[1], p[3], p.lineno(1))
    
    def p_expression_value(self, p):
        '''expression : value'''
        if isinstance(p[1], (str, int, float, bool)):
            p[0] = LiteralNode(p[1], p.lineno(1))
        else:
            p[0] = p[1]
    
    def p_value(self, p):
        '''value : STRING
                | NUMBER
                | IDENTIFIER
                | ASTERISK
                | TRUE
                | FALSE'''
        if p[1] == 'true':
            p[0] = True
        elif p[1] == 'false':
            p[0] = False
        elif p[1] == '*':
            p[0] = '*'
        else:
            p[0] = p[1]
    
    def p_empty(self, p):
        '''empty :'''
        p[0] = None
    
    def p_error(self, p):
        if p:
            error_msg = f"Syntax error at line {p.lineno}: Unexpected token '{p.value}' (type: {p.type})"
            self.errors.append(error_msg)
            print(error_msg)
            # Skip the bad token and try to recover
            if self.parser:
                self.parser.errok()
        else:
            error_msg = "Syntax error: Unexpected end of file"
            self.errors.append(error_msg)
            print(error_msg)
    
    def build(self, **kwargs):
        """Build the parser - suppress PLY warnings"""
        # Suppress PLY output and warnings
        self.parser = yacc.yacc(
            module=self, 
            debug=False, 
            write_tables=False,
            errorlog=yacc.NullLogger(),  # Suppress warnings
            **kwargs
        )
        return self.parser
    
    def parse(self, data, debug=False):
        """
        Parse input data and return AST
        
        Args:
            data (str): Source code to parse
            debug (bool): Enable debug output
            
        Returns:
            AST root node or None if errors occurred
        """
        if not self.parser:
            self.build()

        assert self.parser is not None  # For Pylance

        result = self.parser.parse(data, lexer=self.lexer.lexer, debug=debug)

        
        # Reset lexer state before parsing
        self.lexer.reset()
        
        # Clear previous errors
        self.errors = []
        
        result = self.parser.parse(data, lexer=self.lexer.lexer, debug=debug)
        
        if self.errors:
            print(f"\nParsing completed with {len(self.errors)} error(s)")
            return None
        
        return result