# Use the server as the authoritative data source

CwFitness will store canonical user, plan, exercise, and workout data in PostgreSQL. IndexedDB is limited to the active workout draft and an idempotent outbox so a short network interruption does not stop set recording; this avoids two equal sources of truth while preserving the MVP's most important offline moment.

## Consequences

Full plan editing and history browsing require a connection. Mutable records use server versions, conflicts are surfaced instead of silently resolved, and one device at a time owns editing of an In-progress Session.
