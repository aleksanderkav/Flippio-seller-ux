# Flippio Seller UX

Forenkler Dokan auksjons-produktflyt:
- Minimal "Create"-skjema
- Flere valg på "Edit"
- Avanserte innstillinger (accordion)
- Felt-skanner + innstillinger (huk av hva som skjules/flyttes)

## Installasjon
1. Last opp plugin-mappen til `wp-content/plugins/flippio-seller-ux/`
2. Aktiver pluginen i WordPress admin
3. Gå til selger-dashbordet (Dokan). Som admin får du en knapp **"Skann felter (admin)"** – bruk den.
4. Gå til **Innstillinger → Flippio Seller UX** og huk av hvilke felter som:
   - Skjules på Create
   - Flyttes til Avansert på Create
   - Flyttes til Avansert på Edit
5. Ferdig. Server-side defaults sikrer at skjulte felt har trygg verdi.

## Funksjoner
- **Felt-skanner**: Automatisk oppdager alle felter i Dokan-skjemaet
- **Innstillinger**: Enkel kontroll over hva som skjules/flyttes
- **Avanserte innstillinger**: Accordion-seksjon for komplekse felter
- **Hjelpetekster**: Kontekstuelle tips for vanlige felter
- **Validering**: Sjekker at nødvendige felter er fylt ut
