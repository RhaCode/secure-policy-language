"""
backend/compiler/ast_nodes.py
Abstract Syntax Tree (AST) Node Definitions for SPL
Each node represents a construct in the Secure Policy Language
"""

class ASTNode:
    """Base class for all AST nodes"""
    def __init__(self, line_number=None):
        self.line_number = line_number
    
    def __repr__(self):
        return self.__str__()


class ProgramNode(ASTNode):
    """Root node representing the entire program"""
    def __init__(self, statements):
        super().__init__()
        self.statements = statements
    
    def __str__(self):
        return f"Program(\n  " + ",\n  ".join(str(s) for s in self.statements) + "\n)"


class RoleNode(ASTNode):
    """Node representing a role definition"""
    def __init__(self, name, properties, line_number=None):
        super().__init__(line_number)
        self.name = name
        self.properties = properties
    
    def __str__(self):
        props = ", ".join(f"{k}: {v}" for k, v in self.properties.items())
        return f"Role(name={self.name}, properties={{{props}}}, line={self.line_number})"


class UserNode(ASTNode):
    """Node representing a user definition"""
    def __init__(self, name, properties, line_number=None):
        super().__init__(line_number)
        self.name = name
        self.properties = properties
    
    def __str__(self):
        props = ", ".join(f"{k}: {v}" for k, v in self.properties.items())
        return f"User(name={self.name}, properties={{{props}}}, line={self.line_number})"


class ResourceNode(ASTNode):
    """Node representing a resource definition"""
    def __init__(self, name, properties, line_number=None):
        super().__init__(line_number)
        self.name = name
        self.properties = properties
    
    def __str__(self):
        props = ", ".join(f"{k}: {v}" for k, v in self.properties.items())
        return f"Resource(name={self.name}, properties={{{props}}}, line={self.line_number})"


class PolicyNode(ASTNode):
    """Node representing an access control policy (ALLOW/DENY)"""
    def __init__(self, policy_type, actions, resource, condition=None, line_number=None):
        super().__init__(line_number)
        self.policy_type = policy_type  # 'ALLOW' or 'DENY'
        self.actions = actions  # List of actions
        self.resource = resource  # Resource identifier
        self.condition = condition  # Optional condition expression
    
    def __str__(self):
        cond_str = f", condition={self.condition}" if self.condition else ""
        actions_str = ", ".join(self.actions)
        return f"Policy(type={self.policy_type}, actions=[{actions_str}], resource={self.resource}{cond_str}, line={self.line_number})"


class BinaryOpNode(ASTNode):
    """Node representing a binary operation (AND, OR, ==, !=, <, >, etc.)"""
    def __init__(self, operator, left, right, line_number=None):
        super().__init__(line_number)
        self.operator = operator
        self.left = left
        self.right = right
    
    def __str__(self):
        return f"BinaryOp({self.left} {self.operator} {self.right})"


class UnaryOpNode(ASTNode):
    """Node representing a unary operation (NOT)"""
    def __init__(self, operator, operand, line_number=None):
        super().__init__(line_number)
        self.operator = operator
        self.operand = operand
    
    def __str__(self):
        return f"UnaryOp({self.operator} {self.operand})"


class AttributeNode(ASTNode):
    """Node representing an attribute access (e.g., user.role, time.hour)"""
    def __init__(self, object_name, attribute_name, line_number=None):
        super().__init__(line_number)
        self.object_name = object_name
        self.attribute_name = attribute_name
    
    def __str__(self):
        return f"{self.object_name}.{self.attribute_name}"


class LiteralNode(ASTNode):
    """Node representing a literal value (string, number, boolean)"""
    def __init__(self, value, line_number=None):
        super().__init__(line_number)
        self.value = value
    
    def __str__(self):
        if isinstance(self.value, str):
            return f'"{self.value}"'
        return str(self.value)


# Visitor pattern for traversing the AST
class ASTVisitor:
    """
    Base class for AST visitors
    Implement specific visit methods for each node type
    """
    
    def visit(self, node):
        """Visit a node and dispatch to specific visit method"""
        method_name = f'visit_{type(node).__name__}'
        visitor = getattr(self, method_name, self.generic_visit)
        return visitor(node)
    
    def generic_visit(self, node):
        """Default visitor for nodes without specific visit method"""
        raise Exception(f'No visit_{type(node).__name__} method')
    
    def visit_ProgramNode(self, node):
        for statement in node.statements:
            self.visit(statement)
    
    def visit_RoleNode(self, node):
        pass
    
    def visit_UserNode(self, node):
        pass
    
    def visit_ResourceNode(self, node):
        pass
    
    def visit_PolicyNode(self, node):
        if node.condition:
            self.visit(node.condition)
    
    def visit_BinaryOpNode(self, node):
        self.visit(node.left)
        self.visit(node.right)
    
    def visit_UnaryOpNode(self, node):
        self.visit(node.operand)
    
    def visit_AttributeNode(self, node):
        pass


# AST Printer for visualization
class ASTPrinter(ASTVisitor):
    """Pretty-print the AST structure"""
    
    def __init__(self):
        self.indent_level = 0
    
    def indent(self):
        return "  " * self.indent_level
    
    def visit_ProgramNode(self, node):
        print(f"{self.indent()}Program:")
        self.indent_level += 1
        for statement in node.statements:
            self.visit(statement)
        self.indent_level -= 1
    
    def visit_RoleNode(self, node):
        print(f"{self.indent()}Role: {node.name}")
        self.indent_level += 1
        for key, value in node.properties.items():
            print(f"{self.indent()}{key}: {value}")
        self.indent_level -= 1
    
    def visit_UserNode(self, node):
        print(f"{self.indent()}User: {node.name}")
        self.indent_level += 1
        for key, value in node.properties.items():
            print(f"{self.indent()}{key}: {value}")
        self.indent_level -= 1
    
    def visit_ResourceNode(self, node):
        print(f"{self.indent()}Resource: {node.name}")
        self.indent_level += 1
        for key, value in node.properties.items():
            print(f"{self.indent()}{key}: {value}")
        self.indent_level -= 1
    
    def visit_PolicyNode(self, node):
        actions_str = ", ".join(node.actions)
        print(f"{self.indent()}{node.policy_type} Policy:")
        self.indent_level += 1
        print(f"{self.indent()}Actions: [{actions_str}]")
        print(f"{self.indent()}Resource: {node.resource}")
        if node.condition:
            print(f"{self.indent()}Condition:")
            self.indent_level += 1
            self.visit(node.condition)
            self.indent_level -= 1
        self.indent_level -= 1
    
    def visit_BinaryOpNode(self, node):
        print(f"{self.indent()}BinaryOp: {node.operator}")
        self.indent_level += 1
        print(f"{self.indent()}Left:")
        self.indent_level += 1
        self.visit(node.left)
        self.indent_level -= 1
        print(f"{self.indent()}Right:")
        self.indent_level += 1
        self.visit(node.right)
        self.indent_level -= 1
        self.indent_level -= 1
    
    def visit_UnaryOpNode(self, node):
        print(f"{self.indent()}UnaryOp: {node.operator}")
        self.indent_level += 1
        self.visit(node.operand)
        self.indent_level -= 1
    
    def visit_AttributeNode(self, node):
        print(f"{self.indent()}{node.object_name}.{node.attribute_name}")