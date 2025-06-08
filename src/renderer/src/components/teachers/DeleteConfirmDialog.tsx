import { motion } from 'framer-motion'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { Teacher } from '@shared/types/database'

interface DeleteConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  teacher: Teacher | null
}

export const DeleteConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  teacher
}: DeleteConfirmDialogProps) => {
  if (!teacher) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-black border-white/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Delete Teacher
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="text-white/70">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-white">
              {teacher.first_name} {teacher.last_name}
            </span>
            ?
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-200">
                <div className="font-medium mb-1">This action cannot be undone.</div>
                <div>This will permanently delete:</div>
                <ul className="list-disc list-inside mt-2 space-y-1 text-red-300">
                  <li>Teacher's personal information</li>
                  <li>All assigned subjects</li>
                  <li>Course assignments</li>
                  <li>Schedule assignments</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white">
              Cancel
            </Button>
            <Button onClick={onConfirm} className="bg-red-500 hover:bg-red-600 text-white">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Teacher
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
