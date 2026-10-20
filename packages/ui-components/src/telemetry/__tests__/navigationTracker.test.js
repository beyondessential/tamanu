import { describe, it, expect, beforeEach } from 'vitest';
import { ROOT_CONTEXT } from '@opentelemetry/api';
import { TELEMETRY_SPAN_KINDS, TELEMETRY_NAV_OUTCOMES } from '@tamanu/constants';

import { TelemetryNavigationTracker } from '../navigationTracker';
import { SPAN_ATTR } from '../spanKeys';

const QUIET_MS = 500;
const CAP_MS = 30000;

function makeTracer() {
  const spans = [];
  return {
    spans,
    startSpan(name, _options, ctx) {
      const span = {
        name,
        ctx,
        attributes: {},
        ended: false,
        setAttribute(key, value) {
          this.attributes[key] = value;
        },
        end() {
          this.ended = true;
        },
      };
      spans.push(span);
      return span;
    },
  };
}

function makeTimers() {
  let seq = 0;
  const timers = new Map();
  return {
    scheduleTimer(fn, ms) {
      const id = ++seq;
      timers.set(id, { fn, ms });
      return id;
    },
    cancelTimer(id) {
      timers.delete(id);
    },
    // Fire the pending timer scheduled for this delay (quiet vs cap are distinct).
    fireByMs(ms) {
      for (const [id, timer] of [...timers].reverse()) {
        if (timer.ms === ms) {
          timers.delete(id);
          timer.fn();
          return true;
        }
      }
      return false;
    },
    pendingForMs(ms) {
      return [...timers.values()].filter(t => t.ms === ms).length;
    },
  };
}

function makeTracker(tracer, timers) {
  return new TelemetryNavigationTracker({
    tracer,
    quietWindowMs: QUIET_MS,
    maxDurationMs: CAP_MS,
    getContextAttributes: () => ({
      deviceId: 'web-test',
      appVersion: '0.0.0',
      sessionId: 'session-1',
      userId: 'user-1',
    }),
    scheduleTimer: timers.scheduleTimer.bind(timers),
    cancelTimer: timers.cancelTimer.bind(timers),
  });
}

