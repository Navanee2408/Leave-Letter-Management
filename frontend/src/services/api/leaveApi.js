import { apiClient } from './client.js'

export const leaveApi = {
  async list(params = {}) {
    const { data } = await apiClient.get('/leave-applications', { params })
    return data
  },

  async listMy(params = {}) {
    const { data } = await apiClient.get('/leave-applications/my', { params })
    return data
  },

  async getById(id) {
    const { data } = await apiClient.get(`/leave-applications/${id}`)
    return data
  },

  async getHistory(id) {
    const { data } = await apiClient.get(`/leave-applications/${id}/history`)
    return data
  },

  async getDocumentBlob(id) {
    const response = await apiClient.get(`/leave-applications/${id}/document`, {
      responseType: 'blob',
    })
    return response.data
  },

  async submit(payload) {
    let body = payload
    let headers = {}

    if (!(payload instanceof FormData)) {
      const formData = new FormData()
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (
            (key === 'document' || key === 'supportingDocument') &&
            (value instanceof File || value instanceof Blob)
          ) {
            formData.append('supportingDocument', value)
          } else if (key !== 'document' && key !== 'supportingDocument') {
            formData.append(key, value)
          }
        }
      })
      body = formData
      headers['Content-Type'] = 'multipart/form-data'
    } else {
      headers['Content-Type'] = 'multipart/form-data'
    }

    const { data } = await apiClient.post('/leave-applications', body, { headers })
    return data
  },

  async approve(id, comment = '') {
    const { data } = await apiClient.post(`/leave-applications/${id}/approve`, {
      comment: comment ? String(comment).trim() : undefined,
    })
    return data
  },

  async reject(id, reason) {
    const { data } = await apiClient.post(`/leave-applications/${id}/reject`, {
      reason: String(reason).trim(),
    })
    return data
  },

  async reopen(id, reason) {
    const { data } = await apiClient.post(`/leave-applications/${id}/reopen`, {
      reason: String(reason).trim(),
    })
    return data
  },
}
