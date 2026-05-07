import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

export const generateISO = async (config: any) => {
  const response = await axios.post(`${API_URL}/api/generate`, config, {
    responseType: 'blob',
  });
  return response.data;
};
