"""
backend/compiler/semantic_analyzer.py
AuthScript Semantic Analysis
Performs semantic checks, validates policies, detects conflicts
"""

from compiler.parser import (
    BinaryOpNode, UnaryOpNode, AttributeNode, LiteralNode, ASTVisitor
)
from compiler.symbol_table import SymbolTable, Symbol, SymbolType


class SemanticError:
    """Represents a semantic error"""
    def __init__(self, message, line_number=None, error_type="ERROR"):
        self.message = message
        self.line_number = line_number
        self.error_type = error_type
    
    def __str__(self):
        line_info = f" at line {self.line_number}" if self.line_number else ""
        return f"[{self.error_type}]{line_info}: {self.message}"
    
    def to_dict(self):
        return {
            "type": self.error_type,
            "message": self.message,
            "line": self.line_number
        }


class PolicyConflict:
    """Represents a conflict between two policies"""
    def __init__(self, policy1, policy2, conflict_type, description):
        self.policy1 = policy1
        self.policy2 = policy2
        self.conflict_type = conflict_type
        self.description = description
        self.risk_score = self._calculate_risk_score()
    
    def _calculate_risk_score(self):
        """Calculate risk score (0-100) based on conflict type"""
        risk_scores = {
            "ALLOW_DENY_CONFLICT": 85,
            "PRIVILEGE_ESCALATION": 95,
            "OVERLY_PERMISSIVE": 70,
            "LOGICAL_CONTRADICTION": 60,
            "REDUNDANT_POLICY": 20
        }
        return risk_scores.get(self.conflict_type, 50)
    
    def to_dict(self):
        return {
            "type": self.conflict_type,
            "description": self.description,
            "risk_score": self.risk_score,
            "policy1_line": self.policy1.line_number if self.policy1 else None,
            "policy2_line": self.policy2.line_number if self.policy2 else None
        }


