import { apiClient } from './client.js'

export const tutorApi = {
  async list(params = {}) {
    const { data } = await apiClient.get('/tutors', { params })
    return data
  },

  async getById(id) {
    const { data } = await apiClient.get(`/tutors/${id}`)
    return data
  },

  async create(payload) {
    const { data } = await apiClient.post('/tutors', payload)
    return data
  },

  async update(id, payload) {
    const { data } = await apiClient.patch(`/tutors/${id}`, payload)
    return data
  },

  async setStatus(id, status) {
    const { data } = await apiClient.patch(`/tutors/${id}/status`, { status })
    return data
  },

  async getMyClasses() {
    const { data } = await apiClient.get('/tutors/me/classes')
    return data
  },

  async getMyStudents() {
    const { data } = await apiClient.get('/tutors/me/students')
    return data
  },

  async getMyApprovedLeaves(params = {}) {
    const { data } = await apiClient.get('/tutors/me/approved-leaves', { params })
    return data
  },
}
