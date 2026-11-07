import { useEffect, useMemo, useState } from 'react'

export function usePagination(items, perPage = 8) {
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(items.length / perPage))

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount))
  }, [pageCount])

  const pageItems = useMemo(() => {
    const start = (page - 1) * perPage
    return items.slice(start, start + perPage)
  }, [items, page, perPage])

  return {
    page,
    setPage,
    pageItems,
    pageCount,
    total: items.length,
    from: items.length ? (page - 1) * perPage + 1 : 0,
    to: Math.min(page * perPage, items.length),
  }
}
