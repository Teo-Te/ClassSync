import {
  ScheduleConstraints,
  TimeSlot,
  ScheduleSession,
  ScheduleConflict,
  GeneratedSchedule,
  Course,
  Class,
  TeacherWithCourses,
  Room,
  CourseWithTeacherDetails
} from '@shared/types/database'

export class ScheduleAlgorithm {
  private constraints: ScheduleConstraints
  private timeSlots: TimeSlot[]
  private teachers: TeacherWithCourses[]
  private rooms: Room[]
  private classes: Class[]
  private courses: CourseWithTeacherDetails[]

  constructor(
    constraints: ScheduleConstraints,
    teachers: TeacherWithCourses[],
    rooms: Room[],
    classes: Class[],
    courses: CourseWithTeacherDetails[]
  ) {
    this.constraints = constraints
    this.teachers = teachers
    this.rooms = rooms
    this.classes = classes
    this.courses = courses
    this.timeSlots = this.generateTimeSlots()
  }

  private generateTimeSlots(): TimeSlot[] {
    const days: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday'
    ]
    const slots: TimeSlot[] = []

    days.forEach((day) => {
      for (
        let hour = this.constraints.preferredStartTime;
        hour < this.constraints.maxEndTime;
        hour += 2
      ) {
        slots.push({
          day,
          startTime: hour,
          endTime: hour + 2,
          duration: 2
        })
      }
    })

