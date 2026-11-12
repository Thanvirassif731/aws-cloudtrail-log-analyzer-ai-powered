# 📋 Project Documentation & Architecture Details

All documentation, architecture specifications, and implementation details have been fully updated across the codebase.

---

## 📌 Executive Summary

- **Application Name**: AWS CloudTrail Log Analyzer & Admin Dashboard
- **Current App Version**: `v1.1.0` (AI Error Diagnosis & Cost Intelligence Edition)
- **License**: MIT (Open Source)
- **Creator / Maintainer**: [Thanvir Assif](https://thanvirassif.com)
- **Contribution Policy**: Open to everyone — create your fix or feature and raise a Pull Request (PR) to become a recognized contributor.
- **Access URL**: [http://localhost:5000](http://localhost:5000) (Production) / [http://localhost:5173](http://localhost:5173) (Vite Dev)
- **Default Credentials**: `admin` / `admin123` *(with 1-click Auto-fill on the sign-in screen)*

---

## 🚀 Key Modules & Architecture

### 1. AI-Powered Error Root-Cause Diagnostics (`aiService.js` & `EventDetailModal.jsx`)
- **Dual AI Provider Architecture**:
  - **Google Gemini API**: Utilizing the official `@google/genai` SDK with `gemini-3.8-flash` (Recommended) or `gemini-3.5-flash-lite`.
  - **AWS Bedrock API**: Utilizing `@aws-sdk/client-bedrock-runtime` using unified `Converse` calls with `anthropic.claude-3-5-sonnet-20241022-v2:0`, `amazon.nova-micro-v1:0`, or `amazon.titan-text-express-v1`.
- **Granular Diagnostic Output**:
  - **Why It Failed (Root Cause)**: Plain-English explanation of why the call was denied or failed.
  - **Failed IAM Action & Target Resource**: Specific action (e.g., `kms:Decrypt`, `s3:GetObject`) and resource ARN involved.
  - **Remediation & Fix**: Copyable least-privilege IAM Policy JSON statement and AWS CLI verification command.
  - **Security Threat Evaluation**: Risk severity rating (`Low`, `Medium`, `High`, `Critical`) distinguishing benign developer misconfigurations from potential privilege escalation or reconnaissance.
- **Execution Cost & Token Tracking**: Displays input/output tokens, execution latency, and exact micro-spend in USD directly on the diagnosis card.

### 2. AI Executive Error Summary (`AIExecutiveSummaryModal.jsx` & `Dashboard.jsx`)
- 1-click action in the Dashboard's "API Errors & Denials" card.
- Evaluates systemic failure patterns across all active log archives.
- Synthesizes an executive narrative, top failure clusters, threat indicators, and a prioritized security action plan.

### 3. AI Usage, Token Credits & Cost Intelligence Dashboard (`AIUsageDashboard.jsx` & `aiPricing.js`)
- **Cumulative KPIs**: Real-time dollar spend (`$ USD`), total token credits used (Prompt vs. Completion), total diagnoses executed, and active engine status.
- **Interactive Model Roster & Switcher**: Side-by-side pricing rate cards per 1M tokens with 1-click model switching.
- **Audit Activity Trail**: Comprehensive historical log recording every single analysis (timestamp, event, error code, engine, tokens in/out, latency, and estimated cost).
- **Persistent Storage**: Captures all usage logs in `ai_usage.json`.

### 4. Application Footer & Contributor Hub (`Footer.jsx`)
- **Version Badging**: Displays current app version `v1.1.0`.
- **Open Source Attribution**: Credited to [Thanvir Assif](https://thanvirassif.com).
- **Contributor Invitation**: Pull request callout: *"Open to create your fix or feature and raise a PR to be a contributor."*

### 5. Multi-Location Log Ingestion (Local + AWS S3)
- Scans `.json.gz` and `.json` CloudTrail log archives from filesystem directories and Amazon S3 buckets (`s3://bucket-name/prefix`).
- Live in-app background download banner with progress percentage and notification alerts.
- Segregated filtering by origin (`All Origins`, `Local Files Only`, `AWS S3 Cloud Only`).

### 6. High-Performance In-Memory Indexing
- Built on Node.js streaming `zlib` decompressor indexing tens of thousands of records in sub-second time without external databases.

---

## 📁 Repository File Tree

```
.
├── AWSLogs/                         # Default directory for CloudTrail .json.gz archives
├── start-dashboard.bat              # One-click Windows application launcher
├── package.json                     # Root npm script runner (version 1.1.0)
├── LICENSE                          # Open source MIT License
├── .gitignore                       # Git ignore definitions
├── .env.example                     # Environment variables template
├── details.md                       # Comprehensive technical details & update logs
├── README.md                        # Master repository documentation
└── cloudtrail-dashboard/            # Full-stack React 19 + Express 5 application
    ├── server.js                    # Streaming zlib parser, in-memory index, auth & REST API
    ├── aiService.js                 # Gemini & Bedrock AI diagnostic engine & usage recorder
    ├── aiPricing.js                 # AI models catalog & token cost calculator
    ├── ai_usage.json                # Persistent transaction log of AI analyses & costs
    ├── config.json                  # Auto-persisted user locations & AI settings
    ├── package.json                 # Dashboard dependencies & build scripts (version 1.1.0)
    ├── vite.config.js               # Vite 8 configuration with Tailwind CSS v4 & proxy
    ├── index.html                   # HTML entrypoint
    ├── dist/                        # Production client bundle served by Express
    ├── public/                      # Static brand assets & icons
    └── src/
        ├── api.js                   # API client with JWT/Bearer handling & REST endpoints
        ├── version.js               # Centralized version (1.1.0), author & contributor metadata
        ├── App.jsx                  # Main application orchestrator & 3-tab routing
        ├── App.css                  # Custom scrollbar and component animations
        ├── index.css                # Tailwind CSS v4 design system
        ├── main.jsx                 # React root renderer
        ├── context/
        │   └── AuthContext.jsx      # Admin session authentication state & token persistence
        └── components/
            ├── Login.jsx            # Admin login screen with demo fill & footer
            ├── Navbar.jsx           # Top navigation bar, stats summary & tab switches
            ├── Dashboard.jsx        # Executive analytics, charts, KPIs & security alerts
            ├── EventsTable.jsx      # Searchable, filterable event table with CSV/JSON exporters
            ├── EventDetailModal.jsx # 5-tab inspector with AI Root-Cause Diagnosis
            ├── AIUsageDashboard.jsx # AI usage, token credits, cost & model selector view
            ├── AISettingsModal.jsx  # AI provider (Gemini / Bedrock) & API keys configuration
            ├── AIExecutiveSummaryModal.jsx # CISO-level executive error summary modal
            ├── LocationsModal.jsx   # Multi-location manager (Local folders & AWS S3 buckets)
            ├── NotificationBanner.jsx # Real-time background fetch status loader & toast alert
            ├── HelpGuideModal.jsx   # Interactive administrator user guide & operational manual
            └── Footer.jsx           # App footer with version, open-source author link & PR callout
```
