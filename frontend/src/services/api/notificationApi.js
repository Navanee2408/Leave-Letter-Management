import { apiClient } from './client.js'

export const notificationApi = {
  async listMy(params = {}) {
    const { data } = await apiClient.get('/notifications/my', { params })
    return data
  },

  async getUnreadCount() {
    const { data } = await apiClient.get('/notifications/unread-count')
    return data
  },

  async markRead(id) {
    const { data } = await apiClient.patch(`/notifications/${id}/read`)
    return data
  },

  async markAllRead() {
    const { data } = await apiClient.patch('/notifications/read-all')
    return data
  },
}
