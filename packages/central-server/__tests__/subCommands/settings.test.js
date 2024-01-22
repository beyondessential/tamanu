// import { join } from 'path';
// import { mkdtemp, writeFile, rmdir } from 'fs/promises';
// import { tmpdir } from 'os';
// import { fake } from '@tamanu/shared/test-helpers/fake';
// import { Op } from 'sequelize';
// import { SETTINGS_SCOPES } from '@tamanu/constants';
// import { getSetting, setSetting, loadSettings } from '../../app/subCommands/settings';
// import { createTestContext } from '../utilities';

describe('settings', () => {
  it('does nothing', () => {
    expect(true).toBe(true);
  });
  // TODO: subcommand creates a non test context and these tests cause some trouble
  // let ctx;
  // const facility = '38ee9650-9b0c-440f-8b0c-c9526fba35ea';
  // beforeAll(async () => {
  //   ctx = await createTestContext();
  //   const { Facility } = ctx.store.models;
  //   await Facility.create(fake(Facility, { id: facility }));
  // });
  // afterAll(() => ctx.close());
  // afterEach(async () => {
  //   const { Setting } = ctx.store.models;
  //   await Setting.destroy({
  //     where: {
  //       key: {
  //         [Op.like]: 'test%',
  //       },
  //     },
  //     force: true,
  //   });
  // });
  // beforeEach(async () => {
  //   const { Setting } = ctx.store.models;
  //   try {
  //     await Setting.set(
  //       'test',
  //       {
  //         value: 'test',
  //         tree: {
  //           flower: ['flower', 'girl'],
  //           branch: {
  //             leaf: 'leaf',
  //           },
  //         },
  //       },
  //       SETTINGS_SCOPES.GLOBAL,
  //     );
  //     await Setting.set(
  //       'test',
  //       {
  //         house: {
  //           door: 'wooden',
  //           window: 'glass',
  //         },
  //         beings: ['person', 'dog', 'cat'],
  //       },
  //       SETTINGS_SCOPES.CENTRAL,
  //     );
  //     await Setting.set(
  //       'test',
  //       {
  //         tree: {
  //           squirrels: ['bunny', 'muffin'],
  //           branch: {
  //             leaf: 'weed',
  //             root: 'root',
  //           },
  //         },
  //       },
  //       SETTINGS_SCOPES.FACILITY,
  //       facility,
  //     );
  //   } catch (err) {
  //     console.log(err);
  //     throw err;
  //   }
  // });
  // describe('get (global)', () => {
  //   it('retrieves a scalar', () =>
  //     expect(
  //       getSetting('test.value', { scope: SETTINGS_SCOPES.GLOBAL }),
  //     ).resolves.toMatchSnapshot());
  //   it('retrieves an array', () =>
  //     expect(
  //       getSetting('test.tree.flower', { scope: SETTINGS_SCOPES.GLOBAL }),
  //     ).resolves.toMatchSnapshot());
  //   it('retrieves an object', () =>
  //     expect(
  //       getSetting('test.tree.branch', { scope: SETTINGS_SCOPES.GLOBAL }),
  //     ).resolves.toMatchSnapshot());
  //   it('retrieves a non-existent key', () =>
  //     expect(
  //       getSetting('nothinghere', { scope: SETTINGS_SCOPES.GLOBAL }),
  //     ).resolves.toMatchSnapshot());
  // });
  // describe('get (facility)', () => {
  //   it('retrieves a scalar', () =>
  //     expect(
  //       getSetting('test.tree.branch.root', { facility, scope: SETTINGS_SCOPES.FACILITY }),
  //     ).resolves.toMatchSnapshot());
  //   it('retrieves an array', () =>
  //     expect(
  //       getSetting('test.tree.squirrels', { facility, scope: SETTINGS_SCOPES.FACILITY }),
  //     ).resolves.toMatchSnapshot());
  //   it('retrieves an object', () =>
  //     expect(
  //       getSetting('test.tree.branch', { facility, scope: SETTINGS_SCOPES.FACILITY }),
  //     ).resolves.toMatchSnapshot());
  //   it('retrieves a non-existent key', () =>
  //     expect(
  //       getSetting('nothinghere', { facility, scope: SETTINGS_SCOPES.FACILITY }),
  //     ).resolves.toMatchSnapshot());
  // });
  // describe('get (central)', () => {
  //   it('retrieves a scalar', () =>
  //     expect(
  //       getSetting('test.house.door', { facility, scope: SETTINGS_SCOPES.CENTRAL }),
  //     ).resolves.toMatchSnapshot());
  //   it('retrieves an array', () =>
  //     expect(
  //       getSetting('test.beings', { facility, scope: SETTINGS_SCOPES.CENTRAL }),
  //     ).resolves.toMatchSnapshot());
  //   it('retrieves an object', () =>
  //     expect(
  //       getSetting('test.house', { facility, scope: SETTINGS_SCOPES.CENTRAL }),
  //     ).resolves.toMatchSnapshot());
  //   it('retrieves a non-existent key', () =>
  //     expect(
  //       getSetting('nothinghere', { facility, scope: SETTINGS_SCOPES.CENTRAL }),
  //     ).resolves.toMatchSnapshot());
  // });
  // describe('set (global)', () => {
  //   it('sets a new scalar', async () => {
  //     const { Setting } = ctx.store.models;
  //     await expect(
  //       setSetting('test.enabled', 'true', { scope: SETTINGS_SCOPES.GLOBAL }),
  //     ).resolves.toMatchSnapshot();
  //     await expect(Setting.get('test.enabled', null, SETTINGS_SCOPES.GLOBAL)).resolves.toBe(true);
  //   });
  //   it('overwrites a scalar', async () => {
  //     const { Setting } = ctx.store.models;
  //     await expect(
  //       setSetting('test.value', '"test2"', { scope: SETTINGS_SCOPES.GLOBAL }),
  //     ).resolves.toMatchSnapshot();
  //     await expect(Setting.get('test.value', null, SETTINGS_SCOPES.GLOBAL)).resolves.toBe('test2');
  //   });
  //   it('sets a new array', async () => {
  //     const { Setting } = ctx.store.models;
  //     await expect(
  //       setSetting('test.list', '["groceries", "antiques"]', { scope: SETTINGS_SCOPES.GLOBAL }),
  //     ).resolves.toMatchSnapshot();
  //     await expect(Setting.get('test.list', null, SETTINGS_SCOPES.GLOBAL)).resolves.toStrictEqual([
  //       'groceries',
  //       'antiques',
  //     ]);
  //   });
  //   it('overwrites an array', async () => {
  //     const { Setting } = ctx.store.models;
  //     await expect(
  //       setSetting('test.tree.flower', '["tulips"]', { scope: SETTINGS_SCOPES.GLOBAL }),
  //     ).resolves.toMatchSnapshot();
  //     await expect(
  //       Setting.get('test.tree.flower', null, SETTINGS_SCOPES.GLOBAL),
  //     ).resolves.toStrictEqual(['tulips']);
  //   });
  //   it('sets a new object', async () => {
  //     const { Setting } = ctx.store.models;
  //     await expect(
  //       setSetting('test.dict', '{"broken": "eggs"}', { scope: SETTINGS_SCOPES.GLOBAL }),
  //     ).resolves.toMatchSnapshot();
  //     await expect(Setting.get('test.dict', null, SETTINGS_SCOPES.GLOBAL)).resolves.toStrictEqual({
  //       broken: 'eggs',
  //     });
  //   });
  //   it('overwrites an object', async () => {
  //     const { Setting } = ctx.store.models;
  //     await expect(
  //       setSetting('test.tree.branch', '{ "leaf": "bug" }', { scope: SETTINGS_SCOPES.GLOBAL }),
  //     ).resolves.toMatchSnapshot();
  //     await expect(
  //       Setting.get('test.tree.branch', null, SETTINGS_SCOPES.GLOBAL),
  //     ).resolves.toStrictEqual({
  //       leaf: 'bug',
  //     });
  //     await expect(Setting.get('test.tree', null, SETTINGS_SCOPES.GLOBAL)).resolves.toStrictEqual({
  //       flower: ['flower', 'girl'],
  //       branch: {
  //         leaf: 'bug',
  //       },
  //     });
  //   });
  // });
  // describe('set (central)', () => {
  //   it('sets a new scalar', async () => {
  //     const { Setting } = ctx.store.models;
  //     await expect(
  //       setSetting('test.kennel', 'true', { scope: SETTINGS_SCOPES.CENTRAL }),
  //     ).resolves.toMatchSnapshot();
  //     await expect(Setting.get('test.kennel', null, SETTINGS_SCOPES.CENTRAL)).resolves.toBe(true);
  //   });
  //   it('overwrites a scalar', async () => {
  //     const { Setting } = ctx.store.models;
  //     await expect(
  //       setSetting('test.house.door', '"metal"', { scope: SETTINGS_SCOPES.CENTRAL }),
  //     ).resolves.toMatchSnapshot();
  //     await expect(Setting.get('test.house.door', null, SETTINGS_SCOPES.CENTRAL)).resolves.toBe(
  //       'metal',
  //     );
  //   });
  //   it('sets a new array', async () => {
  //     const { Setting } = ctx.store.models;
  //     await expect(
  //       setSetting('test.house.features', '["kitchen", "pool"]', {
  //         scope: SETTINGS_SCOPES.CENTRAL,
  //       }),
  //     ).resolves.toMatchSnapshot();
  //     await expect(
  //       Setting.get('test.house.features', null, SETTINGS_SCOPES.CENTRAL),
  //     ).resolves.toStrictEqual(['kitchen', 'pool']);
  //   });
  //   it('overwrites an array', async () => {
  //     const { Setting } = ctx.store.models;
  //     await expect(
  //       setSetting('test.house.beings', '["monkey", "horse"]', { scope: SETTINGS_SCOPES.CENTRAL }),
  //     ).resolves.toMatchSnapshot();
  //     await expect(
  //       Setting.get('test.house.beings', null, SETTINGS_SCOPES.CENTRAL),
  //     ).resolves.toStrictEqual(['monkey', 'horse']);
  //   });
  //   it('sets a new object', async () => {
  //     const { Setting } = ctx.store.models;
  //     await expect(
  //       setSetting('test.dict', '{"home": "line"}', { scope: SETTINGS_SCOPES.CENTRAL }),
  //     ).resolves.toMatchSnapshot();
  //     await expect(Setting.get('test.dict', null, SETTINGS_SCOPES.CENTRAL)).resolves.toStrictEqual({
  //       home: 'line',
  //     });
  //   });
  //   it('overwrites an object', async () => {
  //     const { Setting } = ctx.store.models;
  //     await expect(
  //       setSetting('test.house', '{ "pool": "water" }', { scope: SETTINGS_SCOPES.GLOBAL }),
  //     ).resolves.toMatchSnapshot();
  //     await expect(Setting.get('test.house', null, SETTINGS_SCOPES.GLOBAL)).resolves.toStrictEqual({
  //       pool: 'water',
  //     });
  //   });
  // });
  // describe('set (facility)', () => {
  //   it('sets a new scalar', async () => {
  //     const { Setting } = ctx.store.models;
  //     await expect(
  //       setSetting('test.enabled', 'true', { facility, scope: SETTINGS_SCOPES.FACILITY }),
  //     ).resolves.toMatchSnapshot();
  //     await expect(Setting.get('test.enabled', facility, SETTINGS_SCOPES.FACILITY)).resolves.toBe(
  //       true,
  //     );
  //   });
  //   it('sets a new array', async () => {
  //     const { Setting } = ctx.store.models;
  //     await expect(
  //       setSetting('test.list', '["groceries", "antiques"]', {
  //         facility,
  //         scope: SETTINGS_SCOPES.FACILITY,
  //       }),
  //     ).resolves.toMatchSnapshot();
  //     await expect(
  //       Setting.get('test.list', facility, SETTINGS_SCOPES.FACILITY),
  //     ).resolves.toStrictEqual(['groceries', 'antiques']);
  //   });
  //   it('sets a new object', async () => {
  //     const { Setting } = ctx.store.models;
  //     await expect(
  //       setSetting('test.dict', '{"broken": "eggs"}', {
  //         facility,
  //         scope: SETTINGS_SCOPES.FACILITY,
  //       }),
  //     ).resolves.toMatchSnapshot();
  //     await expect(
  //       Setting.get('test.dict', facility, SETTINGS_SCOPES.FACILITY),
  //     ).resolves.toStrictEqual({ broken: 'eggs' });
  //   });
  // });
  // describe('load', () => {
  //   let tempdir;
  //   beforeEach(async () => {
  //     tempdir = await mkdtemp(join(tmpdir(), 'settings-'));
  //   });
  //   afterEach(async () => {
  //     await rmdir(tempdir, { recursive: true });
  //   });
  //   describe('a json file', () => {
  //     it('to global namespace', async () => {
  //       const { Setting } = ctx.store.models;
  //       const file = join(tempdir, 'test.json');
  //       await writeFile(file, JSON.stringify({ really: { nice: 'eyes' } }));
  //       await expect(
  //         loadSettings('test.json', file, { scope: SETTINGS_SCOPES.GLOBAL }),
  //       ).resolves.toMatchSnapshot();
  //       await expect(Setting.get('test.json', null, SETTINGS_SCOPES.GLOBAL)).resolves.toStrictEqual(
  //         {
  //           really: { nice: 'eyes' },
  //         },
  //       );
  //     });
  //     it('to a facility', async () => {
  //       const { Setting } = ctx.store.models;
  //       const file = join(tempdir, 'test.json');
  //       await writeFile(file, JSON.stringify({ really: { blue: 'eyes' } }));
  //       await expect(
  //         loadSettings('test.json', file, { facility, scope: SETTINGS_SCOPES.FACILITY }),
  //       ).resolves.toMatchSnapshot();
  //       await expect(Setting.get('test.json', null, SETTINGS_SCOPES.GLOBAL)).resolves.toBe(
  //         undefined,
  //       );
  //       await expect(Setting.get('test.json', null, SETTINGS_SCOPES.CENTRAL)).resolves.toBe(
  //         undefined,
  //       );
  //       await expect(
  //         Setting.get('test.json', facility, SETTINGS_SCOPES.FACILITY),
  //       ).resolves.toStrictEqual({
  //         really: { blue: 'eyes' },
  //       });
  //     });
  //     it('to central', async () => {
  //       const { Setting } = ctx.store.models;
  //       const file = join(tempdir, 'test.json');
  //       await writeFile(file, JSON.stringify({ really: { purple: 'hat' } }));
  //       await expect(
  //         loadSettings('test.json', file, { scope: SETTINGS_SCOPES.CENTRAL }),
  //       ).resolves.toMatchSnapshot();
  //       await expect(Setting.get('test.json', null, SETTINGS_SCOPES.GLOBAL)).resolves.toBe(
  //         undefined,
  //       );
  //       await expect(Setting.get('test.json', facility, SETTINGS_SCOPES.FACILITY)).resolves.toBe(
  //         undefined,
  //       );
  //       await expect(
  //         Setting.get('test.json', null, SETTINGS_SCOPES.CENTRAL),
  //       ).resolves.toStrictEqual({
  //         really: { purple: 'hat' },
  //       });
  //     });
  //     it('preview only', async () => {
  //       const { Setting } = ctx.store.models;
  //       const file = join(tempdir, 'test.json');
  //       await writeFile(file, JSON.stringify({ really: { dull: 'eyes' } }));
  //       await expect(
  //         loadSettings('test.json', file, { preview: true, scope: SETTINGS_SCOPES.GLOBAL }),
  //       ).resolves.toMatchSnapshot();
  //       await expect(Setting.get('test.json', null, SETTINGS_SCOPES.GLOBAL)).resolves.toBe(
  //         undefined,
  //       );
  //     });
  //   });
  //   describe('a KDL file', () => {
  //     it('to global namespace', async () => {
  //       const { Setting } = ctx.store.models;
  //       const file = join(tempdir, 'test.kdl');
  //       await writeFile(
  //         file,
  //         `
  //         test.kdl {
  //           character "Marten Reed"
  //           firstAppearance 1
  //           human true
  //         }
  //         `,
  //       );
  //       await expect(
  //         loadSettings('test.kdl', file, { scope: SETTINGS_SCOPES.GLOBAL }),
  //       ).resolves.toMatchSnapshot();
  //       await expect(Setting.get('test.kdl', null, SETTINGS_SCOPES.GLOBAL)).resolves.toStrictEqual({
  //         character: 'Marten Reed',
  //         firstAppearance: 1,
  //         human: true,
  //       });
  //     });
  //     it('to central', async () => {
  //       const { Setting } = ctx.store.models;
  //       const file = join(tempdir, 'test.kdl');
  //       await writeFile(
  //         file,
  //         `
  //         test.kdl {
  //           character "Donkey Man"
  //           firstAppearance 2
  //           human "partly"
  //         }
  //         `,
  //       );
  //       await expect(
  //         loadSettings('test.kdl', file, { scope: SETTINGS_SCOPES.CENTRAL }),
  //       ).resolves.toMatchSnapshot();
  //       await expect(Setting.get('test.kdl', null, SETTINGS_SCOPES.CENTRAL)).resolves.toStrictEqual(
  //         {
  //           character: 'Donkey Man',
  //           firstAppearance: 2,
  //           human: 'partly',
  //         },
  //       );
  //     });
  //     it('to a facility', async () => {
  //       const { Setting } = ctx.store.models;
  //       const file = join(tempdir, 'test.kdl');
  //       await writeFile(
  //         file,
  //         `
  //         test.kdl {
  //           character "Pintsize"
  //           firstAppearance 1
  //           human false
  //         }
  //         `,
  //       );
  //       await expect(
  //         loadSettings('test.kdl', file, { facility, scope: SETTINGS_SCOPES.FACILITY }),
  //       ).resolves.toMatchSnapshot();
  //       await expect(Setting.get('test.kdl', null, SETTINGS_SCOPES.GLOBAL)).resolves.toBe(
  //         undefined,
  //       );
  //       await expect(
  //         Setting.get('test.kdl', facility, SETTINGS_SCOPES.FACILITY),
  //       ).resolves.toStrictEqual({
  //         character: 'Pintsize',
  //         firstAppearance: 1,
  //         human: false,
  //       });
  //     });
  //     it('preview only', async () => {
  //       const { Setting } = ctx.store.models;
  //       const file = join(tempdir, 'test.kdl');
  //       await writeFile(
  //         file,
  //         `
  //         test.kdl {
  //           character "Claire Augustus"
  //           firstAppearance 2203
  //           human true
  //         }
  //         `,
  //       );
  //       await expect(
  //         loadSettings('test.kdl', file, { preview: true, scope: SETTINGS_SCOPES.GLOBAL }),
  //       ).resolves.toMatchSnapshot();
  //       await expect(Setting.get('test.kdl', null, SETTINGS_SCOPES.GLOBAL)).resolves.toBe(
  //         undefined,
  //       );
  //     });
  //   });
  // });
});
