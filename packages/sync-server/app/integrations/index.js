import express from 'express';
import { fijiRoutes } from './fiji';

export const integrationRoutes = express.Router();
integrationRoutes.use('/fiji', fijiRoutes);
