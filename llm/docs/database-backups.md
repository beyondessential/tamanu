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
  retentionPolicy: <backupRetentionDays>d   # e.g. "3d" — from Pulumi backupRetentionDays config
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

### Retention via the ObjectStore

**Do not** set `spec.backup.retentionPolicy` on the `Cluster` resource. When the
Barman Cloud Plugin is active, CNPG ignores that field entirely and emits a warning.
Retention must be configured on the `ObjectStore` as a top-level `spec` field:

```yaml
spec:
  retentionPolicy: <backupRetentionDays>d   # e.g. "3d", "7d", "10d"
```

Barman will automatically expire base backups (and their associated WAL files) older
than the configured window.

## Pulumi Config Keys

These keys are emitted by `configMap()` in `ghaCdHelpers.mjs` and should be
consumed by the Pulumi stack:

| Key | Type | Description |
|-----|------|-------------|
| `backupsEnabled` | `boolean` | Whether to create ObjectStore + ScheduledBackup resources |
| `backupRetentionDays` | `number \| null` | Days to retain base backups (1–10); `null` when backups are disabled |

## On-Demand Backups

Trigger `cd-backup.yml` from the GitHub Actions UI (or `workflow_call`) to take an
ad-hoc snapshot at any time. This is also the recommended way to verify the backup
pipeline is working on a new auto-deploy before relying on the schedule.

## Restoring

Use `cd-restore.yml` to bootstrap a temporary cluster from the object store, then
pipe the recovered data back into the live cluster.

### How it works

1. A new `Cluster` (`<original>-restore-<timestamp>`) is created and bootstrapped
   from S3 — either the latest backup or a specific point in time.
2. The workflow waits for the restored cluster to become `Ready` (typically ~2–3
   minutes).
3. The workflow prints copy-paste ready commands for the operator to complete the
   rollback.

### Point-in-time recovery

To roll back to a specific moment, supply `recovery-target-time` in RFC 3339 format:

```
2026-05-21 19:20:00+00
```

Leave it blank to restore to the most recent consistent state. Note that "most
recent" includes all WAL-archived changes up to the latest archived segment — it is
**not** a rollback. Always specify a target time when rolling back an unwanted change.

### Cutover procedure (after the restore cluster is Ready)

The app continues connecting to the original cluster's `-rw` service throughout.
The cutover replaces the database content without touching any Kubernetes
infrastructure:

```bash
# 1. Verify the restored data looks correct
kubectl exec -it -n $NS ${RESTORE_NAME}-1 -c postgres -- psql -U postgres -d app

# 2. Pipe the restored data into the live cluster (app stays connected throughout)
kubectl exec -n $NS ${RESTORE_NAME}-1 -c postgres -- pg_dump -U postgres -d app -Fc | kubectl exec -i -n $NS ${CLUSTER}-1 -c postgres -- pg_restore -U postgres -d app --clean --if-exists

# 3. Verify the live cluster has the rolled-back data

# 4. Delete the restore cluster
kubectl delete cluster $RESTORE_NAME -n $NS
```

The workflow output prints all variables (`NS`, `RESTORE_NAME`, `CLUSTER`) pre-filled
with the correct values so the operator can copy-paste directly.

## Rollback Runbooks

### Rolling back a single server

Use this when only one server (e.g. `central` or `facility-1`) needs to be rolled back.

1. **Trigger `cd-restore.yml`** with the target server and a `recovery-target-time` set to just before the incident:
   - `deploy-name`: e.g. `feature-my-branch` (without the `tamanu-` prefix)
   - `cluster`: e.g. `central` or `facility-1`
   - `recovery-target-time`: e.g. `2026-05-21 19:20:00+00`

2. **Wait for the workflow to complete** (~2–3 minutes). It will print copy-paste commands including the pre-filled variable exports.

3. **Run the printed commands** to verify and pipe the data back:
   ```bash
   # Variables are printed by the workflow — copy-paste them:
   NS=tamanu-<deploy-name>
   RESTORE_NAME=<cluster>-restore-<timestamp>-db
   CLUSTER=<cluster>-db

   # Verify restored data
   kubectl exec -it -n $NS ${RESTORE_NAME}-1 -c postgres -- psql -U postgres -d app

   # Pipe restored data into live cluster
   kubectl exec -n $NS ${RESTORE_NAME}-1 -c postgres -- pg_dump -U postgres -d app -Fc | kubectl exec -i -n $NS ${CLUSTER}-1 -c postgres -- pg_restore -U postgres -d app --clean --if-exists

   # Delete the restore cluster
   kubectl delete cluster $RESTORE_NAME -n $NS
   ```

---

### Rolling back all servers

Use this when a change affected multiple servers and all need to be restored to the same point in time. **Use the exact same `recovery-target-time` for all clusters** to keep the databases consistent with each other.

1. **Note the recovery target time** — pick a timestamp before the incident that applies to all servers (e.g. `2026-05-21 19:20:00+00`).

2. **Trigger `cd-restore.yml` once per cluster** — run it sequentially or in parallel for each cluster that needs rolling back:
   - `central`
   - `facility-1`
   - `facility-2`
   - (repeat for all facility servers in the deployment)

   Use the **same `recovery-target-time`** for every run.

3. **Wait for all restore clusters to be Ready.**

4. **Pipe each cluster's data back in order** — start with `central`, then facilities:
   ```bash
   NS=tamanu-<deploy-name>

   # Repeat for each cluster (central-db, facility-1-db, facility-2-db, ...):
   RESTORE_NAME=<cluster>-restore-<timestamp>-db
   CLUSTER=<cluster>-db

   kubectl exec -n $NS ${RESTORE_NAME}-1 -c postgres -- pg_dump -U postgres -d app -Fc | kubectl exec -i -n $NS ${CLUSTER}-1 -c postgres -- pg_restore -U postgres -d app --clean --if-exists
   ```

5. **Verify** each live cluster has the rolled-back data.

6. **Delete all restore clusters:**
   ```bash
   kubectl delete cluster -n $NS -l tamanu.io/restored-from   # deletes all restore clusters at once
   ```

> **Note:** The app does not need to be stopped during this procedure. The `pg_restore` step briefly locks tables but the app will reconnect automatically. For zero-tolerance deployments, consider stopping the app pods before step 4 and restarting after step 6.

---

## Testing on an Auto-Deploy

To exercise the full backup lifecycle on an ephemeral PR deploy, add `%backup` to the
deploy line in the PR body:

```markdown
- [x] Deploy to Tamanu Internal <!-- #deploy %backup %backupretention=3 -->
```

Then:

1. Wait for `cd-up` to finish — this creates the `ObjectStore` and `ScheduledBackup`.
2. Trigger `cd-backup` manually from the Actions tab (or wait for the scheduled run).
3. Verify the backup completed: `kubectl get backup -n <ns> --sort-by=.metadata.creationTimestamp`
4. Note the backup completion timestamp, then make a test change to the database.
5. Trigger `cd-restore` with a `recovery-target-time` set to just **before** the test
   change — this confirms rollback works, not just "restore to latest".
6. Follow the cutover procedure above to pipe the restored data into the live cluster
   and verify the test change is gone.
