import { registerSettingsPathListener } from '../src/cache/dbNotifier';

const settled = () =>
  new Promise(resolve => {
    setTimeout(resolve, 400);
  });

const notifierFor = options => {
  let listener;
  registerSettingsPathListener(callback => {
    listener = callback;
  }, options);
  return payload => listener({ table: 'settings', event: 'UPDATE', newId: 'row-1', ...payload });
};

describe('registerSettingsPathListener', () => {
  it('runs onChange for a setting under a watched path', async () => {
    const onChange = jest.fn();
    const notify = notifierFor({
      paths: ['ai', 'patientSummary'],
      resolveChangedKey: async () => 'ai.anthropicModel',
      onChange,
    });

    notify();
    await settled();

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('ignores a setting outside the watched paths', async () => {
    const onChange = jest.fn();
    const notify = notifierFor({
      paths: ['ai'],
      resolveChangedKey: async () => 'vaccinations.defaultDose',
      onChange,
    });

    notify();
    await settled();

    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not match a path that is only a name prefix', async () => {
    const onChange = jest.fn();
    const notify = notifierFor({
      paths: ['ai'],
      resolveChangedKey: async () => 'airQuality.threshold',
      onChange,
    });

    notify();
    await settled();

    expect(onChange).not.toHaveBeenCalled();
  });

  it('runs onChange when the key cannot be resolved', async () => {
    const onChange = jest.fn();
    const notify = notifierFor({
      paths: ['ai'],
      resolveChangedKey: async () => null,
      onChange,
    });

    notify();
    await settled();

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('collapses one save spread over several rows into a single run', async () => {
    const onChange = jest.fn();
    const notify = notifierFor({
      paths: ['ai'],
      resolveChangedKey: async () => 'ai.enabled',
      onChange,
    });

    notify({ newId: 'row-1' });
    notify({ newId: 'row-2' });
    notify({ newId: 'row-3' });
    await settled();

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('reports a failing onChange without letting it reject', async () => {
    const onError = jest.fn();
    const notify = notifierFor({
      paths: ['ai'],
      resolveChangedKey: async () => 'ai.enabled',
      onChange: async () => {
        throw new Error('rebuild failed');
      },
      onError,
    });

    notify();
    await settled();

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'rebuild failed' }));
  });

  it('ignores changes to other tables', async () => {
    const onChange = jest.fn();
    const resolveChangedKey = jest.fn();
    const notify = notifierFor({ paths: ['ai'], resolveChangedKey, onChange });

    notify({ table: 'patients' });
    await settled();

    expect(resolveChangedKey).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
