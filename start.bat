@echo off
setlocal enabledelayedexpansion

REM Disable analytics
set NG_CLI_ANALYTICS=off
set NG_DISABLE_VERSION_CHECK=true

REM Start development server
echo Starting Angular Development Server...
echo Server running on: http://localhost:4200
echo.

cd /d "c:\Users\sama laptop\Local Sites\gallery-mazhari-angular"
call ng serve --port 4200 --poll 2000 <<EOF
N
EOF

pause
