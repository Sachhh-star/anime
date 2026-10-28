# Dragon Ball Universe – Character Power Portal

Een website over de personages uit **Dragon Ball**. Alle personages komen live uit een externe API: de [Dragon Ball API](https://web.dragonball-api.com/). Je kunt zoeken, filteren en per personage de details en het **Ki Power Level** bekijken.

Dit project is gemaakt voor het **keuzedeel Frontend Development** (MBO 4 Software Development, ROC Alfa-college). Het belangrijkste leerdoel: **data ophalen uit een API en die tonen op de website**. Hoe dat werkt, lees je in het hoofdstuk [De API](#de-api).

## Functies

- **Alle personages**: op de homepage zie je de personages uit de API, met foto, naam en ras.
- **Zoeken**: typ in de zoekbalk een naam of een ras (bijvoorbeeld `Saiyan`). De lijst past zich direct aan.
- **Filterknoppen**: toon alleen **Male**, **Female**, **Saiyan** of **Human**, of weer **All**.
- **Filter op letter (A–Z)**: klik op een letter om de personages te zien waarvan de naam met die letter begint. Er komen alleen knoppen voor letters waar ook echt personages bij horen.
- **Detailvenster (modal)**: klik op een personage. Je ziet de foto, het ras, het geslacht, de serie, de beschrijving en een balk met het Ki-level ten opzichte van het maximale Ki.
- Het venster sluit je met **×**, door naast het venster te klikken of met de **Escape**-toets.
- **Pagina Main characters**: de vijf bekendste krijgers (Goku, Vegeta, Gohan, Piccolo en Trunks) als grote kaarten met een Ki-balk.
- **Laadscherm en foutmelding**: tijdens het laden zie je "Gathering Ki Energy...". Lukt het laden niet, dan zie je een foutmelding.
- **Snel laden**: de data wordt bewaard in de browser (cache) en de afbeeldingen laden pas als ze nodig zijn.
- **Responsive**: werkt op telefoon, tablet en computer. Op een telefoon zit het menu achter de menuknop.

## Gebruikte technieken

| Onderdeel | Techniek | Waarvoor |
| --- | --- | --- |
| Structuur | **HTML** | De opbouw van de pagina's. |
| Opmaak | **CSS** en **Bootstrap 5** | Kleuren, layout, het menu en de weergave op een telefoon. |
| Interactie | **JavaScript** | Zoeken, filteren, het detailvenster en de API-aanroepen. |
| Data | **Dragon Ball API** met de **Fetch API** | De personages ophalen. |
| Dataformaat | **JSON** | De vorm waarin de API de data terugstuurt. |
| Opslag | **localStorage** | De opgehaalde personages bewaren in de browser (cache). |

## De API

### Wat is een API?

Een API (Application Programming Interface) is een manier waarop twee programma's met elkaar praten. Deze website maakt geen eigen database. Hij **vraagt** de data aan een andere server: de Dragon Ball API. Die server stuurt een **antwoord** terug in **JSON**.

```
Website (browser)  --- request (fetch) --->  dragonball-api.com
Website (browser)  <-- response (JSON) ----  dragonball-api.com
```

### Het endpoint

| Methode | Adres | Wat doet het? |
| --- | --- | --- |
| `GET` | `https://dragonball-api.com/api/characters?limit=100` | Haalt maximaal 100 personages op. |

- `GET` betekent: ik wil data **ophalen** (niet aanpassen).
- `?limit=100` is een **query parameter**. Daarmee vraag je om 100 personages tegelijk in plaats van een paar per pagina.
- Je hebt geen API-sleutel nodig. De API is gratis en openbaar.

### Zo ziet het antwoord eruit (JSON)

De API stuurt een object terug. De personages staan in `items`:

```json
{
    "items": [
        {
            "id": 1,
            "name": "Goku",
            "ki": "60.000.000",
            "maxKi": "90 Septillion",
            "race": "Saiyan",
            "gender": "Male",
            "description": "El protagonista de la serie...",
            "image": "https://dragonball-api.com/characters/goku_normal.webp"
        }
    ],
    "meta": { "totalItems": 58, "itemsPerPage": 100 }
}
```

De website gebruikt deze velden:

| Veld | Waar zie je het? |
| --- | --- |
| `name` | Naam op de kaart en in het detailvenster. |
| `image` | Foto van het personage. |
| `race` | Ras op de kaart, het filter Saiyan / Human en de zoekfunctie. |
| `gender` | Het filter Male / Female en het detailvenster. |
| `ki` en `maxKi` | De Ki-balk. |
| `description` | De beschrijving in het detailvenster. |

### Zo roept de website de API aan

De API-aanroep staat in `javascript/shared.js`. Beide pagina's gebruiken dit bestand:

```js
async function fetchCharacters() {
  const response = await fetch(API_URL);           // 1. stuur het verzoek

  if (!response.ok) {                              // 2. is het gelukt?
    throw new Error("API error. Status: " + response.status);
  }

  const data = await response.json();              // 3. zet het antwoord om naar JavaScript
  localStorage.setItem(CACHE_KEY, JSON.stringify(data.items)); // 4. bewaar in de cache
  return data.items;
}
```

Wat gebeurt hier?

1. `fetch(API_URL)` stuurt een `GET`-verzoek naar de API.
2. `response.ok` controleert of de API "gelukt" terugstuurt. Zo niet (bijvoorbeeld status `404` of `500`), dan stopt de code met een fout.
3. `response.json()` zet het JSON-antwoord om naar een JavaScript-object. De personages staan in `data.items`.
4. We bewaren de lijst in `localStorage`, zodat de website de volgende keer meteen iets kan laten zien.

Daarna maakt JavaScript voor elk personage een kaart en zet die op de pagina (`renderCharacters()` in `script.js` en `showMainCharacters()` in `main-charactors.js`).

### `async` en `await`

Een API-aanroep kost tijd: de browser moet wachten op een andere server. Daarom zijn de functies `async`. Met `await` wacht de code tot het antwoord binnen is, zonder dat de pagina vastloopt.

### Foutafhandeling

De aanroep staat in een `try { ... } catch { ... }`. Gaat er iets mis, bijvoorbeeld geen internet of de API geeft een foutcode? Dan:

- zie je op de homepage de melding *"Er is een fout opgetreden bij het laden van de Ki-krijgers."*;
- zie je op de pagina Main characters een rode foutmelding in plaats van de kaarten.

Vindt een filter of zoekopdracht niets? Dan zie je *"Geen legendarische krijgers gevonden met dit filter!"*

### Cache en snelheid

Om de website snel te maken:

1. **Eerst de cache**: staat er al data in `localStorage`? Dan toont de website die meteen (`getCharacters()`).
2. **Op de achtergrond bijwerken**: daarna wordt de API toch opnieuw aangeroepen, zodat de cache actueel blijft.
3. **Lazy loading**: alleen de eerste 4 afbeeldingen laden direct. De rest laadt pas als je ernaartoe scrolt.

### Ki-waarden omrekenen

De API geeft Ki soms als tekst, zoals `"90 Septillion"` of `"60.000.000"`. Om de Ki-balk te kunnen tekenen, rekent `kiToNumber()` dit om naar een getal (bijvoorbeeld *septillion* = 10²⁴). `kiPercent()` berekent daarna hoe vol de balk is.

## Installatie en starten

Wat heb je nodig?

- Een browser (Chrome, Edge of Firefox)
- Visual Studio Code met de extensie **Live Server**
- Internet (voor de API)

**Stap 1.** Download het project.

```bash
git clone https://github.com/Sachhh-star/anime.git
```

**Stap 2.** Open de map `anime` in Visual Studio Code.

**Stap 3.** Klik rechtsonder op **Go Live** (Live Server).

**Stap 4.** De homepage opent in je browser, bijvoorbeeld op:

```
http://127.0.0.1:5500/
```

> Let op: open de HTML-bestanden niet door erop te dubbelklikken. De CSS en JavaScript staan met een pad vanaf de hoofdmap (`/css/...`, `/javascript/...`), en dat werkt alleen via een server zoals Live Server.

## Zo gebruik je de website

1. Op de **homepage** zie je alle personages.
2. Typ in de **zoekbalk** een naam of ras.
3. Klik op een **filterknop** (Male, Female, Saiyan, Human) of op een **letter**.
4. Klik op een **personage** om de details en de Ki-balk te zien.
5. Open het **menu** en kies **Main characters** voor de vijf bekendste krijgers.

## Mappenstructuur

| Map / bestand | Wat staat erin? |
| --- | --- |
| `index.html` | De homepage met zoeken, filters en alle personages. |
| `main-charactors.html` | De pagina met de vijf hoofdpersonages. |
| `css/index.css` | De opmaak van de website. |
| `css/main-charactors.css` | Extra opmaak voor de pagina Main characters. |
| `javascript/shared.js` | Code voor beide pagina's: de API-aanroep, de cache, de Ki-berekening en het detailvenster. |
| `javascript/script.js` | Homepage: kaarten, zoeken, filterknoppen en de A–Z-knoppen. |
| `javascript/main-charactors.js` | Pagina Main characters: de vijf grote kaarten met Ki-balk. |
| `img/` | Afbeeldingen. |
| `anime_document/` | Documenten voor de opdracht (klantwens, API endpoints, testrapporten, SEO-advies). |

## Bron

- **Dragon Ball API**: [https://web.dragonball-api.com/](https://web.dragonball-api.com/). Hier staat de documentatie van de API. Alle data en afbeeldingen van de personages komen hiervandaan.
- **API-adres dat de website gebruikt**: `https://dragonball-api.com/api/characters?limit=100`

Dragon Ball is van Akira Toriyama / Toei Animation. Dit is een schoolproject.
