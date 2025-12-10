$file = "server/routes/guides.js"
$content = Get-Content $file -Raw

# Fix 1: Add is_deleted filter to main query (line 19)
$content = $content -replace (
    "    \.eq\('user_id', userId\)\n    \.order\('pinned'",
    "    .eq('user_id', userId)`n    .eq('is_deleted', false)  // Exclude deleted guides`n    .order('pinned'"
)

# Fix 2: Add is_deleted filter to stats query (line 320)
$content = $content -replace (
    "      \.select\('type, category'\)\n      \.eq\('user_id', userId\);",
    "      .select('type, category')`n      .eq('user_id', userId)`n      .eq('is_deleted', false);  // Exclude deleted guides from stats"
)

Set-Content $file -Value $content -NoNewline
Write-Host "Fixed backend routes to exclude deleted guides"
