import express from 'express';

import { simpleGet } from '../crudHelpers';

export const invoiceLineTypes = express.Router();

invoiceLineTypes.get('/:id', simpleGet('InvoiceLineType'));
