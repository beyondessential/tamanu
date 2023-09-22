import * as yup from 'yup';

describe('customYupMethods', () => {
  it('should add a custom method to yup', () => {
    expect(yup.string().whenSetting('key', {})).toBeDefined();
  });
  it('should throw an error if settings are not passed to yup context', () => {
    const schema = yup.string().whenSetting('key', {
      is: 'value',
      then: yup.string().required(),
      otherwise: yup.string().notRequired(),
    });
    expect(schema.validate('value')).rejects.toThrow(
      'Settings reader must be passed to yup validation context to use custom "whenSetting" method',
    );
  });
  it('should validate when setting is equal to value', async () => {
    const schema = yup.string().whenSetting('key', {
      is: 'value',
      then: yup.string().required(),
      otherwise: yup.number().required(),
    });
    const settings = {
      get: jest.fn().mockResolvedValue('value'),
    };
    const result = await schema.validate('res', {
      context: {
        settings,
      },
    });
    expect(result).toEqual('res');
  });
  it('should validate when setting is not equal to value', async () => {
    const schema = yup.string().whenSetting('key', {
      is: 'value',
      then: yup.number().required(),
      otherwise: yup.string().required(),
    });
    const settings = {
      get: jest.fn().mockResolvedValue('not value'),
    };
    const result = await schema.validate('res', {
      context: {
        settings,
      },
    });
    expect(result).toEqual('res');
  });
  it('should validate when setting is equal to value and value is a function', async () => {
    const schema = yup.string().whenSetting('key', {
      is: value => value === 'value',
      then: yup.string().required(),
      otherwise: yup.number().required(),
    });
    const settings = {
      get: jest.fn().mockResolvedValue('value'),
    };
    const result = await schema.validate('res', {
      context: {
        settings,
      },
    });
    expect(result).toEqual('res');
  });
  it('should validate when setting is not equal to value and value is a function', async () => {
    const schema = yup.string().whenSetting('key', {
      is: value => value === 'value',
      then: yup.number().required(),
      otherwise: yup.string().required(),
    });
    const settings = {
      get: jest.fn().mockResolvedValue('not value'),
    };
    const result = await schema.validate('res', {
      context: {
        settings,
      },
    });
    expect(result).toEqual('res');
  });
});
