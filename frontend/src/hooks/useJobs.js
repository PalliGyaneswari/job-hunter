import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'

export function useJobs(filters) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.tab)      params.set('tab',      filters.tab)
      if (filters.category) params.set('category', filters.category)
      if (filters.location) params.set('location', filters.location)
      if (filters.search)   params.set('search',   filters.search)
      if (filters.page)     params.set('page',     filters.page)
      if (filters.limit)    params.set('limit',    filters.limit)
      const res = await api.get(`/api/jobs?${params}`)
      return res.data
    },
    keepPreviousData: true,
  })
}

export function useJobStats() {
  return useQuery({
    queryKey: ['job-stats'],
    queryFn: async () => {
      const res = await api.get('/api/jobs/stats')
      return res.data.stats
    },
    staleTime: 60 * 1000, // 1 minute
  })
}

export function useApplyJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }) => api.post(`/api/jobs/${id}/apply`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['job-stats'] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}

export function useUnapplyJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/api/jobs/${id}/apply`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['job-stats'] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}

export function useRefreshPipeline() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/api/jobs/refresh'),
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['jobs'] })
        queryClient.invalidateQueries({ queryKey: ['job-stats'] })
        queryClient.invalidateQueries({ queryKey: ['ingestion-log'] })
      }, 3000)
    },
  })
}
