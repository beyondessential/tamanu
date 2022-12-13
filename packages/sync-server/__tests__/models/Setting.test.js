import { fake } from 'shared/test-helpers/fake';
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
            minutes: null,
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
    await Setting.set('cats', {
      breeds: { siamese: { include: false } },
    });

    // alter existing keys in a nested object
    await Setting.set(
      'timezone',
      { offset: { minutes: 30 }, daylightSavingsBounds: ['02/04', '30/09'] },
      facilityA,
    );

    // alter an existing key and add a new one at the same time
    await Setting.set('timezone', { name: 'Australia/Sydney', code: 'AEST' }, facilityA);

    // alter an existing key using dot notation
    await Setting.set('timezone.offset.hours', 10, facilityA);

    // add a new setting separate to the facility specific one
    await Setting.set('timezone.offset.hours', 14);

    // Assert

    const cats = await Setting.get('cats');
    expect(cats).toEqual({
      breeds: {
        persian: {
          include: true,
        },
        siamese: {
          include: false,
        },
      },
    });

    const timezone = await Setting.get('timezone', facilityA);
    expect(timezone).toEqual({
      name: 'Australia/Sydney',
      code: 'AEST',
      offset: {
        hours: 10,
        minutes: 30,
      },
      daylightSavingsBounds: ['02/04', '30/09'],
    });
  });
});
