import express from 'express';
import asyncHandler from 'express-async-handler';
import { findSuggestions } from '@tamanu/shared/utils';

export const suggestionRoutes = express.Router();

suggestionRoutes.get(
  '/facility',
  asyncHandler(async (req, res) => {
    const { models } = req.store;
    const searchTerm = req.query.q || '';
    const searchQuery = searchTerm.trim().toLowerCase();
    const facilities = await findSuggestions(models.Facility, searchQuery);
    res.send(facilities.map(({ id, name, code }) => ({ id, name, code })));
  }),
);
