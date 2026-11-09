import { apiClient } from './client.js'

export const classApi = {
  async list(params = {}) {
    const { data } = await apiClient.get('/classes', { params })
    return data
  },

  async getById(id) {
    const { data } = await apiClient.get(`/classes/${id}`)
    return data
  },

  async create(payload) {
    const { data } = await apiClient.post('/classes', payload)
    return data
  },

  async update(id, payload) {
    const { data } = await apiClient.patch(`/classes/${id}`, payload)
    return data
  },

  async setStatus(id, status) {
    const { data } = await apiClient.patch(`/classes/${id}/status`, { status })
    return data
  },
}
