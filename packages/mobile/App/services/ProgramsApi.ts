import { AxiosResponse } from 'axios';
import { API } from './API';
import { ProgramModel } from '../models/Program';

export const ProgramsAPI = {
  getList: (): Promise<AxiosResponse<ProgramModel[]>> => API.get('/programs'),
};
