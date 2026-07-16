# Reference: maintain Tamanu on Linux (frontline slice)

This covers only the **frontline** host tasks a support officer needs to inspect
a Linux Tamanu server. For anything heavier — disk resize, database restore,
snapshots, AWS-level work — do **not** improvise; those procedures live in
`beyondessential/ops`.

All commands below are **[diagnose]** except the single-service restart, which is
mutating (see `../sops/restart-services.md` for its class).

## Get on the box

Connect over the deployment's VPN (Tailscale or Fortinet — check Canopy notes,
see `../deployment-context.md`), then SSH:

```bash
ssh ubuntu@<server name>
```

### Finding the server name

Identify the host by name, never by IP — it is too easy to end up in the wrong
SSH session against the wrong machine.

- **Primary — Bitwarden.** Deployments > _<country>_ > Prod (or Clone / Demo) >
  Remote. That entry holds the SSH instructions for a Linux host, or the Remote
  Desktop credentials for a Windows host. Read the name from there; document the
  path to the credential, never the credential itself.
- **Fallback — Tailscale (on Mac).** Tailscale menu in the top toolbar > Network
  Devices > Tagged Devices, then find the machine in the list. You can't
  copy-paste the name from that menu — read it and type it.
- **If an agent with Canopy MCP access is running this:** the device name is
  already in Canopy (`get_server` / `get_group`), so don't make the human hunt
  for it — return the fully-filled `ssh` command. See `../deployment-context.md`
  for the Canopy bootstrap.

## Run the doctor

First thing on any Linux host:

```bash
bestool tamanu doctor
```

Maps to the healthchecks. For meaning and solve, see `../healthchecks.md` and
Canopy's `get_check_documentation`.

## Read logs

```bash
journalctl -fu tamanu-central-api        # a Tamanu service
journalctl -fu caddy -o cat | jq -c '.ts = (.ts | todate)'   # Caddy (UTC)
journalctl -u postgresql                 # Postgres
```

More detail and filtering in `../sops/read-logs.md`.

## Resource usage

```bash
htop            # live CPU / memory / load
df -h           # disk usage per filesystem
df -i           # inode usage (ENOSPC despite free space = inodes)
```

Podman is used for some services; inspect containers with:

```bash
podman ps
podman logs <container>
```

## Restart a single service

Mutating — see `../sops/restart-services.md` for the class and OTS rules.

```bash
sudo systemctl restart tamanu-central-<service>
# or, for the FHIR workers specifically:
sudo systemctl restart tamanu-central-fhir-{refresh,resolve}
```

## Out of scope here (see beyondessential/ops)

- Disk resize / repartition (also see ruled-out actions for the destructive
  variants)
- Database restore from backup
- Snapshots
- AWS console / instance-level changes
