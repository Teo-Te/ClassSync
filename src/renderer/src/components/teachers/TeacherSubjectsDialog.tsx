import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, BookOpen, Trash2, Clock, Users, GraduationCap, Edit2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Course, CourseType } from '@shared/types/database'
import { TeacherWithCourses } from '@shared/types/database'

interface TeacherCoursesDialogProps {
  open: boolean
  onClose: () => void
  teacher: TeacherWithCourses | null
  onCoursesUpdated: (teacherId: number, courses: (Course & { type: CourseType })[]) => void
}

export const TeacherCoursesDialog = ({
  open,
  onClose,
  teacher,
  onCoursesUpdated
}: TeacherCoursesDialogProps) => {
  const [assignedCourses, setAssignedCourses] = useState<(Course & { type: CourseType })[]>([])
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [removingCourse, setRemovingCourse] = useState<number | null>(null)
  const [editingCourse, setEditingCourse] = useState<number | null>(null)

  // Load teacher courses when dialog opens
  useEffect(() => {
    if (open && teacher) {
      loadTeacherCourses()
    }
  }, [open, teacher])

  const loadTeacherCourses = async () => {
    if (!teacher) return

    try {
      setLoading(true)
      const [assigned, available] = await Promise.all([
        window.api.teachers.getCoursesWithTypes(teacher.id),
        window.api.teachers.getAvailableCourses(teacher.id)
      ])

      setAssignedCourses(assigned)
      setAvailableCourses(available)
    } catch (error) {
      console.error('Failed to load teacher courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignCourse = async (course: Course, type: CourseType) => {
    if (!teacher) return

    try {
      await window.api.teachers.assignCourse(teacher.id, course.id, type)

      const updatedAssigned = [...assignedCourses, { ...course, type }]
      const updatedAvailable = availableCourses.filter((c) => c.id !== course.id)

      setAssignedCourses(updatedAssigned)
      setAvailableCourses(updatedAvailable)
      onCoursesUpdated(teacher.id, updatedAssigned)
    } catch (error) {
      console.error('Failed to assign course:', error)
    }
  }

  const handleUpdateCourseType = async (
    course: Course & { type: CourseType },
    newType: CourseType
  ) => {
    if (!teacher) return

    try {
      await window.api.teachers.updateCourseType(teacher.id, course.id, newType)

      const updatedAssigned = assignedCourses.map((c) =>
        c.id === course.id ? { ...c, type: newType } : c
      )

      setAssignedCourses(updatedAssigned)
      onCoursesUpdated(teacher.id, updatedAssigned)
      setEditingCourse(null)
    } catch (error) {
      console.error('Failed to update course type:', error)
    }
  }

  const handleRemoveCourse = async (course: Course & { type: CourseType }) => {
    if (!teacher) return

    try {
      setRemovingCourse(course.id)
      await window.api.teachers.removeCourse(teacher.id, course.id)

      const updatedAssigned = assignedCourses.filter((c) => c.id !== course.id)
      const updatedAvailable = [...availableCourses, course].sort((a, b) =>
        a.name.localeCompare(b.name)
      )

      setAssignedCourses(updatedAssigned)
      setAvailableCourses(updatedAvailable)
      onCoursesUpdated(teacher.id, updatedAssigned)
    } catch (error) {
      console.error('Failed to remove course:', error)
    } finally {
      setRemovingCourse(null)
    }
  }

  const getTypeColor = (type: CourseType) => {
    switch (type) {
      case 'lecture':
        return 'blue'
      case 'seminar':
        return 'green'
      case 'both':
        return 'lime'
      default:
        return 'gray'
    }
  }

  const getTypeIcon = (type: CourseType) => {
    switch (type) {
      case 'lecture':
        return <GraduationCap className="w-4 h-4" />
      case 'seminar':
        return <Users className="w-4 h-4" />
      case 'both':
        return <BookOpen className="w-4 h-4" />
      default:
        return <BookOpen className="w-4 h-4" />
    }
  }

  const getTypeLabel = (type: CourseType) => {
    switch (type) {
      case 'lecture':
        return 'Lectures Only'
      case 'seminar':
        return 'Seminars Only'
      case 'both':
        return 'Both'
      default:
        return 'Unknown'
    }
  }

  const filteredAvailableCourses = availableCourses.filter((course) =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleClose = () => {
    setSearchTerm('')
    setRemovingCourse(null)
    setEditingCourse(null)
    onClose()
  }

  if (!teacher) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-black border-white/30 text-white max-w-4xl min-w-3xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-lime-500" />
            Manage Courses for {teacher.first_name} {teacher.last_name}
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[50vh]">
            {/* Available Courses */}
            <div className="space-y-4 overflow-y-auto no-scrollbar">
              <div>
                <Label className="text-white text-lg font-semibold">
                  Available Courses ({filteredAvailableCourses.length})
                </Label>
                <p className="text-white/70 text-sm">Courses the teacher can be assigned to</p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/50" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search available courses..."
                  className="pl-10 bg-black border-white/30 text-white placeholder:text-white/50 focus:border-lime-500"
                />
              </div>

              {/* Available Courses List */}
              <div className="h-full overflow-y-auto no-scrollbar space-y-2 pr-2">
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-white/5 border border-white/10 rounded-lg p-3 animate-pulse"
                      >
                        <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-white/20 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredAvailableCourses.length === 0 ? (
                  <div className="text-center py-8 text-white/50">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">
                      {searchTerm
                        ? 'No courses found matching your search'
                        : 'All courses have been assigned'}
                    </div>
                  </div>
                ) : (
                  <AnimatePresence>
                    {filteredAvailableCourses.map((course, index) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex-1 mb-3">
                          <div className="text-white font-medium">{course.name}</div>
                          <div className="text-white/70 text-sm flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {course.hours_per_week}h/week
                            </span>
                            <span>
                              {course.lecture_hours}L + {course.seminar_hours}S
                            </span>
                          </div>
                        </div>

                        {/* Course Type Selection */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAssignCourse(course, 'lecture')}
                            className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
                          >
                            <GraduationCap className="w-3 h-3 mr-1" />L
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => handleAssignCourse(course, 'seminar')}
                            className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                          >
                            <Users className="w-3 h-3 mr-1" />S
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => handleAssignCourse(course, 'both')}
                            className="flex-1 bg-lime-500/20 hover:bg-lime-500/30 text-lime-400 border border-lime-500/30"
                          >
                            <BookOpen className="w-3 h-3 mr-1" />
                            Both
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* Assigned Courses */}
            <div className="space-y-4 overflow-y-auto no-scrollbar">
              <div>
                <Label className="text-white text-lg font-semibold">
                  Assigned Courses ({assignedCourses.length})
                </Label>
                <p className="text-white/70 text-sm">Courses this teacher can teach</p>
              </div>

              {/* Assigned Courses List */}
              <div className="h-full overflow-y-auto no-scrollbar space-y-2 pr-2">
                {assignedCourses.length === 0 ? (
                  <div className="text-center py-8 text-white/50">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">No courses assigned</div>
                    <div className="text-xs">Assign courses from the left panel</div>
                  </div>
                ) : (
                  <AnimatePresence>
                    {assignedCourses.map((course, index) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className={`bg-${getTypeColor(course.type)}-500/10 border border-${getTypeColor(course.type)}-500/20 rounded-lg p-3 last:mb-20`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="text-white font-medium">{course.name}</div>
                            <div
                              className={`text-${getTypeColor(course.type)}-400 text-sm flex items-center gap-4`}
                            >
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {course.hours_per_week}h/week
                              </span>
                              <span>
                                {course.lecture_hours}L + {course.seminar_hours}S
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() =>
                                setEditingCourse(editingCourse === course.id ? null : course.id)
                              }
                              className="bg-white/10 hover:bg-white/20 text-white"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleRemoveCourse(course)}
                              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300"
                              disabled={removingCourse === course.id}
                            >
                              {removingCourse === course.id ? (
                                <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Type Badge */}
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-1 bg-${getTypeColor(course.type)}-500/20 border border-${getTypeColor(course.type)}-500/30 rounded text-xs text-${getTypeColor(course.type)}-400`}
                        >
                          {getTypeIcon(course.type)}
                          {getTypeLabel(course.type)}
                        </div>

                        {/* Edit Type Controls */}
                        {editingCourse === course.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-white/10"
                          >
                            <div className="text-xs text-white/70 mb-2">
                              Change teaching capability:
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={() => handleUpdateCourseType(course, 'lecture')}
                                className={`flex-1 text-xs ${course.type === 'lecture' ? 'bg-blue-500/30 text-blue-300' : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400'} border border-blue-500/30`}
                                disabled={course.type === 'lecture'}
                              >
                                <GraduationCap className="w-3 h-3 mr-1" />L
                              </Button>

                              <Button
                                size="sm"
                                onClick={() => handleUpdateCourseType(course, 'seminar')}
                                className={`flex-1 text-xs ${course.type === 'seminar' ? 'bg-green-500/30 text-green-300' : 'bg-green-500/10 hover:bg-green-500/20 text-green-400'} border border-green-500/30`}
                                disabled={course.type === 'seminar'}
                              >
                                <Users className="w-3 h-3 mr-1" />S
                              </Button>

                              <Button
                                size="sm"
                                onClick={() => handleUpdateCourseType(course, 'both')}
                                className={`flex-1 text-xs ${course.type === 'both' ? 'bg-lime-500/30 text-lime-300' : 'bg-lime-500/10 hover:bg-lime-500/20 text-lime-400'} border border-lime-500/30`}
                                disabled={course.type === 'both'}
                              >
                                <BookOpen className="w-3 h-3 mr-1" />
                                Both
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="text-sm text-white/70 bg-white/5 p-3 rounded">
            <div className="flex items-start gap-2">
              <BookOpen className="w-4 h-4 text-lime-400 mt-0.5 flex-shrink-0" />
              <strong className="text-lime-400">Teaching Capabilities:</strong>
              <div>
                <div className="space-y-1">
                  <div>
                    <span className="text-blue-400">Lectures Only:</span> Teacher can only teach
                    lecture sessions
                  </div>
                  <div>
                    <span className="text-green-400">Seminars Only:</span> Teacher can only teach
                    seminar sessions
                  </div>
                  <div>
                    <span className="text-lime-400">Both:</span> Teacher can teach both lectures and
                    seminars
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
            <Button onClick={handleClose} className="bg-white/10 hover:bg-white/20 text-white">
              Done
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
