"""
backend/compiler/code_generator.py
Target Code Generation for Secure Policy Language
Generates executable policies with proper structure for execution engine
"""

from compiler.parser import (
    ASTVisitor, BinaryOpNode, AttributeNode, LiteralNode, UnaryOpNode,
    ProgramNode, RoleNode, UserNode, ResourceNode, PolicyNode
)

class CodeGenerator(ASTVisitor):
    """Generates target code from validated AST"""
    
    def __init__(self, target_format='json'):
        self.target_format = target_format
        self.roles = []
        self.users = []
        self.resources = []
        self.policies = []
        self.indent_level = 0
    
    def generate(self, ast):
        """Main entry point for code generation"""
        if ast is None:
            return None
        
        # Reset collections
        self.roles = []
        self.users = []
        self.resources = []
        self.policies = []
        
        # Visit AST to collect definitions
        self.visit(ast)
        
        if self.target_format == 'json':
            return self._generate_json()
        elif self.target_format == 'python':
            return self._generate_python()
        elif self.target_format == 'yaml':
            return self._generate_yaml()
        else:
            return str({"roles": self.roles, "users": self.users, "resources": self.resources, "policies": self.policies})
    
    def visit_ProgramNode(self, node):
        """Visit program node - process all statements"""
        for statement in node.statements:
            self.visit(statement)
    
    def visit_RoleNode(self, node):
        """Generate code for role definitions"""
        permissions = node.properties.get('can', [])
        
        # Handle both single value and list
        if not isinstance(permissions, list):
            permissions = [permissions]
        
        role_def = {
            "name": node.name,
            "properties": {
                "can": permissions
            }
        }
        self.roles.append(role_def)
    
    def visit_UserNode(self, node):
        """Generate code for user definitions"""
        user_def = {
            "name": node.name,
            "properties": node.properties
        }
        self.users.append(user_def)
    
    def visit_ResourceNode(self, node):
        """Generate code for resource definitions"""
        resource_def = {
            "name": node.name,
            "properties": node.properties
        }
        self.resources.append(resource_def)
    
    def visit_PolicyNode(self, node):
        """Generate code for policy rules"""
        policy_def = {
            "type": node.policy_type,  # ALLOW or DENY
            "actions": node.actions,
            "resource": node.resource,
            "condition": self._serialize_condition(node.condition)
        }
        self.policies.append(policy_def)
    
    def _serialize_condition(self, condition):
        """Convert condition AST to serializable string format"""
        if condition is None:
            return None
        
        if isinstance(condition, BinaryOpNode):
            left = self._serialize_condition(condition.left)
            right = self._serialize_condition(condition.right)
            return f"{left} {condition.operator} {right}"
        
        elif isinstance(condition, UnaryOpNode):
            operand = self._serialize_condition(condition.operand)
            return f"{condition.operator} {operand}"
        
        elif isinstance(condition, AttributeNode):
            return f"{condition.object_name}.{condition.attribute_name}"
        
        elif isinstance(condition, LiteralNode):
            if isinstance(condition.value, str):
                return f'"{condition.value}"'
            else:
                return str(condition.value)
        
        return str(condition)
    
    def _generate_json(self):
        """Generate JSON output with proper structure for execution engine"""
        import json
        
        output = {
            "roles": self.roles,
            "users": self.users,
            "resources": self.resources,
            "policies": self.policies,
            "metadata": {
                "version": "1.0",
                "format": "spl-compiled",
                "roles_count": len(self.roles),
                "users_count": len(self.users),
                "resources_count": len(self.resources),
                "policies_count": len(self.policies)
            }
        }
        
        return json.dumps(output, indent=2)
    
    def _generate_python(self):
        """Generate Python code for policy enforcement"""
        header = '''"""
Generated SPL Policy Enforcement Code
Auto-generated from Secure Policy Language
"""

from datetime import datetime
from typing import Dict, Any, List, Optional

'''
        
        # Generate role classes
        roles_code = "# Role definitions\n"
        for role in self.roles:
            permissions = role['properties']['can']
            perms_str = "['*']" if '*' in permissions else str(permissions)
            
            roles_code += f"""
class {role['name']}Role:
    def __init__(self):
        self.name = "{role['name']}"
        self.permissions = {perms_str}
    
    def has_permission(self, action: str) -> bool:
        if '*' in self.permissions:
            return True
        return action in self.permissions

"""
        
        # Generate policy functions
        policies_code = "# Policy functions\n"
        for i, policy in enumerate(self.policies):
            actions_str = ', '.join(f'"{action}"' for action in policy['actions'])
            condition_code = self._condition_to_python_code(policy['condition'])
            
            policies_code += f"""
def policy_{i}_{policy['type'].lower()}(user: Dict[str, Any], action: str, resource: str, context: Dict[str, Any]) -> Optional[str]:
    \"\"\"Policy: {policy['type']} {policy['actions']} on {policy['resource']}\"\"\"
    
    # Check if action matches
    if action not in [{actions_str}]:
        return None
    
    # Check if resource matches
    if resource != "{policy['resource']}":
        return None
    
    # Evaluate condition
    if {condition_code}:
        return "{policy['type'].lower()}"
    
    return None

"""
        
        # Generate engine class
        engine_code = '''
class PolicyEngine:
    """Policy evaluation engine"""
    
    def __init__(self):
        self.policies = []
    
    def add_policy(self, policy_func):
        self.policies.append(policy_func)
    
    def evaluate(self, user: Dict[str, Any], action: str, resource: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Evaluate all policies and return decision"""
        if context is None:
            context = {}
        
        decisions = []
        for policy_func in self.policies:
            result = policy_func(user, action, resource, context)
            if result:
                decisions.append(result)
        
        # Deny overrides allow
        if 'deny' in decisions:
            return 'deny'
        elif 'allow' in decisions:
            return 'allow'
        else:
            return 'deny'  # Default deny

# Initialize engine
engine = PolicyEngine()

'''
        
        # Register policies
        registration = "# Register policies\n"
        for i, policy in enumerate(self.policies):
            registration += f"engine.add_policy(policy_{i}_{policy['type'].lower()})\n"
        
        return header + roles_code + policies_code + engine_code + registration
    
    def _condition_to_python_code(self, condition_str):
        """Convert condition string to Python code"""
        if condition_str is None:
            return "True"
        
        # Replace SPL operators with Python equivalents
        python_code = condition_str
        python_code = python_code.replace(" AND ", " and ")
        python_code = python_code.replace(" OR ", " or ")
        python_code = python_code.replace(" NOT ", " not ")
        
        # Replace attribute access
        # user.role -> context.get('user', {}).get('role')
        import re
        
        def replace_attribute(match):
            obj = match.group(1)
            attr = match.group(2)
            return f"context.get('{obj}', {{}}).get('{attr}')"
        
        python_code = re.sub(r'(\w+)\.(\w+)', replace_attribute, python_code)
        
        return python_code
    
    def _generate_yaml(self):
        """Generate YAML output"""
        try:
            import yaml
            output = {
                "roles": self.roles,
                "users": self.users,
                "resources": self.resources,
                "policies": self.policies
            }
            return yaml.dump(output, default_flow_style=False, indent=2)
        except ImportError:
            return "# YAML generation requires PyYAML package\n"
    
    def get_supported_formats(self):
        """Return list of supported target formats"""
        return ['json', 'python', 'yaml']


# Example usage and testing
if __name__ == '__main__':
    from compiler.parser import SPLParser
    
    sample_code = '''
    ROLE Admin {
        can: *
    }
    
    ROLE Developer {
        can: read, write
    }
    
    RESOURCE DB_Finance {
        path: "/data/financial"
    }
    
    ALLOW action: read, write ON RESOURCE: DB_Finance
    IF (user.role == "Developer" AND time.hour >= 9 AND time.hour <= 17)
    
    USER Alice {
        role: Admin
    }
    '''
    
    # Parse the sample code
    parser = SPLParser()
    parser.build()
    ast = parser.parse(sample_code)
    
    if ast:
        print("✓ Parsing successful")
        
        # Test JSON generation
        json_generator = CodeGenerator('json')
        json_output = json_generator.generate(ast)
        print("\n" + "="*50)
        print("JSON OUTPUT:")
        print("="*50)
        print(json_output)
        
    else:
        print("✗ Parsing failed")
        print("Errors:", parser.errors)