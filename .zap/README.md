# DAST (OWASP ZAP) scanning

The `DAST` workflow (`.github/workflows/ci-dast.yml`) runs OWASP ZAP **full
active scans** against a throwaway central + facility stack stood up in CI.

A full active scan sends real attack payloads (injection, traversal, etc.) and
can mutate or destroy data, so it only ever runs against the disposable CI
database — never a real deployment.

## When it runs

Opt-in on PRs by ticking **Run DAST scan** (`#dast`) in the PR body, and on
every merge-queue run.

The `dast-required` job exposes a single stable check name (**DAST Required**)
that can be marked required in branch protection to block merges on a failing
scan.

## What it scans

A matrix of four scans:

| Target | Port | Auth | Why |
|--------|------|------|-----|
| facility API | 4000 | authenticated | Facility servers are usually LAN-only; authed coverage is the priority |
| facility API | 4000 | unauthenticated | Cheap anonymous-surface signal |
| central API | 3000 | authenticated | |
| central API | 3000 | unauthenticated | Central is often internet-exposed, so the anonymous-attacker view matters most |

Authenticated scans log in as the provisioned `admin@tamanu.io` user and inject
the JWT on every request via a ZAP `replacer` rule. Facility tokens are scoped
via `setFacility`; central uses the login token directly (central's
`setFacility` doesn't reissue a token).

## Gating and false positives

Each scan runs with `fail_action: true`: any alert that isn't ignored fails that
matrix job. Suppress confirmed false positives (and low/informational noise) in
[`rules.tsv`](./rules.tsv) by setting the alert's plugin ID to `IGNORE` with a
comment. The low-severity/informational passive rules are already ignored there
to approximate "block on medium/high only".

After a failing run, download the per-scan **`zap-dast-report-<name>`** artifact
to see each alert's plugin ID and decide whether to fix it or ignore it.

## Running locally

Stand up the stack the same way CI does (see `.github/scripts/e2e-test-setup.sh`),
then run the packaged scan against a server. For example, the facility API:

```bash
TOKEN=...  # mint via POST /api/login then POST /api/setFacility
docker run --rm -v "$(pwd)/.zap:/zap/wrk/.zap" --network host \
  ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py \
  -t http://localhost:4000 \
  -c .zap/rules.tsv \
  -z "-config replacer.full_list(0).description=authheader \
      -config replacer.full_list(0).enabled=true \
      -config replacer.full_list(0).matchtype=REQ_HEADER \
      -config replacer.full_list(0).matchstr=Authorization \
      -config replacer.full_list(0).regex=false \
      -config 'replacer.full_list(0).replacement=Bearer ${TOKEN}'"
```

## Known limitations / follow-ups

- **Endpoint discovery depth.** A REST API has no HTML links for the traditional
  spider to follow, so active-scan coverage is bounded by what ZAP discovers
  from the API root. For deeper coverage, export an OpenAPI/Swagger spec and
  switch to `zaproxy/action-api-scan`, or seed a ZAP context with the routes the
  web/mobile clients use.
