import { apiClient } from './client.js'

export const departmentApi = {
  async list(params = {}) {
    const { data } = await apiClient.get('/departments', { params })
    return data
  },

  async getById(id) {
    const { data } = await apiClient.get(`/departments/${id}`)
    return data
  },

  async getHod(id) {
    const { data } = await apiClient.get(`/departments/${id}/hod`)
    return data
  },

  async create(payload) {
    const { data } = await apiClient.post('/departments', payload)
    return data
  },

  async update(id, payload) {
    const { data } = await apiClient.patch(`/departments/${id}`, payload)
    return data
  },

  async setStatus(id, status) {
    const { data } = await apiClient.patch(`/departments/${id}/status`, { status })
    return data
  },
}
