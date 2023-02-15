# get to latest tamanu
cd \Tamanu
$latest = Get-ChildItem -Attributes Directory | Sort-Object -Property BaseName -Descending | Select -First 1
cd $latest

$config = type .\config\local.json | ConvertFrom-JSON

# get to latest postgres
cd '\Program Files\PostgreSQL'
$latest = Get-ChildItem -Attributes Directory | Sort-Object -Property BaseName -Descending | Select -First 1
cd $latest

chcp 1252
$env:PGHOST = "localhost"
$env:PGDATABASE = $config.db.name
$env:PGUSER = $config.db.username
$env:PGPASSWORD = $config.db.password
$env:PSQL_HISTORY= '\Tamanu\psql.history'
.\bin\psql.exe

pause
