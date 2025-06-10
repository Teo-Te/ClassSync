import { motion } from 'framer-motion'
import { ArrowLeft, Building, Users, GraduationCap, Clock, BarChart3 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Badge } from '@renderer/components/ui/badge'
import { ScheduleGrid } from './ScheduleGrid'
import {
  ScheduleView,
  ScheduleSession,
  Room,
  TeacherWithCourses,
  Class,
  ScheduleConflict
} from '@shared/types/database'

interface IndividualScheduleViewProps {
  view: ScheduleView
  onViewChange: (view: ScheduleView) => void
  sessions: ScheduleSession[]
  conflicts: ScheduleConflict[]
  rooms: Room[]
  teachers: TeacherWithCourses[]
  classes: Class[]
  onSessionClick?: (session: ScheduleSession) => void
}

export const IndividualScheduleView = ({
  view,
  onViewChange,
  sessions,
  conflicts,
  rooms,
  teachers,
  classes,
  onSessionClick
}: IndividualScheduleViewProps) => {
  if (!view.selectedId) return null

  const getEntitySessions = () => {
    switch (view.type) {
      case 'rooms':
        return sessions.filter((s) => s.roomId === view.selectedId)
      case 'teachers':
        return sessions.filter((s) => s.teacherId === view.selectedId)
      case 'classes':
        return sessions.filter((s) => s.classId === view.selectedId)
      default:
        return []
    }
  }

  const getEntity = () => {
    switch (view.type) {
      case 'rooms':
        return rooms.find((r) => r.id === view.selectedId)
      case 'teachers':
        return teachers.find((t) => t.id === view.selectedId)
      case 'classes':
        return classes.find((c) => c.id === view.selectedId)
      default:
        return null
    }
  }

  const entitySessions = getEntitySessions()
  const entity = getEntity()
  const entityConflicts = conflicts.filter((c) => c.affectedItems.includes(view.selectedName || ''))

  const getIcon = () => {
    switch (view.type) {
      case 'rooms':
        return <Building className="w-6 h-6 text-blue-500" />
      case 'teachers':
        return <Users className="w-6 h-6 text-green-500" />
      case 'classes':
        return <GraduationCap className="w-6 h-6 text-lime-500" />
      default:
        return null
    }
  }

  const getBackButtonText = () => {
    switch (view.type) {
      case 'rooms':
        return 'Back to Rooms'
      case 'teachers':
        return 'Back to Teachers'
      case 'classes':
        return 'Back to Classes'
      default:
        return 'Back'
    }
  }

  const getEntityInfo = () => {
    if (view.type === 'rooms' && entity) {
      const room = entity as Room
      return [
        { label: 'Type', value: room.type.toUpperCase() },
        { label: 'Capacity', value: room.capacity?.toString() || 'N/A' },
        { label: 'Sessions', value: entitySessions.length.toString() },
        {
          label: 'Utilization',
          value: `${Math.round((entitySessions.length / 20) * 100)}%`
        }
      ]
    }

    if (view.type === 'teachers' && entity) {
      const teacher = entity as TeacherWithCourses
      const totalHours = entitySessions.reduce((sum, s) => sum + s.timeSlot.duration, 0)
      return [
        { label: 'Email', value: teacher.email },
        { label: 'Courses', value: teacher.courses.length.toString() },
        { label: 'Sessions', value: entitySessions.length.toString() },
        { label: 'Weekly Hours', value: `${totalHours}h` }
      ]
    }

    if (view.type === 'classes' && entity) {
      const classItem = entity as Class
      const totalHours = entitySessions.reduce((sum, s) => sum + s.timeSlot.duration, 0)
      const lectures = entitySessions.filter((s) => s.type === 'lecture').length
      const seminars = entitySessions.filter((s) => s.type === 'seminar').length

      return [
        { label: 'Year', value: classItem.year.toString() },
        { label: 'Semester', value: classItem.semester.toString() },
        { label: 'Total Hours', value: `${totalHours}h/week` },
        { label: 'Sessions', value: `${lectures}L / ${seminars}S` }
      ]
    }

    return []
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => onViewChange({ type: view.type })}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {getBackButtonText()}
          </Button>
          <div className="flex items-center gap-3">
            {getIcon()}
            <div>
              <h2 className="text-2xl font-bold text-white">{view.selectedName}</h2>
              <p className="text-white/70">
                {view.type.charAt(0).toUpperCase() + view.type.slice(1, -1)} Schedule
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {getEntityInfo().map((info, index) => (
          <Card key={index} className="bg-black border-white/20">
            <CardContent className="p-4">
              <div className="text-white/70 text-sm">{info.label}</div>
              <div className="text-white font-medium text-lg">{info.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conflicts */}
      {entityConflicts.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Schedule Conflicts ({entityConflicts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {entityConflicts.slice(0, 3).map((conflict, index) => (
                <div key={index} className="text-red-300 text-sm">
                  • {conflict.message}
                </div>
              ))}
              {entityConflicts.length > 3 && (
                <div className="text-red-300/70 text-sm">
                  +{entityConflicts.length - 3} more conflicts
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Grid */}
      <Card className="bg-black border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Weekly Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScheduleGrid
            sessions={entitySessions}
            conflicts={entityConflicts}
            onSessionClick={onSessionClick}
          />
        </CardContent>
      </Card>

      {/* Session List */}
      {entitySessions.length > 0 && (
        <Card className="bg-black border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Session Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {entitySessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={session.type === 'lecture' ? 'default' : 'secondary'}
                      className={session.type === 'lecture' ? 'bg-blue-500' : 'bg-green-500'}
                    >
                      {session.type.toUpperCase()}
                    </Badge>
                    <div>
                      <div className="text-white font-medium">{session.courseName}</div>
                      <div className="text-white/70 text-sm">
                        {view.type !== 'classes' && `Class ${session.className} • `}
                        {view.type !== 'teachers' && `${session.teacherName} • `}
                        {view.type !== 'rooms' && `${session.roomName} • `}
                        {session.timeSlot.day} {session.timeSlot.startTime}:00-
                        {session.timeSlot.endTime}:00
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSessionClick?.(session)}
                    className="text-white hover:bg-white/10"
                  >
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}
