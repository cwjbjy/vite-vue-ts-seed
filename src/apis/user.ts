import HttpClient from '../utils/axios';
import type { ListParams, ListModel } from './model/userModel';

export const getList = (params: ListParams) => {
  return HttpClient.get<ListModel>('/list', { params });
};
