import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  // Generate page numbers with ellipsis
  const getPages = () => {
    const pages = []
    const delta = 2
    const range = []
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }
    if (range.length > 0 && range[0] > 2) pages.push('...')
    pages.unshift(1)
    pages.push(...range)
    if (range.length > 0 && range[range.length - 1] < totalPages - 1) pages.push('...')
    if (totalPages > 1) pages.push(totalPages)
    return pages
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button
        id="pagination-prev"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg bg-vault-card border border-vault-border text-vault-text-muted hover:text-vault-brass hover:border-vault-brass/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={16} />
      </button>

      {getPages().map((page, i) =>
        page === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 py-2 text-vault-text-dim mono text-sm">…</span>
        ) : (
          <button
            key={page}
            id={`pagination-page-${page}`}
            onClick={() => onPageChange(page)}
            className={`w-9 h-9 rounded-lg text-sm mono font-medium transition-all ${
              page === currentPage
                ? 'bg-brass-gradient text-vault-bg font-bold shadow-gold'
                : 'bg-vault-card border border-vault-border text-vault-text-muted hover:border-vault-brass/40 hover:text-vault-brass'
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        id="pagination-next"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg bg-vault-card border border-vault-border text-vault-text-muted hover:text-vault-brass hover:border-vault-brass/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
