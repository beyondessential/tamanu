import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
//import options from './swagger.json'

export const publicRoutes = express.Router();
const options = {
    "definition": {
      "openapi": "3.0.0",
      "info": {
        "title": "Tamanu HL7 Demo API",
        "version": "0.1.0",
        "description":
          "This is a sample public API using the same underlying data structures intended to be compliant with HL7 FHIR https://www.hl7.org/fhir/",
        "license": {
          "name": "TAMANU OPEN SOURCE LICENCE - LOW INCOME AND MIDDLE INCOME ECONOMIES",
          "url": "https://github.com/beyondessential/tamanu/blob/dev/license"
        },
        "contact": {
          "name": "Kurt Johnson",
          "url": "https://www.beyondessential.com.au/products/tamanu/",
          "email": "kurt@beyondessential.com.au"
        }
      },
      "servers": [
        {
          "url": "http://localhost:3000/v1/public/integration/hl7Demo"
        }
      ]
    },
    "apis": ["./routes/patients.js"]
};
  
  const specs = swaggerJsdoc(options);
  publicRoutes.use('/api-docs', swaggerUi.serve);
  publicRoutes.get('/api-docs', swaggerUi.setup(specs));