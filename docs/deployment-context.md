# Establishing deployment context

Before investigating any incident, work out **which deployment is affected** and
gather its context. This is where the Canopy-specific detail lives; the generic
Workhorse support skill reads this file to learn how to do it for Tamanu.

All steps here are **[diagnose]** (read-only) unless noted.

## Identify the deployment and read its state via Canopy

Use the Canopy MCP. It is read-only; nothing here mutates anything.

- **`get_server`** — for a single server: its version, per-check health status,
  whether it is a central or facility server, its Tailscale status, and the
  timestamps that let you derive local time (below).
- **`get_group`** — for the deployment as a whole: the central/facility topology
  (which servers belong together), group-level health, and the group `notes`.

From these, establish:

- **Version** — the running Tamanu version(s). Note that the frontend and
  backend can legitimately differ; two API servers on different versions is the
  problem (`version_drift`).
- **Health checks** — which checks are failing and at what severity. Use
  `healthchecks.md` to map a failing check to a deeper runbook, and Canopy's
  `get_check_documentation` for the meaning and solve of each check.
- **Topology** — is this a single-server deployment or central + multiple
  facilities? Which server is central? A facility problem and a central problem
  are investigated differently.
- **Tailscale status** — is the server reachable over Tailscale (the usual path
  in)? See VPN access below.

## Deriving local time (there is no timezone field)

Canopy does **not** store an explicit timezone or operating-hours field for a
deployment. To reason about "is it the middle of the night there" or "is this
inside working hours", derive local time from the **UTC offset**:

- Read the `sync_lookup` check's `last_updated` on the server via `get_server`.
- Compare it against the current UTC time to recover the deployment's local-time
  UTC offset, and use that offset to convert timestamps.

Remember most on-server logs (Caddy in particular) are in **UTC** — convert to
local time using the derived offset before deciding whether a spike lines up
with, say, a clinic opening.

## Per-deployment "known weird things" (Canopy notes)

Deployments carry quirks that are not expressible as structured fields. These
live in Canopy's free-text **`notes`** on the server and on the group. Always
read both:

- Server `notes` (from `get_server`)
- Group `notes` (from `get_group`)

These notes are **read-only via the MCP** — they are authored by operators in the
Canopy web UI. Surface and cite the relevant note when it changes your
investigation; **never attempt to write or update them through the MCP.**

Examples of what lives in notes:

- **SENAITE user override** — at some sites the SENAITE integration user is
  deliberately configured differently. At Palau, the SENAITE integration user is
  set to `mSupply`. A generic "check the integration user is SENAITE" step would
  wrongly flag Palau as broken. Always check the deployment's notes before
  treating an unexpected integration user as a fault.
- **VPN access method** — see below.

## VPN access

Access to a deployment's servers is over a VPN, which is either **Tailscale** or
**Fortinet** depending on the deployment. This is recorded per-deployment in
Canopy notes. Check the notes to know which one to use before trying to connect.

Once on the VPN, on Linux hosts you typically `ssh ubuntu@<server>`; see
`reference/maintain-tamanu-on-linux.md` for the frontline host workflow.

## Deep host procedures

For anything beyond frontline inspection — disk resize, DB restore, snapshots,
AWS-level changes — do **not** improvise on the host. Those procedures live in
`beyondessential/ops`.
