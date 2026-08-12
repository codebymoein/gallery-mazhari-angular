# GM-029 — Remove unused notification service

## Scope
Remove only `src/app/core/services/notification.service.ts` from `main@bf66cf260ba811dbbe0390432ff861e33df76dc5`.

## Evidence
Calibrated Knip reports the file as unused. Repository search found no references to `NotificationService` or `sendConsultationAlert`. The only previously observed consumer, `BookingService`, was removed in GM-028 and is already merged.

## Non-scope
No routes, templates, backend/API/database/media/deployment code, environment notification settings, or other Knip findings are changed.

## Verification
Expected calibrated Knip unused-file count: 9 -> 8. All exact-head quality, SSR, static analysis, browser/CWV, and release-certification evidence must remain green before merge.

## Recovery
Revert this focused PR to restore the service; no data migration or runtime recovery is required.
