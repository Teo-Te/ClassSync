// src/renderer/src/components/courses/AssignTeacherDialog.tsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, User, X } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Course, Teacher } from '@shared/types/database'

interface AssignTeacherDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (teacherId: number) => void
  course: Course | null
  teachers: Teacher[]
}

export const AssignTeacherDialog = ({
  open,
  onClose,
  onSubmit,
  course,
  teachers
}: AssignTeacherDialogProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [assignedTeachers, setAssignedTeachers] = useState<number[]>([])

  useEffect(() => {
    if (open && course) {
      // Load assigned teachers for this course
      loadAssignedTeachers()
    }
  }, [open, course])

  const loadAssignedTeachers = async () => {
    if (!course) return

    try {
      // This would need to be implemented in your API
      // const assigned = await window.api.courses.getAssignedTeachers(course.id)
      // setAssignedTeachers(assigned)

      // For now, we'll use the teachers array from the course if available
      setAssignedTeachers((course as any).teachers || [])
    } catch (error) {
      console.error('Failed to load assigned teachers:', error)
    }
  }

  const filteredTeachers = teachers.filter(
    (teacher) =>
      `${teacher.first_name} ${teacher.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) && !assignedTeachers.includes(teacher.id)
  )

  const currentlyAssigned = teachers.filter((teacher) => assignedTeachers.includes(teacher.id))

  const handleAssignTeacher = () => {
    if (selectedTeacher) {
      onSubmit(selectedTeacher.id)
      setSelectedTeacher(null)
      setSearchTerm('')
    }
  }

  const handleRemoveTeacher = async (teacherId: number) => {
    if (!course) return

    try {
      await window.api.courses.removeTeacher(course.id, teacherId)
      setAssignedTeachers(assignedTeachers.filter((id) => id !== teacherId))
    } catch (error) {
      console.error('Failed to remove teacher:', error)
    }
  }

  const handleClose = () => {
    setSelectedTeacher(null)
    setSearchTerm('')
    onClose()
  }

  if (!course) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-black border-white/30 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Manage Teachers for {course.name}</DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Currently Assigned Teachers */}
          {currentlyAssigned.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white">Currently Assigned</h3>
              <div className="space-y-2">
                {currentlyAssigned.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-lime-500 rounded-full flex items-center justify-center text-black text-sm font-medium">
                        {teacher.first_name[0]}
                        {teacher.last_name[0]}
                      </div>
                      <span className="text-white">
                        {teacher.first_name} {teacher.last_name}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleRemoveTeacher(teacher.id)}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search and Assign New Teacher */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white">Assign New Teacher</h3>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/50" />
              <Input
                placeholder="Search teachers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-black border-white/30 text-white placeholder:text-white/50 focus:border-lime-500"
              />
            </div>

            {/* Available Teachers */}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredTeachers.length === 0 ? (
                <div className="text-center py-6 text-white/50">
                  {searchTerm ? 'No teachers found' : 'All teachers are already assigned'}
                </div>
              ) : (
                filteredTeachers.map((teacher) => (
                  <motion.div
                    key={teacher.id}
                    whileHover={{ x: 4 }}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedTeacher?.id === teacher.id
                        ? 'bg-lime-500/20 border-lime-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                    onClick={() => setSelectedTeacher(teacher)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white text-sm">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          {teacher.first_name} {teacher.last_name}
                        </div>
                        <div className="text-white/50 text-sm">Available for assignment</div>
                      </div>
                    </div>
                    {selectedTeacher?.id === teacher.id && (
                      <div className="w-4 h-4 bg-lime-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-black rounded-full"></div>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
            <Button onClick={handleClose} className="bg-white/10 hover:bg-white/20 text-white">
              Close
            </Button>
            {selectedTeacher && (
              <Button
                onClick={handleAssignTeacher}
                className="bg-lime-500 hover:bg-lime-600 text-black font-medium"
              >
                Assign {selectedTeacher.first_name} {selectedTeacher.last_name}
              </Button>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
