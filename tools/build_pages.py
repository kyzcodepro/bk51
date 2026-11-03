"""Génère les pages services/*.html et sitemap.xml à partir de tools/services.json.

Usage : python3 tools/build_pages.py
"""
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://www.bkauto51.com"
VERSION = "16"
TEL = "+33749591208"
TEL_TXT = "07 49 59 12 08"

services = json.loads((ROOT / "tools" / "services.json").read_text(encoding="utf-8"))
e = html.escape


def footer_links(current=None):
    current_attr = ' aria-current="page"'
    items = "".join(
        f'<li><a href="/services/{s["slug"]}"{current_attr if s["slug"] == current else ""}>{e(s["nav"])}</a></li>'
        for s in services
    )
    return f'<nav class="footer__services" aria-label="Nos services"><p>Nos services</p><ul>{items}</ul></nav>'


def page(s):
    url = f'{SITE}/services/{s["slug"]}'
    signs = "".join(f"<li>{e(x)}</li>" for x in s["signs"])
    steps = "".join(
        f'<li data-reveal><span class="steps__n">{i}</span><h3>{e(t)}</h3><p>{e(d)}</p></li>'
        for i, (t, d) in enumerate(s["steps"], 1)
    )
    faq = "".join(
        f'<details class="faq__item" data-reveal><summary>{e(q)}</summary><p>{e(a)}</p></details>'
        for q, a in s["faq"]
    )
    others = "".join(
        f'<li><a href="/services/{o["slug"]}" class="link-arrow">{e(o["nav"])}</a></li>'
        for o in services if o["slug"] != s["slug"]
    )
    ld = [
        {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": s["title"],
            "description": s["meta"],
            "url": url,
            "areaServed": "Châlons-en-Champagne et 40 km autour",
            "provider": {
                "@type": "AutoRepair",
                "name": "BK AUTO 51",
                "url": f"{SITE}/",
                "telephone": TEL,
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "3 Rue Adolphe Willette",
                    "postalCode": "51000",
                    "addressLocality": "Châlons-en-Champagne",
                    "addressCountry": "FR",
                },
            },
        },
        {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}}
                for q, a in s["faq"]
            ],
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Accueil", "item": f"{SITE}/"},
                {"@type": "ListItem", "position": 2, "name": s["nav"], "item": url},
            ],
        },
    ]
    return f"""<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{e(s["title"])} · BK AUTO 51</title>
  <meta name="description" content="{e(s["meta"])}">
  <link rel="canonical" href="{url}">
  <meta property="og:title" content="{e(s["title"])} · BK AUTO 51">
  <meta property="og:description" content="{e(s["meta"])}">
  <meta property="og:url" content="{url}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fr_FR">
  <meta name="theme-color" content="#141414">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=Barlow:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/styles.css?v={VERSION}">
  <script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head>
<body>
  <div class="topbar">
    <div class="container topbar__inner">
      <span>3 rue Adolphe Willette — 51000 Châlons-en-Champagne</span>
      <span class="topbar__right">Lun–ven 9h–18h · <a href="tel:{TEL}">{TEL_TXT}</a></span>
    </div>
  </div>

  <header class="header" id="top">
    <div class="container header__inner">
      <a href="/" class="logo" aria-label="BK AUTO 51, accueil">
        <span class="logo__bk">BK</span><span class="logo__rest">AUTO&nbsp;51</span>
      </a>
      <button class="nav-toggle" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="nav">Menu</button>
      <nav class="nav" id="nav">
        <a href="/#services">Services</a>
        <a href="/#methode">Méthode</a>
        <a href="/#zone">Zone</a>
        <a href="/#contact">Contact</a>
        <a href="/#contact" class="btn btn--dark btn--sm">Devis gratuit</a>
      </nav>
    </div>
  </header>

  <main>
    <section class="hero svc-hero">
      <div class="container">
        <p class="kicker anim-in" style="--d:0"><a href="/">Accueil</a> / {e(s["nav"])}</p>
        <h1 class="anim-in" style="--d:1">{e(s["title"])}</h1>
        <p class="lead anim-in" style="--d:2">{e(s["lead"])}</p>
        <p class="open-status anim-in" style="--d:3" data-open-status hidden></p>
        <div class="hero__actions anim-in" style="--d:3">
          <a href="tel:{TEL}" class="btn btn--yellow">Appeler le {TEL_TXT}</a>
          <a href="/#contact" class="btn btn--outline">Devis gratuit en ligne</a>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container svc-cols">
        <div>
          <header class="sec-head sec-head--stack" data-reveal>
            <span class="sec-head__num">01</span>
            <h2>Les signes qui doivent alerter</h2>
          </header>
          <ul class="signs" data-reveal>{signs}</ul>
        </div>
        <aside class="svc-card" data-reveal>
          <p class="svc-card__title">Au garage ou chez vous</p>
          <p>Garage au 3 rue Adolphe Willette à Châlons-en-Champagne. On se déplace aussi à domicile ou sur votre lieu de travail, jusqu'à 40&nbsp;km.</p>
          <p>Lundi – vendredi : 9h00 – 18h00</p>
          <a href="tel:{TEL}" class="btn btn--yellow btn--block">Appeler</a>
        </aside>
      </div>
    </section>

    <section class="section section--paper2">
      <div class="container">
        <header class="sec-head" data-reveal>
          <span class="sec-head__num">02</span>
          <h2>Comment on s'en occupe</h2>
          <p>Devis gratuit, rien n'est fait sans votre accord.</p>
        </header>
        <ol class="steps">{steps}</ol>
      </div>
    </section>

    <section class="section">
      <div class="container faq">
        <header class="sec-head" data-reveal>
          <span class="sec-head__num">03</span>
          <h2>Questions fréquentes</h2>
        </header>
        {faq}
      </div>
    </section>

    <section class="section section--ink">
      <div class="container svc-cta" data-reveal>
        <p class="statement__big">Un doute&nbsp;? <mark>Appelez, on vous dit tout de suite.</mark></p>
        <div class="hero__actions">
          <a href="tel:{TEL}" class="btn btn--yellow">{TEL_TXT}</a>
          <a href="/#contact" class="btn btn--outline">Demander un devis</a>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <header class="sec-head" data-reveal>
          <span class="sec-head__num">04</span>
          <h2>Nos autres services</h2>
          <p>Toutes marques, essence, diesel et hybride.</p>
        </header>
        <ul class="svc-others" data-reveal>{others}</ul>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="container">
      {footer_links(s["slug"])}
      <p class="footer__mark" aria-hidden="true">BK AUTO 51</p>
      <div class="footer__inner">
        <p>© <span id="year"></span> BK AUTO 51 — Garage automobile, Châlons-en-Champagne — Déplacement jusqu'à 40&nbsp;km</p>
        <a href="#top">Haut de page ↑</a>
      </div>
    </div>
  </footer>

  <nav class="action-bar" aria-label="Contact rapide">
    <a href="tel:{TEL}" class="action-bar__call">Appeler</a>
    <a href="/#contact" class="action-bar__quote">Devis gratuit</a>
  </nav>

  <script src="/assets/main.js?v={VERSION}" defer></script>
</body>
</html>
"""


for s in services:
    (ROOT / "services" / f'{s["slug"]}.html').write_text(page(s), encoding="utf-8")

urls = [f"{SITE}/"] + [f'{SITE}/services/{s["slug"]}' for s in services]
(ROOT / "sitemap.xml").write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + "".join(f"  <url><loc>{u}</loc></url>\n" for u in urls)
    + "</urlset>\n",
    encoding="utf-8",
)

# Liens vers les services dans le pied de page de l'accueil
index = ROOT / "index.html"
text = index.read_text(encoding="utf-8")
start, end = "<!-- services:start -->", "<!-- services:end -->"
if start in text:
    a, b = text.index(start) + len(start), text.index(end)
    text = text[:a] + footer_links() + text[b:]
    index.write_text(text, encoding="utf-8")

print(f"{len(services)} pages générées, sitemap : {len(urls)} URL")
