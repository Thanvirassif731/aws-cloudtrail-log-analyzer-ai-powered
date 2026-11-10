# 🛡️ AWS CloudTrail Dashboard & Log Analyzer

[![Version](https://img.shields.io/badge/Version-v1.0.0-amber.svg?style=flat-square)](package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Author](https://img.shields.io/badge/Author-Thanvir_Assif-orange.svg?style=flat-square)](https://thanvirassif.com)
[![React](https://img.shields.io/badge/Frontend-React_19_%2B_Vite_8-61DAFB.svg?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_%2B_Express_5-339933.svg?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-38B2AC.svg?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

A fast, lightweight, open-source full-stack application designed to analyze, monitor, search, and inspect AWS CloudTrail logs ingested from local folders or directly from **Amazon S3 buckets**.

---

## 🌐 Quick Access

- **Web Portal URL**: [http://localhost:5000](http://localhost:5000)
- **Vite Dev Server**: [http://localhost:5173](http://localhost:5173)
- **Default Admin Username**: `admin`
- **Default Admin Password**: `admin123` *(with 1-click Auto-fill)*
- **Official Creator Website**: [https://thanvirassif.com](https://thanvirassif.com)
- **Current App Version**: `v1.0.0`

---

## ☁️ Key Features

### 1. Multi-Location Ingestion (Local + AWS S3)
- Connect multiple local filesystem directories (`../AWSLogs`, `./AWSLogs`, custom folders) and AWS S3 buckets (`s3://bucket-name/prefix`).
- Automatic streaming `.json.gz` extraction and in-memory indexing using Node.js streaming `zlib` and `@aws-sdk/client-s3`.
- In-app animated progress banner and notification toast for background S3 downloads.
- Persistent location configuration in `config.json`.

### 2. Origin Segregation
- Filter events and dashboard KPIs by origin: **All Origins**, **Local Files Only**, or **AWS S3 Cloud Only**.
- Distinct visual badges on table rows and event inspector indicating record source.

### 3. Analytics & Threat Detection
- Executive KPIs: Total Events, Failed Requests, Error Rates, Service Counts, IAM Identities, Active Regions, and Read/Write ratios.
- Privileged root account activity detection with 1-click filter.
- Top error rankings (`AccessDenied`, `Client.UnauthorizedOperation`, etc.).
- Interactive daily activity timeline chart and horizontal breakdown bars.

### 4. Searchable & Sortable Event Explorer
- Global text search across Event Name, Service, Principal, IP, Error Code, and IDs.
- Multi-dimensional filters (Service, Region, Principal, Status, Read/Write, Date range).
- Sortable columns, page navigation (10/25/50/100 records per page).
- 1-click **Export to CSV** and **Export to JSON**.

### 5. Deep Event Inspector
- 4-tab modal: Overview & Identity, Request Parameters (JSON viewer), Response Elements (JSON viewer), and Full Raw CloudTrail JSON (with copy and download).

### 6. App Footer & Contributor Hub
- Displays current app version (`v1.0.0`).
- Open-source attribution to [Thanvir Assif](https://thanvirassif.com).
- Open invitation for contributors to fix bugs, propose features, and submit Pull Requests.

---

## 🚀 Scripts & Development

```bash
# Install dependencies
npm install

# Start Express production server (serves dist/)
npm start

# Start Vite hot-reloading dev server on http://localhost:5173
npm run dev

# Compile production bundle into dist/
npm run build

# Preview production build with Vite
npm run preview
```

---

## 📁 Package Structure

```
cloudtrail-dashboard/
├── server.js                    # Express 5 backend, zlib streaming parser, S3 fetcher, in-memory index & auth
├── config.json                  # Auto-saved user locations configuration
├── package.json                 # Dependencies & scripts (version 1.0.0)
├── vite.config.js               # Vite 8 config with Tailwind CSS v4 & proxy to port 5000
├── index.html                   # HTML template entrypoint
├── dist/                        # Production build artifacts
├── public/                      # Static brand assets
└── src/
    ├── api.js                   # API client with JWT/Bearer handling & REST endpoints
    ├── version.js               # Centralized version (1.0.0), author info & contributor message
    ├── App.jsx                  # Main application container & view manager
    ├── App.css                  # Custom animations & scrollbars
    ├── index.css                # Tailwind CSS v4 styling rules
    ├── main.jsx                 # React root mount
    ├── context/
    │   └── AuthContext.jsx      # Admin login authentication state & tokens
    └── components/
        ├── Login.jsx            # Admin login interface with demo credentials & footer
        ├── Navbar.jsx           # Top header navigation, stats summary & rescan trigger
        ├── Dashboard.jsx        # Analytics charts, metrics, KPIs & security filters
        ├── EventsTable.jsx      # Filterable event table with CSV & JSON exports
        ├── EventDetailModal.jsx # 4-tab event inspector modal with formatted JSON
        ├── LocationsModal.jsx   # Multi-location management (Local & AWS S3)
        ├── NotificationBanner.jsx # Live background S3 fetch indicator & notification
        ├── HelpGuideModal.jsx   # Interactive user manual & instructions
        └── Footer.jsx           # App footer with version, author link & PR contributor callout
```

---

## 👨‍💻 Author & Contributing

### Author
Created with ❤️ by **[Thanvir Assif](https://thanvirassif.com)**.
- **Website**: [https://thanvirassif.com](https://thanvirassif.com)
- **GitHub**: [@Thanvirassif731](https://github.com/Thanvirassif731)

### Contributing
Open source project! Open to create your fix or feature and raise a PR to be a contributor.

1. Fork the repository.
2. Create a branch: `git checkout -b feature/my-feature` or `git checkout -b fix/my-fix`.
3. Make and test your changes: `npm run build`.
4. Commit your changes: `git commit -m "feat: description of changes"`.
5. Push to your fork: `git push origin feature/my-feature`.
6. Open a Pull Request on GitHub.

---

## 📄 License
Licensed under the [MIT License](LICENSE).
