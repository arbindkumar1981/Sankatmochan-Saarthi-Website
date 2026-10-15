# Firebase Firestore backup and restore — operations runbook

**Status:** Procedure only. No scheduled backup, backup bucket, IAM binding, or restore drill has been provisioned by this repository change.

## Preconditions

- Firebase project: `sankatmochan-509100`. Verify the correct project and Firestore database before every command.
- An administrator with appropriate Google Cloud permissions, billing enabled, and a dedicated, private Google Cloud Storage bucket in a compatible location.
- Bucket access restricted to a backup service account and designated recovery operators; enable retention, versioning or retention lock as appropriate. Never publish student backups or commit service-account keys.
- Decide retention and residency with the organization's privacy and data-retention policy. Backups contain minors' personal information.
- Test on an isolated nonproduction project; do not import into production to test.

## Manual export (authorized operator only)

```sh
gcloud config set project sankatmochan-509100
gcloud firestore export gs://YOUR_PRIVATE_BACKUP_BUCKET/firestore/YYYY-MM-DDTHHMMSS --database='(default)'
```

Replace placeholders with a dedicated bucket and unique timestamp. Confirm the long-running operation completed successfully, then verify the export manifest exists. A command invocation alone is not a successful backup.

## Restore drill (isolated environment)

1. Prepare an isolated project with a compatible Firestore database, security rules, indexes, and controlled IAM.
2. Copy the verified export into an appropriately permissioned private bucket if required.
3. Import into the isolated database using `gcloud firestore import gs://YOUR_PRIVATE_BACKUP_BUCKET/firestore/EXPORT_PREFIX --database='(default)'` with the **isolated project selected**.
4. Compare collection counts and sampled referential integrity (users, tests, results, mistakes, content); verify permissions, student access restrictions, and app behavior.
5. Record export operation ID, import operation ID, manifest path, counts, errors, recovery duration, and sign-off.

## Production recovery controls

- Require two-person authorization, a documented incident, and a verified recovery point.
- Take a fresh export before any destructive recovery if the source remains accessible.
- Firestore import does not automatically erase extra existing documents. Design and approve a conflict/merge strategy.
- Cloud Storage study files, Firebase Authentication accounts, Hosting releases, secrets, and other services are **not** included in Firestore exports. Back them up separately using their respective supported mechanisms.
- Ensure deletion requests and retention limits are reflected in backup lifecycle and restore processes.
- Set up server-side scheduled exports or managed backups, monitoring, failure alerts, and periodic restore drills before marking backup/restore as operational.
