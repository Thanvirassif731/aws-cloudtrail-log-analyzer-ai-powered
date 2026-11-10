# 📋 Project Documentation & Architecture Details

All documentation, architecture specifications, and implementation details have been fully updated across the codebase.

---

## 📌 Executive Summary

- **Application Name**: AWS CloudTrail Log Analyzer & Admin Dashboard
- **Current App Version**: `v1.0.0`
- **License**: MIT (Open Source)
- **Creator / Maintainer**: [Thanvir Assif](https://thanvirassif.com)
- **Contribution Policy**: Open to everyone — create your fix or feature and raise a Pull Request (PR) to become a recognized contributor.
- **Access URL**: [http://localhost:5000](http://localhost:5000) (Production) / [http://localhost:5173](http://localhost:5173) (Vite Dev)
- **Default Credentials**: `admin` / `admin123` *(with 1-click Auto-fill on the sign-in screen)*

---

## 🚀 Key Modules & Architecture

### 1. Application Footer & Contributor Hub (`Footer.jsx`)
- **Version Badging**: Displays current app version `v1.0.0` dynamically retrieved from `src/version.js` and `package.json`.
- **Open Source Attribution**: Highlights *"Open source created by Thanvir Assif"* linking directly to [https://thanvirassif.com](https://thanvirassif.com).
- **Contributor Invitation**: Pull request callout: *"Open to create your fix or feature and raise a PR to be a contributor."* with interactive `GitPullRequest` badging.
- **Consistent Integration**:
  - Embedded in [`App.jsx`](file:///T:/Assif/KGiSL/log-data/cloudtrail-dashboard/src/App.jsx) across both Analytics Dashboard and Event Explorer views.
  - Embedded in [`Login.jsx`](file:///T:/Assif/KGiSL/log-data/cloudtrail-dashboard/src/components/Login.jsx) on the administrator login portal.
  - Referenced in [`HelpGuideModal.jsx`](file:///T:/Assif/KGiSL/log-data/cloudtrail-dashboard/src/components/HelpGuideModal.jsx) inside the interactive instructions modal.

### 2. Multi-Location Log Ingestion (Local + AWS S3)
- **Local Directory Support**: Recursively scans `.json.gz` and `.json` CloudTrail log archives from default (`../AWSLogs`, `./AWSLogs`) or user-specified custom filesystem directories.
- **Amazon S3 Cloud Support**: Direct integration with AWS S3 via `@aws-sdk/client-s3` (`s3://bucket-name/prefix`).
- **Live Background Notifications**: Real-time progress bar (`NotificationBanner.jsx`) showing percentage and archive counts during S3 fetching, with automatic completion alerts.
- **Origin Segregation**: 1-click filtering between `All Origins`, `Local Files Only`, and `AWS S3 Cloud Only`, with distinct visual color badges on each record.

### 3. High-Performance In-Memory Parsing & Indexing
- Built on Node.js streaming `zlib` decompressor that parses thousands of `.json.gz` archives in milliseconds without external SQL/NoSQL databases.
- Stores normalized records in an optimized in-memory index for instant filtering, multi-field searching, sorting, and pagination.

### 4. Interactive Analytics & Security Threat Monitoring
- **High-Level KPIs**: Total Events, Failed API Calls, Failure Rate %, Active AWS Services, IAM Identities, Active Regions, and Read/Write operation ratio.
- **Threat Detection**:
  - Highlights privileged **AWS Root Account activity** with a 1-click drilldown filter.
  - Ranks **Authorization Failures** (`AccessDenied`, `Client.UnauthorizedOperation`, `ExpiredTokenException`).
- **Data Visualizations**:
  - Interactive daily timeline SVG chart.
  - Horizontal call-volume distribution bars for Services, API Actions, and IAM Principals.

### 5. Searchable Event Table & Deep Inspector
- **Explorer Table**: Multi-dimensional filtering by Service, Region, Principal, Status, Read/Write, Origin, and Date ranges.
- **Exporters**: 1-click **Export to CSV** and **Export to JSON** for the current filtered view.
- **Deep Inspector Modal**: 4-tab record breakdown including Caller Identity (ARN, MFA, Session Context), Syntax-highlighted Request Parameters, Response Elements, and Full Raw CloudTrail JSON.

---

## 📁 Updated Documentation Files

1. **Master README** ([`README.md`](file:///T:/Assif/KGiSL/log-data/README.md))
   - Version `v1.0.0` badges, author details, and open-source contribution guide.
   - Comprehensive feature breakdown, quick start instructions, environment variable tables, and full repository file tree.
   - REST API documentation for all server endpoints.

2. **Dashboard README** ([`cloudtrail-dashboard/README.md`](file:///T:/Assif/KGiSL/log-data/cloudtrail-dashboard/README.md))
   - Frontend and backend development scripts (`dev`, `start`, `build`, `preview`).
   - Package-specific structure and step-by-step contribution instructions.

3. **Project Architecture Details** ([`details.md`](file:///T:/Assif/KGiSL/log-data/details.md))
   - Exhaustive technical changelog, module breakdown, and administrative manual.

---

## 🛠️ Operational Guide for Administrators

1. **Starting the Application**:
   - Double-click `start-dashboard.bat` (Windows) or execute `npm start` in the terminal.
   - Open [http://localhost:5000](http://localhost:5000) in your browser.
2. **Logging In**:
   - Use default username `admin` and password `admin123`, or click the **Auto-fill** button.
3. **Managing Locations**:
   - Click the **Locations** icon in the navbar to add a local directory path or an S3 bucket URL.
4. **Rescanning Archives**:
   - Click **Rescan Logs** anytime new log files are placed in the directory.
5. **Reviewing User Guide**:
   - Click the **Instructions** button in the top navigation bar to open the in-app guide at any time.
