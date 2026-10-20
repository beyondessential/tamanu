import asyncHandler from 'express-async-handler';

// TEMPORARY (spec: BTEL) — artificial per-request latency for validating browser
// performance telemetry on preview deployments. Gated on the global
// `chaos.requestDelayMs` setting (default 0 = off), so it is inert unless switched
// on via settings. Applies to every request that has a settings reader, slowing
// reads and writes alike so page-load and request timings in the telemetry reflect
// a sluggish-feeling app. REMOVE before this card merges.
//
// `req.settings` differs by server: a facility reader is keyed by facility id and
// also carries a `.global` reader; a central reader is a single reader. Both serve
// global settings, so read through `.global` when present, else the reader itself.
export const chaosDelayMiddleware = asyncHandler(async (req, _res, next) => {
  const reader = req.settings?.global ?? req.settings;
  const delayMs = (await reader?.get?.('chaos.requestDelayMs')) ?? 0;
  if (delayMs > 0) {
    await new Promise(resolve => {
      setTimeout(resolve, delayMs);
    });
  }
  next();
});
