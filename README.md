# 🛡️ AWS CloudTrail Log Analyzer & Admin Dashboard

[![Version](https://img.shields.io/badge/Version-v1.0.0-amber.svg?style=flat-square)](package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Author](https://img.shields.io/badge/Author-Thanvir_Assif-orange.svg?style=flat-square)](https://thanvirassif.com)
[![React](https://img.shields.io/badge/Frontend-React_19_%2B_Vite_8-61DAFB.svg?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_%2B_Express_5-339933.svg?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-38B2AC.svg?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Open Source](https://img.shields.io/badge/Open_Source-PRs_Welcome-emerald.svg?style=flat-square)](https://github.com/Thanvirassif731/aws-cloudtrail-log-data)

A fast, lightweight, and modern open-source web application designed to analyze, monitor, search, and deeply inspect AWS CloudTrail logs downloaded from local disk storage or dynamically fetched from **Amazon S3 buckets**.

Ingest thousands of gzip-compressed CloudTrail archives (`.json.gz`) in milliseconds into an optimized in-memory index without external databases, and navigate audit trails with rich visual analytics, threat detections, and export capabilities.

---

## 🌐 Quick Access

- **Web Portal URL**: [http://localhost:5000](http://localhost:5000)
- **Default Admin Username**: `admin`
- **Default Admin Password**: `admin123` *(includes 1-click Auto-fill on the sign-in screen)*
- **Official Creator Website**: [https://thanvirassif.com](https://thanvirassif.com)
- **Current Release**: `v1.0.0`

---

## ✨ Features & Highlights

### ☁️ 1. Multi-Location Support (Local Folders & AWS S3 Buckets)
- **Simultaneous Multiple Sources**: Connect and stream logs concurrently from:
  - **Local Folders**: Relative paths (e.g. `../AWSLogs`, `./AWSLogs`) or absolute paths (`C:\logs`, `/var/data/awslogs`).
  - **AWS S3 Buckets**: Connect to S3 buckets (`s3://bucket-name/prefix`) with automatic `.json.gz` streaming download and in-memory unzipping via `@aws-sdk/client-s3`.
- **Background Fetching with Real-Time Progress Notification Banner**:
  - Displays real-time archive download progress: *"Downloading X of Y archives (Z%)... Please wait for data to update"*.
  - Live dismissible alerts when background ingestion finishes or if network/permission errors occur.
- **Location Management Modal**: View active sources, monitor real-time statuses (`Loaded`, `Fetching`, `Empty`, `Error`), rescan/refresh specific locations, or remove sources.
- **Config Persistence**: User-configured log directories and S3 buckets are persisted to `config.json` across server restarts.

### 🌐 2. Data Origin Segregation & Badging
- **Origin Filter Pills**: Switch views instantly on the dashboard or event tables:
  - **All Origins**: Unified view aggregating local archives and cloud S3 records.
  - **Local Files Only**: Segregated strictly to local directory archives.
  - **AWS S3 Cloud Only**: Segregated strictly to archives fetched from Amazon S3.
- **Visual Origin Badges**:
  - `Local` badge (cyan/blue) for records loaded from filesystem directories.
  - `S3 Cloud` badge (purple) displaying the originating S3 bucket name.

### 📁 3. Strict File Type & Format Enforcement
- **Authentic CloudTrail Validation**: Only archives ending with **`.json.gz`** or **`.json`** that conform to AWS CloudTrail record schema are ingested.
- **Noise Rejection**: Irrelevant file types (`.txt`, `.csv`, `.log`, `.parquet`, `.db`, `.gz`, or arbitrary non-CloudTrail JSON) are automatically skipped. If a directory contains zero valid CloudTrail records, the portal resets safely to `0` and alerts the user to update the location.

### 🔐 4. Secure Admin Authentication
- Secure admin login with session token management and Bearer token API authorization.
- Configurable administrator credentials via environment variables (`ADMIN_USERNAME` and `ADMIN_PASSWORD`).
- Auto-fill demo credentials on the login screen for rapid development and testing.

### 📊 5. Executive Analytics Dashboard
- **Instant High-Level KPIs**:
  - Total Ingested Events
  - Failed API Calls & Failure Rate %
  - Active AWS Services Count
  - Active IAM Identities Count
  - Active AWS Regions Count
  - Read vs. Write Operations Breakdown
- **Security & Privilege Threat Alerts**:
  - **Privileged Root Activity**: Immediate 1-click filter for high-risk actions performed by the AWS Account Root principal.
  - **Access Denials & Errors**: Highlights top authorization failures (`AccessDenied`, `Client.UnauthorizedOperation`, `ExpiredTokenException`).
- **Interactive Data Visualizations**:
  - **Daily Activity Timeline Chart**: Interactive SVG bar chart with 1-click day filtering.
  - **Top AWS Services**: Call volume ranking (KMS, STS, SSM, S3, DynamoDB, EC2, IAM, etc.).
  - **Top API Actions**: Distribution of actions like `Decrypt`, `AssumeRole`, `GetParametersByPath`.
  - **Top IAM Principals**: Caller identities ranking (users, assumed roles, Lambda executors).
  - **Regional Distribution**: Geographic spread across AWS regions (`us-east-1`, `eu-west-1`, `ap-south-1`, etc.).

### 🔎 6. Searchable & Sortable Event Explorer Table
- **Global Search**: Real-time filtering across Event Name, Service, IAM User/Role, Source IP Address, Error Code, Request ID, and Event ID.
- **Multi-Dimensional Filters**: Filter by Service, Region, Principal, Status (Success vs. Error), Operation (Read vs. Write), Origin (Local vs. Cloud), and Date range.
- **Interactive Sorting**: Ascending and descending sort by clicking on column headers (Event Time, Event Name, Service, Principal, Region, Status, etc.).
- **Configurable Pagination**: Page navigation with selectable page sizes (10, 25, 50, 100).
- **One-Click Data Exporters**:
  - **Export to CSV**: Downloads a clean CSV spreadsheet with all active filter constraints applied.
  - **Export to JSON**: Downloads formatted JSON records for downstream ingestion into SIEM or analytics tools.

### 🔍 7. Deep Event Inspector Modal
Clicking any log row opens a detailed 4-tab record inspector:
1. **Overview & Identity**: Complete caller identity (Type, ARN, Account ID, Access Key ID, MFA status, Session context), request context (Source IP, User Agent, TLS details), and full error diagnostics.
2. **Request Parameters**: Syntax-highlighted, formatted JSON tree with **"Copy Parameters"** action.
3. **Response Elements**: Syntax-highlighted, formatted JSON tree with **"Copy Elements"** action.
4. **Full Raw CloudTrail JSON**: Original unprocessed JSON record with **"Copy Full JSON"** and **"Download JSON"** actions.

### ⚡ 8. Application Footer, Versioning & Open Source Contributor Hub
- **Version Indicator**: Dynamically reflects the current application version (`v1.0.0`).
- **Creator Attribution**: Credited to open-source developer **[Thanvir Assif](https://thanvirassif.com)** with direct portfolio links.
- **Contributor Callout**: Open invitation: *"Open to create your fix or feature and raise a PR to be a contributor."* with pull request badging.
- Embedded uniformly across both the authenticated dashboard and the sign-in portal.

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
# From the project root
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
| `AWS_REGION` | `us-east-1` | Default AWS region for S3 client queries |
| `AWS_ACCESS_KEY_ID` | *(Optional)* | IAM Access Key ID for S3 bucket access (or use AWS CLI profile / EC2 role) |
| `AWS_SECRET_ACCESS_KEY` | *(Optional)* | IAM Secret Access Key for S3 bucket access |

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

---

## 📁 Repository Structure

```
.
├── AWSLogs/                         # Default directory for CloudTrail .json.gz archives
├── start-dashboard.bat              # One-click Windows application launcher
├── package.json                     # Root npm script runner (version 1.0.0)
├── LICENSE                          # Open source MIT License
├── .gitignore                       # Git ignore definitions
├── .env.example                     # Environment variables template
├── details.md                       # Comprehensive technical details & update logs
├── README.md                        # Master repository documentation
└── cloudtrail-dashboard/            # Full-stack React 19 + Express 5 application
    ├── server.js                    # Streaming zlib parser, in-memory index, auth & REST API
    ├── config.json                  # Auto-persisted user locations & settings
    ├── package.json                 # Dashboard dependencies & build scripts (version 1.0.0)
    ├── vite.config.js               # Vite 8 configuration with Tailwind CSS v4 & proxy
    ├── index.html                   # HTML entrypoint
    ├── dist/                        # Production client bundle served by Express
    ├── public/                      # Static brand assets & icons
    └── src/
        ├── api.js                   # API client, authorization header handler & endpoints
        ├── version.js               # Centralized version (1.0.0), author & contributor metadata
        ├── App.jsx                  # Main application orchestrator & tab routing
        ├── App.css                  # Custom scrollbar and component animations
        ├── index.css                # Tailwind CSS v4 design system
        ├── main.jsx                 # React root renderer
        ├── context/
        │   └── AuthContext.jsx      # Admin session authentication state & token persistence
        └── components/
            ├── Login.jsx            # Admin login screen with demo fill & footer
            ├── Navbar.jsx           # Top navigation bar, statistics summary & tab switches
            ├── Dashboard.jsx        # Executive analytics, charts, KPIs & security alerts
            ├── EventsTable.jsx      # Searchable, filterable event table with CSV/JSON exporters
            ├── EventDetailModal.jsx # 4-tab deep record inspector & JSON viewers
            ├── LocationsModal.jsx   # Multi-location manager (Local folders & AWS S3 buckets)
            ├── NotificationBanner.jsx # Real-time background fetch status loader & toast alert
            ├── HelpGuideModal.jsx   # Interactive administrator user guide & operational manual
            └── Footer.jsx           # App footer with version, open-source author link & PR contributor callout
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
