import { useQuery } from '@tanstack/react-query'
import api from '../api/client'

export function useApplications() {
  return useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const res = await api.get('/api/applications')
      return res.data.data
    },
  })
}

export function useIngestionLog(limit = 20) {
  return useQuery({
    queryKey: ['ingestion-log', limit],
    queryFn: async () => {
      const res = await api.get(`/api/applications/ingestion-log?limit=${limit}`)
      return res.data.data
    },
    staleTime: 30 * 1000, // 30 seconds
  })
}
