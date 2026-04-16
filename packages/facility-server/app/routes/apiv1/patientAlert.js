import express from 'express';
import asyncHandler from 'express-async-handler';

export const patientAlert = express.Router();

patientAlert.get(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'PatientAlert');
    const alert = await req.models.PatientAlert.findByPk(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: { message: 'Alert not found' } });
    }
    res.send(alert);
  }),
);

patientAlert.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'PatientAlert');
    const { patientId, status } = req.query;
    const where = {};
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;
    const alerts = await req.models.PatientAlert.findAll({ where });
    res.send({ data: alerts, count: alerts.length });
  }),
);

patientAlert.post(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'PatientAlert');
    const { patientId, alertType, message, severity } = req.body;
    if (!patientId || !alertType || !message) {
      return res.status(400).json({
        error: { message: 'patientId, alertType, and message are required' },
      });
    }
    const alert = await req.models.PatientAlert.create({
      patientId,
      alertType,
      message,
      severity: severity || 'medium',
      createdByUserId: req.user.id,
      status: 'active',
    });
    res.send(alert);
  }),
);

patientAlert.put(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'PatientAlert');
    const alert = await req.models.PatientAlert.findByPk(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: { message: 'Alert not found' } });
    }
    await alert.update(req.body);
    res.send(alert);
  }),
);

patientAlert.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('delete', 'PatientAlert');
    const alert = await req.models.PatientAlert.findByPk(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: { message: 'Alert not found' } });
    }
    await alert.update({ status: 'resolved', resolvedByUserId: req.user.id });
    res.send({ message: 'Alert resolved' });
  }),
);
