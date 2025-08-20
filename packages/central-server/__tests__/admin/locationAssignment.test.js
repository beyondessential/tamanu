import { REPEAT_FREQUENCY, LOCATION_ASSIGNMENT_STATUS } from '@tamanu/constants';
import { createTestContext } from '../utilities';
import { fake } from '@tamanu/fake-data/fake';
import { toDateString } from '@tamanu/utils/dateTime';
import { addDays, addWeeks, addMonths, getISODay, parseISO } from 'date-fns';
import { generateFrequencyDates, getWeekdayOrdinalPosition } from '@tamanu/utils/appointmentScheduling';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

describe('Location Assignment API', () => {
  let ctx;
  let models;
  let baseApp;
  let adminApp;
  let testUser;
  let testLocation;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
    adminApp = await baseApp.asRole('admin');

    // Create the facility if it doesn't exist (needed for settings seeding)
    const [facility] = await models.Facility.findOrCreate({
      where: { id: 'facility-1' },
      defaults: {
        id: 'facility-1',
        code: 'facility-1',
        name: 'facility-1',
      },
    });

    testLocation = await models.Location.create({
      ...fake(models.Location),
      facilityId: facility.id,
    });
    testUser = await models.User.create({
      ...fake(models.User),
      id: uuidv4(),
    });
  });

  afterEach(async () => {
    await models.LocationAssignmentTemplate.truncate();
    await models.LocationAssignment.truncate();
    await models.UserLeave.truncate();
  });

  afterAll(async () => {
    await ctx.close();
  });

  describe('Create location assignments', () => {
    it('Should create a non-repeating location assignment', async () => {
      const { LocationAssignment } = models;
      const startDate = toDateString(new Date());
  
      const result = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: startDate,
        startTime: '09:00',
        endTime: '10:00',
      });
  
      expect(result).toHaveSucceeded();
  
      // Verify the assignment is created with correct data
      const createdAssignment = await LocationAssignment.findOne({
        where: {
          userId: testUser.id,
          locationId: testLocation.id,
          date: startDate,
        },
      });
  
      expect(createdAssignment).toBeTruthy();
      expect(createdAssignment.userId).toEqual(testUser.id);
      expect(createdAssignment.locationId).toEqual(testLocation.id);
      expect(createdAssignment.date).toEqual(startDate);
      expect(createdAssignment.startTime.startsWith('09:00')).toBe(true);
      expect(createdAssignment.endTime.startsWith('10:00')).toBe(true);
      expect(createdAssignment.status).toEqual(LOCATION_ASSIGNMENT_STATUS.ACTIVE);
      expect(createdAssignment.templateId).toBeNull();
    });
  
    it('Should create a weekly repeating assignment', async () => {
      const { LocationAssignment, LocationAssignmentTemplate } = models;
      const startDate = toDateString(new Date());
      const endDate = toDateString(addWeeks(new Date(), 10));
  
      const result = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: startDate,
        startTime: '10:00',
        endTime: '11:00',
        isRepeating: true,
        repeatFrequency: 1,
        repeatUnit: REPEAT_FREQUENCY.WEEKLY,
        repeatEndDate: endDate,
      });
  
      expect(result).toHaveSucceeded();
  
      const createdTemplate = await LocationAssignmentTemplate.findOne({
        where: {
          userId: testUser.id,
          locationId: testLocation.id,
          date: startDate,
        },
      });
  
      expect(createdTemplate).toBeTruthy();
      expect(createdTemplate.userId).toEqual(testUser.id);
      expect(createdTemplate.locationId).toEqual(testLocation.id);
      expect(createdTemplate.date).toEqual(startDate);
      expect(createdTemplate.startTime.startsWith('10:00')).toBe(true);
      expect(createdTemplate.endTime.startsWith('11:00')).toBe(true);
      expect(createdTemplate.repeatFrequency).toEqual(1);
      expect(createdTemplate.repeatUnit).toEqual(REPEAT_FREQUENCY.WEEKLY);
      expect(createdTemplate.repeatEndDate).toEqual(endDate);
  
      const generatedAssignments = await LocationAssignment.findAll({
        where: {
          templateId: createdTemplate.id,
        },
        order: [['date', 'ASC']],
      });
  
      expect(generatedAssignments.length).toBeGreaterThan(0);
      
      const expectedDow = getISODay(parseISO(startDate));
      generatedAssignments.forEach(assignment => {
        const assignmentDow = getISODay(parseISO(assignment.date));
  
        expect(assignment.userId).toEqual(testUser.id);
        expect(assignment.locationId).toEqual(testLocation.id);
        expect(assignmentDow).toEqual(expectedDow);
        expect(assignment.startTime.startsWith('10:00')).toBe(true);
        expect(assignment.endTime.startsWith('11:00')).toBe(true);
      });
    });
  
    it('Should create a monthly repeating assignment', async () => {
      const { LocationAssignment, LocationAssignmentTemplate } = models;
      const startDate = toDateString(new Date());
      const endDate = toDateString(addMonths(new Date(), 10)); // 3 months from now
  
      const result = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: startDate,
        startTime: '11:00',
        endTime: '12:00',
        isRepeating: true,
        repeatFrequency: 1,
        repeatUnit: REPEAT_FREQUENCY.MONTHLY,
        repeatEndDate: endDate,
      });
  
      expect(result).toHaveSucceeded();
  
      const createdTemplate = await LocationAssignmentTemplate.findOne({
        where: {
          userId: testUser.id,
          locationId: testLocation.id,
          date: startDate,
          repeatUnit: REPEAT_FREQUENCY.MONTHLY,
        },
      });
  
      expect(createdTemplate).toBeTruthy();
      expect(createdTemplate.repeatUnit).toEqual(REPEAT_FREQUENCY.MONTHLY);
      expect(createdTemplate.repeatEndDate).toEqual(endDate);
  
      const generatedAssignments = await LocationAssignment.findAll({
        where: {
          templateId: createdTemplate.id,
        },
        order: [['date', 'ASC']],
      });
  
      expect(generatedAssignments.length).toBeGreaterThan(0);
      
      // Verify the assignments are created with the correct day of week and ordinal position
      const expectedDow = getISODay(parseISO(startDate));
      const expectedOrdinalPosition = getWeekdayOrdinalPosition(parseISO(startDate));
      generatedAssignments.forEach(assignment => {
        const assignmentDow = getISODay(parseISO(assignment.date));
        const assignmentOrdinalPosition = getWeekdayOrdinalPosition(parseISO(assignment.date));
  
        expect(assignmentDow).toEqual(expectedDow);
        expect(assignmentOrdinalPosition).toEqual(expectedOrdinalPosition);
      });
    });
  
    it('Should create repeating assignment without explicit end date', async () => {
      const { LocationAssignment, LocationAssignmentTemplate } = models;
      const startDate = toDateString(new Date());
  
      const result = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: startDate,
        startTime: '12:00',
        endTime: '13:00',
        isRepeating: true,
        repeatFrequency: 2,
        repeatUnit: REPEAT_FREQUENCY.WEEKLY,
      });
  
      expect(result).toHaveSucceeded();
  
      const createdTemplate = await LocationAssignmentTemplate.findOne({
        where: {
          userId: testUser.id,
          locationId: testLocation.id,
          date: startDate,
          repeatFrequency: 2,
          repeatUnit: REPEAT_FREQUENCY.WEEKLY,
        },
      });
  
      expect(createdTemplate).toBeTruthy();
      expect(createdTemplate.repeatFrequency).toEqual(2);
      expect(createdTemplate.repeatUnit).toEqual(REPEAT_FREQUENCY.WEEKLY);
      expect(createdTemplate.repeatEndDate).toBeNull();
  
      const generatedAssignments = await LocationAssignment.findAll({
        where: {
          templateId: createdTemplate.id,
        },
      });
  
      expect(generatedAssignments.length).toBeGreaterThan(0);
    });
  
    it('Should reject when assign to non-existent user', async () => {
      const tomorrow = toDateString(addDays(new Date(), 1));
      const nonExistentUserId = uuidv4();
  
      const result = await adminApp.post('/api/admin/location-assignments').send({
        userId: nonExistentUserId,
        locationId: testLocation.id,
        date: tomorrow,
        startTime: '17:00',
        endTime: '18:00',
      });
  
      expect(result).toHaveRequestError(404);
    });
  
    it('Should reject when create assignment for non-existent location', async () => {
      const tomorrow = toDateString(addDays(new Date(), 1));
      const nonExistentLocationId = 'non-existent-location-id';
  
      const result = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: nonExistentLocationId,
        date: tomorrow,
        startTime: '09:00',
        endTime: '17:00',
      });
  
      expect(result).toHaveRequestError(404);
    });
  });

  describe('Get location assignments', () => {
    it('Should get a list of location assignments by date range', async () => {
      const today = toDateString(new Date());
      const nextMonth = toDateString(addDays(new Date(), 30));
      const after = today;
      const before = nextMonth;

      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: today,
        startTime: '10:00',
        endTime: '11:00',
        isRepeating: true,
        repeatFrequency: 1,
        repeatUnit: REPEAT_FREQUENCY.WEEKLY,
        repeatEndDate: toDateString(addWeeks(new Date(), 10)),
      });
      
      const result = await adminApp.get(`/api/admin/location-assignments?after=${after}&before=${before}`);
      
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveProperty('count');
      expect(result.body).toHaveProperty('data');
      expect(result.body.data.length).toBeGreaterThan(0);
      
      // Verify the returned assignments are within the date range
      result.body.data.forEach(assignment => {
        expect(assignment.date >= after).toBe(true);
        expect(assignment.date <= before).toBe(true);
        expect(assignment.status).toEqual(LOCATION_ASSIGNMENT_STATUS.ACTIVE);
      });
  
      //Verify included relationships
      const firstAssignment = result.body.data[0];
      expect(firstAssignment).toHaveProperty('user');
      expect(firstAssignment.user).toHaveProperty('id', testUser.id);
      expect(firstAssignment.user).toHaveProperty('displayName');
      
      expect(firstAssignment).toHaveProperty('location');
      expect(firstAssignment.location).toHaveProperty('id', testLocation.id);
      expect(firstAssignment.location).toHaveProperty('name');
    });

    it('Should not get repeating assignments overlapping with user leaves', async () => {
      const { UserLeave } = models;

      const startDate = toDateString(new Date());
      const endDate = toDateString(addDays(new Date(), 30));

      await UserLeave.create({
        userId: testUser.id,
        startDate,
        endDate,
        scheduledBy: testUser.id,
        scheduledAt: toDateString(new Date()),
      });

      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: startDate,
        startTime: '13:00',
        endTime: '14:00',
        isRepeating: true,
        repeatFrequency: 1,
        repeatUnit: REPEAT_FREQUENCY.WEEKLY,
        repeatEndDate: toDateString(addWeeks(new Date(), 10)),
      });

      const result = await adminApp.get(`/api/admin/location-assignments?after=${startDate}&before=${endDate}`);

      expect(result).toHaveSucceeded();
      expect(result.body.data.length).toBe(0);
    });
  });

  describe('Check overlap with existing assignments', () => {
    it('Should reject when new assignments overlap with existing assignments', async () => {
      // Create an existing single assignment
      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: toDateString(new Date()),
        startTime: '10:00',
        endTime: '13:00',
      });

      // Create an existing repeating assignments
      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: toDateString(new Date()),
        startTime: '13:00',
        endTime: '15:00',
        isRepeating: true,
        repeatFrequency: 1,
        repeatUnit: REPEAT_FREQUENCY.WEEKLY,
        repeatEndDate: toDateString(addWeeks(new Date(), 10)),
      });

      // Create a new single assignment that overlaps with the existing assignments
      const assignmentResult = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: toDateString(new Date()),
        startTime: '12:00',
        endTime: '14:00',
      });

      expect(assignmentResult).toHaveRequestError(400);
      expect(assignmentResult.body.error.type).toEqual('overlap_assignment_error');
      expect(assignmentResult.body.error.overlapAssignments.length).toBe(2);

      // Create new repeating assignment that overlaps with the existing assignments
      const templateResult = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: toDateString(new Date()),
        startTime: '12:00',
        endTime: '14:00',
        isRepeating: true,
        repeatFrequency: 2,
        repeatUnit: REPEAT_FREQUENCY.WEEKLY,
        repeatEndDate: toDateString(addWeeks(new Date(), 10)),
      });

      expect(templateResult).toHaveRequestError(400);
      expect(templateResult.body.error.type).toEqual('overlap_assignment_error');
      expect(templateResult.body.error.overlapAssignments.length).toBe(2);
    });

    it('Should handle edge cases for time boundaries', async () => {
      // Create existing assignment: 10:00-13:00
      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: toDateString(new Date()),
        startTime: '10:00',
        endTime: '13:00',
      });
    
      const result1 = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: toDateString(new Date()),
        startTime: '08:00',
        endTime: '10:00',
      });
      expect(result1).toHaveSucceeded();
    
      const result2 = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: toDateString(new Date()),
        startTime: '13:00',
        endTime: '15:00',
        isRepeating: true,
        repeatFrequency: 1,
        repeatUnit: REPEAT_FREQUENCY.MONTHLY,
        repeatEndDate: toDateString(addWeeks(new Date(), 10)),
      });
      expect(result2).toHaveSucceeded();
    
      const result3 = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: toDateString(new Date()),
        startTime: '08:00',
        endTime: '09:00',
      });
      expect(result3).toHaveRequestError(400);
    });

    it('Should allow overlapping assignments for different locations', async () => {
      const anotherLocation = await models.Location.create({
        ...fake(models.Location),
        facilityId: testLocation.facilityId,
      });
    
      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: toDateString(new Date()),
        startTime: '10:00',
        endTime: '13:00',
      });
    
      const result = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: anotherLocation.id,
        date: toDateString(new Date()),
        startTime: '10:00',
        endTime: '13:00',
      });
      expect(result).toHaveSucceeded();
    });

    it('Should handle monthly repeating assignment overlaps', async () => {
      const today = toDateString(new Date());
      const futureDates = generateFrequencyDates(
        today,
        toDateString(addMonths(new Date(), 3)),
        1,
        REPEAT_FREQUENCY.MONTHLY,
      )

      // Create existing monthly repeating assignment
      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: today,
        startTime: '10:00',
        endTime: '13:00',
        isRepeating: true,
        repeatFrequency: 1,
        repeatUnit: REPEAT_FREQUENCY.MONTHLY,
      });
    
      // Test: Overlapping monthly assignment
      const result = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: futureDates[1],
        startTime: '12:00',
        endTime: '14:00',
        isRepeating: true,
        repeatFrequency: 2,
        repeatUnit: REPEAT_FREQUENCY.MONTHLY,
      });
      expect(result).toHaveRequestError(400);
    });

    it('Should not overlap with existing assignments on user leaves', async () => {
      const { UserLeave, User } = models;

      const testUser2 = await User.create({
        ...fake(User),
        id: uuidv4(),
      });

      const startDate = toDateString(new Date());
      const endDate = toDateString(addDays(new Date(), 3));

      await UserLeave.create({
        userId: testUser.id,
        startDate,
        endDate,
        scheduledBy: testUser.id,
        scheduledAt: toDateString(new Date()),
      });
      
      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: startDate,
        startTime: '10:00',
        endTime: '11:00',
        isRepeating: true,
        repeatFrequency: 1,
        repeatUnit: REPEAT_FREQUENCY.WEEKLY,
        repeatEndDate: toDateString(addWeeks(new Date(), 10)),
      });

      const result = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser2.id,
        locationId: testLocation.id,
        date: startDate,
        startTime: '10:00',
        endTime: '11:00',
      });

      expect(result).toHaveSucceeded();
    });
  });


  describe('Delete location assignments', () => {   
    it('Should delete a non-repeating assignment', async () => {
      const { LocationAssignment } = models;

      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: toDateString(new Date()),
        startTime: '10:00',
        endTime: '11:00',
      });

      const createdAssignment = await LocationAssignment.findOne({
        where: {
          userId: testUser.id,
          locationId: testLocation.id,
          templateId: null,
        },
      });

      expect(createdAssignment).toBeTruthy();

      // Delete the assignment
      const deleteResult = await adminApp.delete(`/api/admin/location-assignments/${createdAssignment.id}`);

      expect(deleteResult).toHaveSucceeded();

      // Verify the assignment is soft deleted
      const deletedAssignment = await LocationAssignment.findByPk(createdAssignment.id);
      expect(deletedAssignment).toBeNull();
    });

    it('Should delete a selected assignment in repeating', async () => {
      const { LocationAssignment } = models;

      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: toDateString(new Date()),
        startTime: '10:00',
        endTime: '11:00',
        isRepeating: true,
        repeatFrequency: 1,
        repeatUnit: REPEAT_FREQUENCY.WEEKLY,
        repeatEndDate: toDateString(addWeeks(new Date(), 10)),
      });

      const generatedAssignments = await LocationAssignment.findAll({
        where: {
          templateId: { [Op.ne]: null },
        },
        order: [['date', 'ASC']],
      });

      expect(generatedAssignments.length).toBeGreaterThan(1);

      const assignmentToDelete = generatedAssignments[1];
      
      const deleteResult = await adminApp.delete(`/api/admin/location-assignments/${assignmentToDelete.id}`);

      expect(deleteResult).toHaveSucceeded();

      const updatedAssignment = await LocationAssignment.findByPk(assignmentToDelete.id);
      expect(updatedAssignment).toBeTruthy();
      expect(updatedAssignment.status).toEqual(LOCATION_ASSIGNMENT_STATUS.INACTIVE);
    });

    it('Should delete selected and future assignments', async () => {
      const { LocationAssignment, LocationAssignmentTemplate } = models;

      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: toDateString(new Date()),
        startTime: '10:00',
        endTime: '11:00',
        isRepeating: true,
        repeatFrequency: 1,
        repeatUnit: REPEAT_FREQUENCY.WEEKLY,
        repeatEndDate: toDateString(addWeeks(new Date(), 10)),
      });

      const createdTemplate = await LocationAssignmentTemplate.findOne({
        where: {
          userId: testUser.id,
          locationId: testLocation.id,
        },
      });

      const generatedAssignments = await LocationAssignment.findAll({
        where: {
          templateId: createdTemplate.id,
        },
        order: [['date', 'ASC']],
      });

      expect(generatedAssignments.length).toBeGreaterThan(2);

      // Delete the second assignment
      const assignmentToDelete = generatedAssignments[3];
      const deleteResult = await adminApp.delete(`/api/admin/location-assignments/${assignmentToDelete.id}?deleteFuture=true`);

      expect(deleteResult).toHaveSucceeded();

      const deletedAssignment = await LocationAssignment.findByPk(assignmentToDelete.id);
      expect(deletedAssignment).toBeNull();

      const futureAssignments = await LocationAssignment.findAll({
        where: {
          templateId: createdTemplate.id,
          date: { [Op.gte]: assignmentToDelete.date },
        },
      });

      expect(futureAssignments.length).toBe(0);

      const updatedTemplate = await LocationAssignmentTemplate.findByPk(createdTemplate.id);
      expect(updatedTemplate.repeatEndDate).toEqual(generatedAssignments[2].date);
    });

    it('Should reject when deleting future assignments for non-repeating assignments', async () => {
      const { LocationAssignment } = models;
      const tomorrow = toDateString(addDays(new Date(), 1));

      // Create a non-repeating assignment
      const createResult = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: tomorrow,
        startTime: '21:00',
        endTime: '22:00',
      });

      expect(createResult).toHaveSucceeded();

      const createdAssignment = await LocationAssignment.findOne({
        where: {
          userId: testUser.id,
          locationId: testLocation.id,
          date: tomorrow,
          templateId: null,
          startTime: '21:00',
          endTime: '22:00',
        },
      });

      expect(createdAssignment).toBeTruthy();

      // Try to delete with deleteFuture=true (should fail)
      const deleteResult = await adminApp.delete(`/api/admin/location-assignments/${createdAssignment.id}?deleteFuture=true`);

      expect(deleteResult).toHaveRequestError(422);
    });
  });
});
