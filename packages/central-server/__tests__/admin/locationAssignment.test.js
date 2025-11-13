import { REPEAT_FREQUENCY } from '@tamanu/constants';
import { createTestContext } from '../utilities';
import { fake } from '@tamanu/fake-data/fake';
import { toDateString } from '@tamanu/utils/dateTime';
import { addDays, addWeeks, addMonths, getISODay, parseISO, subDays } from 'date-fns';
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

    const testFacility = await models.Facility.create({
      ...fake(models.Facility),
    });

    testLocation = await models.Location.create({
      ...fake(models.Location),
      facilityId: testFacility.id,
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
        startTime: '09:00:00',
        endTime: '10:00:00',
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
      expect(createdAssignment.startTime).toEqual('09:00:00');
      expect(createdAssignment.endTime).toEqual('10:00:00');
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
        startTime: '10:00:00',
        endTime: '11:00:00',
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
      expect(createdTemplate.startTime).toEqual('10:00:00');
      expect(createdTemplate.endTime).toEqual('11:00:00');
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
        expect(assignment.startTime).toEqual('10:00:00');
        expect(assignment.endTime).toEqual('11:00:00');
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
        startTime: '11:00:00',
        endTime: '12:00:00',
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
      let expectedOrdinalPosition = getWeekdayOrdinalPosition(parseISO(startDate));
      expectedOrdinalPosition = expectedOrdinalPosition === -1 ? 4 : expectedOrdinalPosition;

      generatedAssignments.forEach(assignment => {
        const assignmentDow = getISODay(parseISO(assignment.date));
        let assignmentOrdinalPosition = getWeekdayOrdinalPosition(parseISO(assignment.date));
        assignmentOrdinalPosition = assignmentOrdinalPosition === -1 ? 4 : assignmentOrdinalPosition;
        expect(assignmentDow).toEqual(expectedDow);
        expect(assignmentOrdinalPosition).toEqual(expectedOrdinalPosition);
      });
    });

    it('Should reject when assign to non-existent user', async () => {
      const tomorrow = toDateString(addDays(new Date(), 1));
      const nonExistentUserId = uuidv4();

      const result = await adminApp.post('/api/admin/location-assignments').send({
        userId: nonExistentUserId,
        locationId: testLocation.id,
        date: tomorrow,
        startTime: '17:00:00',
        endTime: '18:00:00',
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
        startTime: '09:00:00',
        endTime: '17:00:00',
      });

      expect(result).toHaveRequestError(404);
    });

    it('Should reject when create single assignment overlapping with user leaves', async () => {
      const { UserLeave } = models;
      const startDate = toDateString(new Date());
      const endDate = toDateString(addDays(new Date(), 1));

      await UserLeave.create({
        userId: testUser.id,
        startDate,
        endDate,
      });

      const result = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: startDate,
        startTime: '10:00:00',
        endTime: '11:00:00',
      });

      expect(result).toHaveRequestError(400);
    });

    it('Should reject when create assignment with date greater than max future months', async () => {
      const maxFutureMonths = await ctx.settings.get('locationAssignments.assignmentMaxFutureMonths');
      const startDate = toDateString(addMonths(new Date(), maxFutureMonths + 1));

      const result = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: startDate,
        startTime: '10:00:00',
        endTime: '11:00:00',
      });

      expect(result).toHaveRequestError(400);
    });

    it('Should reject when create assignment with repeat end date greater than max future months', async () => {
      const maxFutureMonths = await ctx.settings.get('locationAssignments.assignmentMaxFutureMonths');
      const startDate = toDateString(new Date());
      const endDate = toDateString(addMonths(new Date(), maxFutureMonths + 1));

      const result = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: startDate,
        startTime: '10:00:00',
        endTime: '11:00:00',
        repeatFrequency: 1,
        repeatUnit: REPEAT_FREQUENCY.WEEKLY,
        repeatEndDate: endDate,
      });

      expect(result).toHaveRequestError(400);
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
        startTime: '10:00:00',
        endTime: '11:00:00',
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
      const endDate = toDateString(addDays(new Date(), 1));

      await UserLeave.create({
        userId: testUser.id,
        startDate,
        endDate,
      });

      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: startDate,
        startTime: '13:00:00',
        endTime: '14:00:00',
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
      const today = toDateString(new Date());
      // Create an existing single assignment
      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: today,
        startTime: '10:00:00',
        endTime: '13:00:00',
      });

      // Create an existing repeating assignments
      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: today,
        startTime: '13:00:00',
        endTime: '15:00:00',
        repeatFrequency: 2,
        repeatUnit: REPEAT_FREQUENCY.WEEKLY,
        repeatEndDate: toDateString(addWeeks(new Date(), 10)),
      });

      // Create a new single assignment that overlaps with the existing assignments
      const assignmentResult = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: today,
        startTime: '12:00:00',
        endTime: '14:00:00',
      });

      expect(assignmentResult).toHaveRequestError(400);
      expect(assignmentResult.body.error.type).toEqual('overlap_assignment_error');
      expect(assignmentResult.body.error.overlapAssignments.length).toBeGreaterThan(1);

      // Create new repeating assignment that overlaps with the existing assignments
      const templateResult = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: toDateString(addWeeks(new Date(), -1)),
        startTime: '12:00:00',
        endTime: '14:00:00',
        repeatFrequency: 1,
        repeatUnit: REPEAT_FREQUENCY.WEEKLY,
        repeatEndDate: toDateString(addWeeks(new Date(), 10)),
      });

      expect(templateResult).toHaveRequestError(400);
      expect(templateResult.body.error.type).toEqual('overlap_assignment_error');
      expect(templateResult.body.error.overlapAssignments.length).toBeGreaterThan(1);
    });

    it('Should handle edge cases for time boundaries', async () => {
      // Create existing assignment: 10:00-13:00
      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: toDateString(new Date()),
        startTime: '10:00:00',
        endTime: '13:00:00',
      });

      const result1 = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: toDateString(new Date()),
        startTime: '08:00:00',
        endTime: '10:00:00',
      });
      expect(result1).toHaveSucceeded();

      const result2 = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: toDateString(new Date()),
        startTime: '13:00:00',
        endTime: '15:00:00',
        repeatFrequency: 1,
        repeatUnit: REPEAT_FREQUENCY.MONTHLY,
        repeatEndDate: toDateString(addWeeks(new Date(), 10)),
      });
      expect(result2).toHaveSucceeded();

      const result3 = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: toDateString(new Date()),
        startTime: '08:00:00',
        endTime: '09:00:00',
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
        startTime: '10:00:00',
        endTime: '13:00:00',
      });

      const result = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: anotherLocation.id,
        date: toDateString(new Date()),
        startTime: '10:00:00',
        endTime: '13:00:00',
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
        startTime: '10:00:00',
        endTime: '13:00:00',
        repeatFrequency: 1,
        repeatUnit: REPEAT_FREQUENCY.MONTHLY,
        repeatEndDate: toDateString(addMonths(new Date(), 10)),
      });

      // Test: Overlapping monthly assignment
      const result = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: futureDates[1],
        startTime: '12:00:00',
        endTime: '14:00:00',
        repeatFrequency: 2,
        repeatUnit: REPEAT_FREQUENCY.MONTHLY,
        repeatEndDate: toDateString(addMonths(new Date(), 10)),
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
      });

      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: startDate,
        startTime: '10:00:00',
        endTime: '11:00:00',
        repeatFrequency: 1,
        repeatUnit: REPEAT_FREQUENCY.WEEKLY,
        repeatEndDate: toDateString(addWeeks(new Date(), 10)),
      });

      const result = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser2.id,
        locationId: testLocation.id,
        date: startDate,
        startTime: '10:00:00',
        endTime: '11:00:00',
      });

      expect(result).toHaveSucceeded();
    });

    it('Should detect partial overlaps in repeating assignments', async () => {
      const today = toDateString(new Date());
      const endDate = toDateString(addWeeks(new Date(), 8));

      // Create a weekly repeating assignment for 8 weeks
      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: today,
        startTime: '10:00:00',
        endTime: '12:00:00',
        repeatFrequency: 1,
        repeatUnit: REPEAT_FREQUENCY.WEEKLY,
        repeatEndDate: endDate,
      });

      // Create a weekly repeating assignment that starts 4 weeks later (should overlap for 4 weeks)
      const partialOverlapResult = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: toDateString(addWeeks(new Date(), 4)),
        startTime: '11:00:00',
        endTime: '13:00:00',
        repeatFrequency: 1,
        repeatUnit: REPEAT_FREQUENCY.WEEKLY,
        repeatEndDate: toDateString(addWeeks(new Date(), 12)),
      });

      expect(partialOverlapResult).toHaveRequestError(400);
      expect(partialOverlapResult.body.error.type).toEqual('overlap_assignment_error');
      expect(partialOverlapResult.body.error.overlapAssignments.length).toBeGreaterThan(0);

      // Verify that assignments that don't overlap in time are allowed
      const noOverlapResult = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: toDateString(addWeeks(new Date(), 4)),
        startTime: '08:00:00',
        endTime: '09:00:00',
        repeatFrequency: 1,
        repeatUnit: REPEAT_FREQUENCY.WEEKLY,
        repeatEndDate: toDateString(addWeeks(new Date(), 12)),
      });

      expect(noOverlapResult).toHaveSucceeded();
    });

    it ('Should return overlap leaves for new assignments', async () => {
      const { UserLeave } = models;
      const today = new Date();

      const leave =await UserLeave.create({
        userId: testUser.id,
        startDate: toDateString(today),
        endDate: toDateString(addDays(today, 3)),
      });


      const result = await adminApp.get(`/api/admin/location-assignments/overlapping-leaves?userId=${testUser.id}&date=${toDateString(today)}`);
      expect(result).toHaveSucceeded();
      expect(result.body.length).toBe(1);
      expect(result.body[0].id).toEqual(leave.id);

      const leave2 = await UserLeave.create({
        userId: testUser.id,
        startDate: toDateString(addDays(today, 5)),
        endDate: toDateString(addDays(today, 10)),
      });

      const result2 = await adminApp.get(`/api/admin/location-assignments/overlapping-leaves?userId=${testUser.id}&date=${toDateString(today)}&repeatEndDate=${toDateString(addDays(today, 100))}&repeatFrequency=1&repeatUnit=WEEKLY`);
      expect(result2).toHaveSucceeded();
      expect(result2.body.length).toBe(2);
      expect(result2.body[1].id).toEqual(leave2.id);
      expect(result2.body[0].id).toEqual(leave.id);
    });
  });

  describe('Modify non-repeating assignment', () => {
    it('Should update a non-repeating assignment', async () => {
      const { LocationAssignment } = models;

      const today = toDateString(new Date());
      const tomorrow = toDateString(addDays(new Date(), 1));

      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: today,
        startTime: '10:00:00',
        endTime: '11:00:00',
      });

      const createdAssignment = await LocationAssignment.findOne({
        where: {
          userId: testUser.id,
          locationId: testLocation.id,
          templateId: null,
        },
      });

      expect(createdAssignment).toBeTruthy();

      const updateResult = await adminApp.put(`/api/admin/location-assignments/${createdAssignment.id}`).send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: tomorrow,
        startTime: '12:00:00',
        endTime: '13:00:00',
      });
      expect(updateResult).toHaveSucceeded();

      const updatedAssignment = await LocationAssignment.findByPk(createdAssignment.id);
      expect(updatedAssignment.locationId).toEqual(testLocation.id);
      expect(updatedAssignment.date).toEqual(tomorrow);
      expect(updatedAssignment.startTime).toEqual('12:00:00');
      expect(updatedAssignment.endTime).toEqual('13:00:00');
    });

    it('Should reject when overlapping with existing assignments', async () => {
      const { LocationAssignment } = models;
      const today = toDateString(new Date());
      const tomorrow = toDateString(addDays(new Date(), 1));

      //Create assignment template
      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: tomorrow,
        startTime: '10:00:00',
        endTime: '11:00:00',
        repeatFrequency: 1,
        repeatUnit: REPEAT_FREQUENCY.WEEKLY,
        repeatEndDate: toDateString(addWeeks(new Date(), 10)),
      });

      //Create a new assignment
      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: tomorrow,
        startTime: '11:00:00',
        endTime: '12:00:00',
      });

      // Create another assignment to modify
      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: today,
        startTime: '10:00:00',
        endTime: '13:00:00',
      });

      const assignmentToModify = await LocationAssignment.findOne({
        where: {
          userId: testUser.id,
          locationId: testLocation.id,
          date: today,
          templateId: null,
        },
      });

      const updateResult = await adminApp.put(`/api/admin/location-assignments/${assignmentToModify.id}`).send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: tomorrow,
        startTime: '10:00:00',
        endTime: '13:00:00',
      });
      expect(updateResult).toHaveRequestError(400);
      expect(updateResult.body.error.type).toEqual('overlap_assignment_error');
      expect(updateResult.body.error.overlapAssignments.length).toBe(2);

    });

    it('Should reject when overlapping with user leaves', async () => {
      const { UserLeave, LocationAssignment } = models;
      const today = toDateString(new Date());

      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: today,
        startTime: '10:00:00',
        endTime: '11:00:00',
      });

      const startDate = toDateString(addDays(new Date(), 1));
      const endDate = toDateString(addDays(new Date(), 1));

      await UserLeave.create({
        userId: testUser.id,
        startDate,
        endDate,
      });

      const assignmentToModify = await LocationAssignment.findOne({
        where: {
          userId: testUser.id,
          locationId: testLocation.id,
          date: today,
          templateId: null,
        },
      });

      const updateResult = await adminApp.put(`/api/admin/location-assignments/${assignmentToModify.id}`).send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: startDate,
        startTime: '10:00:00',
        endTime: '13:00:00',
      });
      expect(updateResult).toHaveRequestError(400);
    });

    it('Should reject when update assignment with date greater than max future months', async () => {
      const { LocationAssignment } = models;
      const maxFutureMonths = await ctx.settings.get('locationAssignments.assignmentMaxFutureMonths');
      const startDate = toDateString(addMonths(new Date(), maxFutureMonths + 1));

      const assignment = await LocationAssignment.create({
        userId: testUser.id,
        locationId: testLocation.id,
        date: toDateString(new Date()),
        startTime: '10:00:00',
        endTime: '11:00:00',
      });

      const result = await adminApp.put(`/api/admin/location-assignments/${assignment.id}`).send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: startDate,
        startTime: '10:00:00',
        endTime: '11:00:00',
      });

      expect(result).toHaveRequestError(400);
    });

  });

  describe('Modify a repeating assignment', () => {
    it('Should update a repeating assignment', async () => {
      const { LocationAssignment } = models;
      const today = toDateString(new Date());
      const tomorrow = toDateString(addDays(new Date(), 1));
      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: today,
        startTime: '10:00:00',
        endTime: '11:00:00',
        repeatFrequency: 1,
        repeatUnit: REPEAT_FREQUENCY.WEEKLY,
        repeatEndDate: toDateString(addWeeks(new Date(), 10)),
      });

      const createdAssignment = await LocationAssignment.findOne({
        where: {
          userId: testUser.id,
          locationId: testLocation.id,
          date: today,
        },
      });

      const updateResult = await adminApp.put(`/api/admin/location-assignments/${createdAssignment.id}`).send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: tomorrow,
        startTime: '10:00:00',
        endTime: '13:00:00',
      });
      expect(updateResult).toHaveSucceeded();

      const updatedAssignment = await LocationAssignment.findByPk(createdAssignment.id);
      expect(updatedAssignment).toBeNull();

      const newAssignment = await LocationAssignment.findOne({
        where: {
          userId: testUser.id,
          locationId: testLocation.id,
          date: tomorrow,
          startTime: '10:00:00',
          endTime: '13:00:00',
          templateId: null,
        },
      });
      expect(newAssignment).toBeTruthy();
    });

    it('Should reject when overlapping with existing assignments', async () => {
      const { LocationAssignment } = models;
      const today = toDateString(new Date());
      const endDate = toDateString(addWeeks(new Date(), 10));

      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: today,
        startTime: '10:00:00',
        endTime: '11:00:00',
        repeatFrequency: 1,
        repeatUnit: REPEAT_FREQUENCY.WEEKLY,
        repeatEndDate: endDate,
      });

      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: today,
        startTime: '11:00:00',
        endTime: '12:00:00',
      });

      const assignmentToModify = await LocationAssignment.findOne({
        where: {
          userId: testUser.id,
          locationId: testLocation.id,
          date: { [Op.gt]: today },
          templateId: { [Op.ne]: null },
        },
      });

      const updateResult = await adminApp.put(`/api/admin/location-assignments/${assignmentToModify.id}`).send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: today,
        startTime: '10:00:00',
        endTime: '13:00:00',
      });
      expect(updateResult).toHaveRequestError(400);
      expect(updateResult.body.error.type).toEqual('overlap_assignment_error');
      expect(updateResult.body.error.overlapAssignments.length).toBe(2);
    });

    it('Should reject when overlapping with user leaves', async () => {
      const { UserLeave, LocationAssignment } = models;
      const today = toDateString(new Date());

      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: today,
        startTime: '10:00:00',
        endTime: '11:00:00',
        repeatFrequency: 1,
        repeatUnit: REPEAT_FREQUENCY.WEEKLY,
        repeatEndDate: toDateString(addWeeks(new Date(), 10)),
      });

      const startDate = toDateString(addDays(new Date(), 1));
      const endDate = toDateString(addDays(new Date(), 1));

      await UserLeave.create({
        userId: testUser.id,
        startDate,
        endDate,
      });

      const assignmentToModify = await LocationAssignment.findOne({
        where: {
          userId: testUser.id,
          locationId: testLocation.id,
        },
        order: [['date', 'ASC']],
      });

      const updateResult = await adminApp.put(`/api/admin/location-assignments/${assignmentToModify.id}`).send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: startDate,
        startTime: '10:00:00',
        endTime: '13:00:00',
      });
      expect(updateResult).toHaveRequestError(400);
    });
  });

  describe('Modify selected and future assignments', () => {
    it('Should create new template and delete selected and future assignments', async () => {
      const { LocationAssignmentTemplate, LocationAssignment } = models;
      const today = toDateString(new Date());
      const endDate = toDateString(addWeeks(new Date(), 10));

      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: today,
        startTime: '10:00:00',
        endTime: '11:00:00',
        repeatFrequency: 1,
        repeatUnit: REPEAT_FREQUENCY.WEEKLY,
        repeatEndDate: endDate,
      });

      const assignments = await LocationAssignment.findAll({
        where: {
          userId: testUser.id,
          locationId: testLocation.id,
          templateId: { [Op.ne]: null },
        },
        limit: 10
      });

      const assignmentToUpdate = assignments[3];
      const newDate = toDateString(addWeeks(parseISO(assignmentToUpdate.date), 1));
      const updateResult = await adminApp.put(`/api/admin/location-assignments/${assignmentToUpdate.id}`).send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: newDate,
        startTime: '11:00:00',
        endTime: '12:00:00',
        updateAllNextRecords: true,
        repeatFrequency: 2,
        repeatUnit: REPEAT_FREQUENCY.WEEKLY,
        repeatEndDate: endDate,
      });
      expect(updateResult).toHaveSucceeded();

      const template = await LocationAssignmentTemplate.findByPk(assignmentToUpdate.templateId);
      // Expect the repeat end date to be the date of the latest assignment
      expect(template.repeatEndDate).toEqual(assignments[2].date);

      const assignmentsAfterUpdate = await LocationAssignment.findAll({
        where: {
          templateId: assignmentToUpdate.templateId,
          date: { [Op.gte]: assignmentToUpdate.date },
        },
        order: [['date', 'ASC']],
      });
      // Expect selected and future assignments to be deleted
      expect(assignmentsAfterUpdate.length).toBe(0);

      const newTemplate = await LocationAssignmentTemplate.findOne({
        where: {
          userId: testUser.id,
          locationId: testLocation.id,
          date: newDate,
          startTime: '11:00:00',
          endTime: '12:00:00',
        },
      });
      // New template should be created
      expect(newTemplate).toBeTruthy();
      expect(newTemplate.repeatEndDate).toEqual(endDate);

      const newAssignments = await LocationAssignment.findAll({
        where: {
          templateId: newTemplate.id,
          date: { [Op.gte]: newDate },
        },
        order: [['date', 'ASC']],
      });
      // Expect new assignments to be created
      expect(newAssignments.length).toBeGreaterThan(1);
      expect(newAssignments[0].date).toEqual(newDate);
      expect(newAssignments[0].startTime).toEqual('11:00:00');
      expect(newAssignments[0].endTime).toEqual('12:00:00');
      expect(addWeeks(parseISO(newAssignments[0].date), 2)).toEqual(parseISO(newAssignments[1].date));
    });

    it('Should reject when new assignment template is overlapping with existing assignments', async () => {
      const { LocationAssignment } = models;
      const previousDate = toDateString(subDays(new Date(), 1));

      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: previousDate,
        startTime: '10:00:00',
        endTime: '11:00:00',
        repeatFrequency: 1,
        repeatUnit: REPEAT_FREQUENCY.WEEKLY,
        repeatEndDate: toDateString(addMonths(new Date(), 10)),
      });

      const assignments = await LocationAssignment.findAll({
        where: {
          userId: testUser.id,
          locationId: testLocation.id,
          templateId: { [Op.ne]: null },
        },
        limit: 10,
      });

      const assignmentToUpdate = assignments[3];
      const updateResult = await adminApp.put(`/api/admin/location-assignments/${assignmentToUpdate.id}`).send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: assignments[2].date,
        startTime: '10:00:00',
        endTime: '11:00:00',
        updateAllNextRecords: true,
        repeatFrequency: 1,
        repeatUnit: REPEAT_FREQUENCY.WEEKLY,
        repeatEndDate: toDateString(addMonths(new Date(), 10)),
      });
      // Overlap with assignments in the same template
      expect(updateResult).toHaveRequestError(400);
      expect(updateResult.body.error.type).toEqual('overlap_assignment_error');
      expect(updateResult.body.error.overlapAssignments.length).toBe(1);
      expect(updateResult.body.error.overlapAssignments[0].date).toEqual(assignments[2].date);

      // Create new repeating assignments
      const tomorrow = addDays(new Date(), 1);
      const assignmentDate = toDateString(addWeeks(tomorrow, 2));
      const createResult = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: assignmentDate,
        startTime: '10:00:00',
        endTime: '11:00:00',
        repeatFrequency: 2,
        repeatUnit: REPEAT_FREQUENCY.WEEKLY,
        repeatEndDate: toDateString(addWeeks(new Date(), 10)),
      });
      expect(createResult).toHaveSucceeded();

      // Create new non-repeating assignment
      const createResult2 = await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: assignmentDate,
        startTime: '11:00:00',
        endTime: '12:00:00',
      });
      expect(createResult2).toHaveSucceeded();

      const updateResult2 = await adminApp.put(`/api/admin/location-assignments/${assignmentToUpdate.id}`).send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: toDateString(tomorrow),
        startTime: '10:00:00',
        endTime: '12:00:00',
        updateAllNextRecords: true,
        repeatFrequency: 2,
        repeatUnit: REPEAT_FREQUENCY.WEEKLY,
        repeatEndDate: toDateString(addMonths(new Date(), 10)),
      });
      expect(updateResult2).toHaveRequestError(400);
      expect(updateResult2.body.error.type).toEqual('overlap_assignment_error');
      expect(updateResult2.body.error.overlapAssignments.length).toBeGreaterThan(1);
    });
  });

  describe('Delete location assignments', () => {
    it('Should delete a non-repeating assignment', async () => {
      const { LocationAssignment } = models;

      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: toDateString(new Date()),
        startTime: '10:00:00',
        endTime: '11:00:00',
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
        startTime: '10:00:00',
        endTime: '11:00:00',
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
      expect(updatedAssignment).toBeNull();
    });

    it('Should delete selected and future assignments', async () => {
      const { LocationAssignment, LocationAssignmentTemplate } = models;

      await adminApp.post('/api/admin/location-assignments').send({
        userId: testUser.id,
        locationId: testLocation.id,
        date: toDateString(new Date()),
        startTime: '10:00:00',
        endTime: '11:00:00',
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
      const deleteResult = await adminApp.delete(`/api/admin/location-assignments/${assignmentToDelete.id}?deleteAllNextRecords=true`);

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
  });
});
