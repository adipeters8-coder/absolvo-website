# absolvo-website
Webseite von Absolvo.

## Entwicklung

Astro, statischer Output, gehostet auf GitHub Pages unter https://www.absolvo.shop. Inhalt, Design und Technik stehen in `CLAUDE.md`.

```bash
npm install
npm run dev      # lokal unter http://localhost:4321
npm test         # Preisrechner-Tests (Testfälle aus CLAUDE.md, Abschnitt 8)
npm run build    # statischer Build nach dist/
```

- Preise und Regeln des Rechners: `src/data/preise.json`
- FAQ: `src/data/faq.json`
- Social-Links, Mail, Schalter „Jeder zahlt selbst“: `src/data/site.json`
- Forminit-Form-ID: `forminit_id` in `src/data/site.json` (öffentlich, kein Geheimnis). Feldnamen müssen dem Muster `fi-{typ}-{name}` folgen, sonst speichert Forminit sie nicht.

Jeder Push auf `main` baut die Seite über `.github/workflows/deploy.yml` und veröffentlicht sie.
