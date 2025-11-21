"""
backend/compiler/code_generator.py
Target Code Generation for Secure Policy Language
Generates executable policies in target formats (JSON, Python, etc.)
"""

from compiler.parser import (
    ASTVisitor, BinaryOpNode, AttributeNode, LiteralNode,
    ProgramNode, RoleNode, UserNode, ResourceNode, PolicyNode
)

class CodeGenerator(ASTVisitor):
    """Generates target code from validated AST"""
    
    def __init__(self, target_format='json'):
        self.target_format = target_format
        self.output = []
        self.indent_level = 0
    
    def generate(self, ast):
        """Main entry point for code generation"""
        if ast is None:
            return None
        
        self.output = []
        self.visit(ast)
        
        if self.target_format == 'json':
            return self._generate_json()
        elif self.target_format == 'python':
            return self._generate_python()
        elif self.target_format == 'yaml':
            return self._generate_yaml()
        else:
            return '\n'.join(str(item) for item in self.output)
    
    def visit_ProgramNode(self, node):
        """Visit program node - process all statements"""
        for statement in node.statements:
            self.visit(statement)
    
    def visit_RoleNode(self, node):
        """Generate code for role definitions"""
        if self.target_format == 'json':
            role_def = {
                "type": "role",
                "name": node.name,
                "permissions": node.properties.get('can', []),
                "line_number": node.line_number
            }
            self.output.append(role_def)
        elif self.target_format == 'python':
            # Generate Python class for role
            perms = node.properties.get('can', [])
            if perms == '*':
                perms_str = "ALL_PERMISSIONS"
            else:
                perms_str = f"{perms}"
            
            python_code = f"""
class {node.name}Role:
    \"\"\"Auto-generated role: {node.name}\"\"\"
    
    def __init__(self):
        self.name = "{node.name}"
        self.permissions = {perms_str}
    
    def has_permission(self, action):
        return action in self.permissions if self.permissions != "ALL_PERMISSIONS" else True
"""
            self.output.append(python_code.strip())
    
    def visit_UserNode(self, node):
        """Generate code for user definitions"""
        if self.target_format == 'json':
            user_def = {
                "type": "user",
                "name": node.name,
                "properties": node.properties,
                "line_number": node.line_number
            }
            self.output.append(user_def)
    
    def visit_ResourceNode(self, node):
        """Generate code for resource definitions"""
        if self.target_format == 'json':
            resource_def = {
                "type": "resource", 
                "name": node.name,
                "path": node.properties.get('path', ''),
                "properties": node.properties,
                "line_number": node.line_number
            }
            self.output.append(resource_def)
    
    def visit_PolicyNode(self, node):
        """Generate code for policy rules"""
        if self.target_format == 'json':
            policy_def = {
                "type": "policy",
                "effect": node.policy_type.lower(),
                "actions": node.actions,
                "resource": node.resource,
                "condition": self._condition_to_dict(node.condition),
                "line_number": node.line_number
            }
            self.output.append(policy_def)
        elif self.target_format == 'python':
            # Generate Python function for policy enforcement
            actions_str = ', '.join(f'"{action}"' for action in node.actions)
            condition_code = self._condition_to_python(node.condition)
            
            python_code = f"""
def policy_{node.policy_type.lower()}_{node.resource.replace('.', '_')}(user, action, context):
    \"\"\"Auto-generated policy: {node.policy_type} {node.actions} on {node.resource}\"\"\"
    
    # Check action
    if action not in [{actions_str}]:
        return None  # This policy doesn't apply
    
    # Check resource
    # Resource matching logic would go here
    
    # Check condition
    if {condition_code}:
        return "{node.policy_type.lower()}"  # "allow" or "deny"
    
    return None  # Condition not met
"""
            self.output.append(python_code.strip())
    
    def _condition_to_dict(self, condition):
        """Convert condition AST to serializable format"""
        if condition is None:
            return None
        
        if isinstance(condition, BinaryOpNode):
            return {
                "operator": condition.operator,
                "left": self._condition_to_dict(condition.left),
                "right": self._condition_to_dict(condition.right),
                "line_number": condition.line_number
            }
        elif isinstance(condition, AttributeNode):
            return {
                "type": "attribute",
                "object": condition.object_name,
                "attribute": condition.attribute_name,
                "line_number": condition.line_number
            }
        elif isinstance(condition, LiteralNode):
            return {
                "type": "literal",
                "value": condition.value,
                "line_number": condition.line_number
            }
        
        return str(condition)
    
    def _condition_to_python(self, condition):
        """Convert condition AST to Python code"""
        if condition is None:
            return "True"  # No condition means always apply
        
        if isinstance(condition, BinaryOpNode):
            left_code = self._condition_to_python(condition.left)
            right_code = self._condition_to_python(condition.right)
            
            # Map SPL operators to Python operators
            operator_map = {
                '==': '==',
                '!=': '!=',
                '<': '<',
                '>': '>',
                '<=': '<=',
                '>=': '>=',
                'AND': 'and',
                'OR': 'or'
            }
            
            python_op = operator_map.get(condition.operator, condition.operator)
            return f"({left_code} {python_op} {right_code})"
        
        elif isinstance(condition, AttributeNode):
            # Convert user.role to context.get('user', {}).get('role')
            if condition.object_name == 'user':
                return f"context.get('user', {{}}).get('{condition.attribute_name}')"
            elif condition.object_name == 'time':
                return f"context.get('time', {{}}).get('{condition.attribute_name}')"
            else:
                return f"context.get('{condition.object_name}', {{}}).get('{condition.attribute_name}')"
        
        elif isinstance(condition, LiteralNode):
            if isinstance(condition.value, str):
                return f'"{condition.value}"'
            else:
                return str(condition.value)
        
        return "True"
    
    def _generate_json(self):
        """Generate JSON output"""
        import json
        return json.dumps(self.output, indent=2)
    
    def _generate_python(self):
        """Generate Python code for policy enforcement"""
        if not self.output:
            return "# No policies to generate"
        
        # Combine all generated Python code
        header = '''"""
Generated SPL Policy Enforcement Code
Auto-generated from Secure Policy Language
"""

from datetime import datetime

# Role definitions
'''
        
        # Separate roles and policies
        roles = [code for code in self.output if 'class' in code and 'Role' in code]
        policies = [code for code in self.output if 'def policy_' in code]
        
        # Policy engine class
        engine_code = '''
class PolicyEngine:
    """Policy evaluation engine"""
    
    def __init__(self):
        self.policies = []
    
    def add_policy(self, policy_function):
        """Add a policy function to the engine"""
        self.policies.append(policy_function)
    
    def evaluate(self, user, action, resource, context=None):
        """Evaluate all policies for a request"""
        if context is None:
            context = {}
        
        decisions = []
        
        for policy_func in self.policies:
            result = policy_func(user, action, context)
            if result is not None:
                decisions.append(result)
        
        # Default deny if no explicit allow
        if "allow" in decisions and "deny" not in decisions:
            return "allow"
        else:
            return "deny"

# Initialize engine
engine = PolicyEngine()

'''
        
        # Add policy registration
        policy_registration = "# Policy registration\n"
        for policy_code in policies:
            # Extract function name
            if 'def policy_' in policy_code:
                func_name = policy_code.split('def ')[1].split('(')[0]
                policy_registration += f"engine.add_policy({func_name})\n"
        
        full_code = header + '\n\n'.join(roles) + engine_code + '\n\n'.join(policies) + '\n\n' + policy_registration
        return full_code
    
    def _generate_yaml(self):
        """Generate YAML output"""
        try:
            import yaml
            return yaml.dump(self.output, default_flow_style=False, indent=2)
        except ImportError:
            return "# YAML generation requires PyYAML package\n" + str(self.output)
    
    def get_supported_formats(self):
        """Return list of supported target formats"""
        return ['json', 'python', 'yaml']


# Example usage and testing
if __name__ == '__main__':
    # Test the code generator
    from compiler.parser import SPLParser
    
    sample_code = '''
    ROLE Admin {
        can: *
    }
    
    RESOURCE DB_Finance {
        path: "/data/financial"
    }
    
    ALLOW action: read, write ON RESOURCE: DB_Finance
    IF (time.hour >= 9 AND time.hour <= 17)
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
        
        # Test Python generation
        python_generator = CodeGenerator('python')
        python_output = python_generator.generate(ast)
        print("\n" + "="*50)
        print("PYTHON OUTPUT:")
        print("="*50)
        print(python_output)
        
    else:
        print("✗ Parsing failed")
        print("Errors:", parser.errors)