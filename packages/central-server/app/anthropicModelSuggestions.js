import asyncHandler from 'express-async-handler';
import express from 'express';

import { log } from '@tamanu/shared/services/logging';
import { getSettingSecret, SecretNotConfiguredError } from '@tamanu/shared/utils/crypto';

const MODELS_URL = 'https://api.anthropic.com/v1/models';
const ANTHROPIC_VERSION = '2023-06-01';
const CACHE_TTL_MS = 10 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10 * 1000;

export const anthropicModelSuggestions = express.Router();

let cache = null;

// The API key is a secret setting, so the model list is fetched here rather than
// from the browser. An unconfigured or rejected key yields an empty list: an
// admin filling in this category may not have saved the key yet.
const loadModels = async settings => {
  let apiKey;
  try {
    apiKey = await getSettingSecret(settings, 'ai.anthropicApiKey');
  } catch (error) {
    if (error instanceof SecretNotConfiguredError) return [];
    throw error;
  }
  if (!apiKey) return [];

  let response;
  try {
    response = await fetch(MODELS_URL, {
      headers: { 'x-api-key': apiKey, 'anthropic-version': ANTHROPIC_VERSION },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    log.warn(`anthropicModel suggester: model list unreachable: ${error.message}`);
    return [];
  }

  if (!response.ok) {
    log.warn(`anthropicModel suggester: model list request failed with ${response.status}`);
    return [];
  }

  const body = await response.json();
  return (body.data ?? []).map(({ id, display_name: displayName, capabilities }) => ({
    id,
    name: displayName ?? id,
    supportsVision: Boolean(
      capabilities?.image_input?.supported && capabilities?.pdf_input?.supported,
    ),
  }));
};

// The pending request is cached, not its result, so concurrent requests share
// one call. An empty result is never kept: the admin may be saving the key right
// now, and should not wait out the TTL to see the list appear.
const fetchModels = settings => {
  if (cache && cache.expiresAt > Date.now()) return cache.models;

  const models = loadModels(settings);
  cache = { models, expiresAt: Date.now() + CACHE_TTL_MS };
  models
    .then(loaded => {
      if (loaded.length === 0) cache = null;
    })
    .catch(() => {
      cache = null;
    });
  return models;
};

const listRoute = eligible =>
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Setting');
    const models = (await fetchModels(req.settings)).filter(eligible);
    const search = (req.query.q || '').trim().toLowerCase();
    const matching = search
      ? models.filter(
          ({ id, name }) => id.toLowerCase().includes(search) || name.toLowerCase().includes(search),
        )
      : models;
    res.send(matching.map(({ id, name }) => ({ id, name })));
  });

// Lookup is never filtered: a saved model has to render as itself even once it
// stops being offered, or the field appears empty and the admin overwrites it.
const lookupRoute = asyncHandler(async (req, res) => {
  req.checkPermission('read', 'Setting');
  const models = await fetchModels(req.settings);
  const model = models.find(({ id }) => id === req.params.id);
  res.send(model ? { id: model.id, name: model.name } : { id: req.params.id, name: req.params.id });
});

anthropicModelSuggestions.get('/anthropicModel', listRoute(() => true));
anthropicModelSuggestions.get('/anthropicModel/:id', lookupRoute);

// The fast model serves the form builder's image context, so it has to read
// images and PDFs; a model that can't would fail only at the point of use.
anthropicModelSuggestions.get(
  '/anthropicVisionModel',
  listRoute(({ supportsVision }) => supportsVision),
);
anthropicModelSuggestions.get('/anthropicVisionModel/:id', lookupRoute);

export const clearAnthropicModelCache = () => {
  cache = null;
};
