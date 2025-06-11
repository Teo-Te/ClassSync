import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Settings,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Building
} from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { ConstraintConfig } from '@renderer/components/schedules/ConstraintConfig'
import { ScheduleAlgorithm } from '@renderer/lib/utils/scheduleAlgorithm'
import {
  ScheduleConstraints,
  GeneratedSchedule,
  ScheduleSession,
  ScheduleConflict,
  TeacherWithCourses,
  Room,
  Class,
  CourseWithTeacherDetails,
  Course,
  CourseType
} from '@shared/types/database'
import { ScheduleNavigation } from '@renderer/components/schedules/ScheduleNavigation'
import { IndividualScheduleView } from '@renderer/components/schedules/IndividualScheduleView'
import { ScheduleView } from '@shared/types/database'

const defaultConstraints: ScheduleConstraints = {
  preferredStartTime: 9,
  preferredEndTime: 13,
  maxEndTime: 15,
  maxTeacherHoursPerDay: 6,
  avoidBackToBackSessions: false,
  lectureSessionLength: 2,
  seminarSessionLength: 2,
  avoidSplittingSessions: false,
  prioritizeMorningLectures: false,
  groupSameCourseClasses: false,
  distributeEvenlyAcrossWeek: false
}

const Schedule = () => {
  const [currentSchedule, setCurrentSchedule] = useState<GeneratedSchedule | null>(null)
  const [constraints, setConstraints] = useState<ScheduleConstraints>(defaultConstraints)
  const [generating, setGenerating] = useState(false)
  const [showConstraints, setShowConstraints] = useState(false)
  const [selectedSession, setSelectedSession] = useState<ScheduleSession | null>(null)
  const [scheduleView, setScheduleView] = useState<ScheduleView>({ type: 'overview' })

  // Data loading states
  const [teachers, setTeachers] = useState<TeacherWithCourses[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [courses, setCourses] = useState<CourseWithTeacherDetails[]>([])
  const [classCoursesMap, setClassCoursesMap] = useState<Map<number, CourseWithTeacherDetails[]>>(
    new Map()
  ) // ADD THIS
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('📊 Loading schedule data...')

      const [teachersData, roomsData, classesData, coursesData] = await Promise.all([
        window.api.teachers.getAll(),
        window.api.rooms.getAll(),
        window.api.classes.getAll(),
        window.api.courses.getAll()
      ])

      // Transform teachers to include courses with proper types
      const teachersWithCourses: TeacherWithCourses[] = await Promise.all(
        teachersData.map(async (teacher) => {
          try {
            const courses = await window.api.teachers.getCoursesWithTypes(teacher.id)
            return { ...teacher, courses }
          } catch (error) {
            console.error(`Failed to load courses for teacher ${teacher.id}:`, error)
            return { ...teacher, courses: [] }
          }
        })
      )

      // Transform courses to include manual assignments and teacher details
      const transformedCourses: CourseWithTeacherDetails[] = await Promise.all(
        coursesData.map(async (course) => {
          try {
            // Get manually assigned teachers for this course
            const assignedTeachers = await window.api.courses.getAssignedTeachers(course.id)
            return {
              ...course,
              teachers: [], // Keep for backward compatibility
              manualAssignments: assignedTeachers.map((teacher) => ({
                teacherId: teacher.id,
                teacherName: `${teacher.first_name} ${teacher.last_name}`,
                type: teacher.type as 'lecture' | 'seminar' | 'both',
                isManual: true
              })),
              lectureTeacher: undefined, // Initialize optional properties
              seminarTeacher: undefined
            }
          } catch (error) {
            console.error(`Failed to load manual assignments for course ${course.id}:`, error)
            return {
              ...course,
              teachers: [], // Keep for backward compatibility
              manualAssignments: [], // Empty array when no manual assignments
              lectureTeacher: undefined,
              seminarTeacher: undefined
            }
          }
        })
      )

      // NEW: Load class-course relationships for each class
      const classCoursesMapping = new Map<number, CourseWithTeacherDetails[]>()

      for (const classItem of classesData) {
        try {
          // Get courses assigned to this specific class
          const classCourses = await window.api.courses.getByClassId(classItem.id)

          // Transform class courses to include manual assignments
          const transformedClassCourses: CourseWithTeacherDetails[] = await Promise.all(
            classCourses.map(async (course) => {
              const assignedTeachers = await window.api.courses.getAssignedTeachers(course.id)
              return {
                ...course,
                teachers: [],
                manualAssignments: assignedTeachers.map((teacher) => ({
                  teacherId: teacher.id,
                  teacherName: `${teacher.first_name} ${teacher.last_name}`,
                  type: teacher.type as 'lecture' | 'seminar' | 'both',
                  isManual: true
                })),
                lectureTeacher: undefined,
                seminarTeacher: undefined
              }
            })
          )

          classCoursesMapping.set(classItem.id, transformedClassCourses)
          console.log(
            `📚 Class ${classItem.name}: ${transformedClassCourses.length} courses assigned`
          )
          console.log(`   Courses: ${transformedClassCourses.map((c) => c.name).join(', ')}`)
        } catch (error) {
          console.error(`Failed to load courses for class ${classItem.id}:`, error)
          classCoursesMapping.set(classItem.id, [])
        }
      }

      setTeachers(teachersWithCourses)
      setRooms(roomsData)
      setClasses(classesData)
      setCourses(transformedCourses)
      setClassCoursesMap(classCoursesMapping) // NEW: Set the class-courses mapping

      console.log(`✅ Data loaded successfully:`)
      console.log(`   Teachers: ${teachersWithCourses.length}`)
      console.log(`   Rooms: ${roomsData.length}`)
      console.log(`   Classes: ${classesData.length}`)
      console.log(`   Total Courses: ${transformedCourses.length}`)
      console.log(`   Class-Course Mappings: ${classCoursesMapping.size}`)

      // Log class-course relationships for debugging
      console.log('📋 Class-Course Relationships:')
      classCoursesMapping.forEach((courses, classId) => {
        const className = classesData.find((c) => c.id === classId)?.name || `Class ${classId}`
        console.log(`   ${className}: ${courses.map((c) => c.name).join(', ')}`)
      })

      // Log manual assignments for debugging
      transformedCourses.forEach((course) => {
        if (course.manualAssignments.length > 0) {
          console.log(`   Manual assignments for ${course.name}:`, course.manualAssignments)
        }
      })
    } catch (error) {
      console.error('❌ Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateSchedule = async () => {
    try {
      setGenerating(true)

      // Create algorithm instance with class-courses mapping
      const algorithm = new ScheduleAlgorithm(
        constraints,
        teachers,
        rooms,
        classes,
        courses,
        classCoursesMap
      )

      // Generate schedule
      const schedule = algorithm.generateSchedule()

      setCurrentSchedule(schedule)
    } catch (error) {
      console.error('Failed to generate schedule:', error)
    } finally {
      setGenerating(false)
    }
  }

  // ... rest of the component remains the same ...
  const getConflictStats = (conflicts: ScheduleConflict[]) => {
    return {
      critical: conflicts.filter((c) => c.severity === 'critical').length,
      warning: conflicts.filter((c) => c.severity === 'warning').length,
      suggestion: conflicts.filter((c) => c.severity === 'suggestion').length
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 bg-black min-h-screen">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/20 rounded w-1/3"></div>
          <div className="h-96 bg-white/10 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6 bg-black min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-lime-500 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Schedule Generator</h1>
            <p className="text-white/70">Generate optimized class schedules automatically</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => setShowConstraints(true)}
            className="bg-white/10 hover:bg-white/20 text-white"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>

          {currentSchedule && (
            <Button
              onClick={() => {
                /* Implement export */
              }}
              className="bg-lime-500 hover:bg-lime-600 text-black"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <Card className="bg-black border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-white">{teachers.length}</div>
                <div className="text-white/70 text-sm">Teachers</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Building className="w-8 h-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-white">{rooms.length}</div>
                <div className="text-white/70 text-sm">Rooms</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-lime-500" />
              <div>
                <div className="text-2xl font-bold text-white">{classes.length}</div>
                <div className="text-white/70 text-sm">Classes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-white" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {currentSchedule ? Math.round(currentSchedule.score) : 0}%
                </div>
                <div className="text-white/70 text-sm">Quality Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Schedule Content */}
      <AnimatePresence mode="wait">
        {currentSchedule ? (
          <motion.div
            key="schedule"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Global Conflicts Summary - only show on overview */}
            {scheduleView.type === 'overview' && currentSchedule.conflicts.length > 0 && (
              <Card className="bg-red-500/10 border-red-500/20">
                <CardHeader>
                  <CardTitle className="text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Global Schedule Conflicts ({currentSchedule.conflicts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {currentSchedule.conflicts.slice(0, 3).map((conflict, index) => (
                      <div key={index} className="text-red-300 text-sm">
                        • {conflict.message}
                      </div>
                    ))}
                    {currentSchedule.conflicts.length > 3 && (
                      <div className="text-red-300/70 text-sm">
                        +{currentSchedule.conflicts.length - 3} more conflicts
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation or Individual View */}
            {scheduleView.selectedId ? (
              <IndividualScheduleView
                view={scheduleView}
                onViewChange={setScheduleView}
                sessions={currentSchedule.sessions}
                conflicts={currentSchedule.conflicts}
                rooms={rooms}
                teachers={teachers}
                classes={classes}
                onSessionClick={setSelectedSession}
              />
            ) : (
              <ScheduleNavigation
                view={scheduleView}
                onViewChange={setScheduleView}
                rooms={rooms}
                teachers={teachers}
                classes={classes}
                sessions={currentSchedule.sessions}
              />
            )}

            {/* Schedule Metadata - only show on overview */}
            {scheduleView.type === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white/5 p-4 rounded">
                  <div className="text-white/70">Generated</div>
                  <div className="text-white font-medium">
                    {new Date(currentSchedule.metadata.generatedAt).toLocaleString()}
                  </div>
                </div>
                <div className="bg-white/5 p-4 rounded">
                  <div className="text-white/70">Total Hours</div>
                  <div className="text-white font-medium">
                    {currentSchedule.metadata.totalHours} hours/week
                  </div>
                </div>
                <div className="bg-white/5 p-4 rounded">
                  <div className="text-white/70">Room Utilization</div>
                  <div className="text-white font-medium">
                    {Math.round(currentSchedule.metadata.utilizationRate)}%
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-16"
          >
            <Calendar className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-xl text-white mb-2">No Schedule Generated</h3>
            <p className="text-white/70 mb-6">
              Configure your constraints and generate an optimized schedule
            </p>
            <Button
              onClick={() => setShowConstraints(true)}
              className="bg-lime-500 hover:bg-lime-600 text-black"
            >
              <Settings className="w-4 h-4 mr-2" />
              Get Started
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Constraint Configuration Dialog */}
      <Dialog open={showConstraints} onOpenChange={setShowConstraints}>
        <DialogContent className="bg-black border-white/30 text-white min-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Schedule Configuration</DialogTitle>
          </DialogHeader>
          <ConstraintConfig
            constraints={constraints}
            onConstraintsChange={setConstraints}
            onGenerate={() => {
              setShowConstraints(false)
              handleGenerateSchedule()
            }}
            generating={generating}
          />
        </DialogContent>
      </Dialog>

      {/* Session Details Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="bg-black border-white/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Session Details</DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-white/70 text-sm">Course</div>
                  <div className="text-white font-medium">{selectedSession.courseName}</div>
                </div>
                <div>
                  <div className="text-white/70 text-sm">Class</div>
                  <div className="text-white font-medium">{selectedSession.className}</div>
                </div>
                <div>
                  <div className="text-white/70 text-sm">Teacher</div>
                  <div className="text-white font-medium">{selectedSession.teacherName}</div>
                </div>
                <div>
                  <div className="text-white/70 text-sm">Room</div>
                  <div className="text-white font-medium">{selectedSession.roomName}</div>
                </div>
                <div>
                  <div className="text-white/70 text-sm">Type</div>
                  <div
                    className={`font-medium ${
                      selectedSession.type === 'lecture' ? 'text-blue-400' : 'text-green-400'
                    }`}
                  >
                    {selectedSession.type.toUpperCase()}
                  </div>
                </div>
                <div>
                  <div className="text-white/70 text-sm">Time</div>
                  <div className="text-white font-medium">
                    {selectedSession.timeSlot.day} {selectedSession.timeSlot.startTime}:00-
                    {selectedSession.timeSlot.endTime}:00
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Schedule
