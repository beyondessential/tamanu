import { initDb } from '../initDb';

// the test cases in here ignore the way the data is stored (which is currently with a record per
// leaf value, and dot notation keys) in favour of testing that setting then getting a setting
// functions correctly - slightly higher level, to be more robust to changes in implementation detail
describe('Setting', () => {
  let Setting;
  let context;

  beforeAll(async () => {
    context = await initDb({ testMode: true });
    Setting = context.models.Setting;
  });

  afterEach(async () => {
    await Setting.truncate();
  });

  it('sets and gets basic settings', async () => {
    const testCases = [
      ['timezone', 'Pacific/Tongatapu'],
      ['offset', 12],
      ['nothing', null],
      ['include', true],
    ];

    const testSetThenGet = async ([key, value]) => {
      await Setting.set(key, value);
      const output = await Setting.get(key);
      expect(output).toEqual(value);
    };

    await Promise.all(testCases.map(testSetThenGet));
  });

  it('sets and gets nested settings using full dot notation', async () => {
    const testCases = [
      ['timezone.name', 'Pacific/Tongatapu'],
      ['timezone.offset.hours', 12],
      ['timezone.offset.minutes', null],
      ['cats.breeds.persian.include', true],
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
        'timezone',
        {
          name: 'Pacific/Tongatapu',
          offset: {
            hours: 12,
            minutes: null,
          },
        },
      ],
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
    ];
    await Promise.all(inputs.map(([key, value]) => Setting.set(key, value)));

    const testCases = [
      [
        'timezone',
        {
          name: 'Pacific/Tongatapu',
          offset: {
            hours: 12,
            minutes: null,
          },
        },
      ],
      ['timezone.offset.hours', 12],
      [
        'cats.breeds',
        {
          persian: { include: true },
        },
      ],
    ];

    const runTest = async ([key, value]) => {
      const output = await Setting.get(key);
      expect(output).toEqual(value);
    };

    await Promise.all(testCases.map(runTest));
  });
});
