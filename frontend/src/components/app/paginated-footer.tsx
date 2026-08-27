import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const PAGE_SIZE_OPTIONS = [25, 50, 100]

function pageRange(current: number, total: number): (number | 'ellipsis')[] {
  const pages: (number | 'ellipsis')[] = []
  for (let page = 1; page <= total; page++) {
    if (page === 1 || page === total || Math.abs(page - current) <= 1) {
      pages.push(page)
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis')
    }
  }
  return pages
}

export function PaginatedFooter({
  count,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  count: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize))
  const from = count === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(count, page * pageSize)

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          {from}–{to} of {count}
        </span>
        <Select value={String(pageSize)} onValueChange={(v) => v && onPageSizeChange(Number(v))}>
          <SelectTrigger className="w-24" aria-label="Rows per page">
            <SelectValue placeholder={String(pageSize)} />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            />
          </PaginationItem>
          {pageRange(page, totalPages).map((p, index) =>
            p === 'ellipsis' ? (
              <PaginationItem key={`e-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink isActive={p === page} onClick={() => onPageChange(p)}>
                  {p}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
