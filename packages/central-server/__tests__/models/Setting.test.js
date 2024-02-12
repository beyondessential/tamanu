import { fake } from '@tamanu/shared/test-helpers/fake';
import { createTestContext } from '../utilities';

// the test cases in here ignore the way the data is stored (which is currently with a record per
// leaf value, and dot notation keys) in favour of testing that setting then getting a setting
// functions correctly - slightly higher level, to be more robust to changes in implementation detail
describe('Setting', () => {
  let Setting;
  let Facility;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    Setting = ctx.store.models.Setting;
    Facility = ctx.store.models.Facility;
  });

  afterEach(async () => {
    await Setting.truncate();
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('sets and gets basic settings', async () => {
    const testCases = [
      ['timezone', 'Pacific/Tongatapu'],
      ['offset', 12],
      ['nothing', null],
      ['include', true],
      ['some', ['t', 'h', 'i', 'n', 'g', 's']],
    ];

    const testSetThenGet = async ([key, value]) => {
      await Setting.set(key, value);
      const output = await Setting.get(key);
      expect(output).toEqual(value);
    };

    await Promise.all(testCases.map(testSetThenGet));
  });

  it('sets and gets nested settings using dot notation', async () => {
    const testCases = [
      ['cats.breeds.persian.include', true],
      ['timezone.name', 'Pacific/Tongatapu'],
      ['timezone.offset.hours', 12],
      ['timezone.offset.minutes', null],
      ['timezone.daylightSavingsBounds', ['02/04', '25/09']],
    ];

    const testSetThenGet = async ([key, value]) => {
      await Setting.set(key, value);
      const output = await Setting.get(key);
      expect(output).toEqual(value);
    };

    await Promise.all(testCases.map(testSetThenGet));
  });

  it('sets and gets nested settings using objects', async () => {
    const inputs = [
      [
        'cats',
        {
          breeds: {
            persian: {
              include: true,
            },
          },
        },
      ],
      [
        'timezone',
        {
          name: 'Pacific/Tongatapu',
          offset: {
            hours: 12,
            minutes: null,
          },
          daylightSavingsBounds: ['02/04', '25/09'],
        },
      ],
    ];
    await Promise.all(inputs.map(([key, value]) => Setting.set(key, value)));

    const testCases = [
      [
        'cats.breeds',
        {
          persian: { include: true },
        },
      ],
      [
        'timezone',
        {
          name: 'Pacific/Tongatapu',
          offset: {
            hours: 12,
            minutes: null,
          },
          daylightSavingsBounds: ['02/04', '25/09'],
        },
      ],
      ['timezone.offset.hours', 12],
    ];

    const runTest = async ([key, value]) => {
      const output = await Setting.get(key);
      expect(output).toEqual(value);
    };

    await Promise.all(testCases.map(runTest));
  });

  it('sets and gets nested settings for a specific facility', async () => {
    const { id: facilityA } = await Facility.create(fake(Facility));
    const { id: facilityB } = await Facility.create(fake(Facility));
    const inputs = [
      [
        'cats',
        {
          breeds: {
            persian: {
              include: true,
            },
          },
        },
        null,
      ],
      [
        'timezone',
        {
          name: 'Pacific/Tongatapu',
          offset: {
            hours: 12,
            minutes: null,
          },
          daylightSavingsBounds: ['02/04', '25/09'],
        },
        facilityA,
      ],
      [
        'timezone',
        {
          name: 'Australia/Sydney',
          offset: {
            hours: 10,
            minutes: null,
          },
          daylightSavingsBounds: ['02/04', '01/10'],
        },
        facilityB,
      ],
    ];
    await Promise.all(
      inputs.map(([key, value, facilityId]) => Setting.set(key, value, facilityId)),
    );

    const testCases = [
      [
        'cats.breeds',
        null,
        {
          persian: { include: true },
        },
      ],
      [
        'timezone',
        facilityA,
        {
          name: 'Pacific/Tongatapu',
          offset: {
            hours: 12,
            minutes: null,
          },
          daylightSavingsBounds: ['02/04', '25/09'],
        },
      ],
      ['timezone.offset.hours', facilityB, 10],
    ];

    const runTest = async ([key, facilityId, value]) => {
      const output = await Setting.get(key, facilityId);
      expect(output).toEqual(value);
    };

    await Promise.all(testCases.map(runTest));
  });

  it('updates existing settings', async () => {
    // Arrange
    const { id: facilityA } = await Facility.create(fake(Facility));
    const inputs = [
      [
        'cats',
        {
          breeds: {
            persian: {
              include: true,
            },
          },
        },
        null,
      ],
      [
        'timezone',
        {
          name: 'Pacific/Tongatapu',
          offset: {
            hours: 12,
          },
          daylightSavingsBounds: ['02/04', '25/09'],
        },
        facilityA,
      ],
    ];
    await Promise.all(
      inputs.map(([key, value, facilityId]) => Setting.set(key, value, facilityId)),
    );

    // Act

    // add another key to a nested object
    await Setting.set('cats.breeds.siamese', { include: false });

    // alter an existing key for a facility
    await Setting.set('timezone.offset.hours', 10, facilityA);

    // add new settings separate to the facility specific one
    await Setting.set('timezone.name', 'Australia/Sydney');
    await Setting.set('timezone.offset.hours', 14);

    // Assert

    expect(await Setting.get('cats')).toEqual({
      breeds: {
        persian: {
          include: true,
        },
        siamese: {
          include: false,
        },
      },
    });

    expect(await Setting.get('timezone', facilityA)).toEqual({
      name: 'Pacific/Tongatapu',
      offset: {
        hours: 10,
      },
      daylightSavingsBounds: ['02/04', '25/09'],
    });

    expect(await Setting.get('timezone')).toEqual({
      name: 'Australia/Sydney',
      offset: {
        hours: 14,
      },
    });
  });

  it('updates settings with deletions', async () => {
    // Arrange
    await Setting.set('testing.key', {
      a: 'stays identical',
      b: 'gets updated',
      c: 'gets deleted',
    });

    // Act
    await Setting.set('testing.key', {
      a: 'stays identical',
      b: 'gets updated here',
      d: 'gets added',
    });

    // Assert
    expect(await Setting.get('testing.key')).toEqual({
      a: 'stays identical',
      b: 'gets updated here',
      d: 'gets added',
    });
  });
});
