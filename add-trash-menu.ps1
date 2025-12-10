$file = "client/components/Navigation.js"
$content = Get-Content $file -Raw

# Add the Trash menu item after Reviews
$content = $content -replace (
    "    { icon: Star, label: 'Reviews', path: '/reviews' },",
    "    { icon: Star, label: 'Reviews', path: '/reviews' },`n    { icon: Trash2, label: 'Trash', path: '/trash' },"
)

Set-Content $file -Value $content -NoNewline
Write-Host "Added Trash menu item to Navigation.js"
