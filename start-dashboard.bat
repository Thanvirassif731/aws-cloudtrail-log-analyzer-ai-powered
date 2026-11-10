@echo off
title AWS CloudTrail Log Analyzer
echo ========================================================
echo   Starting AWS CloudTrail Log Analyzer Dashboard...
echo ========================================================
cd /d "%~dp0cloudtrail-dashboard"

echo Loading 1,076 CloudTrail log archives...
start "" http://localhost:5000
node server.js
pause