class SemanticAnalyzer(ASTVisitor):
    """
    Performs comprehensive semantic analysis on SPL programs
    
    Features:
    - Validates role and resource definitions
    - Detects policy conflicts (ALLOW vs DENY)
    - Identifies security risks and vulnerabilities
    - Checks for privilege escalation
    - Validates attribute access
    - Checks for undefined references (ERRORS - blocks compilation)
    - Analyzes condition expressions
    - Validates role names used in conditions
    - Validates actions in role definitions
    """
    
    # Valid actions that can be used
    VALID_ACTIONS = {'read', 'write', 'delete', 'execute', 'create', 'update', 'list', '*'}
    
    def __init__(self):
        self.symbol_table = SymbolTable()
        self.errors = []
        self.warnings = []
        self.conflicts = []
        
        # Collections for analysis
        self.roles = {}
        self.users = {}
        self.resources = {}
        self.policies = []
        self.policy_index = {}
        
        # Track dangerous patterns
        self.wildcard_permissions = []
        self.guest_delete_permissions = []
        self.overly_permissive_policies = []
        self.undefined_references = []
        
        # Track role references in conditions
        self.role_references_in_conditions = []
    
    def analyze(self, ast):
        """
        Main entry point for semantic analysis
        
        Args:
            ast: Root AST node (ProgramNode)
            
        Returns:
            dict: Analysis results with errors, warnings, and conflicts
        """
        if ast is None:
            self.errors.append(SemanticError("Cannot analyze null AST"))
            return self.get_results()
        
        # Phase 1: Collect all definitions
        self._phase_collection(ast)
        
        # Phase 2: Validate references and bindings
        self._phase_validation()
        
        # Phase 3: Detect conflicts between policies
        self._phase_conflict_detection()
        
        # Phase 4: Security risk analysis
        self._phase_security_analysis()
        
        # Phase 5: Generate recommendations
        self._phase_recommendations()
        
        return self.get_results()
    
    def _phase_collection(self, ast):
        """Phase 1: Collect all definitions (roles, users, resources, policies)"""
        for statement in ast.statements:
            self.visit(statement)
    
    def _phase_validation(self):
        """Phase 2: Validate references and bindings"""
        # Validate user role references
        for user_name, user_node in self.users.items():
            if 'role' in user_node.properties:
                role_name = user_node.properties['role']
                if role_name not in self.roles:
                    error = SemanticError(
                        f"User '{user_name}' references undefined role '{role_name}'",
                        user_node.line_number,
                        "ERROR"
                    )
                    self.errors.append(error)
                    self.undefined_references.append(('role', role_name, user_name))
        
        # Validate policy resource references
        for policy in self.policies:
            if isinstance(policy.resource, str):
                resource_name = policy.resource
                
                # Determine if this is a literal resource identifier
                is_path = resource_name.startswith('/')
                has_wildcard = '*' in resource_name
                has_dot = '.' in resource_name
                
                # If it's a plain identifier (like "DB_Finance"), it MUST be defined
                if not (is_path or has_wildcard or has_dot):
                    if resource_name not in self.resources:
                        error = SemanticError(
                            f"Policy references undefined resource '{resource_name}'. "
                            f"Define it with: RESOURCE {resource_name} {{ ... }}",
                            policy.line_number,
                            "ERROR"
                        )
                        self.errors.append(error)
                        self.undefined_references.append(('resource', resource_name, 'policy'))
                
                # For paths, give helpful feedback if no resources match
                elif is_path:
                    matching_resources = [
                        r for r, node in self.resources.items() 
                        if node.properties.get('path') == resource_name
                    ]
                    if not matching_resources:
                        warning = SemanticError(
                            f"Policy uses path '{resource_name}' which doesn't match any defined resource path",
                            policy.line_number,
                            "WARNING"
                        )
                        self.warnings.append(warning)
        
        # Validate role references in conditions
        self._validate_role_references_in_conditions()
    
    def _validate_role_references_in_conditions(self):
        """Validate that all role names used in conditions are defined"""
        for role_name, line_number, context in self.role_references_in_conditions:
            if role_name not in self.roles:
                error = SemanticError(
                    f"Condition references undefined role '{role_name}'{context}",
                    line_number,
                    "ERROR"
                )
                self.errors.append(error)
                self.undefined_references.append(('role', role_name, 'condition'))
    
    def _phase_conflict_detection(self):
        """Phase 3: Detect conflicts between policies"""
        # Build policy index for faster conflict detection
        resource_policies = {}
        for policy in self.policies:
            resource = policy.resource
            if resource not in resource_policies:
                resource_policies[resource] = []
            resource_policies[resource].append(policy)
        
        # Check for conflicts on same resource
        for resource, policies in resource_policies.items():
            for i, policy1 in enumerate(policies):
                for policy2 in policies[i+1:]:
                    if self._policies_conflict(policy1, policy2):
                        conflict_type = self._determine_conflict_type(policy1, policy2)
                        description = self._generate_conflict_description(policy1, policy2)
                        
                        conflict = PolicyConflict(
                            policy1, policy2, conflict_type, description
                        )
                        self.conflicts.append(conflict)
    
    def _phase_security_analysis(self):
        """Phase 4: Security risk analysis"""
        
        # Risk 1: Wildcard permissions
        for role_name, line in self.wildcard_permissions:
            warning = SemanticError(
                f"SECURITY: Role '{role_name}' has wildcard permissions (*)",
                line,
                "RISK"
            )
            self.warnings.append(warning)
        
        # Risk 2: Guest with delete permissions
        for policy in self.guest_delete_permissions:
            error = SemanticError(
                f"CRITICAL SECURITY RISK: Policy grants 'delete' to Guest role",
                policy.line_number,
                "RISK"
            )
            self.errors.append(error)
        
        # Risk 3: Overly permissive policies
        for policy in self.overly_permissive_policies:
            warning = SemanticError(
                f"Policy allows multiple sensitive actions without conditions",
                policy.line_number,
                "RISK"
            )
            self.warnings.append(warning)
        
        # Risk 4: Check for privilege escalation patterns
        self._detect_privilege_escalation()
    
    def _phase_recommendations(self):
        """Phase 5: Generate recommendations based on analysis"""
        pass
    
    def visit_ProgramNode(self, node):
        """Visit program node and process all statements"""
        for statement in node.statements:
            self.visit(statement)
    
    def visit_RoleNode(self, node):
        """Process and validate role definition"""
        role_name = node.name
        
        # Check for duplicate role
        if role_name in self.roles:
            error = SemanticError(
                f"Duplicate role definition: '{role_name}'",
                node.line_number,
                "ERROR"
            )
            self.errors.append(error)
        else:
            self.roles[role_name] = node
            
            # Add to symbol table
            symbol = Symbol(role_name, SymbolType.ROLE, node.properties)
            symbol.defined_line = node.line_number
            self.symbol_table.define(symbol)
            
            # VALIDATION: Check 'can' property for valid actions
            if 'can' in node.properties:
                can_value = node.properties['can']
                
                # Handle both single value and list of values
                actions_to_check = []
                if isinstance(can_value, list):
                    actions_to_check = can_value
                else:
                    actions_to_check = [can_value]
                
                # Validate each action
                for action in actions_to_check:
                    action_str = str(action).lower()
                    if action_str not in self.VALID_ACTIONS:
                        error = SemanticError(
                            f"Invalid action '{action}' in role '{role_name}'. "
                            f"Valid actions are: {', '.join(sorted(self.VALID_ACTIONS - {'*'}))} or *",
                            node.line_number,
                            "ERROR"
                        )
                        self.errors.append(error)
            
            # Check for wildcard permissions (security risk)
            if 'can' in node.properties:
                perms = node.properties['can']
                if perms == '*':
                    self.wildcard_permissions.append((role_name, node.line_number))
    
    def visit_UserNode(self, node):
        """Process and validate user definition"""
        user_name = node.name
        
        # Check for duplicate user
        if user_name in self.users:
            error = SemanticError(
                f"Duplicate user definition: '{user_name}'",
                node.line_number,
                "ERROR"
            )
            self.errors.append(error)
        else:
            self.users[user_name] = node
            
            # Add to symbol table
            symbol = Symbol(user_name, SymbolType.USER, node.properties)
            symbol.defined_line = node.line_number
            self.symbol_table.define(symbol)
    
    def visit_ResourceNode(self, node):
        """Process and validate resource definition"""
        resource_name = node.name
        
        # Check for duplicate resource
        if resource_name in self.resources:
            error = SemanticError(
                f"Duplicate resource definition: '{resource_name}'",
                node.line_number,
                "ERROR"
            )
            self.errors.append(error)
        else:
            self.resources[resource_name] = node
            
            # Add to symbol table
            symbol = Symbol(resource_name, SymbolType.RESOURCE, node.properties)
            symbol.defined_line = node.line_number
            self.symbol_table.define(symbol)
    
    def visit_PolicyNode(self, node):
        """Process and validate policy rule"""
        self.policies.append(node)
        
        # Validate actions
        for action in node.actions:
            if action != '*' and action not in self.VALID_ACTIONS:
                warning = SemanticError(
                    f"Unknown action '{action}' in policy",
                    node.line_number,
                    "WARNING"
                )
                self.warnings.append(warning)
        
        # Analyze actions for sensitive operations
        sensitive_actions = {'delete', 'execute', 'update'}
        has_sensitive = any(action in sensitive_actions for action in node.actions)
        
        if has_sensitive and node.condition is None:
            self.overly_permissive_policies.append(node)
        
        # Check for dangerous permission patterns
        if node.condition:
            if self._condition_allows_guest(node.condition):
                if 'delete' in node.actions:
                    self.guest_delete_permissions.append(node)
        
        # Visit condition if present
        if node.condition:
            self.visit(node.condition)
    
    def visit_BinaryOpNode(self, node):
        """Process binary operation in conditions"""
        self.visit(node.left)
        self.visit(node.right)
        
        # Check for role comparisons
        if node.operator in ['==', '!=']:
            self._check_role_comparison(node)
    
    def _check_role_comparison(self, node):
        """Check if this is a role comparison and validate role name"""
        # Look for patterns like: user.role == "RoleName"
        if (isinstance(node.left, AttributeNode) and 
            node.left.object_name == 'user' and 
            node.left.attribute_name == 'role' and
            isinstance(node.right, LiteralNode) and
            isinstance(node.right.value, str)):
            
            role_name = node.right.value
            context = f" in condition at line {node.line_number}"
            self.role_references_in_conditions.append((role_name, node.line_number, context))
        
        # Also check the reverse: "RoleName" == user.role
        elif (isinstance(node.right, AttributeNode) and 
              node.right.object_name == 'user' and 
              node.right.attribute_name == 'role' and
              isinstance(node.left, LiteralNode) and
              isinstance(node.left.value, str)):
            
            role_name = node.left.value
            context = f" in condition at line {node.line_number}"
            self.role_references_in_conditions.append((role_name, node.line_number, context))
    
    def visit_UnaryOpNode(self, node):
        """Process unary operation in conditions"""
        self.visit(node.operand)
    
    def visit_LiteralNode(self, node):
        """Process literal values - no action needed"""
        pass
    
    def visit_AttributeNode(self, node):
        """Process attribute access (e.g., user.role, time.hour, request.ip, device.type)"""
        # Validate known objects
        valid_objects = {
            'user': ['role', 'name', 'id', 'department', 'clearance', 'location'],
            'time': ['hour', 'minute', 'day', 'month', 'year', 'weekday'],
            'request': ['ip', 'method', 'path', 'headers', 'user_agent'],
            'resource': ['path', 'type', 'owner', 'sensitivity'],
            'device': ['type', 'id', 'os', 'browser', 'location', 'trusted']
        }
        
        if node.object_name in valid_objects:
            if node.attribute_name not in valid_objects[node.object_name]:
                warning = SemanticError(
                    f"Unknown attribute '{node.attribute_name}' on object '{node.object_name}'",
                    node.line_number,
                    "WARNING"
                )
                self.warnings.append(warning)
        else:
            warning = SemanticError(
                f"Unknown object in attribute access: '{node.object_name}'",
                node.line_number,
                "WARNING"
            )
            self.warnings.append(warning)
    
    def _policies_conflict(self, policy1, policy2):
        """Check if two policies conflict"""
        # Must be on same resource
        if policy1.resource != policy2.resource:
            return False
        
        # Check for action overlap
        actions1 = set(policy1.actions)
        actions2 = set(policy2.actions)
        common_actions = actions1 & actions2
        
        if not common_actions:
            return False
        
        # ALLOW vs DENY on same resource/action
        if policy1.policy_type != policy2.policy_type:
            return self._conditions_may_overlap(policy1.condition, policy2.condition)
        
        return False
    
    def _conditions_may_overlap(self, cond1, cond2):
        """Check if two conditions might be simultaneously true"""
        # If either has no condition, they definitely overlap
        if cond1 is None or cond2 is None:
            return True
        
        # For comprehensive analysis, would need constraint solver
        # For now, assume conditions might overlap unless provably disjoint
        return True
    
    def _determine_conflict_type(self, policy1, policy2):
        """Determine the type of conflict between two policies"""
        if policy1.policy_type != policy2.policy_type:
            if 'delete' in policy1.actions or 'delete' in policy2.actions:
                return "PRIVILEGE_ESCALATION"
            return "ALLOW_DENY_CONFLICT"
        return "LOGICAL_CONTRADICTION"
    
    def _generate_conflict_description(self, policy1, policy2):
        """Generate human-readable conflict description"""
        actions = list(set(policy1.actions) & set(policy2.actions))
        actions_str = ", ".join(actions)
        
        return (f"Conflicting policies on resource '{policy1.resource}' "
                f"for action(s) {actions_str}: "
                f"{policy1.policy_type} (line {policy1.line_number}) vs "
                f"{policy2.policy_type} (line {policy2.line_number})")
    
    def _detect_privilege_escalation(self):
        """Detect potential privilege escalation patterns"""
        # Look for patterns where policies escalate privileges
        for policy in self.policies:
            if policy.policy_type == 'ALLOW':
                # Check if admin actions are given to non-admin roles
                admin_actions = {'delete', 'execute'}
                has_admin_action = any(action in admin_actions for action in policy.actions)
                
                if has_admin_action:
                    if not self._is_admin_context(policy.condition):
                        warning = SemanticError(
                            f"Policy grants sensitive actions without admin context",
                            policy.line_number,
                            "RISK"
                        )
                        self.warnings.append(warning)
    
    def _condition_allows_guest(self, node):
        """Check if a condition node allows Guest role"""
        if isinstance(node, BinaryOpNode):
            return (self._condition_allows_guest(node.left) or 
                   self._condition_allows_guest(node.right))
        elif isinstance(node, LiteralNode):
            return 'guest' in str(node.value).lower()
        elif isinstance(node, AttributeNode):
            return False
        return False
    
    def _is_admin_context(self, node):
        """Check if condition restricts to admin context"""
        if node is None:
            return False
        
        # Convert condition to string for simple pattern matching
        condition_str = self._node_to_string(node).lower()
        return 'admin' in condition_str or 'administrator' in condition_str
    
    def _node_to_string(self, node):
        """Convert AST node to string representation"""
        if isinstance(node, BinaryOpNode):
            left_str = self._node_to_string(node.left)
            right_str = self._node_to_string(node.right)
            return f"({left_str} {node.operator} {right_str})"
        elif isinstance(node, UnaryOpNode):
            operand_str = self._node_to_string(node.operand)
            return f"{node.operator}({operand_str})"
        elif isinstance(node, AttributeNode):
            return f"{node.object_name}.{node.attribute_name}"
        elif isinstance(node, LiteralNode):
            return str(node.value)
        else:
            return str(node)
    
    def get_results(self):
        """Return comprehensive analysis results"""
        return {
            "success": len(self.errors) == 0,
            "errors": [e.to_dict() for e in self.errors],
            "warnings": [w.to_dict() for w in self.warnings],
            "conflicts": [c.to_dict() for c in self.conflicts],
            "statistics": {
                "roles_defined": len(self.roles),
                "users_defined": len(self.users),
                "resources_defined": len(self.resources),
                "policies_defined": len(self.policies),
                "conflicts_found": len(self.conflicts),
                "undefined_references": len(self.undefined_references),
                "role_references_in_conditions": len(self.role_references_in_conditions),
                "security_risks": len(self.wildcard_permissions) + len(self.guest_delete_permissions)
            },
            "security_issues": {
                "wildcard_permissions": self.wildcard_permissions,
                "guest_delete_permissions": len(self.guest_delete_permissions),
                "overly_permissive": len(self.overly_permissive_policies)
            },
            "symbol_table": self.symbol_table.to_dict()
        }
    
    def print_report(self, results):
        """Print a detailed analysis report"""
        print("=" * 80)
        print("SEMANTIC ANALYSIS REPORT")
        print("=" * 80)
        
        print(f"\nStatus: {'✓ PASS' if results['success'] else '✗ FAIL'}")
        
        print(f"\nStatistics:")
        for key, value in results['statistics'].items():
            print(f"  {key}: {value}")
        
        if results['errors']:
            print(f"\nErrors ({len(results['errors'])}):")
            for error in results['errors']:
                print(f"  [{error['type']}] Line {error['line']}: {error['message']}")
        
        if results['warnings']:
            print(f"\nWarnings ({len(results['warnings'])}):")
            for warning in results['warnings']:
                print(f"  [{warning['type']}] Line {warning['line']}: {warning['message']}")
        
        if results['conflicts']:
            print(f"\nConflicts ({len(results['conflicts'])}):")
            for conflict in results['conflicts']:
                print(f"  [{conflict['type']}] Risk: {conflict['risk_score']}/100")
                print(f"    {conflict['description']}")
        
        print("=" * 80)