secure-policy-language/
│
├── backend/
│   ├── compiler/
│   │   ├── __init__.py
│   │   ├── lexer.py              # PLY lexer - tokenization
│   │   ├── parser.py             # PLY parser - syntax analysis
│   │   ├── ast_nodes.py          # AST node classes
│   │   ├── semantic_analyzer.py  # Semantic analysis & validation
│   │   ├── code_generator.py     # Target code generation
│   │   └── symbol_table.py       # Scope and binding management
│   │
│   ├── llm/
│   │   ├── __init__.py
│   │   └── security_scanner.py   # LLM integration for risk analysis
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py             # Flask API endpoints
│   │
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── error_handler.py      # Error messages and handling
│   │   └── logger.py             # Logging configuration
│   │
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_lexer.py
│   │   ├── test_parser.py
│   │   ├── test_semantic.py
│   │   └── sample_policies/      # Test SPL files
│   │       ├── valid_policy.spl
│   │       ├── invalid_policy.spl
│   │       └── conflict_policy.spl
│   │
│   ├── app.py                    # Flask application entry point
│   ├── config.py                 # Configuration (API keys, etc.)
│   ├── requirements.txt          # Python dependencies
│   └── .env                      # Environment variables (not in git)
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── CodeEditor.jsx    # Monaco editor component
│   │   │   ├── CompilerOutput.jsx # Display compilation results
│   │   │   ├── ErrorDisplay.jsx   # Show errors with line numbers
│   │   │   ├── RiskReport.jsx     # LLM security analysis display
│   │   │   └── Navbar.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js            # API calls to backend
│   │   │
│   │   ├── styles/
│   │   │   └── main.css
│   │   │
│   │   ├── App.jsx               # Main React component
│   │   └── main.jsx              # React entry point
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── .env                      # Frontend environment variables
│
├── docs/
│   ├── project_report.md         # Your project report content
│   ├── grammar.txt               # SPL grammar specification
│   ├── token_list.txt            # Complete token listing
│   ├── regex_patterns.txt        # Regular expressions for tokens
│   ├── parse_tree_examples/      # AST/Parse tree diagrams
│   └── screenshots/              # UI screenshots for report
│
├── deployment/
│   ├── azure/
│   │   ├── app_service_config.json
│   │   └── deployment_guide.md
│   │
│   └── docker/
│       ├── Dockerfile.backend
│       ├── Dockerfile.frontend
│       └── docker-compose.yml
│
├── examples/
│   ├── basic_policy.spl          # Simple example policies
│   ├── advanced_policy.spl       # Complex policies
│   └── demo_script.spl           # For presentation demo
│
├── .gitignore
└── README.md                     # Project overview and setup



# Secure Policy Language (SPL) Compiler

A domain-specific language for defining granular, human-readable access control policies with AI-powered security risk analysis.

## 📋 Project Overview

SPL is a declarative programming language designed for enterprise access control systems, similar to AWS IAM policies or Azure RBAC. The compiler performs lexical, syntactic, and semantic analysis, then interfaces with large language models to identify security risks, policy conflicts, and privilege violations.

**Course:** Analysis of Programming Languages (CIT4004)  
**Institution:** University of Technology, Jamaica  
**Semester:** 1 – 2025/2026

## ✨ Features

- **Declarative Syntax**: Human-readable policy definitions
- **Role-Based Access Control**: Define roles, users, and resources
- **Conditional Policies**: Time-based, attribute-based rules
- **Conflict Detection**: Identifies overlapping or contradicting policies
- **AI Security Scanning**: LLM-powered risk analysis and scoring
- **Target Code Generation**: Executable policy enforcement
- **Cloud Deployment**: Azure/AWS compatible

## 🏗️ Architecture

```
SPL Source Code
    ↓
[Lexer] → Tokens
    ↓
[Parser] → AST
    ↓
[Semantic Analyzer] → Validated AST + Symbol Table
    ↓
[Code Generator] → Target Code
    ↓
[LLM Scanner] → Risk Report
    ↓
Execution & Enforcement
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- pip package manager
- Virtual environment (recommended)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd secure-policy-language

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Navigate to compiler directory
cd backend/compiler
```

### Run the Lexer

```bash
python lexer.py
```

### Run the Parser

```bash
python parser.py
```

### Test with Sample Policy

```bash
python parser.py < ../../examples/basic_policy.spl
```

## 📖 Language Syntax

### Roles

```spl
ROLE Administrator {
    can: *
}
```

### Resources

```spl
RESOURCE DB_Finance {
    path: "/data/financial"
}
```

### Users

```spl
USER JaneDoe {
    role: Developer
}
```

### Policies

```spl
ALLOW action: read, write ON RESOURCE: DB_Finance
IF (user.role == "Developer" AND time.hour >= 9)

DENY action: delete ON RESOURCE: DB_Finance
IF (user.role == "Guest")
```

## 🔧 Grammar Specification

