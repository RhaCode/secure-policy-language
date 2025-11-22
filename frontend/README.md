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
│   │   │   ├── CodeEditor.tsx    # Monaco editor component
│   │   │   ├── CompilerOutput.tsx # Display compilation results
│   │   │   ├── ErrorDisplay.tsx   # Show errors with line numbers
│   │   │   ├── RiskReport.tsx     # LLM security analysis display
│   │   │   └── Navbar.tsx
│   │   │
│   │   ├── services/
│   │   │   └── api.ts            # API calls to backend
│   │   │
│   │   ├── styles/
│   │   │   └── main.css
│   │   │
│   │   ├── App.tsx               # Main React component
│   │   └── main.tsx              # React entry point
│   │
│   ├── package.ton
│   ├── vite.config.ts
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


# SPL Execution Engine - Complete Setup Guide

## 🎯 Overview

You now have a **complete policy execution engine** with:
- ✅ Policy compilation (lexer, parser, semantic analysis)
- ✅ Policy execution (runtime enforcement)
- ✅ User/Resource management (SQLite database)
- ✅ Audit logging
- ✅ Access control testing interface

---

## 📁 New Backend Structure

```
backend/
├── compiler/           # Existing compiler components
│   ├── lexer.py
│   ├── parser.py
│   ├── ast_nodes.py
│   ├── semantic_analyzer.py
│   └── code_generator.py
│
├── database/          # NEW - Database management
│   ├── __init__.py
│   └── db_manager.py
│
├── execution/         # NEW - Policy execution engine
│   ├── __init__.py
│   └── policy_engine.py
│
├── api/
│   ├── routes.py              # Compiler APIs
│   └── execution_routes.py    # NEW - Execution APIs
│
└── app.py             # Updated with execution routes
```

---

## 🚀 Backend Setup

### Step 1: Create New Directories

```bash
cd backend
mkdir -p database execution
touch database/__init__.py
touch execution/__init__.py
```

### Step 2: Create New Files

Create these three new files:

1. **`backend/database/db_manager.py`** - SQLite database manager
2. **`backend/execution/policy_engine.py`** - Policy execution engine
3. **`backend/api/execution_routes.py`** - Execution API routes

### Step 3: Update app.py

Replace `backend/app.py` with the updated version that registers execution routes.

### Step 4: Install Additional Dependencies (if needed)

```bash
pip install flask-cors
```

### Step 5: Start the Backend

```bash
cd backend
python app.py
```

You should see:
```
============================================================
SPL COMPILER & EXECUTION ENGINE
============================================================
Starting server on http://localhost:5000

Available endpoints:
  Compiler API: http://localhost:5000/api/*
  Execution API: http://localhost:5000/api/execution/*
============================================================
```

---

## 🗄️ Database Schema

The SQLite database (`spl_database.db`) contains:

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    email TEXT,
    department TEXT,
    created_at TIMESTAMP,
    active BOOLEAN
)
```

### Resources Table
```sql
CREATE TABLE resources (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    path TEXT NOT NULL,
    description TEXT,
    owner TEXT,
    created_at TIMESTAMP
)
```

### Audit Logs Table
```sql
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY,
    timestamp TIMESTAMP,
    username TEXT NOT NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    allowed BOOLEAN NOT NULL,
    reason TEXT,
    ip_address TEXT
)
```

### Compiled Policies Table
```sql
CREATE TABLE compiled_policies (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    source_code TEXT NOT NULL,
    compiled_json TEXT NOT NULL,
    version INTEGER,
    active BOOLEAN,
    created_at TIMESTAMP,
    created_by TEXT
)
```

---

## 🔌 New API Endpoints

### Policy Execution

#### Check Access
```http
POST /api/execution/check-access
Content-Type: application/json

{
  "username": "Alice",
  "action": "read",
  "resource": "DB_Finance",
  "context": {
    "hour": 14
  }
}
```

Response:
```json
{
  "allowed": true,
  "reason": "ALLOW policy matched",
  "decision": "ALLOW",
  "matched_policies": [...],
  "context": {...}
}
```

#### Activate Policy
```http
POST /api/execution/activate-policy
Content-Type: application/json

{
  "name": "production_policy",
  "source_code": "ROLE Admin { can: * }...",
  "compiled_json": {...}
}
```

### User Management

```http
GET    /api/execution/users           # List all users
POST   /api/execution/users           # Create user
GET    /api/execution/users/:username # Get user details
PUT    /api/execution/users/:username # Update user
DELETE /api/execution/users/:username # Delete user
```

### Resource Management

```http
GET    /api/execution/resources       # List all resources
POST   /api/execution/resources       # Create resource
GET    /api/execution/resources/:name # Get resource
PUT    /api/execution/resources/:name # Update resource
DELETE /api/execution/resources/:name # Delete resource
```

### Audit & Statistics

```http
GET /api/execution/audit-logs?username=Alice&limit=50
GET /api/execution/statistics
GET /api/execution/user-permissions/:username
```

---

## 🎨 Frontend Integration

### Step 1: Create Access Tester Component

Create `frontend/src/components/AccessTester.tsx` with the provided code.

### Step 2: Update Main App

Add a new tab to your App.tsx:

```typescript
const [activeTab, setActiveTab] = useState<'compilation' | 'security' | 'debug' | 'execution'>('compilation');

