
import express from 'express';
import swaggerUi from 'swagger-ui-express';
const swaggerDocument = require('./swagger.json');

export const publicRoutes = express.Router();

publicRoutes.use('/api-docs', swaggerUi.serve);
publicRoutes.get('/api-docs', swaggerUi.setup(swaggerDocument));