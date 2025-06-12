// src/renderer/src/components/courses/AssignCourseDialog.tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, BookOpen, Plus } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Course } from '@shared/types/database'

interface AssignCourseDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (courseId: number) => void
  availableCourses: Course[]
}

export const AssignCourseDialog = ({
  open,
  onClose,
  onSubmit,
  availableCourses
}: AssignCourseDialogProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  const filteredCourses = availableCourses.filter((course) =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAssignCourse = () => {
    if (selectedCourse) {
      onSubmit(selectedCourse.id)
      setSelectedCourse(null)
      setSearchTerm('')
    }
  }

  const handleClose = () => {
    setSelectedCourse(null)
    setSearchTerm('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-black border-white/30 text-white min-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Assign Course to Class</DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Search */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/50" />
              <Input
                placeholder="Search available courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-black border-white/30 text-white placeholder:text-white/50 focus:border-lime-500"
              />
            </div>
          </div>

          {/* Available Courses */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white">
              Available Courses ({filteredCourses.length})
            </h3>

            <div className="max-h-60 overflow-y-auto no-scrollbar space-y-2">
              {filteredCourses.length === 0 ? (
                <div className="text-center py-6 text-white/50">
                  {searchTerm
                    ? 'No courses found matching your search'
                    : 'No available courses to assign'}
                </div>
              ) : (
                filteredCourses.map((course) => (
                  <motion.div
                    key={course.id}
                    whileHover={{ x: 4 }}
                    className={`flex items-center justify-between w-[97%] p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedCourse?.id === course.id
                        ? 'bg-lime-500/20 border-lime-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                    onClick={() => setSelectedCourse(course)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-white font-medium">{course.name}</div>
                        <div className="text-white/50 text-sm">
                          {course.hours_per_week}h/week • {course.lecture_hours}L +{' '}
                          {course.seminar_hours}S
                        </div>
                      </div>
                    </div>
                    {selectedCourse?.id === course.id && (
                      <div className="w-5 h-5 bg-lime-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-black rounded-full"></div>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* No courses available message */}
          {availableCourses.length === 0 && (
            <div className="text-center py-8 space-y-3">
              <BookOpen className="w-12 h-12 text-white/30 mx-auto" />
              <div>
                <h3 className="text-lg text-white mb-2">No courses available</h3>
                <p className="text-white/70 text-sm mb-4">
                  All existing courses have been assigned to this class, or no courses exist yet.
                </p>
                <Button onClick={handleClose} className="bg-lime-500 hover:bg-lime-600 text-black">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Course
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
            <Button onClick={handleClose} className="bg-white/10 hover:bg-white/20 text-white">
              Cancel
            </Button>
            {selectedCourse && (
              <Button
                onClick={handleAssignCourse}
                className="bg-lime-500 hover:bg-lime-600 text-black font-medium"
              >
                Assign {selectedCourse.name}
              </Button>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
