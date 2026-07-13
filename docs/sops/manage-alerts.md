# SOP: Enable / disable a Tamanu alert

Turn a Tamanu alert on or off. Disabling an alert is **mutating** (it changes
what fires), so it is **[any-OTS]** — get a second pair of eyes and announce it,
because a silently-disabled alert can hide a real problem.

## Disable one alert

Alerts are YAML files in the current release's `alerts` folder. Edit the alert
file and add, at the top:

```yaml
enabled: false
```

Remove that line to re-enable. Make sure you are editing the **latest** release's
alerts folder — check which Tamanu version is current first. To find it:

```
ls `bestool tamanu find -n1`/alerts
```

On Windows the same folder is under
`This PC → Local Disk → Tamanu → <latest release, e.g. release-v2.49.7> → alerts`.

## Disable all alerts

Disable the scheduled task that runs the alerts — that is the most
straightforward way to stop them all at once. **[any-OTS]**.

## Announce it

Post in the `tamanu-alerts-disabled` channel when you disable an alert so others
know it is off, and mark it re-enabled once you turn it back on. Leaving an
alert disabled and unannounced is itself a risk.
