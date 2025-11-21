# ============================================
# FILE: backend/tests/test_lexer.py
# ============================================

"""
Unit tests for SPL Lexer
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from compiler.lexer import SPLLexer


def test_keywords():
    """Test keyword tokenization"""
    print("\n=== Test 1: Keywords ===")
    lexer = SPLLexer()
    lexer.build()
    
    code = "ROLE USER RESOURCE ALLOW DENY IF AND OR NOT"
    tokens = lexer.tokenize(code)
    
    expected_types = ['ROLE', 'USER', 'RESOURCE', 'ALLOW', 'DENY', 
                      'IF', 'AND', 'OR', 'NOT']
    
    assert len(tokens) == len(expected_types), f"Expected {len(expected_types)} tokens, got {len(tokens)}"
    
    for i, (token_type, _, _) in enumerate(tokens):
        assert token_type == expected_types[i], f"Token {i}: expected {expected_types[i]}, got {token_type}"
    
    print("✓ Keyword tokenization passed")
    return True


def test_identifiers():
    """Test identifier tokenization"""
    print("\n=== Test 2: Identifiers ===")
    lexer = SPLLexer()
    lexer.build()
    
    code = "Admin DB_Finance user_name role123"
    tokens = lexer.tokenize(code)
    
    assert len(tokens) == 4, f"Expected 4 tokens, got {len(tokens)}"
    
    for token_type, value, _ in tokens:
        assert token_type == 'IDENTIFIER', f"Expected IDENTIFIER, got {token_type}"
    
    print("✓ Identifier tokenization passed")
    return True


def test_strings():
    """Test string literal tokenization"""
    print("\n=== Test 3: String Literals ===")
    lexer = SPLLexer()
    lexer.build()
    
    code = '"hello world" \'single quotes\' "/data/path"'
    tokens = lexer.tokenize(code)
    
    assert len(tokens) == 3, f"Expected 3 tokens, got {len(tokens)}"
    
    expected_values = ['hello world', 'single quotes', '/data/path']
    for i, (token_type, value, _) in enumerate(tokens):
        assert token_type == 'STRING', f"Expected STRING, got {token_type}"
        assert value == expected_values[i], f"Expected '{expected_values[i]}', got '{value}'"
    
    print("✓ String tokenization passed")
    return True


def test_numbers():
    """Test number tokenization"""
    print("\n=== Test 4: Numbers ===")
    lexer = SPLLexer()
    lexer.build()
    
    code = "123 45.67 0 999"
    tokens = lexer.tokenize(code)
    
    assert len(tokens) == 4, f"Expected 4 tokens, got {len(tokens)}"
    
    expected_values = [123, 45.67, 0, 999]
    for i, (token_type, value, _) in enumerate(tokens):
        assert token_type == 'NUMBER', f"Expected NUMBER, got {token_type}"
        assert value == expected_values[i], f"Expected {expected_values[i]}, got {value}"
    
    print("✓ Number tokenization passed")
    return True


def test_operators():
    """Test operator tokenization"""
    print("\n=== Test 5: Operators ===")
    lexer = SPLLexer()
    lexer.build()
    
    code = "== != < > <= >= ="
    tokens = lexer.tokenize(code)
    
    expected_types = ['EQUALS', 'NOT_EQUALS', 'LESS_THAN', 'GREATER_THAN', 
                      'LESS_EQUAL', 'GREATER_EQUAL', 'ASSIGN']
    
    assert len(tokens) == len(expected_types), f"Expected {len(expected_types)} tokens, got {len(tokens)}"
    
    for i, (token_type, _, _) in enumerate(tokens):
        assert token_type == expected_types[i], f"Expected {expected_types[i]}, got {token_type}"
    
    print("✓ Operator tokenization passed")
    return True


def test_comments():
    """Test comment handling"""
    print("\n=== Test 6: Comments ===")
    lexer = SPLLexer()
    lexer.build()
    
    code = """
    ROLE Admin // This is a comment
    /* Multi-line
       comment */
    USER Alice
    """
    tokens = lexer.tokenize(code)
    
    # Comments should be ignored
    token_types = [t[0] for t in tokens]
    assert 'ROLE' in token_types, "ROLE keyword should be tokenized"
    assert 'USER' in token_types, "USER keyword should be tokenized"
    assert len(tokens) == 4, f"Expected 4 tokens (no comments), got {len(tokens)}"
    
    print("✓ Comment handling passed")
    return True


def test_complete_policy():
    """Test tokenization of complete policy"""
    print("\n=== Test 7: Complete Policy ===")
    lexer = SPLLexer()
    lexer.build()
    
    code = '''
    ROLE Admin { can: * }
    ALLOW action: read ON RESOURCE: DB_Finance IF (time.hour >= 9)
    '''
    
    tokens = lexer.tokenize(code)
    
    assert len(tokens) > 0, "Should tokenize complete policy"
    
    # Check for key tokens
    token_types = [t[0] for t in tokens]
    assert 'ROLE' in token_types, "Should have ROLE token"
    assert 'ALLOW' in token_types, "Should have ALLOW token"
    assert 'IF' in token_types, "Should have IF token"
    
    print(f"✓ Complete policy tokenization passed ({len(tokens)} tokens)")
    return True


# ============================================
# FILE: backend/tests/test_parser.py
# ============================================

"""
Unit tests for SPL Parser
"""

from compiler.parser import SPLParser
from compiler.ast_nodes import *


def test_role_parsing():
    """Test role definition parsing"""
    print("\n=== Test 1: Role Parsing ===")
    parser = SPLParser()
    parser.build()
    
    code = "ROLE Admin { can: * }"
    ast = parser.parse(code)
    
    assert ast is not None, "Parsing should succeed"
    assert isinstance(ast, ProgramNode), "Root should be ProgramNode"
    assert len(ast.statements) == 1, "Should have 1 statement"
    assert isinstance(ast.statements[0], RoleNode), "Should be RoleNode"
    
    role = ast.statements[0]
    assert role.name == "Admin", f"Role name should be 'Admin', got '{role.name}'"
    assert 'can' in role.properties, "Should have 'can' property"
    
    print("✓ Role parsing passed")
    return True


def test_resource_parsing():
    """Test resource definition parsing"""
    print("\n=== Test 2: Resource Parsing ===")
    parser = SPLParser()
    parser.build()
    
    code = 'RESOURCE DB_Finance { path: "/data/financial" }'
    ast = parser.parse(code)
    
    assert ast is not None, "Parsing should succeed"
    resource = ast.statements[0]
    
    assert isinstance(resource, ResourceNode), "Should be ResourceNode"
    assert resource.name == "DB_Finance", f"Resource name should be 'DB_Finance'"
    assert resource.properties['path'] == "/data/financial"
    
    print("✓ Resource parsing passed")
    return True


def test_policy_parsing():
    """Test policy rule parsing"""
    print("\n=== Test 3: Policy Parsing ===")
    parser = SPLParser()
    parser.build()
    
    code = 'ALLOW action: read, write ON RESOURCE: DB_Finance'
    ast = parser.parse(code)
    
    assert ast is not None, "Parsing should succeed"
    policy = ast.statements[0]
    
    assert isinstance(policy, PolicyNode), "Should be PolicyNode"
    assert policy.policy_type == "ALLOW", "Should be ALLOW policy"
    assert 'read' in policy.actions, "Should have 'read' action"
    assert 'write' in policy.actions, "Should have 'write' action"
    
    print("✓ Policy parsing passed")
    return True


def test_policy_with_condition():
    """Test policy with conditional parsing"""
    print("\n=== Test 4: Policy with Condition ===")
    parser = SPLParser()
    parser.build()
    
    code = 'ALLOW action: read ON RESOURCE: DB_Finance IF (user.role == "Admin")'
    ast = parser.parse(code)
    
    assert ast is not None, "Parsing should succeed"
    policy = ast.statements[0]
    
    assert policy.condition is not None, "Should have condition"
    assert isinstance(policy.condition, BinaryOpNode), "Condition should be BinaryOpNode"
    
    print("✓ Policy with condition parsing passed")
    return True


def test_complex_condition():
    """Test complex condition parsing"""
    print("\n=== Test 5: Complex Condition ===")
    parser = SPLParser()
    parser.build()
    
    code = '''
    ALLOW action: read ON RESOURCE: DB_Finance 
    IF (user.role == "Developer" AND time.hour >= 9 AND time.hour <= 17)
    '''
    ast = parser.parse(code)
    
    assert ast is not None, "Parsing should succeed"
    policy = ast.statements[0]
    
    assert policy.condition is not None, "Should have condition"
    # Complex condition should be nested BinaryOpNodes
    assert isinstance(policy.condition, BinaryOpNode), "Should be BinaryOpNode"
    
    print("✓ Complex condition parsing passed")
    return True


def test_invalid_syntax():
    """Test that invalid syntax is caught"""
    print("\n=== Test 6: Invalid Syntax Detection ===")
    parser = SPLParser()
    parser.build()
    
    # Missing colon
    code = "ROLE Admin { can * }"
    ast = parser.parse(code)
    
    assert ast is None, "Parsing should fail for invalid syntax"
    assert len(parser.errors) > 0, "Should have errors"
    
    print("✓ Invalid syntax detection passed")
    return True


def test_multiple_statements():
    """Test parsing multiple statements"""
    print("\n=== Test 7: Multiple Statements ===")
    parser = SPLParser()
    parser.build()
    
    code = '''
    ROLE Admin { can: * }
    RESOURCE DB { path: "/data" }
    USER Alice { role: Admin }
    '''
    ast = parser.parse(code)
    
    assert ast is not None, "Parsing should succeed"
    assert len(ast.statements) == 3, f"Should have 3 statements, got {len(ast.statements)}"
    
    assert isinstance(ast.statements[0], RoleNode), "First should be RoleNode"
    assert isinstance(ast.statements[1], ResourceNode), "Second should be ResourceNode"
    assert isinstance(ast.statements[2], UserNode), "Third should be UserNode"
    
    print("✓ Multiple statements parsing passed")
    return True


# ============================================
# FILE: backend/tests/test_semantic.py
# ============================================

"""
Unit tests for Semantic Analyzer
"""

from compiler.semantic_analyzer import SemanticAnalyzer


def test_duplicate_role_detection():
    """Test detection of duplicate role definitions"""
    print("\n=== Test 1: Duplicate Role Detection ===")
    
    parser = SPLParser()
    parser.build()
    
    code = '''
    ROLE Admin { can: * }
    ROLE Admin { can: read }
    '''
    ast = parser.parse(code)
    
    analyzer = SemanticAnalyzer()
    results = analyzer.analyze(ast)
    
    assert not results['success'], "Analysis should fail with duplicates"
    assert len(results['errors']) > 0, "Should have errors"
    
    # Check error message mentions duplicate
    error_messages = [e['message'] for e in results['errors']]
    assert any('Duplicate' in msg for msg in error_messages), "Should detect duplicate"
    
    print("✓ Duplicate role detection passed")
    return True


def test_undefined_role_reference():
    """Test detection of undefined role references"""
    print("\n=== Test 2: Undefined Role Reference ===")
    
    parser = SPLParser()
    parser.build()
    
    code = '''
    USER Alice { role: NonExistentRole }
    '''
    ast = parser.parse(code)
    
    analyzer = SemanticAnalyzer()
    results = analyzer.analyze(ast)
    
    assert len(results['warnings']) > 0, "Should have warnings"
    
    warning_messages = [w['message'] for w in results['warnings']]
    assert any('undefined role' in msg.lower() for msg in warning_messages)
    
    print("✓ Undefined role reference detection passed")
    return True


def test_policy_conflict_detection():
    """Test detection of conflicting policies"""
    print("\n=== Test 3: Policy Conflict Detection ===")
    
    parser = SPLParser()
    parser.build()
    
    code = '''
    RESOURCE DB { path: "/data" }
    
    ALLOW action: read ON RESOURCE: DB
    IF (user.role == "Developer")
    
    DENY action: read ON RESOURCE: DB
    IF (user.role == "Developer")
    '''
    ast = parser.parse(code)
    
    analyzer = SemanticAnalyzer()
    results = analyzer.analyze(ast)
    
    assert len(results['conflicts']) > 0, "Should detect conflicts"
    
    conflict = results['conflicts'][0]
    assert conflict['type'] == 'ALLOW_DENY_CONFLICT', "Should be ALLOW/DENY conflict"
    assert conflict['risk_score'] > 0, "Should have risk score"
    
    print("✓ Policy conflict detection passed")
    return True


def test_security_risk_wildcard():
    """Test detection of wildcard security risk"""
    print("\n=== Test 4: Wildcard Security Risk ===")
    
    parser = SPLParser()
    parser.build()
    
    code = '''
    ROLE SuperAdmin { can: * }
    '''
    ast = parser.parse(code)
    
    analyzer = SemanticAnalyzer()
    results = analyzer.analyze(ast)
    
    # Should have warning about wildcard
    warnings = [w for w in results['warnings'] if w['type'] == 'RISK']
    assert len(warnings) > 0, "Should have risk warning for wildcard"
    
    print("✓ Wildcard security risk detection passed")
    return True


def test_guest_delete_risk():
    """Test detection of Guest with delete permission"""
    print("\n=== Test 5: Guest Delete Risk ===")
    
    parser = SPLParser()
    parser.build()
    
    code = '''
    RESOURCE DB { path: "/data" }
    
    ALLOW action: delete ON RESOURCE: DB
    IF (user.role == "Guest")
    '''
    ast = parser.parse(code)
    
    analyzer = SemanticAnalyzer()
    results = analyzer.analyze(ast)
    
    # Should have error about Guest delete
    errors = [e for e in results['errors'] if e['type'] == 'RISK']
    assert len(errors) > 0, "Should detect Guest delete risk"
    
    print("✓ Guest delete risk detection passed")
    return True


def test_statistics():
    """Test that statistics are collected correctly"""
    print("\n=== Test 6: Statistics Collection ===")
    
    parser = SPLParser()
    parser.build()
    
    code = '''
    ROLE Admin { can: * }
    ROLE Dev { can: read }
    USER Alice { role: Admin }
    RESOURCE DB { path: "/data" }
    ALLOW action: read ON RESOURCE: DB
    '''
    ast = parser.parse(code)
    
    analyzer = SemanticAnalyzer()
    results = analyzer.analyze(ast)
    
    stats = results['statistics']
    assert stats['roles_defined'] == 2, "Should have 2 roles"
    assert stats['users_defined'] == 1, "Should have 1 user"
    assert stats['resources_defined'] == 1, "Should have 1 resource"
    assert stats['policies_defined'] == 1, "Should have 1 policy"
    
    print("✓ Statistics collection passed")
    return True


# ============================================
# FILE: backend/tests/run_all_tests.py
# ============================================

"""
Master test runner - runs all test suites
"""


def run_all_tests():
    """Run all test suites"""
    print("=" * 80)
    print("SPL COMPILER TEST SUITE")
    print("=" * 80)
    
    all_tests = []
    
    # Lexer tests
    print("\n" + "=" * 80)
    print("LEXER TESTS")
    print("=" * 80)
    
    lexer_tests = [
        test_keywords,
        test_identifiers,
        test_strings,
        test_numbers,
        test_operators,
        test_comments,
        test_complete_policy
    ]
    
    for test in lexer_tests:
        try:
            result = test()
            all_tests.append(("LEXER", test.__name__, result))
        except Exception as e:
            print(f"✗ {test.__name__} failed: {e}")
            all_tests.append(("LEXER", test.__name__, False))
    
    # Parser tests
    print("\n" + "=" * 80)
    print("PARSER TESTS")
    print("=" * 80)
    
    parser_tests = [
        test_role_parsing,
        test_resource_parsing,
        test_policy_parsing,
        test_policy_with_condition,
        test_complex_condition,
        test_invalid_syntax,
        test_multiple_statements
    ]
    
    for test in parser_tests:
        try:
            result = test()
            all_tests.append(("PARSER", test.__name__, result))
        except Exception as e:
            print(f"✗ {test.__name__} failed: {e}")
            all_tests.append(("PARSER", test.__name__, False))
    
    # Semantic tests
    print("\n" + "=" * 80)
    print("SEMANTIC ANALYZER TESTS")
    print("=" * 80)
    
    semantic_tests = [
        test_duplicate_role_detection,
        test_undefined_role_reference,
        test_policy_conflict_detection,
        test_security_risk_wildcard,
        test_guest_delete_risk,
        test_statistics
    ]
    
    for test in semantic_tests:
        try:
            result = test()
            all_tests.append(("SEMANTIC", test.__name__, result))
        except Exception as e:
            print(f"✗ {test.__name__} failed: {e}")
            all_tests.append(("SEMANTIC", test.__name__, False))
    
    # Print summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for _, _, result in all_tests if result)
    total = len(all_tests)
    
    print(f"\nTotal Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    # Group by category
    print("\nBy Category:")
    for category in ["LEXER", "PARSER", "SEMANTIC"]:
        cat_tests = [t for t in all_tests if t[0] == category]
        cat_passed = sum(1 for _, _, result in cat_tests if result)
        print(f"  {category}: {cat_passed}/{len(cat_tests)} passed")
    
    print("=" * 80)
    
    return passed == total


if __name__ == '__main__':
    success = run_all_tests()
    exit(0 if success else 1)