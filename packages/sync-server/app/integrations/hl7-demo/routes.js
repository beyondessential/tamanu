import swaggerUi from 'swagger-ui-express';
const swaggerDocument = require('./api-doc/swagger.json');
import * as fijiVPS from '../fiji-vps';
export const publicRoutes = fijiVPS.routes;
publicRoutes.use('/api-docs', swaggerUi.serve);
publicRoutes.get('/api-docs', swaggerUi.setup(swaggerDocument));