import axios from 'axios';

export const apiAuth = axios.create({
  baseURL: '/auth',
  headers: {
    'Content-Type': 'application/json',
  },
});