describe('TelemetryNavigationTracker', () => {
  let tracer;
  let timers;
  let tracker;

  beforeEach(() => {
    tracer = makeTracer();
    timers = makeTimers();
    tracker = makeTracker(tracer, timers);
  });

  it('settles a navigation with no requests after the quiet window', () => {
    tracker.startNavigation('/dashboard', {}, {});
    const [nav] = tracer.spans;
    expect(nav.name).toBe(TELEMETRY_SPAN_KINDS.NAVIGATION);
    expect(nav.ended).toBe(false);

    timers.fireByMs(QUIET_MS);

    expect(nav.ended).toBe(true);
    expect(nav.attributes[SPAN_ATTR.OUTCOME]).toBe(TELEMETRY_NAV_OUTCOMES.SETTLED);
    expect(nav.attributes[SPAN_ATTR.ROUTE]).toBe('/dashboard');
    expect(nav.attributes[SPAN_ATTR.KIND]).toBe(TELEMETRY_SPAN_KINDS.NAVIGATION);
    expect(nav.attributes[SPAN_ATTR.USER_ID]).toBe('user-1');
  });

  it('keeps the navigation open until a foreground request settles', () => {
    tracker.startNavigation('/patients', {}, {});
    const nav = tracer.spans[0];

    tracker.onRequestStart({
      phase: 'start',
      id: 1,
      endpoint: 'patient/abc',
      query: {},
      method: 'GET',
      background: false,
    });
    // network busy — no quiet timer pending, nav still open
    expect(timers.pendingForMs(QUIET_MS)).toBe(0);
    expect(nav.ended).toBe(false);

    tracker.onRequestSettle({ phase: 'settle', id: 1, status: 200 });
    const requestSpan = tracer.spans[1];
    expect(requestSpan.name).toBe(TELEMETRY_SPAN_KINDS.REQUEST);
    expect(requestSpan.ended).toBe(true);
    expect(requestSpan.attributes[SPAN_ATTR.STATUS_CODE]).toBe(200);

    // quiet re-armed once in-flight hits zero
    timers.fireByMs(QUIET_MS);
    expect(nav.ended).toBe(true);
    expect(nav.attributes[SPAN_ATTR.OUTCOME]).toBe(TELEMETRY_NAV_OUTCOMES.SETTLED);
  });

  it('records a request span from the explicit route template when the event carries one', () => {
    tracker.startNavigation('/patients', {}, {});

    // A route() call reaches the sink with the template and its resolved params.
    tracker.onRequestStart({
      phase: 'start',
      id: 1,
      endpoint: 'patient/abc-123/allergies',
      route: 'patient/:patientId/allergies',
      pathParams: { patientId: 'abc-123' },
      query: { order: 'asc' },
      method: 'GET',
      background: false,
    });

    const requestSpan = tracer.spans[1];
    expect(requestSpan.attributes[SPAN_ATTR.ROUTE]).toBe('patient/:patientId/allergies');
    expect(JSON.parse(requestSpan.attributes[SPAN_ATTR.PARAMETERS])).toEqual({
      path: { patientId: 'abc-123' },
      query: { order: 'asc' },
    });
  });

  it('records the raw path for a plain-string endpoint, without inferring params', () => {
    tracker.startNavigation('/patients', {}, {});

    // No route/pathParams on the event — an endpoint not migrated to route(). The
    // collector records the concrete path verbatim rather than guessing which
    // segments are ids.
    tracker.onRequestStart({
      phase: 'start',
      id: 1,
      endpoint: 'patient/7c9e6679-7425-40de-944b-e07fc1f90ae7/allergies',
      query: {},
      method: 'GET',
      background: false,
    });

    const requestSpan = tracer.spans[1];
    expect(requestSpan.attributes[SPAN_ATTR.ROUTE]).toBe(
      'patient/7c9e6679-7425-40de-944b-e07fc1f90ae7/allergies',
    );
    expect(JSON.parse(requestSpan.attributes[SPAN_ATTR.PARAMETERS]).path).toEqual({});
  });

  it('records a request made with no active navigation as a standalone span', () => {
    // No startNavigation() — e.g. a suggester load or form submit after the page
    // has settled, or an idle background poll.
    tracker.onRequestStart({
      phase: 'start',
      id: 1,
      endpoint: 'suggestions/village',
      route: 'suggestions/:category',
      pathParams: { category: 'village' },
      query: { q: 'nas' },
      method: 'GET',
      background: false,
    });

    const requestSpan = tracer.spans[0];
    expect(requestSpan.name).toBe(TELEMETRY_SPAN_KINDS.REQUEST);
    expect(requestSpan.attributes[SPAN_ATTR.ROUTE]).toBe('suggestions/:category');
    expect(requestSpan.attributes[SPAN_ATTR.METHOD]).toBe('GET');
    // Standalone: not parented to a navigation span.
    expect(requestSpan.ctx).toBe(ROOT_CONTEXT);

    tracker.onRequestSettle({ phase: 'settle', id: 1, status: 200 });
    expect(requestSpan.ended).toBe(true);
    expect(requestSpan.attributes[SPAN_ATTR.STATUS_CODE]).toBe(200);
  });

  it('records a standalone request even after its navigation has settled', () => {
    tracker.startNavigation('/patients', {}, {});
    timers.fireByMs(QUIET_MS); // navigation settles, activeNav cleared
    expect(tracer.spans[0].ended).toBe(true);

    // A request that fires afterwards (a form submit) is still captured.
    tracker.onRequestStart({
      phase: 'start',
      id: 9,
      endpoint: 'patient/abc/allergies',
      route: 'patient/:patientId/allergies',
      pathParams: { patientId: 'abc' },
      query: {},
      method: 'POST',
      background: false,
    });
    tracker.onRequestSettle({ phase: 'settle', id: 9, status: 201 });

    const submitSpan = tracer.spans[tracer.spans.length - 1];
    expect(submitSpan.name).toBe(TELEMETRY_SPAN_KINDS.REQUEST);
    expect(submitSpan.attributes[SPAN_ATTR.ROUTE]).toBe('patient/:patientId/allergies');
    expect(submitSpan.ended).toBe(true);
    expect(submitSpan.ctx).toBe(ROOT_CONTEXT);
  });

  it('ignores background requests in the quiet calculation', () => {
    tracker.startNavigation('/tasks', {}, {});
    const nav = tracer.spans[0];

    tracker.onRequestStart({
      phase: 'start',
      id: 2,
      endpoint: 'public/ping',
      query: {},
      method: 'GET',
      background: true,
    });
    // background request did not clear the quiet timer
    timers.fireByMs(QUIET_MS);

    expect(nav.ended).toBe(true);
    expect(nav.attributes[SPAN_ATTR.OUTCOME]).toBe(TELEMETRY_NAV_OUTCOMES.SETTLED);
  });

  it('abandons an in-progress navigation when the next one starts', () => {
    tracker.startNavigation('/patients', {}, {});
    tracker.onRequestStart({
      phase: 'start',
      id: 3,
      endpoint: 'patient/abc',
      query: {},
      method: 'GET',
      background: false,
    });
    const first = tracer.spans[0];

    tracker.startNavigation('/dashboard', {}, {});

    expect(first.ended).toBe(true);
    expect(first.attributes[SPAN_ATTR.OUTCOME]).toBe(TELEMETRY_NAV_OUTCOMES.ABANDONED);
  });

  it('caps a navigation that never goes quiet', () => {
    tracker.startNavigation('/imaging', {}, {});
    const nav = tracer.spans[0];
    tracker.onRequestStart({
      phase: 'start',
      id: 4,
      endpoint: 'imaging/abc',
      query: {},
      method: 'GET',
      background: false,
    });

    timers.fireByMs(CAP_MS);

    expect(nav.ended).toBe(true);
    expect(nav.attributes[SPAN_ATTR.OUTCOME]).toBe(TELEMETRY_NAV_OUTCOMES.CAPPED);
  });
});
