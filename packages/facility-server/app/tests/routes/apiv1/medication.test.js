import { jest } from '@jest/globals';
import { v4 as uuid } from 'uuid';

// Mock the dateTime functions
jest.mock('@tamanu/utils/dateTime', () => ({
  getCurrentDateTimeString: jest.fn().mockReturnValue('2023-06-01T10:00:00.000Z'),
  calculateEndDate: jest.fn().mockImplementation((startDate, duration, unit) => {
    // Simple mock implementation for testing
    if (unit.toLowerCase() === 'hours') {
      return '2023-06-01T14:00:00.000Z'; // +4 hours for testing
    }
    return '2023-06-02T10:00:00.000Z'; // +1 day for testing
  }),
}));

// Set up request, response, and model mocks
const setupTest = () => {
  const prescriptionId = uuid();
  const encounterId = uuid();
  const encounterPrescriptionId = uuid();
  const pauseId = uuid();
  const userId = uuid();

  // Mock models
  const mockPrescription = {
    id: prescriptionId,
    endDate: '2023-07-01T00:00:00.000Z',
    forResponse: jest.fn().mockReturnValue({ id: prescriptionId }),
  };

  const mockEncounterPrescription = {
    id: encounterPrescriptionId,
    prescriptionId,
    encounterId,
  };

  const mockPauseRecord = {
    id: pauseId,
    encounterPrescriptionId,
    pauseDuration: 4,
    pauseTimeUnit: 'Hours',
    pauseStartDate: '2023-06-01T10:00:00.000Z',
    pauseEndDate: '2023-06-01T14:00:00.000Z',
    notes: 'Test pause',
    pausingClinicianId: userId,
    save: jest.fn().mockResolvedValue(true),
    reload: jest.fn().mockResolvedValue(true),
    forResponse: jest.fn().mockReturnValue({ id: pauseId }),
  };

  // Mock models with findByPk, findOne, etc.
  const mockModels = {
    Prescription: {
      findByPk: jest.fn().mockResolvedValue(mockPrescription),
    },
    EncounterPrescription: {
      findOne: jest.fn().mockResolvedValue(mockEncounterPrescription),
    },
    EncounterPausePrescription: {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockPauseRecord),
      isPrescriptionPaused: jest.fn().mockResolvedValue({ isPaused: false }),
    },
    EncounterPausePrescriptionHistory: {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: uuid() }),
      findAll: jest.fn().mockResolvedValue([]),
    },
  };

  // Mock request, response objects
  const req = {
    params: { id: prescriptionId },
    body: {
      encounterId,
      pauseDuration: 4,
      pauseTimeUnit: 'Hours',
      notes: 'Test pause',
    },
    query: { encounterId },
    models: mockModels,
    user: { id: userId },
    checkPermission: jest.fn(),
  };

  const res = {
    send: jest.fn(),
    status: jest.fn().mockReturnThis(),
  };

  return {
    req,
    res,
    mockModels,
    mockPrescription,
    mockEncounterPrescription,
    mockPauseRecord,
    prescriptionId,
    encounterId,
    encounterPrescriptionId,
    pauseId,
    userId,
  };
};

// Import the endpoint handlers directly to test
import { medication } from '../../../routes/apiv1/medication';

// Find the relevant route handlers
const pauseHandler = medication.stack.find(
  (layer) => layer.route?.path === '/:id/pause' && layer.route?.methods.post,
)?.route?.stack[0]?.handle;
const resumeHandler = medication.stack.find(
  (layer) => layer.route?.path === '/:id/resume' && layer.route?.methods.post,
)?.route?.stack[0]?.handle;
const getPauseHandler = medication.stack.find(
  (layer) => layer.route?.path === '/:id/pause' && layer.route?.methods.get,
)?.route?.stack[0]?.handle;
const getPauseHistoryHandler = medication.stack.find(
  (layer) => layer.route?.path === '/:id/pause-history' && layer.route?.methods.get,
)?.route?.stack[0]?.handle;

