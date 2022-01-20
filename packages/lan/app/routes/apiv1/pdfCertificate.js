import express from 'express';
import asyncHandler from 'express-async-handler';
import pdf from 'html-pdf';
import pdfTemplate from '../../assets/certificateTemplate';

export const pdfCertificate = express.Router();

pdfCertificate.post(
  '/:patientId',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const { patientId } = params;

    req.checkPermission('read', 'Patient');

    const patient = await models.Patient.findByPk(patientId);
    const data = { patient };

    pdf
      .create(pdfTemplate(data), {
        base: 'file:///Users/tomcaiger/Sites/tamanu/packages/lan/app/',
        localUrlAccess: true,
        width: '216mm',
        height: '279mm',
      })
      .toFile('covid-certificate.pdf', error => {
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
