"""
backend/execution/policy_engine.py
Policy Execution Engine - Enforces compiled AuthScript policies
"""

import json
from datetime import datetime
from typing import Dict, List, Any, Optional
import re


class PolicyEngine:
    """Executes compiled SPL policies and enforces access control"""
    
    def __init__(self, compiled_policy: Dict[str, Any]):
        """
        Initialize policy engine with compiled policy
        
        Args:
            compiled_policy: JSON output from code generator
        """
        self.policy = compiled_policy
        self.roles = self._index_roles()
        self.users = self._index_users()
        self.resources = self._index_resources()
        self.policies = self._index_policies()
        
    def _index_roles(self) -> Dict[str, Any]:
        """Index roles for quick lookup"""
        roles = {}
        for role in self.policy.get('roles', []):
            roles[role['name']] = role
        return roles
    
    def _index_users(self) -> Dict[str, Any]:
        """Index users for quick lookup"""
        users = {}
        for user in self.policy.get('users', []):
            users[user['name']] = user
        return users
    
    def _index_resources(self) -> Dict[str, Any]:
        """Index resources for quick lookup"""
        resources = {}
        for resource in self.policy.get('resources', []):
            resources[resource['name']] = resource
        return resources
    
    def _index_policies(self) -> List[Dict[str, Any]]:
        """Get all policies (ALLOW and DENY)"""
        return self.policy.get('policies', [])
    
    def check_access(self, username: str, action: str, resource_name: str, 
                    context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Check if user has permission to perform action on resource
        
        Args:
            username: Name of user requesting access
            action: Action to perform (read, write, delete, etc.)
            resource_name: Name of resource to access
            context: Additional context (time, IP, device, etc.)
            
        Returns:
            Dict with access decision and explanation
        """
        # Get user
        user = self.users.get(username)
        if not user:
            return {
                'allowed': False,
                'reason': f"User '{username}' not found",
                'decision': 'DENY',
                'matched_policies': []
            }
        
        # Get resource
        resource = self.resources.get(resource_name)
        if not resource:
            return {
                'allowed': False,
                'reason': f"Resource '{resource_name}' not found",
                'decision': 'DENY',
                'matched_policies': []
            }
        
        # Get user's role
        user_role = user.get('properties', {}).get('role')
        if not user_role:
            return {
                'allowed': False,
                'reason': f"User '{username}' has no role assigned",
                'decision': 'DENY',
                'matched_policies': []
            }
        
        # Prepare context for evaluation
        if context is None:
            context = {}
        
        # Add user and time context
        eval_context = {
            'user': {
                'name': username,
                'role': user_role
            },
            'time': {
                'hour': context.get('hour', datetime.now().hour),
                'day': context.get('day', datetime.now().strftime('%A')),
                'date': context.get('date', datetime.now().date())
            },
            'resource': {
                'name': resource_name,
                'path': resource.get('properties', {}).get('path', '')
            }
        }
        
        # Evaluate policies
        matched_policies = []
        deny_found = False
        allow_found = False
        
        for policy in self.policies:
            # Check if policy applies to this resource
            if not self._matches_resource(policy['resource'], resource_name):
                continue
            
            # Check if action matches
            if not self._matches_action(policy['actions'], action):
                continue
            
            # Evaluate condition
            condition_result = True
            if policy.get('condition'):
                condition_result = self._evaluate_condition(
                    policy['condition'], 
                    eval_context
                )
            
            if condition_result:
                matched_policies.append({
                    'type': policy['type'],
                    'actions': policy['actions'],
                    'resource': policy['resource'],
                    'condition': policy.get('condition', 'Always')
                })
                
                if policy['type'] == 'DENY':
                    deny_found = True
                elif policy['type'] == 'ALLOW':
                    allow_found = True
        
        # Decision logic: DENY overrides ALLOW
        if deny_found:
            return {
                'allowed': False,
                'reason': 'Explicit DENY policy matched',
                'decision': 'DENY',
                'matched_policies': matched_policies,
                'context': eval_context
            }
        elif allow_found:
            return {
                'allowed': True,
                'reason': 'ALLOW policy matched',
                'decision': 'ALLOW',
                'matched_policies': matched_policies,
                'context': eval_context
            }
        else:
            return {
                'allowed': False,
                'reason': 'No matching policies (default deny)',
                'decision': 'DENY',
                'matched_policies': matched_policies,
                'context': eval_context
            }
    
    def _matches_resource(self, policy_resource: str, target_resource: str) -> bool:
        """Check if policy resource matches target resource"""
        # Exact match
        if policy_resource == target_resource:
            return True
        
        # Wildcard match (convert to regex)
        pattern = policy_resource.replace('*', '.*')
        return bool(re.match(f'^{pattern}$', target_resource))
    
    def _matches_action(self, policy_actions: List[str], target_action: str) -> bool:
        """Check if action matches policy actions"""
        # Wildcard grants all actions
        if '*' in policy_actions:
            return True
        
        return target_action in policy_actions
    
    def _evaluate_condition(self, condition: str, context: Dict[str, Any]) -> bool:
        """
        Evaluate policy condition against context
        
        Args:
            condition: Condition string (e.g., "user.role == 'Admin'")
            context: Evaluation context with user, time, resource data
            
        Returns:
            Boolean result of condition evaluation
        """
        try:
            # Replace context variables with actual values
            # user.role -> context['user']['role']
            # time.hour -> context['time']['hour']
            
            eval_str = condition
            
            # Replace attribute access (user.role, time.hour, etc.)
            def replace_attr(match):
                obj = match.group(1)
                attr = match.group(2)
                return f"context['{obj}']['{attr}']"
            
            eval_str = re.sub(r'(\w+)\.(\w+)', replace_attr, eval_str)
            
            # Replace comparison operators
            eval_str = eval_str.replace('==', '==').replace('!=', '!=')
            eval_str = eval_str.replace('AND', 'and').replace('OR', 'or').replace('NOT', 'not')
            
            # Safely evaluate
            result = eval(eval_str, {"__builtins__": {}}, {"context": context})
            return bool(result)
        except Exception as e:
            print(f"Error evaluating condition '{condition}': {e}")
            return False
    
    def get_user_permissions(self, username: str) -> Dict[str, Any]:
        """
        Get all permissions for a user
        
        Returns:
            Dict with user's role and applicable policies
        """
        user = self.users.get(username)
        if not user:
            return {'error': f"User '{username}' not found"}
        
        user_role = user.get('properties', {}).get('role')
        role_data = self.roles.get(user_role, {})
        
        return {
            'username': username,
            'role': user_role,
            'role_permissions': role_data.get('properties', {}),
            'applicable_policies': self._get_applicable_policies(username)
        }
    
    def _get_applicable_policies(self, username: str) -> List[Dict[str, Any]]:
        """Get all policies that could apply to this user"""
        applicable = []
        
        for policy in self.policies:
            # Check if policy has condition mentioning user role
            if policy.get('condition'):
                if 'user.role' in policy['condition']:
                    applicable.append(policy)
            else:
                # No condition means applies to all
                applicable.append(policy)
        
        return applicable
    
    def audit_access(self, username: str, action: str, resource_name: str, 
                    allowed: bool, reason: str) -> Dict[str, Any]:
        """
        Create audit log entry
        
        Returns:
            Audit log entry
        """
        return {
            'timestamp': datetime.now().isoformat(),
            'user': username,
            'action': action,
            'resource': resource_name,
            'allowed': allowed,
            'reason': reason
        }