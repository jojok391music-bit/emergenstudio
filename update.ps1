Write-Host "Updating Vercel Live Site..." -ForegroundColor Cyan

# Check for git changes
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "No changes detected. Site is already up-to-date!" -ForegroundColor Green
    Pause
    exit
}

Write-Host "Changes found, uploading to GitHub..." -ForegroundColor Yellow

git add .
git commit -m "Content Update via Admin Panel"
git push

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Success! Vercel is now building your changes." -ForegroundColor Green
    Write-Host "Your live site will be updated in about 30 seconds." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Error pushing to GitHub. Please check the output above." -ForegroundColor Red
}

Write-Host ""
Pause
