import { REPORT_STATUSES } from 'shared/constants';
import { spyOnModule } from 'shared/test-helpers/spyOn';
import { importReport } from '../../../app/subCommands/importReport';
import * as importUtils from '../../../app/subCommands/importReport/utils';
import * as importActions from '../../../app/subCommands/importReport/actions';

jest.mock('../../../app/database', () => ({
  initDatabase: jest.fn().mockResolvedValue('test-store'),
}));

spyOnModule(jest, '../../../app/subCommands/importReport/utils');
spyOnModule(jest, '../../../app/subCommands/importReport/actions');

const mockVersions = [
  { versionNumber: 1, status: REPORT_STATUSES.DRAFT },
  { versionNumber: 2, status: REPORT_STATUSES.DRAFT },
];

const mockDefinition = {
  name: 'test-definition-name',
  getVersions: jest.fn().mockResolvedValue(mockVersions),
};

describe('importReport', () => {
  it('calls list version when list option is provided', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const findOrCreateDefinitionSpy = jest
      .spyOn(importUtils, 'findOrCreateDefinition')
      .mockResolvedValue(mockDefinition);
    const listVersionsSpy = jest.spyOn(importActions, 'listVersions').mockImplementation();
    const options = { list: true, name: 'test-name' };
    await importReport(options);
    expect(exitSpy).toBeCalledWith(0);
    expect(findOrCreateDefinitionSpy).toBeCalledWith(options.name, 'test-store');
    expect(mockDefinition.getVersions).toHaveBeenCalled();
    expect(listVersionsSpy).toBeCalledWith(mockDefinition, mockVersions, 'test-store');
  });
  it('calls create version when file option is provided', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const findOrCreateDefinitionSpy = jest
      .spyOn(importUtils, 'findOrCreateDefinition')
      .mockResolvedValue(mockDefinition);
    const createVersionSpy = jest.spyOn(importActions, 'createVersion').mockImplementation();
    const options = { file: 'test-file', name: 'test-name', verbose: false };
    await importReport(options);
    expect(exitSpy).toBeCalledWith(0);
    expect(findOrCreateDefinitionSpy).toBeCalledWith(options.name, 'test-store');
    expect(mockDefinition.getVersions).toHaveBeenCalled();
    expect(createVersionSpy).toBeCalledWith(
      options.file,
      mockDefinition,
      mockVersions,
      'test-store',
      false,
    );
  });
  it('calls both create version and list versions when both options are provided', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const findOrCreateDefinitionSpy = jest
      .spyOn(importUtils, 'findOrCreateDefinition')
      .mockResolvedValue(mockDefinition);
    const createVersionSpy = jest.spyOn(importActions, 'createVersion').mockImplementation();
    const listVersionsSpy = jest.spyOn(importActions, 'listVersions').mockImplementation();
    const options = { file: 'test-file', list: true, name: 'test-name', verbose: true };
    await importReport(options);
    expect(exitSpy).toBeCalledWith(0);
    expect(findOrCreateDefinitionSpy).toBeCalledWith(options.name, 'test-store');
    expect(mockDefinition.getVersions).toBeCalled();
    expect(createVersionSpy).toBeCalledWith(
      options.file,
      mockDefinition,
      mockVersions,
      'test-store',
      true
    );
    expect(listVersionsSpy).toBeCalledWith(mockDefinition, mockVersions, 'test-store');
  });
});
