import api from './api';

// Create request
const createMaterialRequest = async (requestData) => {
  const { data } = await api.post('/material-requests/request', requestData);
  return data;
};

// Engineer approval
const engineerApproval = async (id, approvalData) => {
  const { data } = await api.put(`/material-requests/${id}/engineer-approval`, approvalData);
  return data;
};

// Contractor approval
const contractorApproval = async (id, approvalData) => {
  const { data } = await api.put(`/material-requests/${id}/contractor-approval`, approvalData);
  return data;
};

// Get all
const getAllMaterialRequests = async (params = {}) => {
  const { data } = await api.get('/material-requests', { params });
  return data;
};

// Get my requests
const getMyMaterialRequests = async () => {
  const { data } = await api.get('/material-requests/my-requests');
  return data;
};

// Get project requests
const getProjectMaterialRequests = async (projectId) => {
  const { data } = await api.get(`/material-requests/project/${projectId}`);
  return data;
};

export const materialRequestService = {
  createMaterialRequest,
  engineerApproval,
  contractorApproval,
  getAllMaterialRequests,
  getMyMaterialRequests,
  getProjectMaterialRequests
};
