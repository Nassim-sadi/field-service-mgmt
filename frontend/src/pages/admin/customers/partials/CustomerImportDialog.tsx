import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/keys'
import { DEMO_MODE } from '@/lib/demo'

export function CustomerImportDialog() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<'skip' | 'overwrite'>('skip')
  const [loading, setLoading] = useState(false)
  const [lastExportInfo, setLastExportInfo] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const onImport = async () => {
    if (DEMO_MODE) {
      toast.info('Demo — import disabled on Netlify, works locally')
      return
    }
    if (!file) {
      toast.error('Select a .csv or .xlsx file')
      return
    }
    const fd = new FormData()
    fd.append('file', file)
    fd.append('on_duplicate', mode)
    setLoading(true)
    try {
      const { data } = await api.post('/customers/import/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success(`Imported ${data.imported}, overwritten ${data.overwritten}, skipped ${data.skipped}, failed ${data.failed}`)
      if (data.errors?.length) {
        const blob = new Blob([JSON.stringify(data.errors, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'import-errors.json'
        a.click()
        URL.revokeObjectURL(url)
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.customers })
      setOpen(false)
      setFile(null)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Import failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const onExport = async (fmt: 'csv' | 'xlsx') => {
    try {
      const res = await api.get(`/customers/export/?fmt=${fmt}`, { responseType: 'blob' })
      const blob = res.data as unknown as Blob
      const ramDelta = (res.headers as Record<string, string>)['x-ram-delta'] ?? (res.headers as Record<string, string>)['X-RAM-Delta']
      const rows = (res.headers as Record<string, string>)['x-rows'] ?? (res.headers as Record<string, string>)['X-Rows']
      if (ramDelta) setLastExportInfo(`Last export: ${rows ?? '?'} rows, RAM delta ${ramDelta}`)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `customers.${fmt}`
      a.click()
      URL.revokeObjectURL(url)
      if (ramDelta) toast.success(`Exported — RAM delta ${ramDelta}`)
    } catch {
      toast.error('Export failed')
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onExport('csv')}>
          <Download /> Export CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => onExport('xlsx')}>
          <Download /> Export XLSX
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button variant="outline" size="sm" />}>
            <Upload /> Import
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import customers</DialogTitle>
              <DialogDescription>CSV or XLSX with headers: company, name, email, phone, address. Company resolved by name.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>File (.csv, .xlsx)</Label>
                <Input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </div>
              <div className="space-y-2">
                <Label>On duplicate (email + company)</Label>
                <Select value={mode} onValueChange={(v) => setMode(v as never)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">Skip</SelectItem>
                    <SelectItem value="overwrite">Overwrite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {DEMO_MODE && <p className="text-xs text-muted-foreground">Demo mode — import disabled on Netlify.</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={onImport} disabled={loading || !file || DEMO_MODE}>
                {loading ? 'Importing…' : 'Import'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {lastExportInfo && <span className="text-xs text-muted-foreground">{lastExportInfo}</span>}
    </div>
  )
}
