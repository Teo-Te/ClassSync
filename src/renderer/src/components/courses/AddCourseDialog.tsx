import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@renderer/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Course } from '@shared/types/database'

interface AddCourseDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  editingCourse?: Course | null // Add this prop
}

export const AddCourseDialog = ({
  open,
  onClose,
  onSubmit,
  editingCourse
}: AddCourseDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    hours_per_week: '4',
    lecture_hours: '2',
    seminar_hours: '2'
  })

  // Update form when editing course changes
  useEffect(() => {
    if (editingCourse) {
      setFormData({
        name: editingCourse.name,
        hours_per_week: editingCourse.hours_per_week.toString(),
        lecture_hours: editingCourse.lecture_hours.toString(),
        seminar_hours: editingCourse.seminar_hours.toString()
      })
    } else {
      setFormData({
        name: '',
        hours_per_week: '4',
        lecture_hours: '2',
        seminar_hours: '2'
      })
    }
  }, [editingCourse, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    onSubmit({
      name: formData.name,
      hours_per_week: parseInt(formData.hours_per_week),
      lecture_hours: parseInt(formData.lecture_hours),
      seminar_hours: parseInt(formData.seminar_hours)
    })

    // Reset form only if not editing
    if (!editingCourse) {
      setFormData({
        name: '',
        hours_per_week: '4',
        lecture_hours: '2',
        seminar_hours: '2'
      })
    }
  }

  const handleClose = () => {
    // Reset form when closing
    if (!editingCourse) {
      setFormData({
        name: '',
        hours_per_week: '4',
        lecture_hours: '2',
        seminar_hours: '2'
      })
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-black border-white/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">
            {editingCourse ? 'Edit Course' : 'Add New Course'}
          </DialogTitle>
        </DialogHeader>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="course-name" className="text-white">
              Course Name
            </Label>
            <Input
              id="course-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Data Structures and Algorithms"
              className="bg-black border-white/30 text-white placeholder:text-white/50 focus:border-lime-500"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total-hours" className="text-white">
                Total Hours/Week
              </Label>
              <Input
                id="total-hours"
                type="number"
                min="1"
                max="20"
                value={formData.hours_per_week}
                onChange={(e) => setFormData({ ...formData, hours_per_week: e.target.value })}
                className="bg-black border-white/30 text-white focus:border-lime-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lecture-hours" className="text-white">
                Lecture Hours
              </Label>
              <Input
                id="lecture-hours"
                type="number"
                min="0"
                max="10"
                value={formData.lecture_hours}
                onChange={(e) => setFormData({ ...formData, lecture_hours: e.target.value })}
                className="bg-black border-white/30 text-white focus:border-lime-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seminar-hours" className="text-white">
                Seminar Hours
              </Label>
              <Input
                id="seminar-hours"
                type="number"
                min="0"
                max="10"
                value={formData.seminar_hours}
                onChange={(e) => setFormData({ ...formData, seminar_hours: e.target.value })}
                className="bg-black border-white/30 text-white focus:border-lime-500"
                required
              />
            </div>
          </div>

          <div className="text-sm text-white/70 bg-white/5 p-3 rounded">
            <strong>Note:</strong> Lecture hours + Seminar hours should equal Total hours per week
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={handleClose}
              className="bg-white/10 hover:bg-white/20 text-white"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-lime-500 hover:bg-lime-600 text-black font-medium">
              {editingCourse ? 'Update Course' : 'Add Course'}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  )
}
