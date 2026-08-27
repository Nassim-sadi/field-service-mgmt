import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<'ul'>) {
  return (
    <ul
      className={cn('flex flex-row items-center gap-1', className)}
      {...props}
    />
  )
}

function PaginationItem({ className, ...props }: React.ComponentProps<'li'>) {
  return <li className={cn('', className)} {...props} />
}

type PaginationLinkProps = React.ComponentProps<typeof Button> & {
  isActive?: boolean
}

function PaginationLink({ className, isActive, ...props }: PaginationLinkProps) {
  return (
    <Button
      aria-current={isActive ? 'page' : undefined}
      variant={isActive ? 'secondary' : 'ghost'}
      className={cn('size-8 gap-0', className)}
      {...props}
    />
  )
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="ghost"
      className={cn('gap-1 pl-2.5', className)}
      {...props}
    >
      <ChevronLeft />
      <span>Previous</span>
    </Button>
  )
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button variant="ghost" className={cn('gap-1 pr-2.5', className)} {...props}>
      <span>Next</span>
      <ChevronRight />
    </Button>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      className={cn('flex size-8 items-center justify-center', className)}
      {...props}
    >
      <MoreHorizontal />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}
