import { fake } from 'shared/test-helpers/fake';
import { listSettings, getSetting, setSetting, loadSettings } from '../../app/subCommands/settings';
import { createTestContext } from '../utilities';

describe('settings', () => {
  let ctx,
    facility = '38ee9650-9b0c-440f-8b0c-c9526fba35ea';
  beforeAll(async () => {
    ctx = await createTestContext();
    const { Setting, Facility } = ctx.store.models;
    await Facility.create(fake(Facility, { id: facility }));

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
    );
  });
  afterAll(() => ctx.close());

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
});
