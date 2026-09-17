# Runbook: Aspen Fiji post-restart

Steps to bring the Aspen Fiji central server back after a reboot, or when it
shows as unreachable / "Tamanu is currently unavailable". Central host:
`syncba.aspenmedical.com.fj` (Windows). Facilities: Ba, Lautoka.

## Why this is needed

After a reboot, Tailscale and pm2 (which runs Tamanu) tend to come back up under
whichever *Aspen* Windows user is logged in, instead of the BES user. That breaks
BES remote access (Tailscale) and management/visibility of Tamanu (pm2). The
durable fix is to be in a Windows session **as the BES user** before starting
either.

Every action is tagged with its class from the ladder in `../README.md`. Check
`../ruled-out-actions.md` before running anything mutating. The recovery steps
here (Tailscale re-auth, starting pm2, restarting the alerts daemon) are routine
service-restore actions on a single deployment's own host, pre-signed here as
**[approved-mitigation]**; validation is **[diagnose]**.

## 1. Get into Central

Tailscale on Central may be down, so its Tailscale IP may be unreachable
directly.

- RDP into the **Ba** (or Lautoka) facility server first, then RDP from there
  into Central, **or**
- Connect to Central directly via **Anydesk**.

Ensure the Windows session is logged in as the **BES user**, not an Aspen user.
**[diagnose]** (establishing access; no change to Tamanu yet).

## 2. Fix Tailscale **[approved-mitigation]**

> **TODO:** exact working steps to be confirmed from the operator who resolved
> the 2026-07-18 incident, then recorded here.

Symptom: `tailscale status` shows Central offline / "Needs authentication", often
held by an Aspen user (e.g. `ASPENFJ\npadyachi`). Background: Aspen nodes are
meant to appear as `tagged-devices` on the `bes.au` tailnet (owned by the tailnet
tag, not a user, and not subject to key expiry). When Central comes back as a
plain user device it inherits that Aspen user's ownership and will keep needing
re-auth. The re-auth must be done from the BES-user session as a `bes.au`
account; verify `tailscale status` shows the node as `tagged-devices` afterward.

## 3. Start Tamanu (pm2) **[approved-mitigation]**

pm2 does not survive a reboot, and if it was running under another user's session
it stops when that user logs out.

1. Confirm no leftover Tamanu processes: in PowerShell run `Get-Process node` —
   it should return nothing. Stray node processes risk double-running against the
   same database.
2. Open a Command Prompt **as administrator**: search for **cmd** in the Start
   menu, **right-click** it, and choose **Run as administrator**.
3. Start pm2 — the path capitalisation matters, use `C:\Tamanu` (capital T), not
   `C:\tamanu`:

   ```
   cd C:\Tamanu\release-vX.Y.Z
   pm2 start .\pm2.config.cjs
   ```

   Replace `release-vX.Y.Z` with the current release folder.

## 4. Restart the alerts daemon **[approved-mitigation]**

A reboot stops the proactive-alerts service. Restart **bestool-alertd** (visible
as a process in Task Manager) so monitoring and alerting resume.

## 5. Validate **[diagnose]**

Run `bestool tamanu doctor --all` and confirm the key checks pass: tailscale,
tamanu_service, HTTP ping (200), db_connect, and a fresh sync_lookup. Then open
Central in a browser and confirm the **Tamanu login page** loads, not "Tamanu is
currently unavailable".

Note: the `tamanu_service` check may report "pm2 process state indeterminate —
try running elevated" if doctor is not run as the user that owns the pm2
processes. That is a visibility artefact, not the app being down — if HTTP ping
is 200 and sync_lookup is fresh, Tamanu is running.

## Prevention / client-side awareness

In practice this has only ever affected Aspen, so treat it as an Aspen-specific
quirk. Aspen's on-site IT team need awareness of this behaviour, and it should be
shared so whoever is on hand at reboot time knows what to do: after any server
reboot they should **log back in as the BES user** — otherwise Tailscale and pm2
(which runs Tamanu) come up under whichever local/Aspen user is logged in, which
takes down BES remote access and the Tamanu app.
