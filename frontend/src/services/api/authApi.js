import { apiClient, setAccessToken } from './client.js'

export const authApi = {
  async login({ email, password }) {
    const { data } = await apiClient.post('/auth/login', { email, password })
    if (data?.accessToken) {
      setAccessToken(data.accessToken)
    }
    return data
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      setAccessToken(null)
    }
  },

  async refresh() {
    const { data } = await apiClient.post('/auth/refresh')
    if (data?.accessToken) {
      setAccessToken(data.accessToken)
    }
    return data
  },

  async getMe() {
    const { data } = await apiClient.get('/auth/me')
    return data
  },
}
