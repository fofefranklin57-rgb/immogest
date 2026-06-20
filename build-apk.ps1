# Build APK ImmoGest — a lancer apres chaque modification du SPA

Write-Host "1/3 Sync assets vers www/..." -ForegroundColor Cyan
$files = @("index.html","app.css","sw.js","manifest.json","portail-locataire.html","portail-bailleur.html","offline.html")
foreach ($f in $files) { if (Test-Path $f) { Copy-Item $f www\ -Force } }
foreach ($d in @("js","img","fonts","icons")) { if (Test-Path $d) { Copy-Item $d www\ -Recurse -Force } }

Write-Host "2/3 Capacitor sync..." -ForegroundColor Cyan
npx cap sync android

Write-Host "3/3 Gradle build APK debug..." -ForegroundColor Cyan
cd android
.\gradlew.bat assembleDebug
cd ..

$apk = "android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apk) {
    $size = [math]::Round((Get-Item $apk).Length / 1MB, 1)
    Write-Host "APK pret : $apk ($size MB)" -ForegroundColor Green
} else {
    Write-Host "Build echoue — verifier les logs ci-dessus" -ForegroundColor Red
}
