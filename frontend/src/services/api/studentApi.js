import { apiClient } from './client.js'

export const studentApi = {
  async list(params = {}) {
    const { data } = await apiClient.get('/students', { params })
    return data
  },

  async getById(id) {
    const { data } = await apiClient.get(`/students/${id}`)
    return data
  },

  async create(payload) {
    const { data } = await apiClient.post('/students', payload)
    return data
  },

  async update(id, payload) {
    const { data } = await apiClient.patch(`/students/${id}`, payload)
    return data
  },

  async setStatus(id, status) {
    const { data } = await apiClient.patch(`/students/${id}/status`, { status })
    return data
  },
}
