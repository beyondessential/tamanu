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

## Open

- Canopy's visual language for mockups. Canopy is not in this repository, so a capture of an existing Canopy page is needed for mockups to match it.
