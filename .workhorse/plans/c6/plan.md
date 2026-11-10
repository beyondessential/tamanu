# Canopy dashboard: product design

Working notes from the design workshop. The dashboard helps support assess deployment health, and in particular whether end users are experiencing slowness.

## Data available

- Browser page-load and API request timings, captured per [BTEL](../../../specs/platform/browser-telemetry.md) (M9, merged).
- Hourly rollups per route and facility, pushed to central (K13): fixed-band histogram plus p50/p95/p99/max, and a capped list of slow events (page loads over 5s, requests over 2s) carrying device and user.
- Canopy's existing healthchecks and incidents.
- System, database, sync, FHIR and report performance are in the PRD but not yet collected; out of scope for the first version.

## Decisions so far

- **Moment of use:** a proactive morning sweep across the fleet. The first screen ranks all deployments.
- **Signals:** browser timings from the K13 rollups, alongside Canopy healthchecks and incidents.
- **Headline:** p95 page load (navigations, not individual requests), computed from merged histograms, so accurate to histogram band width.
- **Ranking:** by absolute p95, slowest first.
- **Facilities:** each deployment row expands to list its facilities.
- **Deployment view:** p95 page load over time. Slowest pages, slow devices and a health timeline were considered and left out.
- **Depth:** no route-level figures or individual slow events in the first version. Detail beyond facility level is investigated on the deployment itself.
- **Window:** defaults to the last 24 hours, adjustable to 7 and 30 days.
- **Low volume:** no special case; every deployment ranks by p95 whatever its page-load count.
- **Trend:** each fleet row carries a 7-day p95 sparkline rather than a change figure.

## Mockups

Two mockups, drawn from Canopy's `private-web` (MUI light theme, `AppSidebar`, `HealthChip`, `RunThroughputChart`):

- **Fleet:** a new Performance section in the sidebar; a small table of groups sorted by p95 page load, each row with Canopy's health chip, a 7-day sparkline and the page-load count, and a row expanding to its facilities.
- **Group:** p95 page load over the window, one line per facility, with the upgrade marked; a table beneath doubles as the legend and carries each facility's p95, page loads and health, with an all-facilities total.

## Assumptions to confirm

- A deployment is a Canopy group, and a facility is a Tamanu facility server in that group, named by its facility.
- The p95 counts clinical web page loads only; the admin panel and patient portal are left out.
- Only production groups are listed.
- A group with more than eight facilities folds the rest into "Other" on the chart, since a categorical palette holds eight lines.
- Sparklines are each scaled to their own row from zero, so they show shape rather than compare rows.
- The dashboard lives in its own Performance section rather than on the group page.

## Open

- How K13's rollups reach Canopy (a healthcheck field on central's report, or a dedicated feed), which decides what Canopy can chart without new storage.
