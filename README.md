# 🛡️ AWS CloudTrail Log Analyzer & Admin Dashboard

[![Version](https://img.shields.io/badge/Version-v1.1.0-amber.svg?style=flat-square)](package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Author](https://img.shields.io/badge/Author-Thanvir_Assif-orange.svg?style=flat-square)](https://thanvirassif.com)
[![React](https://img.shields.io/badge/Frontend-React_19_%2B_Vite_8-61DAFB.svg?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_%2B_Express_5-339933.svg?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-38B2AC.svg?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Open Source](https://img.shields.io/badge/Open_Source-PRs_Welcome-emerald.svg?style=flat-square)](https://github.com/Thanvirassif731/aws-cloudtrail-log-data)

A fast, lightweight, and modern open-source web application designed to analyze, monitor, search, and deeply inspect AWS CloudTrail logs downloaded from local disk storage or dynamically fetched from **Amazon S3 buckets**, now powered by **AI Error Diagnostics** and an **AI Usage & Cost Intelligence Dashboard** supporting **Google Gemini API** and **AWS Bedrock API**.

---

## 🌐 Quick Access

- **Web Portal URL**: [http://localhost:5000](http://localhost:5000)
- **Vite Dev Server**: [http://localhost:5173](http://localhost:5173)
- **Default Admin Username**: `admin`
- **Default Admin Password**: `admin123` *(includes 1-click Auto-fill on the sign-in screen)*
- **Official Creator Website**: [https://thanvirassif.com](https://thanvirassif.com)
- **Current Release**: `v1.1.0`

---

## ✨ Features & Highlights

### 🤖 1. AI-Powered Error Root-Cause Diagnostics
- **Dual AI Engine Support**:
  - **Google Gemini API**: Utilizing `@google/genai` with `gemini-3.8-flash` (Recommended) or `gemini-3.5-flash-lite`.
  - **AWS Bedrock API**: Utilizing `@aws-sdk/client-bedrock-runtime` (`Converse` API) with `Claude 3.5 Sonnet`, `Amazon Nova Micro`, or `Titan`.
- **In-Depth Failure Explanations**:
  - **Why It Failed (Root Cause)**: Plain-English diagnosis of why the API call was denied.
  - **Missing IAM Action & Target Resource**: Pinpoints the exact IAM action (`kms:Decrypt`, `s3:GetObject`, etc.) and affected ARN.
  - **Prescriptive Remediation**: Copy-paste ready least-privilege IAM policy JSON statement and AWS CLI verification command.
  - **Threat & Risk Evaluation**: Severity rating (`Low`, `Medium`, `High`, `Critical`) distinguishing benign developer misconfigurations from potential privilege escalation.
- **Micro-Cost Tracking per Analysis**: Displays exact token counts (input/output), latency, and execution spend in USD directly on the rendered diagnosis card.

### 📊 2. AI Usage, Token Credits & Cost Intelligence Dashboard
- **Cumulative KPIs**: Real-time dollar spend (`$ USD`), total token credits used (Prompt vs. Completion), total diagnoses executed, and active engine status.
- **Interactive Model Roster & Switcher**: Side-by-side pricing rate cards per 1M tokens with 1-click model switching.
- **Audit Activity Trail**: Detailed transaction log of all AI diagnostic executions (timestamp, event, error code, engine, tokens, latency, cost).
- **Persistent Storage**: Retains all usage logs in `ai_usage.json` across server restarts.

### ☁️ 3. Multi-Location Support (Local Folders & AWS S3 Buckets)
- **Simultaneous Multiple Sources**: Connect and stream logs concurrently from:
  - **Local Folders**: Relative paths (e.g. `../AWSLogs`, `./AWSLogs`) or absolute paths (`C:\logs`, `/var/data/awslogs`).
  - **AWS S3 Buckets**: Connect to S3 buckets (`s3://bucket-name/prefix`) with automatic `.json.gz` streaming download and in-memory unzipping via `@aws-sdk/client-s3`.
- **Background Fetching with Real-Time Progress Notification Banner**:
  - Displays real-time archive download progress: *"Downloading X of Y archives (Z%)... Please wait for data to update"*.
  - Live dismissible alerts when background ingestion finishes or if network/permission errors occur.
- **Location Management Modal**: View active sources, monitor real-time statuses (`Loaded`, `Fetching`, `Empty`, `Error`), rescan/refresh specific locations, or remove sources.
- **Config Persistence**: User-configured log directories and S3 buckets are persisted to `config.json` across server restarts.

### 🌐 4. Data Origin Segregation & Badging
- **Origin Filter Pills**: Switch views instantly on the dashboard or event tables:
  - **All Origins**: Unified view aggregating local archives and cloud S3 records.
  - **Local Files Only**: Segregated strictly to local directory archives.
  - **AWS S3 Cloud Only**: Segregated strictly to archives fetched from Amazon S3.
- **Visual Origin Badges**:
  - `Local` badge (cyan/blue) for records loaded from filesystem directories.
  - `S3 Cloud` badge (purple) displaying the originating S3 bucket name.

### 📁 5. Strict File Type & Format Enforcement
- **Authentic CloudTrail Validation**: Only archives ending with **`.json.gz`** or **`.json`** that conform to AWS CloudTrail record schema are ingested.
- **Noise Rejection**: Irrelevant file types (`.txt`, `.csv`, `.log`, `.parquet`, `.db`, `.gz`, or arbitrary non-CloudTrail JSON) are automatically skipped. If a directory contains zero valid CloudTrail records, the portal resets safely to `0` and alerts the user to update the location.

### 🔐 6. Secure Admin Authentication
- Secure admin login with session token management and Bearer token API authorization.
- Configurable administrator credentials via environment variables (`ADMIN_USERNAME` and `ADMIN_PASSWORD`).
- Auto-fill demo credentials on the login screen for rapid development and testing.

### 📊 7. Executive Analytics Dashboard
- **Instant High-Level KPIs**: Total Ingested Events, Failed API Calls & Failure Rate %, Active AWS Services, IAM Identities, Active Regions, and Read/Write ratio.
- **Security & Privilege Threat Alerts**:
  - **Privileged Root Activity**: Immediate 1-click filter for high-risk actions performed by the AWS Account Root principal.
  - **Access Denials & Errors**: Highlights top authorization failures (`AccessDenied`, `Client.UnauthorizedOperation`, `ExpiredTokenException`).
  - **AI Executive Error Summary**: 1-click CISO-level overview summarizing failure clusters and systemic risks across all logs.
- **Interactive Data Visualizations**: Daily Activity Timeline Chart, Top AWS Services, Top API Actions, Top IAM Principals, and Geographic Region distribution.

### 🔎 8. Searchable & Sortable Event Explorer Table
- **Global Search**: Real-time filtering across Event Name, Service, IAM User/Role, Source IP Address, Error Code, Request ID, and Event ID.
- **Multi-Dimensional Filters**: Filter by Service, Region, Principal, Status, Operation, Origin, and Date range.
- **Interactive Sorting & Pagination**: Column sorting, page size selection (10, 25, 50, 100).
- **One-Click Data Exporters**: Export filtered views to **CSV** or **JSON**.

### 🔍 9. Deep Event Inspector Modal
- 5-tab inspector: Overview & Identity, Request Parameters (JSON viewer), Response Elements (JSON viewer), Full Raw CloudTrail JSON, and **AI Root-Cause Diagnosis**.

### ⚡ 10. Application Footer, Versioning & Open Source Contributor Hub
- **Version Indicator**: Dynamically reflects current app version (`v1.1.0`).
- **Creator Attribution**: Credited to open-source developer **[Thanvir Assif](https://thanvirassif.com)** with direct portfolio links.
- **Contributor Callout**: Open invitation: *"Open to create your fix or feature and raise a PR to be a contributor."*

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher (v20+ LTS recommended).
- npm v9.0.0 or higher.

### 1. Clone the Repository
```bash
git clone https://github.com/Thanvirassif731/aws-cloudtrail-log-data.git
cd aws-cloudtrail-log-data
```

### 2. Install Dependencies
```bash
# Install root package scripts
npm install

# Install dashboard application dependencies
cd cloudtrail-dashboard
npm install
cd ..
```

### 3. Start the Application

#### Option A: One-Click Launcher (Windows)
Double-click `start-dashboard.bat`. It will start the server and automatically launch `http://localhost:5000` in your default browser.

#### Option B: Terminal / Command Line
```bash
npm start
```
Or directly within the dashboard folder:
```bash
cd cloudtrail-dashboard
node server.js
```

#### Option C: Development Mode (Vite Frontend with Hot Reloading)
```bash
cd cloudtrail-dashboard
npm run dev
```
*(Runs on `http://localhost:5173` with automatic API proxying to Express on `http://localhost:5000`)*.

---

## ⚙️ Configuration & Environment Variables

Copy `.env.example` to `.env` in `cloudtrail-dashboard/`:
```bash
cp cloudtrail-dashboard/.env.example cloudtrail-dashboard/.env
```

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Port for the Express backend server and web application |
| `ADMIN_USERNAME` | `admin` | Administrator portal username |
| `ADMIN_PASSWORD` | `admin123` | Administrator portal password |
| `LOGS_DIR` | `../AWSLogs` | Default fallback filesystem path for CloudTrail `.json.gz` archives |
| `GEMINI_API_KEY` | *(Optional)* | Google Gemini API key for AI root-cause diagnostics (or configure via in-app UI) |
| `AWS_REGION` | `us-east-1` | Default AWS region for S3 queries and AWS Bedrock |
| `AWS_ACCESS_KEY_ID` | *(Optional)* | IAM Access Key ID for S3 bucket access & Bedrock (or use AWS CLI profile / EC2 role) |
| `AWS_SECRET_ACCESS_KEY` | *(Optional)* | IAM Secret Access Key for S3 bucket access & Bedrock |

---

## 🔌 REST API Endpoints

All data endpoints require authentication via Bearer token (`Authorization: Bearer <token>`).

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/login` | Authenticate with username and password, returns session token |
| `GET` | `/api/auth/me` | Validate current session token |
| `GET` | `/api/stats` | Fetch aggregate KPIs, timelines, top services, actions, and identities |
| `GET` | `/api/events` | Paginated, filtered, and searchable CloudTrail log events query |
| `GET` | `/api/events/:id` | Retrieve full record details by unique event ID or generated UUID |
| `GET` | `/api/sources` | List all active local and S3 log sources |
| `POST` | `/api/sources` | Add a new local directory path or S3 bucket (`s3://bucket/prefix`) |
| `DELETE` | `/api/sources/:id` | Remove a configured log source |
| `POST` | `/api/rescan` | Re-index all configured local folders and trigger S3 sync |
| `GET` | `/api/fetch-status` | Polling endpoint for active background S3 downloads |
| `GET` | `/api/export` | Download filtered records as CSV or JSON format |
| `GET` | `/api/ai/models` | List available Gemini & Bedrock AI models and rate cards |
| `GET` | `/api/ai/config` | Get current AI engine provider, active model, and credential status |
| `POST` | `/api/ai/config` | Update AI provider, model selection, and credentials |
| `POST` | `/api/ai/analyze-event` | Run deep AI root-cause diagnosis on a specific failed CloudTrail record |
| `POST` | `/api/ai/summarize-errors` | Generate CISO-level executive error summary across all ingested failures |
| `GET` | `/api/ai/usage` | Fetch cumulative token credits, USD spend, and granular transaction audit logs |
| `DELETE` | `/api/ai/usage` | Reset AI usage logs and counter statistics |

---

## 📁 Repository Structure

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
    ├── server.js                    # Streaming zlib parser, in-memory index, auth & AI APIs
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
        ├── api.js                   # API client, authorization header handler & endpoints
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

---

## 👨‍💻 Author & Contributing

### Author
Created with ❤️ by **[Thanvir Assif](https://thanvirassif.com)**.
- **Website**: [https://thanvirassif.com](https://thanvirassif.com)
- **GitHub**: [@Thanvirassif731](https://github.com/Thanvirassif731)

### Contributing
Contributions are always welcome! This is an open-source project and community improvements are actively encouraged.

To contribute a bug fix, feature, or enhancement:
1. **Fork the Repository** to your own GitHub account.
2. **Clone your fork**:
   ```bash
   git clone https://github.com/<your-username>/aws-cloudtrail-log-data.git
   cd aws-cloudtrail-log-data
   ```
3. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/my-new-feature
   # or for bug fixes:
   git checkout -b fix/issue-description
   ```
4. **Make Your Changes**: Add your code, tests, or documentation updates.
5. **Verify the Build**:
   ```bash
   npm run build --prefix cloudtrail-dashboard
   ```
6. **Commit & Push**:
   ```bash
   git add .
   git commit -m "feat: add my new feature or fix"
   git push origin feature/my-new-feature
   ```
7. **Open a Pull Request (PR)** against the `main` branch. Provide a brief summary of what your PR introduces.

All approved PRs will be merged, and you will be recognized as a contributor!

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE) - feel free to use, modify, and distribute it for personal, educational, and commercial projects.
