import HttpClient from '../utils/axios';

export const getList = () => {
  return HttpClient.get('/list');
};
