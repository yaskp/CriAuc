# PowerShell script to replace localhost URLs with dynamic API_URL

$files = @(
    "client\src\pages\Display.jsx",
    "client\src\pages\Leaderboard.jsx",
    "client\src\pages\PublicTeamView.jsx",
    "client\src\pages\PublicLeaderboard.jsx",
    "client\src\pages\Teams.jsx",
    "client\src\pages\Players.jsx",
    "client\src\pages\Settings.jsx",
    "client\src\pages\Admin.jsx",
    "client\src\pages\Auction.jsx",
    "client\src\pages\ManageTeams.jsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing $file..."
        $content = Get-Content $file -Raw
        
        # Replace API calls
        $content = $content -replace "'http://localhost:5000/api/", "getApiUrl('/api/"
        $content = $content -replace '"http://localhost:5000/api/', 'getApiUrl("/api/'
        
        # Replace image URLs
        $content = $content -replace '\$\{`http://localhost:5000\$\{', '${getImageUrl('
        $content = $content -replace '`http://localhost:5000\$\{([^}]+)\}', 'getImageUrl($1)'
        
        # Add import if not present
        if ($content -notmatch 'import.*getApiUrl.*from.*config') {
            $content = $content -replace '(import axios from [''"]axios[''"];)', "`$1`r`nimport API_URL, { getApiUrl, getImageUrl } from '../config';"
        }
        
        Set-Content $file $content -NoNewline
        Write-Host "✓ Updated $file"
    }
}

Write-Host "`nDone!"
