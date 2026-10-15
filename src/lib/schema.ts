// JSON-LD-Bausteine (Briefing Abschnitt 7)
import preise from '../data/preise.json';
import site from '../data/site.json';

export const SITE_URL = site.url;

export function absolut(pfad: string): string {
  return new URL(pfad, SITE_URL).href;
}

export function organisation() {
  const sameAs = [site.instagram.url, site.tiktok.url].filter((url) => url && !url.includes('['));
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    url: absolut('/'),
    logo: absolut('/logo/absolvo-logo-tinte.svg'),
    sameAs,
  };
}

export function website() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: absolut('/'),
    inLanguage: 'de-DE',
  };
}

export function produkt(beschreibung: string) {
  const staffelpreise = preise.staffel_basis.map((s) => s.preis);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Abschlusspullover',
    description: beschreibung,
    image: absolut('/og/absolvo-og.png'),
    brand: { '@type': 'Brand', name: site.name },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'EUR',
      lowPrice: Math.min(...staffelpreise).toFixed(2),
      highPrice: Math.max(...staffelpreise).toFixed(2),
      offerCount: preise.staffel_basis.length,
      url: absolut('/preis-berechnen/'),
    },
  };
}

export function faqSeite(fragen: { frage: string; antwort: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: fragen.map((f) => ({
      '@type': 'Question',
      name: f.frage,
      acceptedAnswer: { '@type': 'Answer', text: f.antwort },
    })),
  };
}

export function brotkrumen(krumen: { name: string; pfad: string }[]) {
  const alle = [{ name: 'Start', pfad: '/' }, ...krumen];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: alle.map((k, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: k.name,
      item: absolut(k.pfad),
    })),
  };
}