```bnf
<program> ::= <statement_list>

<statement_list> ::= <statement> | <statement_list> <statement>

<statement> ::= <role_definition>
              | <user_definition>
              | <resource_definition>
              | <policy_rule>

<role_definition> ::= ROLE IDENTIFIER '{' <property_list> '}'

<user_definition> ::= USER IDENTIFIER '{' <property_list> '}'

<resource_definition> ::= RESOURCE IDENTIFIER '{' <property_list> '}'

<policy_rule> ::= <policy_type> action: <action_list> 
                  ON RESOURCE: <resource_spec>
                  [IF <condition>]

<policy_type> ::= ALLOW | DENY

<condition> ::= <expression>

<expression> ::= <expression> AND <expression>
               | <expression> OR <expression>
               | NOT <expression>
               | <expression> <comparison_op> <expression>
               | IDENTIFIER '.' IDENTIFIER
               | <value>

<comparison_op> ::= '==' | '!=' | '<' | '>' | '<=' | '>='
```

## 📦 Project Structure

```
secure-policy-language/
├── backend/
│   ├── compiler/
│   │   ├── lexer.py              # Tokenization
│   │   ├── parser.py             # Syntax analysis
│   │   ├── ast_nodes.py          # AST definitions
│   │   ├── semantic_analyzer.py  # Semantic checks
│   │   └── code_generator.py     # Code generation
│   ├── llm/
│   │   └── security_scanner.py   # AI risk analysis
│   └── api/
│       └── routes.py             # Flask endpoints
├── frontend/
│   └── src/
│       └── components/           # React components
├── docs/
│   └── project_report.md         # Full documentation
├── examples/
│   ├── basic_policy.spl
│   ├── conflict_policy.spl
│   └── advanced_policy.spl
└── requirements.txt
```

## 🧪 Testing

```bash
# Run lexer tests
cd backend/tests
python test_lexer.py

# Run parser tests
python test_parser.py

# Run all tests
pytest
```

## 🎯 Language Characteristics

### Readability
- Clear keyword choices (ALLOW, DENY, ROLE)
- Minimal syntax overhead
- Self-documenting policy structure

### Writability
- Declarative style reduces complexity
- Intuitive conditional expressions
- Support for wildcards and patterns

### Reliability
- Strong type checking (semantic analysis)
- Conflict detection
- AI-powered security validation

## 🤖 LLM Integration

The compiler integrates with LLMs to:
- Identify overly permissive policies
- Detect logical contradictions
- Flag privilege escalation risks
- Suggest improvements
- Assign risk scores (0-100)

## ☁️ Cloud Deployment

### Azure Deployment

```bash
# Deploy backend to Azure App Service
az webapp up --name spl-compiler --resource-group spl-rg

# Deploy frontend to Azure Static Web Apps
cd frontend
npm run build
az staticwebapp create --name spl-frontend
```

## 📊 Token Reference

| Token Type | Pattern | Example |
|------------|---------|---------|
| ROLE | `ROLE` | `ROLE` |
| USER | `USER` | `USER` |
| RESOURCE | `RESOURCE` | `RESOURCE` |
| ALLOW | `ALLOW` | `ALLOW` |
| DENY | `DENY` | `DENY` |
| IDENTIFIER | `[a-zA-Z_][a-zA-Z0-9_]*` | `Admin`, `DB_Finance` |
| STRING | `"..."` or `'...'` | `"Guest"`, `'/data/*'` |
| NUMBER | `\d+(\.\d+)?` | `9`, `17.5` |
| EQUALS | `==` | `==` |
| AND | `AND` | `AND` |
| OR | `OR` | `OR` |

## 🛠️ Development Tools

- **PLY (Python Lex-Yacc)**: Lexer and parser generation
- **Flask**: Backend API framework
- **React**: Frontend interface
- **OpenAI API**: LLM integration
- **Azure/AWS**: Cloud hosting

## 📚 Resources

- [PLY Documentation](https://www.dabeaz.com/ply/)
- [Compiler Design Principles](https://www.cs.auckland.ac.nz/courses/compsci330s1c/)
- [OpenAI API Guide](https://platform.openai.com/docs)

## 👥 Contributors

[Your Name] - [Your ID Number]

## 📄 License

Educational project for CIT4004 - UTech Jamaica

## 🔮 Future Enhancements

- [ ] Policy inheritance
- [ ] Temporal logic support
- [ ] Policy simulation mode
- [ ] Visual policy editor
- [ ] Multi-tenancy support
- [ ] Policy versioning

---

**Note:** This is an academic project demonstrating compiler design principles and AI integration for access control systems.


Testing

cd backend\tests
python test_lexer.py

PS C:\LATEST\secure-policy-language\backend\tests> python test_lexer.py
PS C:\LATEST\secure-policy-language\backend\tests> python test_parser.py
PS C:\LATEST\secure-policy-language\backend\tests> python test_semantic.py