    return slots
  }

  public generateSchedule(): GeneratedSchedule {
    const sessions: ScheduleSession[] = []
    const conflicts: ScheduleConflict[] = []

    // Step 1: Create session requirements
    const sessionRequirements = this.createSessionRequirements()

    // Step 2: Sort by priority (lectures first, morning preferred)
    const sortedRequirements = this.prioritizeRequirements(sessionRequirements)

    // Step 3: Assign sessions to time slots
    for (const requirement of sortedRequirements) {
      const assignment = this.assignSession(requirement, sessions)

      if (assignment.session) {
        sessions.push(assignment.session)
      }

      conflicts.push(...assignment.conflicts)
    }

    // Step 4: Optimize and resolve conflicts
    const optimizedSessions = this.optimizeSchedule(sessions)
    const finalConflicts = this.validateSchedule(optimizedSessions)

    // Step 5: Calculate quality score
    const score = this.calculateQualityScore(optimizedSessions, finalConflicts)

    return {
      id: `schedule_${Date.now()}`,
      name: `Generated Schedule ${new Date().toLocaleDateString()}`,
      sessions: optimizedSessions,
      conflicts: finalConflicts,
      score,
      metadata: {
        generatedAt: new Date().toISOString(),
        constraints: this.constraints,
        totalHours: optimizedSessions.reduce((acc, s) => acc + s.timeSlot.duration, 0),
        utilizationRate: this.calculateUtilizationRate(optimizedSessions)
      }
    }
  }

  private createSessionRequirements() {
    const requirements: Array<{
      courseId: number
      courseName: string
      classId: number
      className: string
      type: 'lecture' | 'seminar'
      duration: number
      priority: number
      preferredTeachers: TeacherWithCourses[]
    }> = []

    this.classes.forEach((classItem) => {
      // Get courses for this class
      const classCourses = this.courses.filter(
        (course) =>
          // You'll need to implement a way to get courses for a class
          // For now, assume all courses are available to all classes
          true
      )

      classCourses.forEach((course) => {
        // Add lecture requirement
        if (course.lecture_hours > 0) {
          const preferredTeachers = this.teachers.filter((teacher) =>
            teacher.courses.some(
              (tc) => tc.id === course.id && (tc.type === 'lecture' || tc.type === 'both')
            )
          )

          requirements.push({
            courseId: course.id,
            courseName: course.name,
            classId: classItem.id,
            className: classItem.name,
            type: 'lecture',
            duration: course.lecture_hours,
            priority: this.calculatePriority('lecture', classItem, course),
            preferredTeachers: this.sortTeachersByWorkload(preferredTeachers)
          })
        }

        // Add seminar requirement
        if (course.seminar_hours > 0) {
          const preferredTeachers = this.teachers.filter((teacher) =>
            teacher.courses.some(
              (tc) => tc.id === course.id && (tc.type === 'seminar' || tc.type === 'both')
            )
          )

          requirements.push({
            courseId: course.id,
            courseName: course.name,
            classId: classItem.id,
            className: classItem.name,
            type: 'seminar',
            duration: course.seminar_hours,
            priority: this.calculatePriority('seminar', classItem, course),
            preferredTeachers: this.sortTeachersByWorkload(preferredTeachers)
          })
        }
      })
    })

    return requirements
  }

  private calculatePriority(
    type: 'lecture' | 'seminar',
    classItem: Class,
    course: CourseWithTeacherDetails
  ): number {
    let priority = 0

    // Lectures get higher priority
    if (type === 'lecture') priority += 10

    // Earlier years get higher priority
    priority += (5 - classItem.year) * 5

    // Higher hour courses get higher priority
    priority += course.hours_per_week

    return priority
  }

  private sortTeachersByWorkload(teachers: TeacherWithCourses[]): TeacherWithCourses[] {
    return teachers.sort((a, b) => {
      const aWorkload = this.calculateTeacherWorkload(a)
      const bWorkload = this.calculateTeacherWorkload(b)
      return aWorkload - bWorkload // Ascending order (less workload first)
    })
  }

  private calculateTeacherWorkload(teacher: TeacherWithCourses): number {
    return teacher.courses.reduce((acc, course) => {
      switch (course.type) {
        case 'lecture':
          return acc + course.lecture_hours
        case 'seminar':
          return acc + course.seminar_hours
        case 'both':
          return acc + course.hours_per_week
        default:
          return acc
      }
    }, 0)
  }

  private prioritizeRequirements(requirements: any[]): any[] {
    return requirements.sort((a, b) => {
      // Sort by priority (higher first)
      if (a.priority !== b.priority) {
        return b.priority - a.priority
      }

      // Then by type (lectures first)
      if (a.type !== b.type) {
        return a.type === 'lecture' ? -1 : 1
      }

      // Then by duration (longer first)
      return b.duration - a.duration
    })
  }

  private assignSession(
    requirement: any,
    existingSessions: ScheduleSession[]
  ): {
    session: ScheduleSession | null
    conflicts: ScheduleConflict[]
  } {
    const conflicts: ScheduleConflict[] = []

    // Step 1: Find best time slot first
    const timeSlot = this.findBestTimeSlotForRequirement(requirement, existingSessions)
    if (!timeSlot) {
      conflicts.push({
        type: 'constraint_violation',
        severity: 'critical',
        message: `No available time slot for ${requirement.courseName} ${requirement.type}`,
        affectedItems: [requirement.courseName],
        suggestions: ['Extend schedule hours', 'Reduce course hours', 'Add more teachers']
      })
      return { session: null, conflicts }
    }

    // Step 2: Find best teacher for this time slot
    const teacher = this.findBestTeacherForTimeSlot(requirement, timeSlot, existingSessions)
    if (!teacher) {
      conflicts.push({
        type: 'teacher_conflict',
        severity: 'critical',
        message: `No available teacher for ${requirement.courseName} ${requirement.type} at ${timeSlot.day} ${timeSlot.startTime}:00`,
        affectedItems: [requirement.courseName],
        suggestions: [
          'Assign a teacher to this course',
          'Modify course requirements',
          'Try different time slot'
        ]
      })
      return { session: null, conflicts }
    }

    // Step 3: Find best room for this time slot
    const room = this.findBestRoom(requirement, timeSlot, existingSessions)
    if (!room) {
      conflicts.push({
        type: 'room_conflict',
        severity: 'critical',
        message: `No available room for ${requirement.courseName} ${requirement.type} at ${timeSlot.day} ${timeSlot.startTime}:00`,
        affectedItems: [requirement.courseName],
        suggestions: ['Add more rooms', 'Reschedule conflicting sessions']
      })
      return { session: null, conflicts }
    }

    // Create session
    const session: ScheduleSession = {
      id: `session_${Date.now()}_${Math.random()}`,
      courseId: requirement.courseId,
      courseName: requirement.courseName,
      classId: requirement.classId,
      className: requirement.className,
      teacherId: teacher.id,
      teacherName: `${teacher.first_name} ${teacher.last_name}`,
      roomId: room.id,
      roomName: room.name,
      type: requirement.type,
      timeSlot,
      conflicts: []
    }

    return { session, conflicts }
  }

  private findBestTimeSlotForRequirement(
    requirement: any,
    existingSessions: ScheduleSession[]
  ): TimeSlot | null {
    // Sort time slots by preference
    const sortedSlots = [...this.timeSlots].sort((a, b) => {
      const aScore = this.calculateTimeSlotScore(a, requirement.type)
      const bScore = this.calculateTimeSlotScore(b, requirement.type)
      return bScore - aScore // Higher score first
    })

    for (const slot of sortedSlots) {
      // Check if any preferred teacher is available for this slot
      const availableTeacher = requirement.preferredTeachers.find((teacher: TeacherWithCourses) => {
        const hasConflict = existingSessions.some(
          (session) =>
            session.teacherId === teacher.id &&
            session.timeSlot.day === slot.day &&
            this.timeSlotsOverlap(session.timeSlot, slot)
        )
        return !hasConflict
      })

      // Check if rooms are available for this slot
      const availableRoom = this.rooms.find((room) => {
        const isCompatible =
          (requirement.type === 'lecture' && room.type === 'lecture') ||
          (requirement.type === 'seminar' && room.type === 'seminar')

        if (!isCompatible) return false

        const hasConflict = existingSessions.some(
          (session) =>
            session.roomId === room.id &&
            session.timeSlot.day === slot.day &&
            this.timeSlotsOverlap(session.timeSlot, slot)
        )

        return !hasConflict
      })

      // If both teacher and room are available, this slot works
      if (availableTeacher && availableRoom) {
        return slot
      }
    }

    return null
  }

  private findBestTeacherForTimeSlot(
    requirement: any,
    timeSlot: TimeSlot,
    existingSessions: ScheduleSession[]
  ): TeacherWithCourses | null {
    for (const teacher of requirement.preferredTeachers) {
      // Check if teacher is available for this specific time slot
      const hasConflict = existingSessions.some(
        (session) =>
          session.teacherId === teacher.id && this.timeSlotsOverlap(session.timeSlot, timeSlot)
      )

      if (!hasConflict) {
        // Check daily workload constraint
        const sameDaySessions = existingSessions.filter(
          (session) => session.teacherId === teacher.id && session.timeSlot.day === timeSlot.day
        )

        const dailyHours =
          sameDaySessions.reduce((total, session) => total + session.timeSlot.duration, 0) +
          timeSlot.duration // Add the new session duration

        if (dailyHours <= this.constraints.maxTeacherHoursPerDay) {
          // Check back-to-back constraint if enabled
          if (this.constraints.avoidBackToBackSessions) {
            const hasBackToBack = sameDaySessions.some((session) => {
              return (
                session.timeSlot.endTime === timeSlot.startTime ||
                session.timeSlot.startTime === timeSlot.endTime
              )
            })

            if (!hasBackToBack) {
              return teacher
            }
          } else {
            return teacher
          }
        }
      }
    }

    return null
  }

  private findBestTimeSlot(
    requirement: any,
    teacher: TeacherWithCourses,
    existingSessions: ScheduleSession[]
  ): TimeSlot | null {
    // Sort time slots by preference
    const sortedSlots = this.timeSlots.sort((a, b) => {
      let aScore = this.calculateTimeSlotScore(a, requirement.type)
      let bScore = this.calculateTimeSlotScore(b, requirement.type)
      return bScore - aScore // Higher score first
    })

    for (const slot of sortedSlots) {
      // Check if slot is available for teacher
      const teacherConflict = existingSessions.some(
        (session) =>
          session.teacherId === teacher.id &&
          session.timeSlot.day === slot.day &&
          this.timeSlotsOverlap(session.timeSlot, slot)
      )

      if (!teacherConflict) {
        return slot
      }
    }

    return null
  }

  private calculateTimeSlotScore(slot: TimeSlot, sessionType: 'lecture' | 'seminar'): number {
    let score = 0

    // Morning preference
    if (slot.startTime >= 9 && slot.endTime <= 13) {
      score += 50 // Best time
    } else if (slot.startTime >= 9 && slot.endTime <= 15) {
      score += 30 // Good time
    } else {
      score += 10 // Worst time
    }

    // Lecture morning preference
    if (sessionType === 'lecture' && slot.startTime === 9) {
      score += 20 // Best for lectures
    } else if (sessionType === 'lecture' && slot.startTime <= 11) {
      score += 10 // Good for lectures
    }

    return score
  }

  private findBestRoom(
    requirement: any,
    timeSlot: TimeSlot,
    existingSessions: ScheduleSession[]
  ): Room | null {
    // Filter available rooms
    const availableRooms = this.rooms.filter((room) => {
      // Check room type compatibility
      const isCompatible =
        (requirement.type === 'lecture' && room.type === 'lecture') ||
        (requirement.type === 'seminar' && room.type === 'seminar')

      if (!isCompatible) return false

      // Check room availability
      const hasConflict = existingSessions.some(
        (session) =>
          session.roomId === room.id &&
          session.timeSlot.day === timeSlot.day &&
          this.timeSlotsOverlap(session.timeSlot, timeSlot)
      )

      return !hasConflict
    })

    // Sort by preference (auditoriums for lectures, capacity, etc.)
    return (
      availableRooms.sort((a, b) => {
        let aScore = this.calculateRoomScore(a, requirement)
        let bScore = this.calculateRoomScore(b, requirement)
        return bScore - aScore
      })[0] || null
    )
  }

  private calculateRoomScore(room: Room, requirement: any): number {
    let score = room.capacity || 50

    // Prefer lecture rooms for lectures
    if (requirement.type === 'lecture' && room.type === 'lecture') {
      score += 100
    }

    // Prefer seminar rooms for seminars
    if (requirement.type === 'seminar' && room.type === 'seminar') {
      score += 100
    }

    return score
  }

  private timeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
    if (slot1.day !== slot2.day) return false

    return slot1.startTime < slot2.endTime && slot2.startTime < slot1.endTime
  }

  private optimizeSchedule(sessions: ScheduleSession[]): ScheduleSession[] {
    // Group same courses for same time slots if possible
    // Resolve minor conflicts
    // Balance teacher workload
    return sessions
  }

  private validateSchedule(sessions: ScheduleSession[]): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = []

    // Check for teacher conflicts
    const teacherSessions = new Map<number, ScheduleSession[]>()
    sessions.forEach((session) => {
      if (!teacherSessions.has(session.teacherId)) {
        teacherSessions.set(session.teacherId, [])
      }
      teacherSessions.get(session.teacherId)!.push(session)
    })

    teacherSessions.forEach((teacherSessionList, teacherId) => {
      for (let i = 0; i < teacherSessionList.length; i++) {
        for (let j = i + 1; j < teacherSessionList.length; j++) {
          if (
            this.timeSlotsOverlap(teacherSessionList[i].timeSlot, teacherSessionList[j].timeSlot)
          ) {
            conflicts.push({
              type: 'teacher_conflict',
              severity: 'critical',
              message: `Teacher ${teacherSessionList[i].teacherName} has conflicting sessions`,
              affectedItems: [teacherSessionList[i].courseName, teacherSessionList[j].courseName],
              suggestions: ['Reschedule one of the sessions', 'Assign different teacher']
            })
          }
        }
      }
    })

    return conflicts
  }

  private calculateQualityScore(
    sessions: ScheduleSession[],
    conflicts: ScheduleConflict[]
  ): number {
    let score = 100

    // Deduct points for conflicts
    conflicts.forEach((conflict) => {
      switch (conflict.severity) {
        case 'critical':
          score -= 20
          break
        case 'warning':
          score -= 10
          break
        case 'suggestion':
          score -= 5
          break
      }
    })

    // Add points for good practices
    const morningLectures = sessions.filter(
      (s) => s.type === 'lecture' && s.timeSlot.startTime >= 9 && s.timeSlot.startTime <= 11
    ).length

    score += Math.min(morningLectures * 2, 20)

    return Math.max(0, Math.min(100, score))
  }

  private calculateUtilizationRate(sessions: ScheduleSession[]): number {
    const totalSlots = this.timeSlots.length
    const usedSlots = sessions.length
    return (usedSlots / totalSlots) * 100
  }
}
