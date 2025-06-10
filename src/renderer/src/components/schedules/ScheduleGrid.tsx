import { motion } from 'framer-motion'
import { Clock, User, MapPin, BookOpen, AlertTriangle } from 'lucide-react'
import { ScheduleSession, TimeSlot, ScheduleConflict } from '@shared/types/database'

interface ScheduleGridProps {
  sessions: ScheduleSession[]
  conflicts: ScheduleConflict[]
  onSessionClick?: (session: ScheduleSession) => void
}

export const ScheduleGrid = ({ sessions, conflicts, onSessionClick }: ScheduleGridProps) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const timeSlots = [9, 11, 13, 15] // 9-11, 11-13, 13-15, 15-17

  const getSessionForSlot = (day: string, startTime: number): ScheduleSession | null => {
    return (
      sessions.find(
        (session) => session.timeSlot.day === day && session.timeSlot.startTime === startTime
      ) || null
    )
  }

  const getConflictsForSession = (session: ScheduleSession): ScheduleConflict[] => {
    return conflicts.filter(
      (conflict) =>
        conflict.affectedItems.includes(session.courseName) ||
        conflict.affectedItems.includes(session.teacherName)
    )
  }

  const getSessionColor = (session: ScheduleSession) => {
    const sessionConflicts = getConflictsForSession(session)

    if (sessionConflicts.some((c) => c.severity === 'critical')) {
      return 'bg-red-500/20 border-red-500/40 text-red-300'
    } else if (sessionConflicts.some((c) => c.severity === 'warning')) {
      return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
    } else if (session.type === 'lecture') {
      return 'bg-blue-500/20 border-blue-500/40 text-blue-300'
    } else {
      return 'bg-green-500/20 border-green-500/40 text-green-300'
    }
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

          {days.map((day) => {
            const session = getSessionForSlot(day, time)
            const sessionConflicts = session ? getConflictsForSession(session) : []

            return (
              <div key={`${day}-${time}`} className="p-2 border-l border-white/10">
                {session ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`h-full p-3 rounded border cursor-pointer hover:opacity-80 transition-opacity ${getSessionColor(session)}`}
                    onClick={() => onSessionClick?.(session)}
                  >
                    <div className="space-y-2">
                      <div className="font-medium text-sm truncate">{session.courseName}</div>

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
                ) : (
                  <div className="h-full flex items-center justify-center text-white/30 text-xs">
                    Available
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
