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
  Building,
  Save
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
  TeacherWithCourses,
  Room,
  Class,
  CourseWithTeacherDetails,
  SavedSchedule
} from '@shared/types/database'
import { ScheduleNavigation } from '@renderer/components/schedules/ScheduleNavigation'
import { IndividualScheduleView } from '@renderer/components/schedules/IndividualScheduleView'
import { ScheduleView } from '@shared/types/database'
import { Textarea } from '@renderer/components/ui/textarea'
import { Input } from '@renderer/components/ui/input'
import { ExportDialog } from '@renderer/components/schedules/ExportDialog'
import { AIOptimizer } from '@renderer/components/schedules/ai/AIOptimizer'
import AIChatbot from '@renderer/components/schedules/ai/AIChatbot'
import { MessageSquare, Sparkles } from 'lucide-react'

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

  // AI Optimizer states
  const [showAIOptimizer, setShowAIOptimizer] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)
  const [isAIChatMinimized, setIsAIChatMinimized] = useState(false)

  // Schedule saving/loading states
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [scheduleName, setScheduleName] = useState('')
  const [scheduleDescription, setScheduleDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)

  // Data loading states
  const [teachers, setTeachers] = useState<TeacherWithCourses[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [courses, setCourses] = useState<CourseWithTeacherDetails[]>([])
  const [classCoursesMap, setClassCoursesMap] = useState<Map<number, CourseWithTeacherDetails[]>>(
    new Map()
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    loadSavedSchedules()
    loadMostRecentSchedule()
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

      // Load class-course relationships for each class
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
      setClassCoursesMap(classCoursesMapping)

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
        if (course.manualAssignments && course.manualAssignments.length > 0) {
          console.log(`   Manual assignments for ${course.name}:`, course.manualAssignments)
        }
      })
    } catch (error) {
      console.error('❌ Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleOptimized = (optimizedSchedule: GeneratedSchedule) => {
    setCurrentSchedule(optimizedSchedule)
    console.log('✅ Schedule optimized by AI!')
  }

  const loadSavedSchedules = async () => {
    try {
      const schedules = await window.api.schedules.getSaved()
      setSavedSchedules(schedules)
    } catch (error) {
      console.error('Failed to load saved schedules:', error)
    }
  }

  const loadMostRecentSchedule = async () => {
    try {
      const schedules = await window.api.schedules.getSaved()

      if (schedules.length > 0) {
        // Get the most recent schedule (schedules are ordered by created_at DESC)
        const mostRecent = schedules[0]
        const savedSchedule = await window.api.schedules.load(mostRecent.id)

        if (savedSchedule) {
          setCurrentSchedule(savedSchedule.data)

          // Also restore the constraints if they were saved
          if (savedSchedule.metadata?.constraints) {
            setConstraints(savedSchedule.metadata.constraints)
          }

          // Set the schedule name for potential re-saving
          setScheduleName(savedSchedule.name)

          console.log(`✅ Auto-loaded most recent schedule: "${savedSchedule.name}"`)
        }
      } else {
        console.log('📅 No saved schedules found - starting fresh')
      }
    } catch (error) {
      console.error('❌ Failed to auto-load recent schedule:', error)
      // Don't throw - just continue without a loaded schedule
    }
  }

  const handleSaveSchedule = async () => {
    if (!currentSchedule || !scheduleName.trim()) return

    try {
      setSaving(true)
      await window.api.schedules.save({
        name: scheduleName.trim(),
        description: scheduleDescription.trim() || undefined,
        data: currentSchedule,
        metadata: {
          constraints,
          savedAt: new Date().toISOString(),
          version: '1.0'
        }
      })

      setShowSaveDialog(false)
      setScheduleDescription('')
      await loadSavedSchedules()

      console.log('✅ Schedule saved successfully!')
    } catch (error) {
      console.error('❌ Failed to save schedule:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleLoadSchedule = async (id: number) => {
    try {
      const savedSchedule = await window.api.schedules.load(id)
      if (savedSchedule) {
        setCurrentSchedule(savedSchedule.data)
        if (savedSchedule.metadata?.constraints) {
          setConstraints(savedSchedule.metadata.constraints)
        }
        setShowHistoryDialog(false)
        console.log('Schedule loaded successfully!')
      }
    } catch (error) {
      console.error('Failed to load schedule:', error)
    }
  }

  const handleDeleteSchedule = async (id: number) => {
    try {
      await window.api.schedules.deleteSaved(id)
      await loadSavedSchedules() // Refresh the list
      console.log('Schedule deleted successfully!')
    } catch (error) {
      console.error('Failed to delete schedule:', error)
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

      // Clear the schedule name since this is a newly generated schedule
      setScheduleName('')

      console.log('✅ New schedule generated!')
    } catch (error) {
      console.error('❌ Failed to generate schedule:', error)
    } finally {
      setGenerating(false)
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

  // Export schedule

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
            <p className="text-white/70">
              Generate optimized class schedules automatically
              {currentSchedule && scheduleName && (
                <span className="ml-2 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                  Loaded: {scheduleName}
                </span>
              )}
            </p>
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

          <Button
            onClick={() => setShowHistoryDialog(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Clock className="w-4 h-4 mr-2" />
            History ({savedSchedules.length})
          </Button>

          {currentSchedule && (
            <>
              {/* AI Optimizer Button */}
              <Button
                onClick={() => setShowAIOptimizer(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Optimize
              </Button>

              {/* AI Chat Button */}
              <Button
                onClick={() => setShowAIChat(true)}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                AI Chat
              </Button>

              <Button
                onClick={() => setShowSaveDialog(true)}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {scheduleName ? 'Update Schedule' : 'Save Schedule'}
              </Button>

              <Button
                onClick={() => {
                  setCurrentSchedule(null)
                  setScheduleName('')
                  console.log('🧹 Schedule cleared')
                }}
                variant="default"
                className="border-red-500 text-red-400 hover:bg-red-500/20"
              >
                Clear Schedule
              </Button>

              <Button
                onClick={() => setShowExportDialog(true)}
                className="bg-lime-500 hover:bg-lime-600 text-black"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </>
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
        <DialogContent className="bg-black border-white/30 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              {selectedSession?.isGrouped && <Users className="w-5 h-5 text-purple-400" />}
              Session Details
              {selectedSession?.isGrouped && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">
                  GROUPED
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-6 min-w-96">
              {/* Basic Session Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-white/70 text-sm">Course</div>
                  <div className="text-white font-medium">{selectedSession.courseName}</div>
                </div>
                <div>
                  <div className="text-white/70 text-sm">Type</div>
                  <div
                    className={`font-medium ${
                      selectedSession.type === 'lecture' ? 'text-blue-400' : 'text-green-400'
                    }`}
                  >
                    {selectedSession.type.toUpperCase()}
                    {selectedSession.isGrouped && ' (GROUPED)'}
                  </div>
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
                  <div className="text-white/70 text-sm">Time</div>
                  <div className="text-white font-medium">
                    {selectedSession.timeSlot.day} {selectedSession.timeSlot.startTime}:00-
                    {selectedSession.timeSlot.endTime}:00
                  </div>
                </div>
                <div>
                  <div className="text-white/70 text-sm">Duration</div>
                  <div className="text-white font-medium">
                    {selectedSession.timeSlot.duration} hours
                  </div>
                </div>
              </div>

              {/* Grouped Classes Section */}
              {selectedSession.isGrouped && selectedSession.groupId && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    Participating Classes
                  </h4>

                  {(() => {
                    // Find all sessions in this group
                    const groupSessions =
                      currentSchedule?.sessions.filter(
                        (s) => s.groupId === selectedSession.groupId
                      ) || []

                    const totalClasses = groupSessions.length
                    const allClassNames = groupSessions.map((s) => s.className).join(', ')

                    return (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-purple-300">
                          <span className="font-medium">{totalClasses} Classes:</span>
                          <span>{allClassNames}</span>
                        </div>

                        {/* Individual class details */}
                        <div className="space-y-2">
                          {groupSessions.map((session, index) => (
                            <div
                              key={session.id}
                              className="flex items-center justify-between bg-white/5 rounded p-2 text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                <span className="text-white">Class {session.className}</span>
                              </div>
                              <div className="text-white/60">{session.courseName}</div>
                            </div>
                          ))}
                        </div>

                        {/* Group statistics */}
                        <div className="pt-2 border-t border-purple-500/20">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="text-white/60">Group ID:</span>
                              <div className="text-white/80 font-mono">
                                {selectedSession.groupId}
                              </div>
                            </div>
                            <div>
                              <span className="text-white/60">Total Students:</span>
                              <div className="text-white/80">~{totalClasses * 25} students</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Individual Class Section (for non-grouped sessions) */}
              {!selectedSession.isGrouped && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Class Information</h4>
                  <div className="text-white/80">{selectedSession.className}</div>
                </div>
              )}

              {/* Conflicts Section */}
              {selectedSession.conflicts && selectedSession.conflicts.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <h4 className="text-red-400 font-medium mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Conflicts ({selectedSession.conflicts.length})
                  </h4>
                  <div className="space-y-1">
                    {selectedSession.conflicts.map((conflict, index) => (
                      <div key={index} className="text-red-300 text-sm">
                        • {conflict.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Assignment Badge */}
              {selectedSession.isManualAssignment && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="text-blue-400 text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    This session uses a manually assigned teacher
                  </div>
                </div>
              )}

              {/* Additional Actions */}
              <div className="flex justify-between pt-4 space-x-1 border-t border-white/10">
                <Button
                  onClick={() => {
                    // Navigate to class view
                    setScheduleView({
                      type: 'classes',
                      selectedId: selectedSession.classId,
                      selectedName: selectedSession.className
                    })
                    setSelectedSession(null)
                  }}
                  variant="default"
                  className="border-white/20 text-white hover:bg-white/10 hover:-translate-y-1 w-1/3"
                >
                  Class Schedule
                </Button>

                <Button
                  onClick={() => {
                    // Navigate to teacher view
                    setScheduleView({
                      type: 'teachers',
                      selectedId: selectedSession.teacherId,
                      selectedName: selectedSession.teacherName
                    })
                    setSelectedSession(null)
                  }}
                  variant="default"
                  className="border-white/20 text-white hover:bg-white/10 hover:-translate-y-1 w-1/3"
                >
                  Teacher Schedule
                </Button>

                <Button
                  onClick={() => {
                    // Navigate to room view
                    setScheduleView({
                      type: 'rooms',
                      selectedId: selectedSession.roomId,
                      selectedName: selectedSession.roomName
                    })
                    setSelectedSession(null)
                  }}
                  variant="default"
                  className="border-white/20 text-white hover:-translate-y-1 hover:bg-white/10 w-1/3"
                >
                  Room Schedule
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Dialogs */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="bg-black border-white/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Save Schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/70 mb-2 block">Schedule Name *</label>
              <Input
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                placeholder="e.g., Fall 2025 Schedule v1"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div>
              <label className="text-sm text-white/70 mb-2 block">Description (Optional)</label>
              <Textarea
                value={scheduleDescription}
                onChange={(e) => setScheduleDescription(e.target.value)}
                placeholder="Add notes about this schedule..."
                className="bg-white/10 border-white/20 text-white min-h-[80px]"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSaveSchedule}
                disabled={!scheduleName.trim() || saving}
                className="bg-green-500 hover:bg-green-600 text-white flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Schedule'}
              </Button>
              <Button
                onClick={() => setShowSaveDialog(false)}
                variant="default"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="bg-black border-white/30 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Schedule History
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {savedSchedules.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <h3 className="text-xl text-white mb-2">No Saved Schedules</h3>
                <p className="text-white/70">Save your generated schedules to access them later</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedSchedules.map((schedule) => (
                  <Card key={schedule.id} className="bg-white/5 border-white/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-medium text-lg">{schedule.name}</h4>
                          {schedule.description && (
                            <p className="text-white/70 text-sm mt-1">{schedule.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
                            <span>
                              Created: {new Date(schedule.created_at).toLocaleDateString()}
                            </span>
                            {schedule.updated_at && (
                              <span>
                                Updated: {new Date(schedule.updated_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button
                            onClick={() => handleLoadSchedule(schedule.id)}
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            Load
                          </Button>
                          <Button
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            size="sm"
                            variant="default"
                            className="border-red-500 text-red-400 hover:bg-red-500/20"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAIOptimizer} onOpenChange={setShowAIOptimizer}>
        <DialogContent className="bg-black border-white/30 text-white min-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              AI Schedule Optimization
            </DialogTitle>
          </DialogHeader>
          {currentSchedule && (
            <AIOptimizer
              schedule={currentSchedule}
              teachers={teachers}
              classes={classes}
              rooms={rooms}
              courses={courses}
              onScheduleOptimized={handleScheduleOptimized}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* AI Chat Component */}
      <AIChatbot
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
        onToggleMinimize={() => setIsAIChatMinimized(!isAIChatMinimized)}
        isMinimized={isAIChatMinimized}
        schedule={currentSchedule!}
        teachers={teachers}
        classes={classes}
        rooms={rooms}
        courses={courses}
      />
      {/* Export Dialog */}
      {showExportDialog && currentSchedule && (
        <ExportDialog
          schedule={currentSchedule}
          rooms={rooms}
          teachers={teachers}
          classes={classes}
          onClose={() => setShowExportDialog(false)}
        />
      )}
    </div>
  )
}

export default Schedule
