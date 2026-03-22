$baseDir = "C:\Users\Loy\Desktop\Work\12 - Affinity\src\data\books\megaGoal1\vocab"

# Unit 4: Sets 3-6 (Assuming set1 and set2 exist)
3..6 | ForEach-Object {
    $path = Join-Path $baseDir "unit4\set$_.json"
    if (-not (Test-Path $path)) {
        Write-Host "Creating $path"
        $json = @{
            unit = "Mega Goal 1 - Unit 4"
            type = "misc"
            setTitle = "Vocab Set $_"
            words = @()
        } | ConvertTo-Json -Depth 5
        $json | Set-Content -Path $path
    }
}

# Units 5-12: Sets 1-6
5..12 | ForEach-Object {
    $u = $_
    $jsonU = "Mega Goal 1 - Unit $u"
    
    1..6 | ForEach-Object {
        $path = Join-Path $baseDir "unit$u\set$_.json"
        if (-not (Test-Path $path)) {
            Write-Host "Creating $path"
            $json = @{
                unit = $jsonU
                type = "misc"
                setTitle = "Vocab Set $_" 
                words = @()
            } | ConvertTo-Json -Depth 5
            $json | Set-Content -Path $path
        }
    }
}
Write-Host "Done!"
