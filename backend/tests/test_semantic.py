"""
backend/tests/test_semantic.py
Unit tests for Semantic Analyzer
"""

import sys
import os

backend_path = os.path.join(os.path.dirname(__file__), '..')
sys.path.insert(0, backend_path)
sys.path.insert(0, os.path.join(backend_path, 'compiler'))

from parser import SPLParser
from semantic_analyzer import SemanticAnalyzer


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
    
    if ast is None:
        print("✗ Parser failed")
        return False
    
    analyzer = SemanticAnalyzer()
    results = analyzer.analyze(ast)
    
    assert not results['success'], "Analysis should fail with duplicates"
    assert len(results['errors']) > 0, "Should have errors"
    
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
    
    if ast is None:
        print("✗ Parser failed")
        return False
    
    analyzer = SemanticAnalyzer()
    results = analyzer.analyze(ast)
    
    assert len(results['warnings']) > 0, "Should have warnings"
    
    warning_messages = [w['message'] for w in results['warnings']]
    assert any('undefined' in msg.lower() or 'not defined' in msg.lower() for msg in warning_messages)
    
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
    
    if ast is None:
        print("✗ Parser failed")
        return False
    
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
    
    if ast is None:
        print("✗ Parser failed")
        return False
    
    analyzer = SemanticAnalyzer()
    results = analyzer.analyze(ast)
    
    warnings = [w for w in results['warnings'] if w.get('type') == 'RISK']
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
    
    if ast is None:
        print("✗ Parser failed")
        return False
    
    analyzer = SemanticAnalyzer()
    results = analyzer.analyze(ast)
    
    errors = [e for e in results['errors'] if e.get('type') == 'RISK']
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
    
    if ast is None:
        print("✗ Parser failed")
        return False
    
    analyzer = SemanticAnalyzer()
    results = analyzer.analyze(ast)
    
    stats = results['statistics']
    assert stats['roles_defined'] == 2, f"Should have 2 roles, got {stats['roles_defined']}"
    assert stats['users_defined'] == 1, f"Should have 1 user, got {stats['users_defined']}"
    assert stats['resources_defined'] == 1, f"Should have 1 resource, got {stats['resources_defined']}"
    assert stats['policies_defined'] == 1, f"Should have 1 policy, got {stats['policies_defined']}"
    
    print("✓ Statistics collection passed")
    return True


def test_valid_program():
    """Test analysis of valid program"""
    print("\n=== Test 7: Valid Program ===")
    
    parser = SPLParser()
    parser.build()
    
    code = '''
    ROLE Admin { can: * }
    ROLE Developer { can: read, write }
    
    RESOURCE DB_Finance { path: "/data/financial" }
    
    USER JaneDoe { role: Developer }
    
    ALLOW action: read, write ON RESOURCE: DB_Finance
    IF (user.role == "Developer" AND time.hour >= 9)
    '''
    ast = parser.parse(code)
    
    if ast is None:
        print("✗ Parser failed")
        return False
    
    analyzer = SemanticAnalyzer()
    results = analyzer.analyze(ast)
    
    assert results['success'], "Valid program should pass semantic analysis"
    
    print("✓ Valid program analysis passed")
    return True


def test_resource_reference_validation():
    """Test resource reference validation"""
    print("\n=== Test 8: Resource Reference Validation ===")
    
    parser = SPLParser()
    parser.build()
    
    code = '''
    ALLOW action: read ON RESOURCE: NonExistentDB
    '''
    ast = parser.parse(code)
    
    if ast is None:
        print("✗ Parser failed")
        return False
    
    analyzer = SemanticAnalyzer()
    results = analyzer.analyze(ast)
    
    assert len(results['warnings']) > 0, "Should have warning about undefined resource"
    
    print("✓ Resource reference validation passed")
    return True


if __name__ == '__main__':
    print("=" * 80)
    print("SPL SEMANTIC ANALYZER TEST SUITE")
    print("=" * 80)
    
    tests = [
        test_duplicate_role_detection,
        test_undefined_role_reference,
        test_policy_conflict_detection,
        test_security_risk_wildcard,
        test_guest_delete_risk,
        test_statistics,
        test_valid_program,
        test_resource_reference_validation,
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            result = test()
            if result:
                passed += 1
        except AssertionError as e:
            print(f"✗ {test.__name__} failed: {e}")
            failed += 1
        except Exception as e:
            print(f"✗ {test.__name__} raised exception: {e}")
            import traceback
            traceback.print_exc()
            failed += 1
    
    print("\n" + "=" * 80)
    print(f"RESULTS: {passed} passed, {failed} failed out of {passed + failed} tests")
    print("=" * 80)