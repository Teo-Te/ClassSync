import { motion } from 'framer-motion'
import { Clock, User, MapPin, BookOpen, AlertTriangle, Users } from 'lucide-react'
import { ScheduleSession, TimeSlot, ScheduleConflict } from '@shared/types/database'

interface ScheduleGridProps {
  sessions: ScheduleSession[]
  conflicts: ScheduleConflict[]
  onSessionClick?: (session: ScheduleSession) => void
}

export const ScheduleGrid = ({ sessions, conflicts, onSessionClick }: ScheduleGridProps) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const timeSlots = [9, 11, 13, 15] // Keep existing time slots

  // Get all sessions for a specific time slot
  const getSessionsForSlot = (day: string, startTime: number): ScheduleSession[] => {
    return sessions.filter(
      (session) => session.timeSlot.day === day && session.timeSlot.startTime === startTime
    )
  }

  // Check if sessions are grouped (same course, teacher, room, time)
  const getGroupedSessions = (day: string, startTime: number): ScheduleSession[][] => {
    const slotSessions = getSessionsForSlot(day, startTime)

    // Group by course + teacher + room + type
    const groups = new Map<string, ScheduleSession[]>()

    slotSessions.forEach((session) => {
      const key = `${session.courseId}-${session.teacherId}-${session.roomId}-${session.type}`
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(session)
    })

    return Array.from(groups.values()).filter((group) => group.length > 1)
  }

  const getConflictsForSession = (session: ScheduleSession): ScheduleConflict[] => {
    return conflicts.filter((conflict) => {
      const affectedItems = conflict.affectedItems || []
      const message = conflict.message.toLowerCase()

      // Check if this session is directly mentioned in affected items
      const sessionInvolvement = {
        hasTeacher: affectedItems.includes(session.teacherName),
        hasRoom: affectedItems.includes(session.roomName),
        hasClass: affectedItems.includes(session.className),
        hasCourse: affectedItems.includes(session.courseName)
      }

      // Extract day/time from conflict message if possible
      const conflictDay = session.timeSlot.day.toLowerCase()
      const conflictTime = session.timeSlot.startTime

      // For double-booking conflicts, check if the conflict mentions this specific day/time
      if (message.includes('double-booked')) {
        // Only show if this session is involved AND the conflict is on this day
        const isDayMentioned =
          message.includes(conflictDay) ||
          message.includes(session.timeSlot.day) ||
          (!message.includes('monday') &&
            !message.includes('tuesday') &&
            !message.includes('wednesday') &&
            !message.includes('thursday') &&
            !message.includes('friday')) // If no specific day mentioned, show for all

        if (message.includes('teacher')) {
          return sessionInvolvement.hasTeacher && sessionInvolvement.hasCourse && isDayMentioned
        }

        if (message.includes('room')) {
          return sessionInvolvement.hasRoom && sessionInvolvement.hasCourse && isDayMentioned
        }

        if (message.includes('class')) {
          return sessionInvolvement.hasClass && sessionInvolvement.hasCourse && isDayMentioned
        }
      }

      // For validation errors, check if this specific session combination is mentioned
      if (message.includes('validation error')) {
        const isDayMentioned =
          message.includes(conflictDay) ||
          message.includes(session.timeSlot.day) ||
          (!message.includes('monday') &&
            !message.includes('tuesday') &&
            !message.includes('wednesday') &&
            !message.includes('thursday') &&
            !message.includes('friday'))

        const matchCount = Object.values(sessionInvolvement).filter(Boolean).length
        return matchCount >= 2 && isDayMentioned
      }

      // For missing sessions: exact course + class match (not time-specific)
      if (message.includes('missing')) {
        return sessionInvolvement.hasCourse && sessionInvolvement.hasClass
      }

      // For no teacher available: course + class match (not time-specific)
      if (message.includes('no teacher')) {
        return sessionInvolvement.hasCourse && sessionInvolvement.hasClass
      }

      // For other conflicts, be more restrictive
      return false
    })
  }

  const getSessionColor = (session: ScheduleSession, isGrouped = false) => {
    const sessionConflicts = getConflictsForSession(session)

    if (sessionConflicts.some((c) => c.severity === 'critical')) {
      return 'bg-red-500/20 border-red-500/40 text-red-300'
    } else if (sessionConflicts.some((c) => c.severity === 'warning')) {
      return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
    } else if (isGrouped) {
      return 'bg-purple-500/20 border-purple-500/40 text-purple-300' // Special color for grouped
    } else if (session.type === 'lecture') {
      return 'bg-blue-500/20 border-blue-500/40 text-blue-300'
    } else {
      return 'bg-green-500/20 border-green-500/40 text-green-300'
    }
  }

  const renderSessionCell = (day: string, time: number) => {
    const slotSessions = getSessionsForSlot(day, time)
    const groupedSessions = getGroupedSessions(day, time)

    // If no sessions, show available
    if (slotSessions.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-white/30 text-xs">
          Available
        </div>
      )
    }

    // If we have grouped sessions, render them
    if (groupedSessions.length > 0) {
      return (
        <div className="space-y-1">
          {groupedSessions.map((group, groupIndex) => {
            const primarySession = group[0] // Use first session as representative
            const sessionConflicts = getConflictsForSession(primarySession)

            return (
              <motion.div
                key={`${day}-${time}-group-${groupIndex}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-2 rounded border cursor-pointer hover:opacity-80 transition-opacity ${getSessionColor(primarySession, true)}`}
                onClick={() => onSessionClick?.(primarySession)}
              >
                <div className="space-y-1">
                  <div className="font-medium text-xs truncate">{primarySession.courseName}</div>

                  <div className="space-y-1 text-xs opacity-90">
                    {/* Show grouped classes indicator */}
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span className="truncate">{group.length} Classes</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span className="truncate">{primarySession.teacherName}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{primarySession.roomName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          primarySession.type === 'lecture'
                            ? 'bg-purple-500/30 text-purple-200'
                            : 'bg-green-500/30 text-green-200'
                        }`}
                      >
                        {primarySession.type.toUpperCase()} (GROUPED)
                      </span>

                      {sessionConflicts.length > 0 && (
                        <AlertTriangle className="w-3 h-3 text-yellow-400" />
                      )}
                    </div>

                    {/* Show class names */}
                    <div className="text-xs text-white/60 truncate">
                      {group.map((s) => s.className).join(', ')}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}

          {/* Show any remaining individual sessions */}
          {slotSessions
            .filter((session) => {
              // Filter out sessions that are already shown in groups
              return !groupedSessions.some((group) =>
                group.some((groupSession) => groupSession.id === session.id)
              )
            })
            .map((session, index) => {
              const sessionConflicts = getConflictsForSession(session)

              return (
                <motion.div
                  key={`${session.id}-individual`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-2 rounded border cursor-pointer hover:opacity-80 transition-opacity ${getSessionColor(session)}`}
                  onClick={() => onSessionClick?.(session)}
                >
                  <div className="space-y-1">
                    <div className="font-medium text-xs truncate">{session.courseName}</div>

                    <div className="space-y-1 text-xs opacity-90">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        <span className="truncate">{session.className}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="truncate">{session.teacherName}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{session.roomName}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            session.type === 'lecture'
                              ? 'bg-blue-500/30 text-blue-200'
                              : 'bg-green-500/30 text-green-200'
                          }`}
                        >
                          {session.type.toUpperCase()}
                        </span>

                        {sessionConflicts.length > 0 && (
                          <AlertTriangle className="w-3 h-3 text-yellow-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
        </div>
      )
    }

    // Show individual sessions only
    return (
      <div className="space-y-1">
        {slotSessions.map((session, index) => {
          const sessionConflicts = getConflictsForSession(session)

          return (
            <motion.div
              key={`${session.id}-${index}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-2 rounded border cursor-pointer hover:opacity-80 transition-opacity ${getSessionColor(session)}`}
              onClick={() => onSessionClick?.(session)}
            >
              <div className="space-y-1">
                <div className="font-medium text-xs truncate">{session.courseName}</div>

                <div className="space-y-1 text-xs opacity-90">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    <span className="truncate">{session.className}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span className="truncate">{session.teacherName}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{session.roomName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        session.type === 'lecture'
                          ? 'bg-blue-500/30 text-blue-200'
                          : 'bg-green-500/30 text-green-200'
                      }`}
                    >
                      {session.type.toUpperCase()}
                    </span>

                    {sessionConflicts.length > 0 && (
                      <AlertTriangle className="w-3 h-3 text-yellow-400" />
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="bg-black border border-white/20 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-6 border-b border-white/20">
        <div className="p-4 bg-white/5 text-white font-medium">Time</div>
        {days.map((day) => (
          <div key={day} className="p-4 bg-white/5 text-white font-medium text-center">
            {day}
          </div>
        ))}
      </div>

      {/* Time slots */}
      {timeSlots.map((time) => (
        <div key={time} className="grid grid-cols-6 border-b border-white/10 min-h-[120px]">
          <div className="p-4 bg-white/5 text-white/70 flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            {time}:00 - {time + 2}:00
          </div>

          {days.map((day) => (
            <div key={`${day}-${time}`} className="p-2 border-l border-white/10">
              {renderSessionCell(day, time)}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