// In tabs section:
<button onClick={() => setActiveTab('execution')}>
  Execution
</button>

// In content section:
{activeTab === 'execution' && (
  <AccessTester className="h-full" />
)}
```

### Step 3: Update API Service

Add to `frontend/src/services/api.ts`:

```typescript
async checkAccess(username: string, action: string, resource: string, context: any) {
  return this.fetchWithErrorHandling(`${API_BASE}/execution/check-access`, {
    method: 'POST',
    body: JSON.stringify({ username, action, resource, context }),
  });
}

async getUsers() {
  return this.fetchWithErrorHandling(`${API_BASE}/execution/users`);
}

async getResources() {
  return this.fetchWithErrorHandling(`${API_BASE}/execution/resources`);
}
```

---

## 🧪 Testing the Complete System

### Test 1: Compile Policy

1. Go to the compiler tab
2. Click "Compile" on the sample code
3. Verify successful compilation
4. Download the generated JSON

### Test 2: Activate Policy

Use the compiled JSON to activate the policy:

```bash
curl -X POST http://localhost:5000/api/execution/activate-policy \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test_policy",
    "compiled_json": {...}
  }'
```

### Test 3: Check Access

#### Test Case 1: Admin can do anything
```bash
curl -X POST http://localhost:5000/api/execution/check-access \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Alice",
    "action": "delete",
    "resource": "DB_Finance"
  }'
```

Expected: ✅ ALLOWED

#### Test Case 2: Developer can read during business hours
```bash
curl -X POST http://localhost:5000/api/execution/check-access \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Bob",
    "action": "read",
    "resource": "DB_Finance",
    "context": {"hour": 14}
  }'
```

Expected: ✅ ALLOWED

#### Test Case 3: Developer cannot read outside business hours
```bash
curl -X POST http://localhost:5000/api/execution/check-access \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Bob",
    "action": "read",
    "resource": "DB_Finance",
    "context": {"hour": 22}
  }'
```

Expected: ❌ DENIED

#### Test Case 4: Developer cannot delete
```bash
curl -X POST http://localhost:5000/api/execution/check-access \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Bob",
    "action": "delete",
    "resource": "DB_Finance"
  }'
```

Expected: ❌ DENIED (explicit DENY policy)

---

## 📊 Sample Data

The database initializes with:

### Users
- **Alice** (Admin) - Full access
- **Bob** (Developer) - Limited access with time restrictions
- **Charlie** (Guest) - Minimal access

### Resources
- **DB_Finance** (database) - `/data/financial`
- **DB_HR** (database) - `/data/hr`
- **API_Users** (api) - `/api/users`

---

## 🎯 Project Requirements Met

This implementation fulfills ALL project requirements:

✅ **Lexical Analysis** - Tokenization with PLY
✅ **Syntax Analysis** - Parser with AST generation
✅ **Semantic Analysis** - Conflict detection, validation
✅ **Code Generation** - Compiles to executable JSON
✅ **Target Code Execution** - Policy engine enforces rules
✅ **LLM Integration** - Security scanning with AI
✅ **User Interface** - Web-based IDE
✅ **Error Handling** - Comprehensive error reporting
✅ **Cloud Deployment Ready** - Can deploy to Azure/AWS

---

## 📝 Adding to Your Project Report

### Section: "Target Code Execution"

"Our SPL compiler generates executable JSON policies that are enforced by our Policy Execution Engine. The engine:

1. **Loads Compiled Policies** - Parses JSON output from code generator
2. **Indexes Rules** - Creates lookup tables for roles, users, resources
3. **Evaluates Conditions** - Dynamically evaluates time-based, role-based rules
4. **Enforces Access Control** - Implements 'Deny overrides Allow' semantics
5. **Logs Audit Trail** - Records all access attempts in SQLite database

The engine supports:
- Role-based access control (RBAC)
- Time-based conditions
- Wildcard permissions
- Explicit deny policies
- Audit logging
- Real-time policy updates"

### Section: "Demonstration"

Include screenshots of:
1. Policy compilation in the editor
2. Access Tester interface showing:
   - User selection
   - Action/Resource selection
   - Access GRANTED result
   - Access DENIED result
   - Matched policies display
3. Audit logs showing access history

---

## 🚀 Next Steps

1. **Test all endpoints** using the Access Tester UI
2. **View audit logs** to see access history
3. **Create additional users/resources** to test different scenarios
4. **Take screenshots** for your project report
5. **Prepare demo** for presentation:
   - Show policy compilation
   - Demonstrate access control working
   - Show time-based restrictions
   - Display audit logs

---

## 📦 Requirements.txt Update

Add to `backend/requirements.txt`:

```txt
flask==3.0.0
flask-cors==4.0.0
ply==3.11
python-dotenv==1.0.0
requests==2.31.0
openai==1.3.5  # For LLM integration
```

---

## 🎉 You Now Have

A **production-ready** Secure Policy Language system with:

- ✅ Complete compiler pipeline
- ✅ Working execution engine  
- ✅ Database-backed user/resource management
- ✅ Audit logging
- ✅ Interactive testing UI
- ✅ Ready for cloud deployment

This exceeds the project requirements and demonstrates a real, working access control system! 🚀