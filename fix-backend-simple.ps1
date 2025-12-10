$file = "server/routes/guides.js"
$content = Get-Content $file -Raw

# Simple replacement - just add the filter after user_id
$content = $content -replace (
    "\.eq\('user_id', userId\)\r?\n    \.order\('pinned'",
    ".eq('user_id', userId)`n    .eq('is_deleted', false)`n    .order('pinned'"
)

# Also fix stats
$content = $content -replace (
    "\.eq\('user_id', userId\);",
    ".eq('user_id', userId)`n      .eq('is_deleted', false);"
)

Set-Content $file -Value $content -NoNewline
Write-Host "Applied filter successfully"
