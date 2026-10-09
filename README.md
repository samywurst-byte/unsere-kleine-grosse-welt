# Unsere kleine große Welt

Unser Familienkompass: eine installierbare Web-App (PWA) für ein fest montiertes iPad im Querformat.
Stand: Version 0.2 mit Phase A (technisches Grundgerüst) und Phase B (funktionierender Familienalltag).

## Starten

Voraussetzung: Node.js 20 oder neuer.

```bash
npm install
npm run dev        # Entwicklungsserver, http://localhost:5173
npm test           # automatisierte Tests (Vitest, deutsche Zeitzone)
npm run build      # Produktions-Build in dist/
npm run preview    # Produktions-Build lokal ansehen
```

## Auf dem iPad installieren

Eine PWA braucht eine HTTPS-Adresse. Dieses Repository baut und veröffentlicht die App bei jedem Push
auf `main` automatisch über GitHub Pages (`.github/workflows/pages.yml`). Jeder andere statische Webspace
mit HTTPS funktioniert ebenfalls mit dem Inhalt von `dist/`.
Die App nutzt relative Pfade und Hash-Routing, sie läuft daher auch in einem Unterordner ohne Server-Konfiguration.

1. Die Adresse in **Safari** auf dem iPad öffnen.
2. Teilen-Symbol → **Zum Home-Bildschirm**.
3. Die App vom Home-Bildschirm starten (Vollbild, Querformat).
4. Beim ersten Start die Eltern-PIN festlegen.
5. Unter **Eltern › Daten** die Familien-Datensicherung importieren. Ohne Import startet die App mit
   neutralen Beispielwerten, die sich im Elternbereich bearbeiten lassen.
6. Empfehlung: Einstellungen → Bildschirm & Helligkeit → Automatische Sperre nach Wunsch einstellen,
   und unter Bedienungshilfen → Geführter Zugriff die App für die Kinder fixieren.

Nach dem ersten erfolgreichen Laden funktioniert die App offline. Alle Daten bleiben lokal auf dem iPad.
**Wichtig:** Daten können verloren gehen, wenn Website-Daten gelöscht oder die App entfernt wird.
Im Elternbereich unter „Daten“ regelmäßig eine Sicherung exportieren.

## Architektur

```
src/
  app/               App-Rahmen: Routing, Navigation, PIN-Ersteinrichtung, Eltern-Sitzung
  components/        Wiederverwendbare UI: Analoguhr, Avatare (SVG), Icons, Modal, PIN-Feld, Formulare
  features/
    dashboard/       Startseite „Heute“
    children/        Kinderauswahl und persönliches Aufgabenbrett
    routines/        Aufgabenkarte
    calendar/        Wochen- und Tagesansicht, Termin-Details
    timers/          Visueller Timer und Timer-Seite
    family-time/     Familienzeit (Mama-Zeit-Timer; Rest folgt in Phase C)
    world-adventure/ Weltreise (vorbereitet; folgt in Phase D)
    parent-settings/ Elternbereich
    rewards/         (Phase C)
  data/seed.ts       neutrale Startwerte (keine echten Familiendaten), nur beim allerersten Start
  database/          Dexie/IndexedDB, versioniertes Schema mit Migrationen
  hooks/             Live-Abfragen, aktuelle Uhrzeit
  services/          Geschäftslogik ohne UI: Kalender, Tagesphasen, Routinen, Haushalt, Timer, PIN, Sicherung
  styles/            Design Tokens und Basisstile
  types/             TypeScript-Datenmodell
  utils/             Datum, IDs, Uhrzeit in Worten
tests/               Vitest-Tests der Geschäftslogik
```

Grundsätze:

- **Geschäftslogik ist rein und getestet** (`src/services`). Die Oberfläche ruft nur Services auf.
- **Datum als lokaler Kalendertag** (`yyyy-MM-dd`) und Uhrzeiten als Wanduhrzeit (`HH:mm`).
  Dadurch bleiben Serien über Sommerzeit, Monats- und Jahreswechsel stabil.
- **Jede Erledigung ist eine eigene Instanz** mit eindeutigem Schlüssel aus Aufgabe, Kind und Datum.
  Mehrfaches Antippen erzeugt keine Duplikate, alte Wochen werden nie überschrieben.
- **Timer rechnen mit Zeitstempeln**, nicht mit herunterzählenden Intervallen, und sind in IndexedDB gespeichert.
- **Schema-Versionen werden nur angehängt.** Version 2 enthält bereits die Tabellen für Phase C und D,
  damit spätere Phasen ohne Umbau auskommen. Eine spätere Synchronisierung kann an den Services andocken.

Erweitern:

- Neues Symbol: in `src/components/Icon.tsx` eintragen.
- Neuer Avatar: in `src/components/Avatar.tsx` zeichnen und in `AvatarKey` ergänzen.
- Neue Datenbankversion: in `src/database/schema.ts` ein neues Schema ergänzen und in `db.ts`
  `this.version(n).stores(...).upgrade(...)` anhängen, dazu einen Migrationstest schreiben.

## Datenschutz

Der Code ist öffentlich. Deshalb enthält er keine echten Namen, Geburtstage oder Termine.
Diese Daten leben nur auf dem iPad und in den Datensicherungen der Eltern.
