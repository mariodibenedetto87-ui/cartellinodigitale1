# Generazione Icone PWA per iOS

## Icone Necessarie

Per una corretta installazione su iPhone/iPad, servono le seguenti icone PNG:

### Dimensioni Richieste
- **icon-120.png** - 120×120px (iPhone con display standard)
- **icon-152.png** - 152×152px (iPad)
- **icon-167.png** - 167×167px (iPad Pro)
- **icon-180.png** - 180×180px (iPhone con display Retina)
- **icon-192.png** - 192×192px (Android, PWA standard)
- **icon-512.png** - 512×512px (Android splash screen, PWA standard)

## Come Generare le Icone

### Opzione 1: Strumento Online Automatico (CONSIGLIATO)
1. Vai su **[RealFaviconGenerator](https://realfavicongenerator.net/)** o **[PWA Builder Image Generator](https://www.pwabuilder.com/imageGenerator)**
2. Carica il tuo logo in alta risoluzione (almeno 512×512px, preferibilmente SVG o PNG con sfondo trasparente)
3. Configura:
   - **iOS**: Scegli sfondo teal (#14b8a6) o bianco
   - **Android**: Abilita "maskable icon" con margine sicuro
4. Scarica il pacchetto completo di icone
5. Copia i file nella cartella `public/` del progetto

### Opzione 2: Photoshop/Figma/GIMP
1. Apri il logo originale in alta risoluzione
2. Per ogni dimensione:
   - Crea un nuovo file quadrato (es. 180×180px)
   - Aggiungi sfondo teal (#14b8a6) o bianco
   - Centra il logo con margine sicuro del 10% (18px per 180×180)
   - Esporta come PNG ottimizzato
3. Salva i file con i nomi esatti: `icon-120.png`, `icon-152.png`, ecc.
4. Posiziona i file nella cartella `public/`

### Opzione 3: Script ImageMagick (Linux/macOS)
```bash
# Installa ImageMagick
brew install imagemagick  # macOS
# oppure: apt-get install imagemagick  # Linux

# Genera tutte le dimensioni da un logo 512×512
convert logo-512.png -resize 120x120 public/icon-120.png
convert logo-512.png -resize 152x152 public/icon-152.png
convert logo-512.png -resize 167x167 public/icon-167.png
convert logo-512.png -resize 180x180 public/icon-180.png
convert logo-512.png -resize 192x192 public/icon-192.png
convert logo-512.png -resize 512x512 public/icon-512.png
```

## Linee Guida Design Apple

### Best Practices:
✅ **Design semplice** - L'icona deve essere riconoscibile anche a 40×40px  
✅ **Sfondo pieno** - Evita trasparenze (iOS aggiunge automaticamente bordi arrotondati)  
✅ **Contrasto alto** - Usa colori che risaltano sia su background chiaro che scuro  
✅ **Margine sicuro** - Lascia 10% di margine per evitare tagli sui bordi arrotondati  
✅ **Colore brand** - Usa il teal (#14b8a6) come sfondo per coerenza con l'app  

### Da Evitare:
❌ Testo troppo piccolo (illeggibile a dimensioni ridotte)  
❌ Dettagli troppo fini (si perdono sui piccoli schermi)  
❌ Trasparenze o sfondi complessi  
❌ Loghi troppo grandi (senza margini sicuri)  

## Verifica delle Icone

Dopo aver generato le icone:

1. **Controlla dimensioni**:
   ```bash
   file public/icon-*.png
   # Output atteso: "PNG image data, 180 x 180, 8-bit/color RGB"
   ```

2. **Testa su iPhone**:
   - Apri l'app in Safari
   - Tocca il pulsante Condividi
   - Verifica che l'icona appaia correttamente in "Aggiungi a Home"
   - Installa e controlla l'icona nella Home Screen

3. **Testa su Android**:
   - Apri l'app in Chrome
   - Attendi il prompt di installazione
   - Verifica l'icona nell'App Drawer

## File Modificati

I seguenti file fanno già riferimento alle icone:
- ✅ `manifest.json` - Riferimenti a icon-192.png e icon-512.png
- ✅ `index.html` - Meta tag per Apple Touch Icons (120, 152, 167, 180)

## Dove Posizionare i File

```
cartellinodigitale1/
├── public/
│   ├── icon-120.png   ← QUI
│   ├── icon-152.png   ← QUI
│   ├── icon-167.png   ← QUI
│   ├── icon-180.png   ← QUI
│   ├── icon-192.png   ← QUI
│   └── icon-512.png   ← QUI
├── manifest.json
└── index.html
```

## Deploy

Dopo aver generato le icone:
1. Aggiungi i file PNG alla cartella `public/`
2. Esegui il build: `npm run build`
3. Deploy su Vercel/Netlify/altro hosting
4. Testa l'installazione su dispositivo reale iOS/Android

## Risorse Utili

- [Apple Human Interface Guidelines - App Icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [PWA Builder - Image Generator](https://www.pwabuilder.com/imageGenerator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Maskable Icon Editor](https://maskable.app/editor)

---

**Nota**: Le icone PNG devono essere generate manualmente in quanto richiedono il logo ad alta risoluzione dell'app. Gli SVG non sono supportati come Apple Touch Icons su iOS.
