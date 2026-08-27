import { Eye, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

function IconAction({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon-sm" onClick={onClick} />}>
        {children}
        <span className="sr-only">{label}</span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function ViewAction({ onClick }: { onClick: () => void }) {
  return (
    <IconAction label="Details" onClick={onClick}>
      <Eye />
    </IconAction>
  )
}

export function EditAction({ onClick }: { onClick: () => void }) {
  return (
    <IconAction label="Edit" onClick={onClick}>
      <Pencil />
    </IconAction>
  )
}
