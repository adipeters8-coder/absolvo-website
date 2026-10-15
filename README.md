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
- Formspree-ID: Repository-Variable `PUBLIC_FORMSPREE_ID` (Settings > Secrets and variables > Actions > Variables), lokal in `.env`

Jeder Push auf `main` baut die Seite über `.github/workflows/deploy.yml` und veröffentlicht sie.
