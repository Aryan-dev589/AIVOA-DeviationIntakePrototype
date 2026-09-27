import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000',
});


export const extractDeviation = async (payload) => {
  // payload is always a FormData object now — built by the caller for both
  // pasted text and file upload, since FastAPI's Form/File both require multipart
  const response = await api.post('/deviations/extract', payload);
  return response.data;
};

export const saveDeviation = async (deviationData) => {
  const response = await api.post('/deviations', deviationData);
  return response.data;
};

export const updateDeviation = async (id, deviationData) => {
  const response = await api.patch(`/deviations/${id}`, deviationData);
  return response.data;
};

export const editDeviationChat = async (message, currentForm) => {
  const response = await api.post('/deviations/edit', {
    message,
    current_form: currentForm,
  });
  return response.data;
};