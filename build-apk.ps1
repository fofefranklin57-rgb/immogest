# Build APK ImmoGest — lancer apres chaque modification du SPA

$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
$env:ANDROID_HOME = "C:\Users\Franklin\AppData\Local\Android\Sdk"

Write-Host "1/4 Sync assets vers www/..." -ForegroundColor Cyan
$files = @("index.html","app.css","sw.js","manifest.json","portail-locataire.html","portail-bailleur.html","offline.html","icon-192.png","icon-512.png","docx.bundle.js","OneSignalSDKWorker.js")
foreach ($f in $files) { if (Test-Path $f) { Copy-Item $f www\ -Force } }
foreach ($d in @("js","img","fonts","icons")) { if (Test-Path $d) { Copy-Item $d www\ -Recurse -Force } }

Write-Host "2/4 Capacitor sync..." -ForegroundColor Cyan
npx cap sync android

Write-Host "3/4 Gradle build APK debug..." -ForegroundColor Cyan
cd android
.\gradlew.bat assembleDebug --no-daemon
cd ..

$apk = "android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apk) {
    $size = [math]::Round((Get-Item $apk).Length / 1MB, 1)
    Write-Host "APK pret : $apk ($size MB)" -ForegroundColor Green

    Write-Host "4/4 Installer sur telephone connecte..." -ForegroundColor Cyan
    & "$env:ANDROID_HOME\platform-tools\adb.exe" install -r $apk
} else {
    Write-Host "Build echoue — verifier les logs ci-dessus" -ForegroundColor Red
}
