import { apiClient } from './client.js'

export const hodApi = {
  async list(params = {}) {
    const { data } = await apiClient.get('/hods', { params })
    return data
  },

  async getById(id) {
    const { data } = await apiClient.get(`/hods/${id}`)
    return data
  },

  async create(payload) {
    const { data } = await apiClient.post('/hods', payload)
    return data
  },

  async update(id, payload) {
    const { data } = await apiClient.patch(`/hods/${id}`, payload)
    return data
  },

  async setStatus(id, status) {
    const { data } = await apiClient.patch(`/hods/${id}/status`, { status })
    return data
  },
}
