import { join } from 'path';
import { mkdtemp, writeFile, rmdir } from 'fs/promises';
import { tmpdir } from 'os';
import { fake } from '@tamanu/shared/test-helpers/fake';
import { Op } from 'sequelize';
import { SETTINGS_SCOPES } from '@tamanu/settings';
import { listSettings, getSetting, setSetting, loadSettings } from '../../app/subCommands/settings';
import { createTestContext } from '../utilities';

describe('settings', () => {
  let ctx;
  const facility = '38ee9650-9b0c-440f-8b0c-c9526fba35ea';
  beforeAll(async () => {
    ctx = await createTestContext();
    const { Facility } = ctx.store.models;
    await Facility.create(fake(Facility, { id: facility }));
  });
  afterAll(() => ctx.close());

  beforeEach(async () => {
    const { Setting } = ctx.store.models;

    await Setting.destroy({
      where: {
        key: {
          [Op.like]: 'test%',
        },
      },
    });

    await Setting.set('test', {
      value: 'test',
      tree: {
        flower: ['flower', 'girl'],
        branch: {
          leaf: 'leaf',
        },
      },
      SETTINGS_SCOPES,
    });

    await Setting.set(
      'test.tree.branch',
      {
        leaf: 'weed',
        root: 'root',
      },
      facility,
    );
  });

  describe('list (global)', () => {
    it('shows all settings', () => expect(listSettings()).resolves.toMatchSnapshot());

    it('shows some settings with a filter', () =>
      expect(listSettings('test.tree')).resolves.toMatchSnapshot());

    it('shows no settings with a non-matching filter', () =>
      expect(listSettings('nothinghere')).resolves.toMatchSnapshot());
  });

  describe('list (facility)', () => {
    it('shows all settings', () =>
      expect(listSettings('', { facility })).resolves.toMatchSnapshot());

    it('shows some settings with a filter', () =>
      expect(listSettings('test.tree', { facility })).resolves.toMatchSnapshot());

    it('shows no settings with a non-matching filter', () =>
      expect(listSettings('nothinghere', { facility })).resolves.toMatchSnapshot());
  });

  describe('get (global)', () => {
    it('retrieves a scalar', () =>
      expect(
        getSetting('test.value', { scope: SETTINGS_SCOPES.GLOBAL }),
      ).resolves.toMatchSnapshot());

    it('retrieves an array', () =>
      expect(
        getSetting('test.tree.flower', { scope: SETTINGS_SCOPES.GLOBAL }),
      ).resolves.toMatchSnapshot());

    it('retrieves an object', () =>
      expect(
        getSetting('test.tree.branch', { scope: SETTINGS_SCOPES.GLOBAL }),
      ).resolves.toMatchSnapshot());

    it('retrieves a non-existent key', () =>
      expect(
        getSetting('nothinghere', { scope: SETTINGS_SCOPES.GLOBAL }),
      ).resolves.toMatchSnapshot());
  });

  describe('get (facility)', () => {
    it('retrieves a scalar', () =>
      expect(
        getSetting('test.value', { facility, scope: SETTINGS_SCOPES.FACILITY }),
      ).resolves.toMatchSnapshot());

    it('retrieves an array', () =>
      expect(
        getSetting('test.tree.flower', { facility, scope: SETTINGS_SCOPES.FACILITY }),
      ).resolves.toMatchSnapshot());

    it('retrieves an object', () =>
      expect(
        getSetting('test.tree.branch', { facility, scope: SETTINGS_SCOPES.FACILITY }),
      ).resolves.toMatchSnapshot());

    it('retrieves a non-existent key', () =>
      expect(
        getSetting('nothinghere', { facility, scope: SETTINGS_SCOPES.FACILITY }),
      ).resolves.toMatchSnapshot());
  });

  describe('set (global)', () => {
    it('sets a new scalar', async () => {
      const { Setting } = ctx.store.models;
      await expect(
        setSetting('test.enabled', 'true', { scope: SETTINGS_SCOPES.GLOBAL }),
      ).resolves.toMatchSnapshot();
      await expect(Setting.get('test.enabled', SETTINGS_SCOPES.GLOBAL)).resolves.toBe(true);
    });

    it('overwrites a scalar', async () => {
      const { Setting } = ctx.store.models;
      await expect(
        setSetting('test.value', '"test2"', { scope: SETTINGS_SCOPES.GLOBAL }),
      ).resolves.toMatchSnapshot();
      await expect(Setting.get('test.value', SETTINGS_SCOPES.GLOBAL)).resolves.toBe('test2');
    });

    it('sets a new array', async () => {
      const { Setting } = ctx.store.models;
      await expect(
        setSetting('test.list', '["groceries", "antiques"]', { scope: SETTINGS_SCOPES.GLOBAL }),
      ).resolves.toMatchSnapshot();
      await expect(Setting.get('test.list', SETTINGS_SCOPES.GLOBAL)).resolves.toStrictEqual([
        'groceries',
        'antiques',
      ]);
    });

    it('overwrites an array', async () => {
      const { Setting } = ctx.store.models;
      await expect(
        setSetting('test.tree.flower', '["tulips"]', { scope: SETTINGS_SCOPES.GLOBAL }),
      ).resolves.toMatchSnapshot();
      await expect(Setting.get('test.tree.flower', SETTINGS_SCOPES.GLOBAL)).resolves.toStrictEqual([
        'tulips',
      ]);
    });

    it('sets a new object', async () => {
      const { Setting } = ctx.store.models;
      await expect(
        setSetting('test.dict', '{"broken": "eggs"}', { scope: SETTINGS_SCOPES.GLOBAL }),
      ).resolves.toMatchSnapshot();
      await expect(Setting.get('test.dict', SETTINGS_SCOPES.GLOBAL)).resolves.toStrictEqual({
        broken: 'eggs',
      });
    });

    it('overwrites an object', async () => {
      const { Setting } = ctx.store.models;
      await expect(
        setSetting('test.tree.branch', '{ "leaf": "bug" }', { scope: SETTINGS_SCOPES.GLOBAL }),
      ).resolves.toMatchSnapshot();
      await expect(Setting.get('test.tree.branch', SETTINGS_SCOPES.GLOBAL)).resolves.toStrictEqual({
        leaf: 'bug',
      });
      await expect(Setting.get('test.tree', SETTINGS_SCOPES.GLOBAL)).resolves.toStrictEqual({
        flower: ['flower', 'girl'],
        branch: {
          leaf: 'bug',
        },
      });
    });
  });

  describe('set (facility)', () => {
    it('sets a new scalar', async () => {
      const { Setting } = ctx.store.models;
      await expect(
        setSetting('test.enabled', 'true', { facility, scope: SETTINGS_SCOPES.FACILITY }),
      ).resolves.toMatchSnapshot();
      await expect(Setting.get('test.enabled', SETTINGS_SCOPES.FACILITY, facility)).resolves.toBe(
        true,
      );
    });

    it('sets a new scalar over a global one', async () => {
      const { Setting } = ctx.store.models;
      await expect(
        setSetting('test.value', '"test2"', { facility, scope: SETTINGS_SCOPES.FACILITY }),
      ).resolves.toMatchSnapshot();
      await expect(Setting.get('test.value', SETTINGS_SCOPES.GLOBAL)).resolves.toBe('test');
      await expect(Setting.get('test.value', SETTINGS_SCOPES.FACILITY, facility)).resolves.toBe(
        'test2',
      );
    });

    it('sets a new array', async () => {
      const { Setting } = ctx.store.models;
      await expect(
        setSetting('test.list', '["groceries", "antiques"]', {
          facility,
          scope: SETTINGS_SCOPES.FACILITY,
        }),
      ).resolves.toMatchSnapshot();
      await expect(
        Setting.get('test.list', SETTINGS_SCOPES.FACILITY, facility),
      ).resolves.toStrictEqual(['groceries', 'antiques']);
    });

    it('sets a new array over a global one', async () => {
      const { Setting } = ctx.store.models;
      await expect(
        setSetting('test.tree.flower', '["tulips"]', { facility, scope: SETTINGS_SCOPES.FACILITY }),
      ).resolves.toMatchSnapshot();
      await expect(Setting.get('test.tree.flower', SETTINGS_SCOPES.GLOBAL)).resolves.toStrictEqual([
        'flower',
        'girl',
      ]);
      await expect(
        Setting.get('test.tree.flower', SETTINGS_SCOPES.FACILITY, facility),
      ).resolves.toStrictEqual(['tulips']);
    });

    it('sets a new object', async () => {
      const { Setting } = ctx.store.models;
      await expect(
        setSetting('test.dict', '{"broken": "eggs"}', {
          facility,
          scope: SETTINGS_SCOPES.FACILITY,
        }),
      ).resolves.toMatchSnapshot();
      await expect(
        Setting.get('test.dict', SETTINGS_SCOPES.FACILITY, facility),
      ).resolves.toStrictEqual({ broken: 'eggs' });
    });

    it('sets a new object over a global one', async () => {
      const { Setting } = ctx.store.models;
      await expect(
        setSetting('test.tree.branch', '{ "leaf": "bug" }', {
          facility,
          scope: SETTINGS_SCOPES.FACILITY,
        }),
      ).resolves.toMatchSnapshot();

      await expect(
        Setting.get('test.tree.branch', SETTINGS_SCOPES.FACILITY, facility),
      ).resolves.toStrictEqual({
        leaf: 'bug',
      });
      await expect(Setting.get('test.tree.branch', SETTINGS_SCOPES.GLOBAL)).resolves.toStrictEqual({
        leaf: 'leaf',
      });

      await expect(
        Setting.get('test.tree', SETTINGS_SCOPES.FACILITY, facility),
      ).resolves.toStrictEqual({
        flower: ['flower', 'girl'],
        branch: {
          leaf: 'bug',
        },
      });
      await expect(Setting.get('test.tree'), SETTINGS_SCOPES.GLOBAL).resolves.toStrictEqual({
        flower: ['flower', 'girl'],
        branch: {
          leaf: 'leaf',
        },
      });
    });
  });

  describe('load', () => {
    let tempdir;
    beforeEach(async () => {
      tempdir = await mkdtemp(join(tmpdir(), 'settings-'));
    });
    afterEach(async () => {
      await rmdir(tempdir, { recursive: true });
    });

    describe('a json file', () => {
      it('to global namespace', async () => {
        const { Setting } = ctx.store.models;
        const file = join(tempdir, 'test.json');
        await writeFile(file, JSON.stringify({ really: { nice: 'eyes' } }));

        await expect(
          loadSettings('test.json', file, { scope: SETTINGS_SCOPES.GLOBAL }),
        ).resolves.toMatchSnapshot();

        await expect(
          Setting.get('test.json', { scope: SETTINGS_SCOPES.GLOBAL }),
        ).resolves.toStrictEqual({
          really: { nice: 'eyes' },
        });
      });

      it('to a facility', async () => {
        const { Setting } = ctx.store.models;
        const file = join(tempdir, 'test.json');
        await writeFile(file, JSON.stringify({ really: { blue: 'eyes' } }));

        await expect(
          loadSettings('test.json', file, { facility, scope: SETTINGS_SCOPES.FACILITY }),
        ).resolves.toMatchSnapshot();

        await expect(Setting.get('test.json', { scope: SETTINGS_SCOPES.GLOBAL })).resolves.toBe(
          undefined,
        );
        await expect(
          Setting.get('test.json', SETTINGS_SCOPES.FACILITY, facility),
        ).resolves.toStrictEqual({
          really: { blue: 'eyes' },
        });
      });

      it('preview only', async () => {
        const { Setting } = ctx.store.models;
        const file = join(tempdir, 'test.json');
        await writeFile(file, JSON.stringify({ really: { dull: 'eyes' } }));

        await expect(
          loadSettings('test.json', file, { preview: true, scope: SETTINGS_SCOPES.GLOBAL }),
        ).resolves.toMatchSnapshot();

        await expect(Setting.get('test.json', SETTINGS_SCOPES.GLOBAL)).resolves.toBe(undefined);
      });
    });

    describe('a KDL file', () => {
      it('to global namespace', async () => {
        const { Setting } = ctx.store.models;
        const file = join(tempdir, 'test.kdl');
        await writeFile(
          file,
          `
          test.kdl {
            character "Marten Reed"
            firstAppearance 1
            human true
          }
          `,
        );

        await expect(
          loadSettings('test.kdl', file, { scope: SETTINGS_SCOPES.GLOBAL }),
        ).resolves.toMatchSnapshot();

        await expect(Setting.get('test.kdl', SETTINGS_SCOPES.GLOBAL)).resolves.toStrictEqual({
          character: 'Marten Reed',
          firstAppearance: 1,
          human: true,
        });
      });

      it('to a facility', async () => {
        const { Setting } = ctx.store.models;
        const file = join(tempdir, 'test.kdl');
        await writeFile(
          file,
          `
          test.kdl {
            character "Pintsize"
            firstAppearance 1
            human false
          }
          `,
        );

        await expect(
          loadSettings('test.kdl', file, { facility, scope: SETTINGS_SCOPES.FACILITY }),
        ).resolves.toMatchSnapshot();

        await expect(Setting.get('test.kdl', SETTINGS_SCOPES.GLOBAL)).resolves.toBe(undefined);
        await expect(
          Setting.get('test.kdl', SETTINGS_SCOPES.FACILITY, facility),
        ).resolves.toStrictEqual({
          character: 'Pintsize',
          firstAppearance: 1,
          human: false,
        });
      });

      it('preview only', async () => {
        const { Setting } = ctx.store.models;
        const file = join(tempdir, 'test.kdl');
        await writeFile(
          file,
          `
          test.kdl {
            character "Claire Augustus"
            firstAppearance 2203
            human true
          }
          `,
        );

        await expect(
          loadSettings('test.kdl', file, { preview: true, scope: SETTINGS_SCOPES.GLOBAL }),
        ).resolves.toMatchSnapshot();

        await expect(Setting.get('test.kdl', SETTINGS_SCOPES.GLOBAL)).resolves.toBe(undefined);
      });
    });
  });
});
