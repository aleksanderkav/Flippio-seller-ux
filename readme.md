# Flippio Seller UX

Forenkler Dokan auksjons-produktflyt:
- Minimal "Create"-skjema
- Flere valg på "Edit"
- Avanserte innstillinger (accordion)
- Felt-skanner + innstillinger (huk av hva som skjules/flyttes)

## Installasjon
1. Last opp plugin-mappen til `wp-content/plugins/flippio-seller-ux/`
2. Aktiver pluginen i WordPress admin
3. Gå til Dokan selger-dashboardet (produkt-redigering)
4. Som admin får du en **"🔍 Skann felter (admin)"** knapp øverst i skjemaet
5. Klikk på knappen for å skanne alle tilgjengelige felter
6. Gå til **Innstillinger → Flippio Seller UX** og konfigurer regler

## Konfigurering
Etter at feltene er skannet, kan du huke av hvilke felter som skal:
- **Skjules på Create** - feltet vises ikke når du oppretter nytt produkt
- **Flyttes til Avansert på Create** - feltet flyttes til "Avanserte innstillinger" seksjonen
- **Flyttes til Avansert på Edit** - feltet flyttes til "Avanserte innstillinger" når du redigerer

## Funksjoner
- **Felt-skanner**: Automatisk oppdager alle felter i Dokan-skjemaet
- **Innstillinger**: Enkel kontroll over hva som skjules/flyttes
- **Avanserte innstillinger**: Accordion-seksjon for komplekse felter
- **Hjelpetekster**: Kontekstuelle tips for vanlige felter
- **Validering**: Sjekker at nødvendige felter er fylt ut
- **Debug**: Konsoll-logging for utviklere

## Troubleshooting
Hvis "Skann felter" knappen ikke vises:
1. Sjekk at du er logget inn som admin
2. Sjekk at du er på Dokan selger-dashboardet
3. Sjekk at pluginen er aktivert
4. Åpne browser-konsollen for eventuelle JavaScript-feil

## Støttede felttyper
- Input (text, number, email, etc.)
- Select (dropdown)
- Textarea
- Checkbox
- Radio buttons