describe('Medication Pause Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /:id/pause', () => {
    it('should successfully pause a medication', async () => {
      const { req, res, mockModels } = setupTest();

      // Set up specific mock behavior for this test
      mockModels.EncounterPausePrescription.isPrescriptionPaused.mockResolvedValue({
        isPaused: false,
      });

      await pauseHandler(req, res);

      // Verify the function was called with the correct parameters
      expect(mockModels.Prescription.findByPk).toHaveBeenCalledWith(req.params.id);
      expect(mockModels.EncounterPrescription.findOne).toHaveBeenCalledWith({
        where: {
          prescriptionId: req.params.id,
          encounterId: req.body.encounterId,
        },
      });
      expect(mockModels.EncounterPausePrescription.isPrescriptionPaused).toHaveBeenCalledWith(
        req.params.id,
      );
      expect(mockModels.EncounterPausePrescription.create).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalled();
    });

    it('should reject when validation fails', async () => {
      const { req, res } = setupTest();

      // Invalid input for testing validation
      req.body.pauseDuration = -1; // Invalid negative duration

      // Expect function to throw
      await expect(pauseHandler(req, res)).rejects.toThrow(/Validation error/);
    });

    it('should reject when prescription not found', async () => {
      const { req, res, mockModels } = setupTest();

      // Prescription not found
      mockModels.Prescription.findByPk.mockResolvedValue(null);

      // Expect function to throw
      await expect(pauseHandler(req, res)).rejects.toThrow(/not found/);
    });

    it('should reject when encounter prescription link not found', async () => {
      const { req, res, mockModels } = setupTest();

      // Encounter prescription link not found
      mockModels.EncounterPrescription.findOne.mockResolvedValue(null);

      // Expect function to throw
      await expect(pauseHandler(req, res)).rejects.toThrow(/not associated/);
    });

    it('should reject when medication is already paused', async () => {
      const { req, res, mockModels } = setupTest();

      // Medication already paused
      mockModels.EncounterPausePrescription.isPrescriptionPaused.mockResolvedValue({
        isPaused: true,
      });

      // Expect function to throw
      await expect(pauseHandler(req, res)).rejects.toThrow(/already paused/);
    });

    it('should reject when pause extends beyond medication end date', async () => {
      const { req, res, mockPrescription } = setupTest();

      // Set up mock to simulate pause extending beyond end date
      mockPrescription.endDate = '2023-06-01T12:00:00.000Z'; // Before our mock pause end date

      // Expect function to throw
      await expect(pauseHandler(req, res)).rejects.toThrow(/extends beyond/);
    });
  });

  describe('POST /:id/resume', () => {
    it('should successfully resume a paused medication', async () => {
      const { req, res, mockModels, mockPauseRecord } = setupTest();

      // Set up specific mock behavior for this test
      mockModels.EncounterPausePrescription.isPrescriptionPaused.mockResolvedValue({
        isPaused: true,
        pauseData: mockPauseRecord,
      });

      await resumeHandler(req, res);

      // Verify the function was called with the correct parameters
      expect(mockModels.Prescription.findByPk).toHaveBeenCalledWith(req.params.id);
      expect(mockModels.EncounterPrescription.findOne).toHaveBeenCalledWith({
        where: {
          prescriptionId: req.params.id,
          encounterId: req.body.encounterId,
        },
      });
      expect(mockModels.EncounterPausePrescription.isPrescriptionPaused).toHaveBeenCalledWith(
        req.params.id,
      );
      expect(mockPauseRecord.save).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalled();
    });

    it('should reject when medication is not paused', async () => {
      const { req, res, mockModels } = setupTest();

      // Medication not paused
      mockModels.EncounterPausePrescription.isPrescriptionPaused.mockResolvedValue({
        isPaused: false,
      });

      // Expect function to throw
      await expect(resumeHandler(req, res)).rejects.toThrow(/not currently paused/);
    });
  });

  describe('GET /:id/pause', () => {
    it('should return active pause information', async () => {
      const { req, res, mockModels, mockPauseRecord } = setupTest();

      // Set up specific mock behavior for this test
      mockModels.EncounterPausePrescription.isPrescriptionPaused.mockResolvedValue({
        isPaused: true,
        pauseData: mockPauseRecord,
      });

      // Set encounterPrescriptionId to match the encountered one for the if check
      mockPauseRecord.encounterPrescriptionId = req.body.encounterId;

      await getPauseHandler(req, res);

      // Verify results
      expect(mockModels.Prescription.findByPk).toHaveBeenCalledWith(req.params.id);
      expect(mockModels.EncounterPrescription.findOne).toHaveBeenCalled();
      expect(mockModels.EncounterPausePrescription.isPrescriptionPaused).toHaveBeenCalledWith(
        req.params.id,
      );
      expect(mockPauseRecord.reload).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalled();
    });

    it('should return null when medication is not paused', async () => {
      const { req, res, mockModels } = setupTest();

      // Medication not paused
      mockModels.EncounterPausePrescription.isPrescriptionPaused.mockResolvedValue({
        isPaused: false,
      });

      await getPauseHandler(req, res);

      // Verify results
      expect(res.send).toHaveBeenCalledWith(null);
    });
  });

  describe('GET /:id/pause-history', () => {
    it('should return pause history for a medication', async () => {
      const { req, res, mockModels } = setupTest();

      // Mock history records
      const historyRecords = [
        {
          id: uuid(),
          action: 'pause',
          actionDate: '2023-06-01T10:00:00.000Z',
          forResponse: jest.fn().mockReturnValue({}),
        },
        {
          id: uuid(),
          action: 'resume',
          actionDate: '2023-06-01T14:00:00.000Z',
          forResponse: jest.fn().mockReturnValue({}),
        },
      ];
      mockModels.EncounterPausePrescriptionHistory.findAll.mockResolvedValue(historyRecords);

      await getPauseHistoryHandler(req, res);

      // Verify results
      expect(mockModels.Prescription.findByPk).toHaveBeenCalledWith(req.params.id);
      expect(mockModels.EncounterPrescription.findOne).toHaveBeenCalled();
      expect(mockModels.EncounterPausePrescriptionHistory.findAll).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith({
        count: historyRecords.length,
        data: expect.any(Array),
      });
    });

    it('should return empty array when no history exists', async () => {
      const { req, res, mockModels } = setupTest();

      // No encounter prescription link
      mockModels.EncounterPrescription.findOne.mockResolvedValue(null);

      await getPauseHistoryHandler(req, res);

      // Verify results
      expect(res.send).toHaveBeenCalledWith({
        count: 0,
        data: [],
      });
    });
  });
});
