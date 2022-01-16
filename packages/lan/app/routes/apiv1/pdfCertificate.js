import express from 'express';
import asyncHandler from 'express-async-handler';
import pdf from 'html-pdf';
import pdfTemplate from '../../assets/certificateTemplate';

export const pdfCertificate = express.Router();

pdfCertificate.post(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Patient');
    pdf.create(pdfTemplate(req.body), {}).toFile('covid-certificate.pdf', error => {
      if (error) {
        console.log('error!!!', error);
      }

      res.send({});
    });
  }),
);

pdfCertificate.get(
  '/:patientId',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Patient');
    res.sendFile(`${__dirname}/covid-certificate.pdf`);
  }),
);
