import { motion } from 'framer-motion'
import { Building, Users, GraduationCap, ArrowLeft, Clock, BarChart3 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Badge } from '@renderer/components/ui/badge'
import {
  ScheduleViewType,
  ScheduleView,
  Room,
  TeacherWithCourses,
  Class,
  ScheduleSession
} from '@shared/types/database'

interface ScheduleNavigationProps {
  view: ScheduleView
  onViewChange: (view: ScheduleView) => void
  rooms: Room[]
  teachers: TeacherWithCourses[]
  classes: Class[]
  sessions: ScheduleSession[]
}

export const ScheduleNavigation = ({
  view,
  onViewChange,
  rooms,
  teachers,
  classes,
  sessions
}: ScheduleNavigationProps) => {
  const getSessionsForRoom = (roomId: number) => sessions.filter((s) => s.roomId === roomId)

  const getSessionsForTeacher = (teacherId: number) =>
    sessions.filter((s) => s.teacherId === teacherId)

  const getSessionsForClass = (classId: number) => sessions.filter((s) => s.classId === classId)

  const calculateUtilization = (roomSessions: ScheduleSession[]) => {
    const totalSlots = 5 * 4 // 5 days, 4 time slots per day
    return Math.round((roomSessions.length / totalSlots) * 100)
  }

  const calculateWorkload = (teacherSessions: ScheduleSession[]) =>
    teacherSessions.reduce((total, session) => total + session.timeSlot.duration, 0)

  if (view.type === 'overview') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Rooms Overview */}
        <Card
          className="bg-black border-white/20 cursor-pointer hover:border-blue-500/40 transition-colors"
          onClick={() => onViewChange({ type: 'rooms' })}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-500" />
              Room Schedules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Total Rooms</span>
                <Badge variant="secondary">{rooms.length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Lecture Rooms</span>
                <Badge variant="secondary">
                  {rooms.filter((r) => r.type === 'lecture').length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Seminar Rooms</span>
                <Badge variant="secondary">
                  {rooms.filter((r) => r.type === 'seminar').length}
                </Badge>
              </div>
              <div className="pt-2 border-t border-white/10">
                <Button variant="default" className="w-full">
                  View All Room Schedules
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teachers Overview */}
        <Card
          className="bg-black border-white/20 cursor-pointer hover:border-green-500/40 transition-colors"
          onClick={() => onViewChange({ type: 'teachers' })}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-green-500" />
              Teacher Schedules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Total Teachers</span>
                <Badge variant="secondary">{teachers.length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Active Teachers</span>
                <Badge variant="secondary">
                  {teachers.filter((t) => getSessionsForTeacher(t.id).length > 0).length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Avg. Workload</span>
                <Badge variant="secondary">
                  {Math.round(
                    teachers.reduce(
                      (sum, t) => sum + calculateWorkload(getSessionsForTeacher(t.id)),
                      0
                    ) / Math.max(teachers.length, 1)
                  )}
                  h/week
                </Badge>
              </div>
              <div className="pt-2 border-t border-white/10">
                <Button variant="default" className="w-full">
                  View All Teacher Schedules
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Classes Overview */}
        <Card
          className="bg-black border-white/20 cursor-pointer hover:border-lime-500/40 transition-colors"
          onClick={() => onViewChange({ type: 'classes' })}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-lime-500" />
              Class Schedules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Total Classes</span>
                <Badge variant="secondary">{classes.length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Year 1 Classes</span>
                <Badge variant="secondary">{classes.filter((c) => c.year === 1).length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Year 2 Classes</span>
                <Badge variant="secondary">{classes.filter((c) => c.year === 2).length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Year 3 Classes</span>
                <Badge variant="secondary">{classes.filter((c) => c.year === 3).length}</Badge>
              </div>
              <div className="pt-2 border-t border-white/10">
                <Button variant="default" className="w-full">
                  View All Class Schedules
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Room List View
  if (view.type === 'rooms' && !view.selectedId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="default"
              onClick={() => onViewChange({ type: 'overview' })}
              className="text-white hover:scale-105 duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Overview
            </Button>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Building className="w-6 h-6 text-blue-500" />
              Room Schedules
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => {
            const roomSessions = getSessionsForRoom(room.id)
            const utilization = calculateUtilization(roomSessions)

            return (
              <Card
                key={room.id}
                className="bg-black border-white/20 cursor-pointer hover:border-blue-500/40 transition-colors"
                onClick={() =>
                  onViewChange({
                    type: 'rooms',
                    selectedId: room.id,
                    selectedName: room.name
                  })
                }
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>{room.name}</span>
                    <Badge
                      variant={room.type === 'lecture' ? 'default' : 'secondary'}
                      className={room.type === 'lecture' ? 'bg-blue-500' : 'bg-green-500'}
                    >
                      {room.type}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">Sessions</span>
                      <span className="text-white font-medium">{roomSessions.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">Utilization</span>
                      <span className="text-white font-medium">{utilization}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">Capacity</span>
                      <span className="text-white font-medium">{room.capacity || 'N/A'}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 mt-3">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </motion.div>
    )
  }

  // Teacher List View
  if (view.type === 'teachers' && !view.selectedId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="default"
              onClick={() => onViewChange({ type: 'overview' })}
              className="text-white hover:scale-105 duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Overview
            </Button>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-green-500" />
              Teacher Schedules
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((teacher) => {
            const teacherSessions = getSessionsForTeacher(teacher.id)
            const workload = calculateWorkload(teacherSessions)

            return (
              <Card
                key={teacher.id}
                className="bg-black border-white/20 cursor-pointer hover:border-green-500/40 transition-colors"
                onClick={() =>
                  onViewChange({
                    type: 'teachers',
                    selectedId: teacher.id,
                    selectedName: `${teacher.first_name} ${teacher.last_name}`
                  })
                }
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-white">
                    {teacher.first_name} {teacher.last_name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">Sessions</span>
                      <span className="text-white font-medium">{teacherSessions.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">Workload</span>
                      <span className="text-white font-medium">{workload}h/week</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">Courses</span>
                      <span className="text-white font-medium">{teacher.courses.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {teacher.courses.slice(0, 2).map((course, idx) => (
                        <Badge key={idx} variant="default" className="text-xs">
                          {course.type}
                        </Badge>
                      ))}
                      {teacher.courses.length > 2 && (
                        <Badge variant="default" className="text-xs">
                          +{teacher.courses.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </motion.div>
    )
  }

  // Class List View
  if (view.type === 'classes' && !view.selectedId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="default"
              onClick={() => onViewChange({ type: 'overview' })}
              className="text-white hover:scale-105 duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Overview
            </Button>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-lime-500" />
              Class Schedules
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((classItem) => {
            const classSessions = getSessionsForClass(classItem.id)
            const totalHours = calculateWorkload(classSessions)

            return (
              <Card
                key={classItem.id}
                className="bg-black border-white/20 cursor-pointer hover:border-lime-500/40 transition-colors"
                onClick={() =>
                  onViewChange({
                    type: 'classes',
                    selectedId: classItem.id,
                    selectedName: classItem.name
                  })
                }
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>Class {classItem.name}</span>
                    <Badge variant="secondary" className="bg-lime-500 text-black">
                      Year {classItem.year}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">Sessions</span>
                      <span className="text-white font-medium">{classSessions.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">Total Hours</span>
                      <span className="text-white font-medium">{totalHours}h/week</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">Semester</span>
                      <span className="text-white font-medium">{classItem.semester}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge variant="default" className="text-xs">
                        {classSessions.filter((s) => s.type === 'lecture').length} Lectures
                      </Badge>
                      <Badge variant="default" className="text-xs">
                        {classSessions.filter((s) => s.type === 'seminar').length} Seminars
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </motion.div>
    )
  }

  return null
}
