import { motion } from 'framer-motion'
import { ArrowLeft, Building, Users, GraduationCap, Clock, BarChart3, UserPlus } from 'lucide-react'
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

  // Group sessions by groupId for display
  const groupSessionsForDisplay = (sessions: ScheduleSession[]) => {
    const grouped = new Map<string, ScheduleSession[]>()
    const individual: ScheduleSession[] = []

    sessions.forEach((session) => {
      if (session.isGrouped && session.groupId) {
        if (!grouped.has(session.groupId)) {
          grouped.set(session.groupId, [])
        }
        grouped.get(session.groupId)!.push(session)
      } else {
        individual.push(session)
      }
    })

    return { grouped: Array.from(grouped.values()), individual }
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

  const { grouped: groupedSessions, individual: individualSessions } =
    groupSessionsForDisplay(entitySessions)

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
            variant="default"
            onClick={() => onViewChange({ type: view.type })}
            className="text-white hover:scale-105 duration-200"
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
            <div className="space-y-4">
              {/* Grouped Sessions */}
              {groupedSessions.map((group, groupIndex) => {
                const representativeSession = group[0] // Use first session as representative
                const allClassNames = group.map((s) => s.className).join(', ')

                return (
                  <div
                    key={`group-${groupIndex}`}
                    className="p-4 bg-purple-500/10 rounded border border-purple-500/20"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-purple-500 text-white">
                          {representativeSession.type.toUpperCase()} - GROUPED
                        </Badge>
                        <div className="flex items-center gap-2 text-purple-300">
                          <UserPlus className="w-4 h-4" />
                          <span className="text-sm">{group.length} Classes</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSessionClick?.(representativeSession)}
                        className="text-white bg-black hover:bg-purple-500/20"
                      >
                        View Details
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="text-white font-medium text-lg">
                        {representativeSession.courseName}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="text-white/70">
                          <span className="font-medium">Classes:</span> {allClassNames}
                        </div>
                        <div className="text-white/70">
                          <span className="font-medium">Time:</span>{' '}
                          {representativeSession.timeSlot.day}{' '}
                          {representativeSession.timeSlot.startTime}:00-
                          {representativeSession.timeSlot.endTime}:00
                        </div>
                        {view.type !== 'teachers' && (
                          <div className="text-white/70">
                            <span className="font-medium">Teacher:</span>{' '}
                            {representativeSession.teacherName}
                          </div>
                        )}
                        {view.type !== 'rooms' && (
                          <div className="text-white/70">
                            <span className="font-medium">Room:</span>{' '}
                            {representativeSession.roomName}
                          </div>
                        )}
                      </div>

                      {/* Show individual class details if needed */}
                      <details className="mt-2">
                        <summary className="text-purple-300 cursor-pointer text-sm hover:text-purple-200">
                          Show individual class sessions
                        </summary>
                        <div className="mt-2 pl-4 space-y-1">
                          {group.map((session, index) => (
                            <div key={session.id} className="text-white/60 text-xs">
                              • Class {session.className}
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  </div>
                )
              })}

              {/* Individual Sessions */}
              {individualSessions.map((session) => (
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
                    className="text-white bg-black"
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
