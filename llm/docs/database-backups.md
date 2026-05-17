# Database Backup Setup (CNPG Barman Cloud Plugin)

This document describes what the `ops` repo Pulumi stack (`tamanu/on-k8s`) needs to
implement to support the `backup` / `backupretention` deploy options that are passed
through from `ghaCdHelpers.mjs`.

## Overview

Backups use the **CNPG Barman Cloud Plugin** (`barman-cloud.cloudnative-pg.io`), the
recommended approach from CNPG 1.26 onwards. Backups are stored in **AWS S3**.

The flow for each database cluster is:

```
PostgreSQL pod (primary/standby)
  └── barman-cloud sidecar
        ├── WAL archiving  →  S3 bucket  (continuous, ≤5 min RPO)
        └── Base backups   →  S3 bucket  (scheduled, e.g. daily)
```

Retention is managed by Barman; base backups older than `backupRetentionDays` are
automatically expired along with any WAL files that are no longer needed.

## Prerequisites (cluster-wide, one-time)

### 1. Install the Barman Cloud Plugin

Install the plugin in the same namespace as the CNPG operator (typically
`cnpg-system`):

```bash
helm repo add cnpg https://cloudnative-pg.github.io/charts
helm upgrade --install barman-cloud-plugin cnpg/barman-cloud-plugin \
  --namespace cnpg-system
```

### 2. Create the S3 bucket

One bucket per environment (e.g. `tamanu-db-backups-staging`,
`tamanu-db-backups-prod`). Recommended S3 settings:

- **Versioning**: enabled
- **Object Lock**: enabled in Governance mode (prevents accidental deletion /
  ransomware attacks)
- **Lifecycle rule**: expire current-version objects N days after the Barman
  retention window ends; expire non-current versions after 90 days

### 3. IAM role (IRSA)

Each CNPG cluster's service account needs an IAM role that allows reading and
writing to the bucket. The `serviceaccountarn` deploy option (already wired up)
controls the ARN annotation placed on the cluster's `serviceAccountTemplate`.

Minimum policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::tamanu-db-backups-<env>",
        "arn:aws:s3:::tamanu-db-backups-<env>/*"
      ]
    }
  ]
}
```

## Per-Deployment Resources (Pulumi)

When `backupsEnabled` is `true`, the Pulumi stack should create the following
resources inside the deployment namespace alongside the CNPG `Cluster`.

### ObjectStore

One `ObjectStore` per CNPG cluster (central-db, facility-*-db):

```yaml
apiVersion: barmancloud.cnpg.io/v1
kind: ObjectStore
metadata:
  name: <cluster-name>-object-store   # e.g. central-db-object-store
  namespace: tamanu-<deploy-name>
spec:
  configuration:
    destinationPath: s3://tamanu-db-backups-<env>/<deploy-name>/<cluster-name>/
    s3Credentials:
      inheritFromIAMRole: true         # uses the IRSA annotation on the cluster SA
    wal:
      compression: gzip
      maxParallel: 2
    data:
      compression: gzip
      jobs: 2
  instanceSidecarConfiguration:
    # Expire backups older than backupRetentionDays
    retentionPolicyIntervalSeconds: 3600
```

### CNPG Cluster – plugin stanza

Add to the existing `Cluster` spec:

```yaml
spec:
  serviceAccountTemplate:
    metadata:
      annotations:
        eks.amazonaws.com/role-arn: <serviceaccountarn>   # from Pulumi config

  plugins:
    - name: barman-cloud.cloudnative-pg.io
      isWALArchiver: true
      parameters:
        barmanObjectName: <cluster-name>-object-store
        serverName: <cluster-name>
```

### ScheduledBackup

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: ScheduledBackup
metadata:
  name: <cluster-name>-scheduled
  namespace: tamanu-<deploy-name>
spec:
  # Daily at 02:00 UTC (six-field Go cron: sec min hour dom month dow)
  schedule: "0 0 2 * * *"
  immediate: true           # take a backup right away when the resource is created
  backupOwnerReference: self
  cluster:
    name: <cluster-name>
  method: plugin
  pluginConfiguration:
    name: barman-cloud.cloudnative-pg.io
```

### Retention via Barman

Set `spec.backup.retentionPolicy` on the `Cluster` to the desired window. This
field is deprecated in CNPG 1.26+ in favour of the plugin handling it, but until
the plugin exposes its own Kubernetes retention API you can still use:

```yaml
spec:
  backup:
    retentionPolicy: <backupRetentionDays>d   # e.g. "7d"
```

Alternatively configure the Barman server-side retention in the ObjectStore's
`instanceSidecarConfiguration` section when the plugin supports it.

## Pulumi Config Keys

These keys are emitted by `configMap()` in `ghaCdHelpers.mjs` and should be
consumed by the Pulumi stack:

| Key | Type | Description |
|-----|------|-------------|
| `backupsEnabled` | `boolean` | Whether to create ObjectStore + ScheduledBackup resources |
| `backupRetentionDays` | `number \| null` | Days to retain base backups; `null` when backups are disabled |

## On-Demand Backups

Trigger `cd-backup.yml` from the GitHub Actions UI (or `workflow_call`) to take an
ad-hoc snapshot at any time. This is also the recommended way to verify the backup
pipeline is working on a new auto-deploy before relying on the schedule.

## Restoring

Use `cd-restore.yml` to bootstrap a new CNPG cluster from the object store. The
workflow:

1. Creates a new `Cluster` resource (`<original>-restore-<timestamp>`) that
   bootstraps from the latest (or a PITR-targeted) backup.
2. Waits for the restored cluster to become `Ready`.
3. Prints manual next-steps for swapping traffic and decommissioning the old cluster.

No live traffic is automatically moved — the operator must validate the restored data
before taking any further action.

## Testing on an Auto-Deploy

To exercise the full backup lifecycle on an ephemeral PR deploy, add `%backup` to the
deploy line in the PR body:

```markdown
- [x] Deploy to Tamanu Internal <!-- #deploy %backup %backupretention=3 -->
```

Then:

1. Wait for `cd-up` to finish — this creates the `ObjectStore` and `ScheduledBackup`.
2. Trigger `cd-backup` manually from the Actions tab (or wait for the scheduled run).
3. Verify the backup appears in S3 and the CNPG `Backup` resource is `completed`.
4. Optionally trigger `cd-restore` to validate recovery end-to-end.
