"""
backend/compiler/symbol_table.py
AuthScript Symbol Table
Manages scopes, bindings, and symbol information
"""

from enum import Enum
from typing import Dict, Optional, Any


class SymbolType(Enum):
    """Types of symbols in SPL"""
    ROLE = "role"
    USER = "user"
    RESOURCE = "resource"
    POLICY = "policy"
    VARIABLE = "variable"


class Symbol:
    """Represents a symbol in the symbol table"""
    
    def __init__(self, name: str, symbol_type: SymbolType, attributes: Dict = None):
        self.name = name
        self.symbol_type = symbol_type
        self.attributes = attributes or {}
        self.scope_level = 0
        self.defined_line = None
    
    def __repr__(self):
        return f"Symbol({self.name}, {self.symbol_type.value}, {self.attributes})"
    
    def to_dict(self):
        return {
            "name": self.name,
            "type": self.symbol_type.value,
            "attributes": self.attributes,
            "scope_level": self.scope_level
        }


class Scope:
    """Represents a scope level in the program"""
    
    def __init__(self, name: str, level: int, parent: Optional['Scope'] = None):
        self.name = name
        self.level = level
        self.parent = parent
        self.symbols: Dict[str, Symbol] = {}
    
    def define(self, symbol: Symbol):
        """Define a symbol in this scope"""
        symbol.scope_level = self.level
        self.symbols[symbol.name] = symbol
    
    def lookup(self, name: str) -> Optional[Symbol]:
        """Look up a symbol in this scope only"""
        return self.symbols.get(name)
    
    def resolve(self, name: str) -> Optional[Symbol]:
        """Resolve a symbol in this scope or parent scopes"""
        symbol = self.lookup(name)
        if symbol:
            return symbol
        
        if self.parent:
            return self.parent.resolve(name)
        
        return None
    
    def __repr__(self):
        return f"Scope({self.name}, level={self.level}, symbols={len(self.symbols)})"


class SymbolTable:
    """
    Manages symbols and scopes for the SPL compiler
    Handles scope nesting, symbol resolution, and binding
    """
    
    def __init__(self):
        # Global scope
        self.global_scope = Scope("global", 0)
        self.current_scope = self.global_scope
        
        # Track all scopes
        self.scopes = [self.global_scope]
        
        # Built-in symbols
        self._initialize_builtins()
    
    def _initialize_builtins(self):
        """Initialize built-in symbols (predefined objects/attributes)"""
        # Built-in objects that can be accessed in conditions
        builtins = {
            'user': ['role', 'name', 'id', 'department', 'clearance', 'location'],
            'time': ['hour', 'minute', 'day', 'month', 'year', 'weekday'],
            'request': ['ip', 'method', 'path', 'headers'],
            'resource': ['path', 'type', 'owner']
        }
        
        for obj_name, attributes in builtins.items():
            symbol = Symbol(obj_name, SymbolType.VARIABLE, {'attributes': attributes})
            self.global_scope.define(symbol)
    
    def enter_scope(self, name: str):
        """Enter a new scope"""
        new_level = self.current_scope.level + 1
        new_scope = Scope(name, new_level, self.current_scope)
        self.current_scope = new_scope
        self.scopes.append(new_scope)
        return new_scope
    
    def exit_scope(self):
        """Exit current scope and return to parent"""
        if self.current_scope.parent:
            self.current_scope = self.current_scope.parent
    
    def define(self, symbol: Symbol):
        """Define a symbol in the current scope"""
        self.current_scope.define(symbol)
    
    def lookup(self, name: str) -> Optional[Symbol]:
        """Look up a symbol in current scope only"""
        return self.current_scope.lookup(name)
    
    def resolve(self, name: str) -> Optional[Symbol]:
        """Resolve a symbol by searching current and parent scopes"""
        return self.current_scope.resolve(name)
    
    def get_all_symbols(self, symbol_type: Optional[SymbolType] = None):
        """Get all symbols of a specific type across all scopes"""
        symbols = []
        for scope in self.scopes:
            for symbol in scope.symbols.values():
                if symbol_type is None or symbol.symbol_type == symbol_type:
                    symbols.append(symbol)
        return symbols
    
    def get_roles(self):
        """Get all defined roles"""
        return self.get_all_symbols(SymbolType.ROLE)
    
    def get_users(self):
        """Get all defined users"""
        return self.get_all_symbols(SymbolType.USER)
    
    def get_resources(self):
        """Get all defined resources"""
        return self.get_all_symbols(SymbolType.RESOURCE)
    
    def symbol_exists(self, name: str) -> bool:
        """Check if a symbol exists in current or parent scopes"""
        return self.resolve(name) is not None
    
    def get_scope_chain(self):
        """Get the current scope chain from global to current"""
        chain = []
        scope = self.current_scope
        while scope:
            chain.insert(0, scope)
            scope = scope.parent
        return chain
    
    def to_dict(self):
        """Convert symbol table to dictionary for serialization"""
        return {
            "scopes": [
                {
                    "name": scope.name,
                    "level": scope.level,
                    "symbols": [symbol.to_dict() for symbol in scope.symbols.values()]
                }
                for scope in self.scopes
            ],
            "current_scope": self.current_scope.name,
            "total_symbols": sum(len(scope.symbols) for scope in self.scopes)
        }
    
    def print_table(self):
        """Print the symbol table in a readable format"""
        print("=" * 80)
        print("SYMBOL TABLE")
        print("=" * 80)
        
        for scope in self.scopes:
            print(f"\nScope: {scope.name} (Level {scope.level})")
            print("-" * 80)
            
            if not scope.symbols:
                print("  (empty)")
            else:
                print(f"{'Name':<20} {'Type':<15} {'Attributes'}")
                print("-" * 80)
                for symbol in scope.symbols.values():
                    attrs = str(symbol.attributes)[:40] + "..." if len(str(symbol.attributes)) > 40 else str(symbol.attributes)
                    print(f"{symbol.name:<20} {symbol.symbol_type.value:<15} {attrs}")
        
        print("=" * 80)
        print(f"Total symbols: {sum(len(scope.symbols) for scope in self.scopes)}")
        print("=" * 80)




