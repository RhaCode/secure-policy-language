"""
backend/tests/test_parser.py
Unit tests for SPL Parser
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

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


def test_user_parsing():
    """Test user definition parsing"""
    print("\n=== Test 3: User Parsing ===")
    parser = SPLParser()
    parser.build()
    
    code = 'USER JaneDoe { role: Developer }'
    ast = parser.parse(code)
    
    assert ast is not None, "Parsing should succeed"
    user = ast.statements[0]
    
    assert isinstance(user, UserNode), "Should be UserNode"
    assert user.name == "JaneDoe", f"User name should be 'JaneDoe'"
    assert user.properties['role'] == "Developer"
    
    print("✓ User parsing passed")
    return True


def test_policy_parsing():
    """Test policy rule parsing"""
    print("\n=== Test 4: Policy Parsing ===")
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
    print("\n=== Test 5: Policy with Condition ===")
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
    print("\n=== Test 6: Complex Condition ===")
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
    assert isinstance(policy.condition, BinaryOpNode), "Should be BinaryOpNode"
    
    print("✓ Complex condition parsing passed")
    return True


def test_invalid_syntax():
    """Test that invalid syntax is caught"""
    print("\n=== Test 7: Invalid Syntax Detection ===")
    parser = SPLParser()
    parser.build()
    
    code = "ROLE Admin { can * }"
    ast = parser.parse(code)
    
    assert ast is None, "Parsing should fail for invalid syntax"
    assert len(parser.errors) > 0, "Should have errors"
    
    print("✓ Invalid syntax detection passed")
    return True


def test_multiple_statements():
    """Test parsing multiple statements"""
    print("\n=== Test 8: Multiple Statements ===")
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


def test_deny_policy():
    """Test DENY policy parsing"""
    print("\n=== Test 9: DENY Policy ===")
    parser = SPLParser()
    parser.build()
    
    code = 'DENY action: delete ON RESOURCE: DB_Finance IF (user.role == "Guest")'
    ast = parser.parse(code)
    
    assert ast is not None, "Parsing should succeed"
    policy = ast.statements[0]
    
    assert policy.policy_type == "DENY", "Should be DENY policy"
    assert 'delete' in policy.actions, "Should have 'delete' action"
    
    print("✓ DENY policy parsing passed")
    return True


def test_multiple_actions():
    """Test parsing multiple actions"""
    print("\n=== Test 10: Multiple Actions ===")
    parser = SPLParser()
    parser.build()
    
    code = 'ALLOW action: read, write, execute ON RESOURCE: DB_Finance'
    ast = parser.parse(code)
    
    assert ast is not None, "Parsing should succeed"
    policy = ast.statements[0]
    
    assert len(policy.actions) == 3, f"Should have 3 actions, got {len(policy.actions)}"
    assert 'read' in policy.actions
    assert 'write' in policy.actions
    assert 'execute' in policy.actions
    
    print("✓ Multiple actions parsing passed")
    return True


if __name__ == '__main__':
    print("=" * 80)
    print("SPL PARSER TEST SUITE")
    print("=" * 80)
    
    tests = [
        test_role_parsing,
        test_resource_parsing,
        test_user_parsing,
        test_policy_parsing,
        test_policy_with_condition,
        test_complex_condition,
        test_invalid_syntax,
        test_multiple_statements,
        test_deny_policy,
        test_multiple_actions,
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