import { AxiosResponse } from 'axios';
import { API } from './BaseAPI';
import { ProgramModel } from '/root/App/models/Program';

export const programs = {
  get: (): Promise<AxiosResponse<ProgramModel[]>> => API.get('programs'),
};
