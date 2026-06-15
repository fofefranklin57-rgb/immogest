# ImmoGest v2 — Guide Build APK Android

## Option 1 : Trusted Web Activity (TWA) — Recommandé

La méthode la plus simple. L'APK est un wrapper Google Chrome qui charge `immogest-34w.pages.dev`.

### Prérequis
- Android Studio installé
- Java 17+
- Cloudflare Pages déployé (déjà fait)

### Étapes

1. **Installer Bubblewrap CLI** (outil Google officiel)
```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://immogest-34w.pages.dev/manifest.json
```

2. **Configuration** — répondre aux questions :
   - Package name : `cm.cabinetcraa.immogest`
   - App name : `ImmoGest`
   - Host : `immogest-34w.pages.dev`
   - Start URL : `/`
   - Version : `2.0.0` → version code `200`

3. **Build**
```bash
bubblewrap build
```
→ Génère `app-release-signed.apk` dans `./build/`

4. **Tester sur téléphone**
```bash
adb install build/app-release-signed.apk
```

---

## Option 2 : Capacitor (WebView natif)

Pour plus de contrôle sur les APIs natives (camera, contacts, push).

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init ImmoGest cm.cabinetcraa.immogest --web-dir .
npx cap add android
npx cap sync
npx cap open android
```

Dans Android Studio : Build → Generate Signed APK

### capacitor.config.json
```json
{
  "appId": "cm.cabinetcraa.immogest",
  "appName": "ImmoGest",
  "webDir": ".",
  "server": {
    "url": "https://immogest-34w.pages.dev",
    "cleartext": false
  },
  "android": {
    "minWebViewVersion": 90
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#0E6AAF"
    }
  }
}
```

---

## Option 3 : PWABuilder (sans code)

1. Aller sur https://www.pwabuilder.com
2. Entrer `https://immogest-34w.pages.dev`
3. Télécharger le package Android
4. Signer avec `keytool` et `jarsigner`

---

## Digital Asset Links (requis pour TWA)

Créer le fichier `/.well-known/assetlinks.json` sur Cloudflare Pages :

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "cm.cabinetcraa.immogest",
    "sha256_cert_fingerprints": ["VOTRE_FINGERPRINT_SHA256"]
  }
}]
```

Pour obtenir le fingerprint :
```bash
keytool -list -v -keystore release.keystore -alias immogest
```

---

## Play Store — Checklist

- [ ] Compte développeur Google Play (25 USD une seule fois)
- [ ] APK signé (keystore sécurisé, ne jamais perdre !)
- [ ] Screenshots 1080x1920 (déjà référencés dans manifest.json)
- [ ] Description FR + EN
- [ ] Politique de confidentialité (héberger sur immogest-34w.pages.dev/privacy.html)
- [ ] Classification âge : Tout public

---

*ImmoGest v2.0 — Cabinet CRAA, Yaoundé, Cameroun*
