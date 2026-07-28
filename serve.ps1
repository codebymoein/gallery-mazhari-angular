# Disable analytics and start server
$env:NG_CLI_ANALYTICS = 'off'
$env:NG_DISABLE_VERSION_CHECK = 'true'

Write-Host "Starting Angular Development Server..."
Write-Host "Server running on: http://localhost:4200"

# Start serve
& ng serve --port 4200 --poll 2000
