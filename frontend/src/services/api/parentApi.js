import { apiClient } from './client.js'

export const parentApi = {
  async list(params = {}) {
    const { data } = await apiClient.get('/parents', { params })
    return data
  },

  async getById(id) {
    const { data } = await apiClient.get(`/parents/${id}`)
    return data
  },

  async create(payload) {
    const { data } = await apiClient.post('/parents', payload)
    return data
  },

  async update(id, payload) {
    const { data } = await apiClient.patch(`/parents/${id}`, payload)
    return data
  },

  async setStatus(id, status) {
    const { data } = await apiClient.patch(`/parents/${id}/status`, { status })
    return data
  },

  async getMyChildren(params = {}) {
    const { data } = await apiClient.get('/parents/me/children', { params })
    return data
  },

  async getChildren(parentId, params = {}) {
    const { data } = await apiClient.get(`/parents/${parentId}/children`, { params })
    return data
  },

  async addChild(parentId, payload) {
    const { data } = await apiClient.post(`/parents/${parentId}/children`, payload)
    return data
  },

  async removeChild(parentId, studentId) {
    const { data } = await apiClient.delete(`/parents/${parentId}/children/${studentId}`)
    return data
  },
}
