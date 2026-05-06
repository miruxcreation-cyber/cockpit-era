# Index.html Feature Inventory

## Shell And Navigation
- Premium header with date and agent identity.
- Fixed bottom tab navigation with active states and counters.
- Main tabs: Aujourd'hui, Mandats, Acquereurs, RDV, Terrain, Parametres.
- Secondary panels: Lots, Prospection, Notes, Performance.
- Horizontal swipe navigation between major tabs.

## Data And Persistence
- Local persistence for all business entities in `localStorage`.
- Session PIN unlocked state in `sessionStorage`.
- Seed bootstrap when persistent data is missing.
- Journal keys per entity and daily completion state keys.

## Mandats
- Pipeline filters with section counters and search.
- Active and estimation card variants with full field detail.
- Net seller, FAI, and Net Samir calculation outputs.
- Status timeline dots, badges, expiry badges.
- Actions: call, WhatsApp, note, matching, more menu.
- Estimation to active conversion action.

## Acquereurs
- Status pipeline, segmentation (chaud/actif/prospect), and search.
- Matching acquereur -> mandat with score explanation.
- Contact actions and follow-up workflows.
- Fiche and interaction journal workflows.

## RDV
- Weekly and list representations.
- RDV CRUD, categories, and details.
- Reminder scheduling with popup, snooze, and completion.
- Countdown and sound/vibration cues.

## Terrain / Copros
- Hierarchical flow: secteurs -> copros -> proprietaires/lots.
- CRUD for secteur/copro/proprietaire.
- Coverage and status indicators.
- Conversion paths toward estimation/mandat.

## Notes And Journal
- Quick-add notes and complete note workflows.
- Entity-scoped interaction journal history.

## Import / Export / Share
- CSV imports with flexible header mapping.
- Fiche client import from encoded text/link.
- Share/export actions via clipboard, SMS, and WhatsApp.

## AI And Voice
- Voice assistant flows with STT/TTS interaction.
- Conversational assistant workflow for data capture.
- Voice-driven extraction of business fields.

## Security And Settings
- Full PIN flow: setup, confirm, unlock, forgot, change.
- Theme switching and reset operations.
- Setup and utility settings used by the legacy app.

## PWA
- Install prompt handling and app installation path.
- Service worker registration logic.
- Browser theme color behavior.
