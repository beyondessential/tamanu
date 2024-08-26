import express from 'express';
import { taskRoute } from './taskRoute';
export const taskingRoute = express.Router();
taskingRoute.use('/task', taskRoute);