# Scope and Binding Demonstration
class ScopeBindingDemo:
    """
    Demonstrates scope and binding concepts in SPL
    For use in project report
    """
    
    @staticmethod
    def demonstrate():
        """Run a demonstration of scope and binding"""
        print("=" * 80)
        print("SPL SCOPE AND BINDING DEMONSTRATION")
        print("=" * 80)
        
        # Create symbol table
        st = SymbolTable()
        
        print("\n1. GLOBAL SCOPE - Defining Roles")
        print("-" * 80)
        
        # Define roles in global scope
        admin_role = Symbol("Administrator", SymbolType.ROLE, {"can": "*"})
        dev_role = Symbol("Developer", SymbolType.ROLE, {"can": "read, write"})
        
        st.define(admin_role)
        st.define(dev_role)
        
        print(f"Defined: {admin_role}")
        print(f"Defined: {dev_role}")
        print(f"Current scope level: {st.current_scope.level}")
        
        print("\n2. GLOBAL SCOPE - Defining Resources")
        print("-" * 80)
        
        # Define resources
        db_resource = Symbol("DB_Finance", SymbolType.RESOURCE, {"path": "/data/financial"})
        st.define(db_resource)
        
        print(f"Defined: {db_resource}")
        
        print("\n3. ENTERING POLICY SCOPE")
        print("-" * 80)
        
        # Enter a policy scope
        st.enter_scope("policy_block_1")
        print(f"Entered scope: {st.current_scope.name}")
        print(f"Current scope level: {st.current_scope.level}")
        
        # Define local variables in policy scope
        time_var = Symbol("current_time", SymbolType.VARIABLE, {"type": "time"})
        st.define(time_var)
        
        print(f"Defined in policy scope: {time_var}")
        
        print("\n4. SYMBOL RESOLUTION")
        print("-" * 80)
        
        # Resolve symbols from different scopes
        print("Resolving 'Administrator' from policy scope:")
        resolved = st.resolve("Administrator")
        print(f"  Found: {resolved} (from scope level {resolved.scope_level})")
        
        print("Resolving 'current_time' from policy scope:")
        resolved = st.resolve("current_time")
        print(f"  Found: {resolved} (from scope level {resolved.scope_level})")
        
        print("Resolving 'NonExistent':")
        resolved = st.resolve("NonExistent")
        print(f"  Found: {resolved}")
        
        print("\n5. SCOPE CHAIN")
        print("-" * 80)
        
        chain = st.get_scope_chain()
        print("Current scope chain:")
        for scope in chain:
            print(f"  {scope}")
        
        print("\n6. EXITING SCOPE")
        print("-" * 80)
        
        st.exit_scope()
        print(f"Exited to scope: {st.current_scope.name}")
        print(f"Current scope level: {st.current_scope.level}")
        
        print("\n7. BINDING DEMONSTRATION")
        print("-" * 80)
        print("Static Binding: Role names are bound at compile time")
        print("  Example: USER Alice { role: Administrator }")
        print("  'Administrator' must be defined before use")
        print("")
        print("Dynamic Binding: Conditions are evaluated at runtime")
        print("  Example: IF (time.hour >= 9)")
        print("  'time.hour' value is determined during execution")
        
        print("\n8. FINAL SYMBOL TABLE")
        print("-" * 80)
        st.print_table()

# Example usage
if __name__ == '__main__':
    # Run scope and binding demonstration
    ScopeBindingDemo.demonstrate()