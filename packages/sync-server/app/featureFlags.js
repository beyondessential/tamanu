import config from 'config';
import express from 'express';
import asyncHandler from 'express-async-handler';

// in the future this might do asychronous work, so we're returning a promise
export const getFeatureFlags = () => Promise.resolve(config.featureFlags.data);
