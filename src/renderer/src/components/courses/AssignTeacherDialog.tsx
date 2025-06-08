import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, User, X, AlertCircle, BookOpen, GraduationCap, Users } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Course, Teacher, AssignmentType } from '@shared/types/database'

interface AssignTeacherDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (teacherId: number, type: AssignmentType) => void
  course: Course | null
  assignmentType: AssignmentType // New prop to specify lecture or seminar
}

export const AssignTeacherDialog = ({
  open,
  onClose,
  onSubmit,
  course,
  assignmentType
}: AssignTeacherDialogProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [assignedTeachers, setAssignedTeachers] = useState<(Teacher & { type: AssignmentType })[]>(
    []
  )
  const [eligibleTeachers, setEligibleTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && course) {
      loadTeacherData()
    } else {
      setAssignedTeachers([])
      setEligibleTeachers([])
      setSelectedTeacher(null)
      setSearchTerm('')
    }
  }, [open, course, assignmentType])

  const loadTeacherData = async () => {
    if (!course) return

    try {
      setLoading(true)

      // Load teachers who can teach this course for this specific type
      const eligible = await window.api.courses.getEligibleTeachers(course.id, assignmentType)
      setEligibleTeachers(eligible || [])

      // Load currently assigned teachers for this course
      const assigned = await window.api.courses.getAssignedTeachers(course.id)
      setAssignedTeachers(assigned || [])
    } catch (error) {
      console.error('Failed to load teacher data:', error)
      setEligibleTeachers([])
      setAssignedTeachers([])
    } finally {
      setLoading(false)
    }
  }

  // Get current teacher for this type
  const currentTeacher = assignedTeachers.find((t) => t.type === assignmentType)

  // Filter eligible teachers and exclude current assignment
  const availableTeachers = (eligibleTeachers || []).filter(
    (teacher) =>
      `${teacher.first_name} ${teacher.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) && currentTeacher?.id !== teacher.id
  )

  const handleAssignTeacher = () => {
    if (selectedTeacher) {
      onSubmit(selectedTeacher.id, assignmentType)
      setSelectedTeacher(null)
      setSearchTerm('')
    }
  }

  const handleRemoveTeacher = async () => {
    if (!course || !currentTeacher) return

    try {
      await window.api.courses.removeTeacherByType(course.id, assignmentType)
      loadTeacherData()
    } catch (error) {
      console.error('Failed to remove teacher:', error)
    }
  }

  const getTypeIcon = () => {
    return assignmentType === 'lecture' ? (
      <GraduationCap className="w-5 h-5 text-blue-500" />
    ) : (
      <Users className="w-5 h-5 text-green-500" />
    )
  }

  const getTypeColor = () => {
    return assignmentType === 'lecture' ? 'blue' : 'green'
  }

  if (!course) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-black border-white/30 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            {getTypeIcon()}
            Assign {assignmentType === 'lecture' ? 'Lecture' : 'Seminar'} Teacher for {course.name}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <div className="animate-pulse space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-white/10 rounded"></div>
              ))}
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Assignment Info */}
            <div
              className={`bg-${getTypeColor()}-500/10 border border-${getTypeColor()}-500/20 rounded-lg p-4`}
            >
              <div className="flex items-start gap-3">
                <AlertCircle
                  className={`w-5 h-5 text-${getTypeColor()}-400 mt-0.5 flex-shrink-0`}
                />
                <div className="text-sm">
                  <div className={`font-medium text-${getTypeColor()}-400 mb-1`}>
                    {assignmentType === 'lecture' ? 'Lecture' : 'Seminar'} Teacher Assignment
                  </div>
                  <div className={`text-${getTypeColor()}-300/80`}>
                    You're assigning a teacher for{' '}
                    {assignmentType === 'lecture'
                      ? `${course.lecture_hours} lecture hours`
                      : `${course.seminar_hours} seminar hours`}{' '}
                    per week. Only teachers qualified to teach {assignmentType}s for this course can
                    be assigned.
                  </div>
                </div>
              </div>
            </div>

            {/* Currently Assigned Teacher */}
            {currentTeacher && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">
                  Current {assignmentType === 'lecture' ? 'Lecture' : 'Seminar'} Teacher
                </h3>
                <div
                  className={`flex items-center justify-between p-3 bg-${getTypeColor()}-500/10 border border-${getTypeColor()}-500/20 rounded-lg`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 bg-${getTypeColor()}-500 rounded-full flex items-center justify-center text-black text-sm font-medium`}
                    >
                      {currentTeacher.first_name?.[0] || '?'}
                      {currentTeacher.last_name?.[0] || '?'}
                    </div>
                    <div>
                      <span className="text-white font-medium">
                        {currentTeacher.first_name} {currentTeacher.last_name}
                      </span>
                      <div className={`text-${getTypeColor()}-400 text-xs`}>
                        Teaching {assignmentType}s for this course
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleRemoveTeacher}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Assign New Teacher */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white">
                {currentTeacher ? 'Change' : 'Assign'}{' '}
                {assignmentType === 'lecture' ? 'Lecture' : 'Seminar'} Teacher (
                {(eligibleTeachers || []).length} available)
              </h3>

              {(eligibleTeachers || []).length === 0 ? (
                <div className="text-center py-8 bg-white/5 rounded-lg border border-white/10">
                  <User className="w-8 h-8 text-white/30 mx-auto mb-2" />
                  <div className="text-white/70 text-sm">
                    No teachers qualified for {assignmentType}s
                  </div>
                  <div className="text-white/50 text-xs mt-1">
                    Assign teachers to teach {assignmentType}s for this course first
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/50" />
                    <Input
                      placeholder={`Search qualified ${assignmentType} teachers...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-black border-white/30 text-white placeholder:text-white/50 focus:border-lime-500"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {availableTeachers.length === 0 ? (
                      <div className="text-center py-6 text-white/50 text-sm">
                        {searchTerm
                          ? 'No qualified teachers found matching your search'
                          : currentTeacher
                            ? 'All other qualified teachers are already assigned elsewhere'
                            : 'No qualified teachers available'}
                      </div>
                    ) : (
                      availableTeachers.map((teacher) => (
                        <motion.div
                          key={teacher.id}
                          whileHover={{ x: 4 }}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedTeacher?.id === teacher.id
                              ? `bg-${getTypeColor()}-500/20 border-${getTypeColor()}-500/50`
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
                              <div className={`text-${getTypeColor()}-400 text-xs`}>
                                ✓ Qualified for {assignmentType}s
                              </div>
                            </div>
                          </div>
                          {selectedTeacher?.id === teacher.id && (
                            <div
                              className={`w-4 h-4 bg-${getTypeColor()}-500 rounded-full flex items-center justify-center`}
                            >
                              <div className="w-2 h-2 bg-black rounded-full"></div>
                            </div>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
              <Button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white">
                Close
              </Button>
              {selectedTeacher && (
                <Button
                  onClick={handleAssignTeacher}
                  className={`bg-${getTypeColor()}-500 hover:bg-${getTypeColor()}-600 text-black font-medium`}
                >
                  Assign {selectedTeacher.first_name} {selectedTeacher.last_name}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  )
}
