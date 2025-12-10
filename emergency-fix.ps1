$file = "client/lib/trashActions.js"
$content = Get-Content $file -Raw

# Replace the specific broken line
$content = $content -replace (
    "export async function moveToTrash\(guideId\) \{`r?`n  // Using centralized supabase client`r?`n`r?`n  const \{ data, error \} = await supabase",
    "export async function moveToTrash(guideId) {`n  const supabase = createClientComponentClient();`n`n  const { data, error } = await supabase"
)

# Fix any other similar patterns
$content = $content -replace (
    "  // Using centralized supabase client`r?`n`r?`n  const \{ data, error \} = await supabase",
    "  const supabase = createClientComponentClient();`n`n  const { data, error } = await supabase"
)

Set-Content $file -Value $content -NoNewline
Write-Host "Emergency fix applied!"
