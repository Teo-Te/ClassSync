import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@renderer/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Class } from '@shared/types/database'

interface ClassDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  editingClass?: Class | null
}

export const ClassDialog = ({ open, onClose, onSubmit, editingClass }: ClassDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    year: '',
    semester: ''
  })

  useEffect(() => {
    if (editingClass) {
      setFormData({
        name: editingClass.name,
        year: editingClass.year.toString(),
        semester: editingClass.semester.toString()
      })
    } else {
      setFormData({
        name: '',
        year: '',
        semester: ''
      })
    }
  }, [editingClass, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    onSubmit({
      name: formData.name,
      year: parseInt(formData.year),
      semester: parseInt(formData.semester)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-black border-white/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">
            {editingClass ? 'Edit Class' : 'Create New Class'}
          </DialogTitle>
        </DialogHeader>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">
              Class Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Computer Science 101"
              className="bg-black border-white/30 text-white placeholder:text-white/50 focus:border-lime-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year" className="text-white">
                Academic Year
              </Label>
              <Select
                value={formData.year}
                onValueChange={(value) => setFormData({ ...formData, year: value })}
              >
                <SelectTrigger className="bg-black border-white/30 text-white">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/30">
                  <SelectItem value="1" className="text-white hover:text-lime-500">
                    1st Year
                  </SelectItem>
                  <SelectItem value="2" className="text-white hover:text-lime-500">
                    2nd Year
                  </SelectItem>
                  <SelectItem value="3" className="text-white hover:text-lime-500">
                    3rd Year
                  </SelectItem>
                  <SelectItem value="4" className="text-white hover:text-lime-500">
                    4th Year
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester" className="text-white">
                Semester
              </Label>
              <Select
                value={formData.semester}
                onValueChange={(value) => setFormData({ ...formData, semester: value })}
              >
                <SelectTrigger className="bg-black border-white/30 text-white">
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/30">
                  <SelectItem value="1" className="text-white hover:text-lime-500">
                    1st Semester
                  </SelectItem>
                  <SelectItem value="2" className="text-white hover:text-lime-500">
                    2nd Semester
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-white/30 text-black hover:text-red-500 hover:border-red-500"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-lime-500 hover:bg-lime-600 text-black font-medium">
              {editingClass ? 'Update Class' : 'Create Class'}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  )
}
