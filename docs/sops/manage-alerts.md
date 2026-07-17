# SOP: Silence / manage a Tamanu alert

Turn a Tamanu alert off (or back on). Silencing an alert is **mutating** (it
changes what fires and can hide a real problem), so it is **[any-OTS]** — get a
second pair of eyes and announce it.

## Alerting is the Canopy healthchecks model now

Tamanu alerting has moved to the **Canopy healthchecks model**. Alerts are driven
by healthchecks (`get_check_documentation` for what each means and how to solve
it — see `../healthchecks.md`), and are silenced / snoozed **in Canopy**, using
Canopy's own silencing and snoozing controls — not by editing files on the
server. To stop an alert firing, silence or snooze the relevant check in Canopy;
to restore it, remove the silence. Canopy is the single source of truth for which
alerts are active.

## Legacy YAML alerts (pre-Canopy)

The old mechanism — a per-alert YAML file in the current release's `alerts` folder
with `enabled: false` added at the top, or disabling the scheduled task that runs
the alerts — predates the Canopy model. It is **not present in the current Tamanu
source** (there is no alerts-yml runner or `alerts` scheduled task in the
codebase). `[unverified]` whether any live deployment still on a pre-Canopy
version relies on it; treat the YAML mechanism as legacy and prefer Canopy
silencing. If you find a deployment that genuinely still runs YAML alerts,
escalate to confirm the right approach rather than assuming the old edit still
applies.

## Announce it

When you silence an alert, announce it (post in the `tamanu-alerts-disabled`
channel) so others know it is off, and mark it restored once you re-enable it.
Leaving an alert silenced and unannounced is itself a risk.
