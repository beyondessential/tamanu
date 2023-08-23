import { join } from 'path';
import { mkdtemp, writeFile, rmdir } from 'fs/promises';
import { tmpdir } from 'os';
import { fake } from 'shared/test-helpers/fake';
import { Op } from 'sequelize';
import { SETTINGS_SCOPES } from '@tamanu/constants';
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
    });

    await Setting.set(
      'test.tree.branch',
      {
        leaf: 'weed',
        root: 'root',
      },
      facility,
      SETTINGS_SCOPES.FACILITY,
    );
  });

  describe('list (global)', () => {
    it('shows all settings', async () => {
      const list = await listSettings();
      // Remove all lines not starting with test.
      // As full contents of settings is not guaranteed to be the same
      expect(list.replace(/\n?^(?!test.).*$\n?/gm, '')).toMatchSnapshot();
    });
    it('shows some settings with a filter', () =>
      expect(listSettings('test.tree')).resolves.toMatchSnapshot());

    it('shows no settings with a non-matching filter', () =>
      expect(listSettings('nothinghere')).resolves.toMatchSnapshot());
  });

  describe('list (facility)', () => {
    it('shows all settings', async () => {
      const list = await listSettings('', { facility });
      // Remove all lines not starting with test.
      // As full contents of settings is not guaranteed to be the same
      expect(list.replace(/\n?^(?!test.).*$\n?/gm, '')).toMatchSnapshot();
    });

    it('shows some settings with a filter', () =>
      expect(listSettings('test.tree', { facility })).resolves.toMatchSnapshot());

    it('shows no settings with a non-matching filter', () =>
      expect(listSettings('nothinghere', { facility })).resolves.toMatchSnapshot());
  });

  describe('get (global)', () => {
    it('retrieves a scalar', () => expect(getSetting('test.value')).resolves.toMatchSnapshot());

    it('retrieves an array', () =>
      expect(getSetting('test.tree.flower')).resolves.toMatchSnapshot());

    it('retrieves an object', () =>
      expect(getSetting('test.tree.branch')).resolves.toMatchSnapshot());

    it('retrieves a non-existent key', () =>
      expect(getSetting('nothinghere')).resolves.toMatchSnapshot());
  });

  describe('get (facility)', () => {
    it('retrieves a scalar', () =>
      expect(getSetting('test.value', { facility })).resolves.toMatchSnapshot());

    it('retrieves an array', () =>
      expect(getSetting('test.tree.flower', { facility })).resolves.toMatchSnapshot());

    it('retrieves an object', () =>
      expect(getSetting('test.tree.branch', { facility })).resolves.toMatchSnapshot());

    it('retrieves a non-existent key', () =>
      expect(getSetting('nothinghere', { facility })).resolves.toMatchSnapshot());
  });

  describe('set (global)', () => {
    it('sets a new scalar', async () => {
      const { Setting } = ctx.store.models;
      await expect(setSetting('test.enabled', 'true')).resolves.toMatchSnapshot();
      await expect(Setting.get('test.enabled')).resolves.toBe(true);
    });

    it('overwrites a scalar', async () => {
      const { Setting } = ctx.store.models;
      await expect(setSetting('test.value', '"test2"')).resolves.toMatchSnapshot();
      await expect(Setting.get('test.value')).resolves.toBe('test2');
    });

    it('sets a new array', async () => {
      const { Setting } = ctx.store.models;
      await expect(setSetting('test.list', '["groceries", "antiques"]')).resolves.toMatchSnapshot();
      await expect(Setting.get('test.list')).resolves.toStrictEqual(['groceries', 'antiques']);
    });

    it('overwrites an array', async () => {
      const { Setting } = ctx.store.models;
      await expect(setSetting('test.tree.flower', '["tulips"]')).resolves.toMatchSnapshot();
      await expect(Setting.get('test.tree.flower')).resolves.toStrictEqual(['tulips']);
    });

    it('sets a new object', async () => {
      const { Setting } = ctx.store.models;
      await expect(setSetting('test.dict', '{"broken": "eggs"}')).resolves.toMatchSnapshot();
      await expect(Setting.get('test.dict')).resolves.toStrictEqual({ broken: 'eggs' });
    });

    it('overwrites an object', async () => {
      const { Setting } = ctx.store.models;
      await expect(setSetting('test.tree.branch', '{ "leaf": "bug" }')).resolves.toMatchSnapshot();
      await expect(Setting.get('test.tree.branch')).resolves.toStrictEqual({ leaf: 'bug' });
      await expect(Setting.get('test.tree')).resolves.toStrictEqual({
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
      await expect(setSetting('test.enabled', 'true', { facility })).resolves.toMatchSnapshot();
      await expect(Setting.get('test.enabled', facility)).resolves.toBe(true);
    });

    it('sets a new scalar over a global one', async () => {
      const { Setting } = ctx.store.models;
      await expect(setSetting('test.value', '"test2"', { facility })).resolves.toMatchSnapshot();
      await expect(Setting.get('test.value')).resolves.toBe('test');
      await expect(Setting.get('test.value', facility)).resolves.toBe('test2');
    });

    it('sets a new array', async () => {
      const { Setting } = ctx.store.models;
      await expect(
        setSetting('test.list', '["groceries", "antiques"]', { facility }),
      ).resolves.toMatchSnapshot();
      await expect(Setting.get('test.list', facility)).resolves.toStrictEqual([
        'groceries',
        'antiques',
      ]);
    });

    it('sets a new array over a global one', async () => {
      const { Setting } = ctx.store.models;
      await expect(
        setSetting('test.tree.flower', '["tulips"]', { facility }),
      ).resolves.toMatchSnapshot();
      await expect(Setting.get('test.tree.flower')).resolves.toStrictEqual(['flower', 'girl']);
      await expect(Setting.get('test.tree.flower', facility)).resolves.toStrictEqual(['tulips']);
    });

    it('sets a new object', async () => {
      const { Setting } = ctx.store.models;
      await expect(
        setSetting('test.dict', '{"broken": "eggs"}', { facility }),
      ).resolves.toMatchSnapshot();
      await expect(Setting.get('test.dict', facility)).resolves.toStrictEqual({ broken: 'eggs' });
    });

    it('sets a new object over a global one', async () => {
      const { Setting } = ctx.store.models;
      await expect(
        setSetting('test.tree.branch', '{ "leaf": "bug" }', { facility }),
      ).resolves.toMatchSnapshot();

      await expect(Setting.get('test.tree.branch', facility)).resolves.toStrictEqual({
        leaf: 'bug',
      });
      await expect(Setting.get('test.tree.branch')).resolves.toStrictEqual({ leaf: 'leaf' });

      await expect(Setting.get('test.tree', facility)).resolves.toStrictEqual({
        flower: ['flower', 'girl'],
        branch: {
          leaf: 'bug',
        },
      });
      await expect(Setting.get('test.tree')).resolves.toStrictEqual({
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

        await expect(loadSettings('test.json', file)).resolves.toMatchSnapshot();

        await expect(Setting.get('test.json')).resolves.toStrictEqual({ really: { nice: 'eyes' } });
      });

      it('to a facility', async () => {
        const { Setting } = ctx.store.models;
        const file = join(tempdir, 'test.json');
        await writeFile(file, JSON.stringify({ really: { blue: 'eyes' } }));

        await expect(loadSettings('test.json', file, { facility })).resolves.toMatchSnapshot();

        await expect(Setting.get('test.json')).resolves.toBe(undefined);
        await expect(Setting.get('test.json', facility)).resolves.toStrictEqual({
          really: { blue: 'eyes' },
        });
      });

      it('preview only', async () => {
        const { Setting } = ctx.store.models;
        const file = join(tempdir, 'test.json');
        await writeFile(file, JSON.stringify({ really: { dull: 'eyes' } }));

        await expect(loadSettings('test.json', file, { preview: true })).resolves.toMatchSnapshot();

        await expect(Setting.get('test.json')).resolves.toBe(undefined);
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

        await expect(loadSettings('test.kdl', file)).resolves.toMatchSnapshot();

        await expect(Setting.get('test.kdl')).resolves.toStrictEqual({
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

        await expect(loadSettings('test.kdl', file, { facility })).resolves.toMatchSnapshot();

        await expect(Setting.get('test.kdl')).resolves.toBe(undefined);
        await expect(Setting.get('test.kdl', facility)).resolves.toStrictEqual({
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

        await expect(loadSettings('test.kdl', file, { preview: true })).resolves.toMatchSnapshot();

        await expect(Setting.get('test.kdl')).resolves.toBe(undefined);
      });
    });
  });
});
