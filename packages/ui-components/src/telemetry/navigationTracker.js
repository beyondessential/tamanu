import { trace, ROOT_CONTEXT } from '@opentelemetry/api';
import { TELEMETRY_SPAN_KINDS, TELEMETRY_NAV_OUTCOMES } from '@tamanu/constants';

import { SPAN_ATTR } from './spanKeys';

// spec: BTEL
// Drives the OpenTelemetry spans for browser performance telemetry. One
// navigation is a root span whose duration is the page-load time, measured by
// the network-quiet heuristic; each API request issued during it is a child
// span. The timing logic lives here (OTel has no concept of SPA navigations),
// while span creation/export is delegated to the injected tracer so this can be
// unit-tested with a stub tracer and fake timers.
export class TelemetryNavigationTracker {
  constructor({
    tracer,
    getContextAttributes,
    quietWindowMs = 500,
    maxDurationMs = 30000,
    scheduleTimer = (fn, ms) => setTimeout(fn, ms),
    cancelTimer = id => clearTimeout(id),
  }) {
    this.tracer = tracer;
    this.getContextAttributes = getContextAttributes;
    this.quietWindowMs = quietWindowMs;
    this.maxDurationMs = maxDurationMs;
    this.scheduleTimer = scheduleTimer;
    this.cancelTimer = cancelTimer;

    this.activeNav = null;
    this.navSeq = 0;
    // id (from the api-client sink) -> { span, background, navId }
    this.requestSpans = new Map();
  }

  // Shared context (device, user, version, session) is read fresh per span so a
  // sign-in part-way through a session is reflected from that point. The interface
  // is not sent — the ingest endpoint stamps it server-side.
  #applyContext(span, attributes) {
    const context = this.getContextAttributes?.() ?? {};
    span.setAttribute(SPAN_ATTR.DEVICE_ID, context.deviceId);
    span.setAttribute(SPAN_ATTR.APP_VERSION, context.appVersion);
    if (context.sessionId) span.setAttribute(SPAN_ATTR.SESSION_ID, context.sessionId);
    if (context.userId) span.setAttribute(SPAN_ATTR.USER_ID, context.userId);
    for (const [key, value] of Object.entries(attributes)) {
      if (value === undefined || value === null) continue;
      span.setAttribute(key, value);
    }
  }

  /** Start timing a navigation to `route` with its resolved path params (and any query). */
  startNavigation(route, pathParams = {}, query = {}) {
    // A navigation that is still in progress when the next one begins is abandoned.
    if (this.activeNav && !this.activeNav.ended) {
      this.#endNavigation(TELEMETRY_NAV_OUTCOMES.ABANDONED);
    }

    const span = this.tracer.startSpan(TELEMETRY_SPAN_KINDS.NAVIGATION);
    this.navSeq += 1;
    const navId = this.navSeq;
    this.activeNav = { span, navId, inFlight: 0, ended: false, quietTimer: null, capTimer: null };

    this.#applyContext(span, {
      [SPAN_ATTR.KIND]: TELEMETRY_SPAN_KINDS.NAVIGATION,
      [SPAN_ATTR.ROUTE]: route,
      [SPAN_ATTR.PARAMETERS]: JSON.stringify({ path: pathParams, query }),
    });

    // Cap backstop, and start the quiet window immediately so a page that makes
    // no requests still settles.
    this.activeNav.capTimer = this.scheduleTimer(
      () => this.#endNavigation(TELEMETRY_NAV_OUTCOMES.CAPPED),
      this.maxDurationMs,
    );
    this.#armQuiet();
  }

  /** Called on the api-client `start` edge. */
  onRequestStart(event) {
    // Every request is timed. One issued during a navigation is parented to it (so
    // the page-load trace holds its requests); one issued outside a navigation — a
    // suggester load, a form submit, an idle poll — is recorded as a standalone
    // request span (its own trace, no parent) so slow endpoints are still captured.
    const nav = this.activeNav && !this.activeNav.ended ? this.activeNav : null;

    // The route template and params come from the api-client's route() call. A
    // call site still passing a plain string has no template to group by, so its
    // concrete path is recorded as-is — the client never guesses which segments
    // are parameters.
    const route = event.route ?? event.endpoint;
    const pathParams = event.pathParams ?? {};
    const parentContext = nav ? trace.setSpan(ROOT_CONTEXT, nav.span) : ROOT_CONTEXT;
    const span = this.tracer.startSpan(TELEMETRY_SPAN_KINDS.REQUEST, {}, parentContext);
    this.#applyContext(span, {
      [SPAN_ATTR.KIND]: TELEMETRY_SPAN_KINDS.REQUEST,
      [SPAN_ATTR.ROUTE]: route,
      [SPAN_ATTR.PARAMETERS]: JSON.stringify({ path: pathParams, query: event.query ?? {} }),
      [SPAN_ATTR.METHOD]: event.method,
    });
    this.requestSpans.set(event.id, {
      span,
      background: event.background,
      navId: nav?.navId ?? null,
    });

    // Only a foreground request belonging to the active navigation gates its
    // network-quiet; standalone and background requests do not.
    if (nav && !event.background) {
      nav.inFlight += 1;
      this.#clearQuiet();
    }
  }

  /** Called on the api-client `settle` edge. */
  onRequestSettle(event) {
    const entry = this.requestSpans.get(event.id);
    if (!entry) return;
    this.requestSpans.delete(event.id);

    if (event.status !== null && event.status !== undefined) {
      entry.span.setAttribute(SPAN_ATTR.STATUS_CODE, event.status);
    }
    entry.span.end();

    const nav = this.activeNav;
    if (!entry.background && nav && !nav.ended && entry.navId === nav.navId) {
      nav.inFlight = Math.max(0, nav.inFlight - 1);
      if (nav.inFlight === 0) this.#armQuiet();
    }
  }

  #armQuiet() {
    this.#clearQuiet();
    if (!this.activeNav) return;
    this.activeNav.quietTimer = this.scheduleTimer(
      () => this.#endNavigation(TELEMETRY_NAV_OUTCOMES.SETTLED),
      this.quietWindowMs,
    );
  }

  #clearQuiet() {
    if (this.activeNav?.quietTimer) {
      this.cancelTimer(this.activeNav.quietTimer);
      this.activeNav.quietTimer = null;
    }
  }

  #endNavigation(outcome) {
    const nav = this.activeNav;
    if (!nav || nav.ended) return;
    nav.ended = true;
    this.#clearQuiet();
    if (nav.capTimer) this.cancelTimer(nav.capTimer);

    // End any foreground request spans still open under this navigation so they
    // aren't leaked; background (polling) spans are left to end on their own.
    for (const [id, entry] of this.requestSpans) {
      if (entry.navId === nav.navId && !entry.background) {
        entry.span.end();
        this.requestSpans.delete(id);
      }
    }

    nav.span.setAttribute(SPAN_ATTR.OUTCOME, outcome);
    nav.span.end();
    this.activeNav = null;
  }
}
