# Progress Interaction Audit

This note records manual checks for the editor progress workflow after the
latest frontend and backend merge.

## Scope

- Editor login flow with the seeded Tantou Editor account.
- Assigned series list, search, status filters, and chapter navigation.
- Studio progress filters, dashboard summaries, task cards, and workspace links.
- Task status updates through the progress board.

## Baseline

- Backend runs on port 5000.
- Frontend runs on port 5173.
- Development data is seeded from the in-memory MongoDB fallback.
- The editor account used for local verification is `editor@example.com`.

## Current Result

- Series list loads from the backend.
- Progress board loads series, chapters, annotations, and task counts.
- Workspace links stay inside the authenticated app session.
- Task status changes update both the Kanban columns and dashboard metrics.

## Series Page Checklist

- Open `/editor/series` from the Tantou Editor sidebar.
- Confirm the summary counters render after backend data loads.
- Confirm the list contains the seeded editor series.
- Search by a Vietnamese title fragment such as `Rồng`.
- Clear the search field and confirm the full list returns.
- Apply the `ACTIVE` filter and confirm active series remain visible.
- Open a chapter list from a series card.
- Confirm the chapter list route receives the selected series id.
- Confirm chapter action links render for page management and publish review.
- Return to the series list through navigation without losing auth state.
