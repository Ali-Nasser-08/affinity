$vocabRoot = "c:\Users\Loy\Desktop\Work\12 - Affinity\src\data\books\megaGoal1\vocab"
$outputFile = "c:\Users\Loy\Desktop\Work\12 - Affinity\src\data\idle\idlevocab.json"

$allWords = [System.Collections.Generic.List[object]]::new()

# Sort units numerically (unit1, unit2, ... unit12)
$units = Get-ChildItem $vocabRoot -Directory | Sort-Object { [int]($_.Name -replace 'unit', '') }

foreach ($unit in $units) {
    $sets = Get-ChildItem $unit.FullName -Filter "*.json" | Sort-Object Name

    foreach ($set in $sets) {
        $content = Get-Content $set.FullName -Raw -Encoding UTF8
        $data = $content | ConvertFrom-Json

        if ($data.words) {
            foreach ($word in $data.words) {
                $allWords.Add($word)
            }
        }
    }
}

Write-Host "Total words collected: $($allWords.Count)"

# Use Newtonsoft-style compact JSON via System.Text.Json if available, or just use -Compress flag
$json = $allWords | ConvertTo-Json -Depth 10 -Compress

# Write output
[System.IO.File]::WriteAllText($outputFile, $json, [System.Text.Encoding]::UTF8)

Write-Host "Saved to: $outputFile"
Write-Host "File size: $([Math]::Round((Get-Item $outputFile).Length / 1KB, 1)) KB"
