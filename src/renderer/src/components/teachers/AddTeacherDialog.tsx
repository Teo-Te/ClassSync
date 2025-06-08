import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@renderer/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Teacher } from '@shared/types/database'

interface AddTeacherDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  editingTeacher?: Teacher | null
}

export const AddTeacherDialog = ({
  open,
  onClose,
  onSubmit,
  editingTeacher
}: AddTeacherDialogProps) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  })

  // Update form when editing teacher changes
  useEffect(() => {
    if (editingTeacher) {
      setFormData({
        first_name: editingTeacher.first_name,
        last_name: editingTeacher.last_name,
        email: editingTeacher.email || '',
        phone: editingTeacher.phone || ''
      })
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: ''
      })
    }
  }, [editingTeacher, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Only submit basic teacher data - no courses/subjects
    onSubmit(formData)

    // Reset form only if not editing
    if (!editingTeacher) {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: ''
      })
    }
  }

  const handleClose = () => {
    // Reset form when closing
    if (!editingTeacher) {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: ''
      })
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-black border-white/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
          </DialogTitle>
        </DialogHeader>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first-name" className="text-white">
                First Name
              </Label>
              <Input
                id="first-name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="John"
                className="bg-black border-white/30 text-white placeholder:text-white/50 focus:border-lime-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last-name" className="text-white">
                Last Name
              </Label>
              <Input
                id="last-name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Doe"
                className="bg-black border-white/30 text-white placeholder:text-white/50 focus:border-lime-500"
                required
              />
            </div>
          </div>

          {/* Contact Fields */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">
              Email (Optional)
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john.doe@school.edu"
              className="bg-black border-white/30 text-white placeholder:text-white/50 focus:border-lime-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-white">
              Phone (Optional)
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
              className="bg-black border-white/30 text-white placeholder:text-white/50 focus:border-lime-500"
            />
          </div>

          {/* Info Section */}
          <div className="text-sm text-white/70 bg-white/5 p-4 rounded-lg border border-white/10">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-lime-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <div className="font-medium text-white mb-1">Course Assignment</div>
                <div className="text-white/70">
                  After creating the teacher, you can assign courses using the "Manage Courses"
                  option from the teacher card. This allows you to assign them to specific courses
                  that exist in your system.
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Steps */}
          {!editingTeacher && (
            <div className="text-sm text-white/70 bg-lime-500/10 border border-lime-500/20 p-4 rounded-lg">
              <div className="font-medium text-lime-400 mb-2">Next Steps:</div>
              <ol className="list-decimal list-inside space-y-1 text-white/70">
                <li>Create the teacher with basic information</li>
                <li>Add courses to your system (if not already done)</li>
                <li>Use "Manage Courses" to assign courses to this teacher</li>
                <li>Teachers can then be assigned to classes with those courses</li>
              </ol>
            </div>
          )}

          {editingTeacher && (
            <div className="text-sm text-white/70 bg-white/5 p-3 rounded">
              <strong>Note:</strong> Use "Manage Courses" from the teacher card to modify course
              assignments.
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={handleClose}
              className="bg-white/10 hover:bg-white/20 text-white"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-lime-500 hover:bg-lime-600 text-black font-medium">
              {editingTeacher ? 'Update Teacher' : 'Create Teacher'}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  )
}
