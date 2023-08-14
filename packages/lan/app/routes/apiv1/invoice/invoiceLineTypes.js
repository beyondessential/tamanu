import express from 'express';

import { simpleGet } from 'shared/utils/crudHelpers';

export const invoiceLineTypes = express.Router();

invoiceLineTypes.get('/:id', simpleGet('InvoiceLineType'));
