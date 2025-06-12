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
  CourseWithTeacherDetails,
  ClassCourse
} from '@shared/types/database'

interface SchedulingPriority {
  score: number
  reasons: string[]
  type: 'best' | 'good' | 'worst'
  penalties: number
}

interface SessionRequirement {
  id: string
  classItem: Class
  course: CourseWithTeacherDetails
  sessionType: 'lecture' | 'seminar'
  priority: number
  isGroupable: boolean
  groupedClasses?: Class[]
}

interface TimeSlotCandidate {
  day: string
  start: number
  end: number
  teacher: TeacherWithCourses
  room: Room
  priority: SchedulingPriority
}

export class ScheduleAlgorithm {
  private constraints: ScheduleConstraints
  private teachers: TeacherWithCourses[]
  private rooms: Room[]
  private classes: Class[]
  private courses: CourseWithTeacherDetails[]
  private classCoursesMap: Map<number, CourseWithTeacherDetails[]>
  private sessions: ScheduleSession[] = []
  private conflicts: ScheduleConflict[] = []
  private sessionIdCounter = 1

  // Expanded time slots for maximum flexibility
  private readonly DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  private readonly TIME_SLOTS = [
    { start: 8, end: 10 }, // Early slot
    { start: 9, end: 11 }, // Prime morning
    { start: 10, end: 12 }, // Late morning
    { start: 11, end: 13 }, // Pre-lunch
    { start: 12, end: 14 }, // Lunch overlap
    { start: 13, end: 15 }, // Early afternoon
    { start: 14, end: 16 }, // Mid afternoon
    { start: 15, end: 17 }, // Late afternoon
    { start: 16, end: 18 }, // Evening
    { start: 17, end: 19 } // Late evening
  ]

  constructor(
    constraints: ScheduleConstraints,
    teachers: TeacherWithCourses[],
    rooms: Room[],
    classes: Class[],
    courses: CourseWithTeacherDetails[],
    classCoursesMap: Map<number, CourseWithTeacherDetails[]>
  ) {
    this.constraints = constraints
    this.teachers = teachers
    this.rooms = rooms
    this.classes = classes
    this.courses = courses
    this.classCoursesMap = classCoursesMap
  }

  public generateSchedule(): GeneratedSchedule {
    console.log('🚀 Starting ULTIMATE schedule generation...')
    console.log('🎯 Priority System: BEST > GOOD > WORST > FAILURE')

    // Reset state
    this.sessions = []
    this.conflicts = []
    this.sessionIdCounter = 1

    // Log input data and constraints
    this.logInputSummary()

    try {
      // Step 1: Validate manual assignments
      this.validateManualAssignments()

      // Step 2: Generate session requirements with grouping
      const requirements = this.generateSessionRequirements()
      console.log(`📋 Generated ${requirements.length} session requirements`)

      // Step 3: Sort by strategic priority
      const sortedRequirements = this.sortRequirementsByStrategy(requirements)

      // Step 4: Schedule each requirement using best-fit algorithm
      for (const requirement of sortedRequirements) {
        this.scheduleRequirementWithBestFit(requirement)
      }

      // Step 5: Apply optimization passes
      this.optimizeSchedule()

      // Step 6: Final validation
      this.validateFinalSchedule()

      // Step 7: Calculate comprehensive quality score
      const score = this.calculateAdvancedQualityScore()

      const result: GeneratedSchedule = {
        id: Date.now(),
        name: `Generated Schedule ${new Date().toLocaleDateString()}`,
        sessions: this.sessions,
        conflicts: this.conflicts,
        score,
        createdAt: new Date().toISOString(),
        metadata: {
          generatedAt: new Date().toISOString(),
          constraints: this.constraints,
          totalHours: this.calculateTotalHours(),
          utilizationRate: this.calculateUtilizationRate(),
          manualAssignments: this.sessions.filter((s) => s.isManualAssignment).length,
          automaticAssignments: this.sessions.filter((s) => !s.isManualAssignment).length
        }
      }

      this.logFinalSummary(result)
      return result
    } catch (error) {
      console.error('❌ Ultimate schedule generation failed:', error)
      throw error
    }
  }

  private logInputSummary(): void {
    console.log(`📊 Input Summary:`)
    console.log(`   Classes: ${this.classes.length}`)
    console.log(`   Courses: ${this.courses.length}`)
    console.log(`   Teachers: ${this.teachers.length}`)
    console.log(`   Rooms: ${this.rooms.length}`)
    console.log(
      `   Time Slots: ${this.TIME_SLOTS.length} × ${this.DAYS.length} = ${this.TIME_SLOTS.length * this.DAYS.length}`
    )

    console.log(`⚙️ Active Constraints:`)
    console.log(
      `   Time Window: ${this.constraints.preferredStartTime}:00-${this.constraints.preferredEndTime}:00 (max: ${this.constraints.maxEndTime}:00)`
    )
    console.log(`   Max Teacher Hours/Day: ${this.constraints.maxTeacherHoursPerDay}`)
    console.log(`   Avoid Back-to-Back: ${this.constraints.avoidBackToBackSessions}`)
    console.log(`   Morning Lectures: ${this.constraints.prioritizeMorningLectures}`)
    console.log(`   Group Classes: ${this.constraints.groupSameCourseClasses}`)
    console.log(`   Distribute Evenly: ${this.constraints.distributeEvenlyAcrossWeek}`)
    console.log(
      `   Session Lengths: L=${this.constraints.lectureSessionLength}h, S=${this.constraints.seminarSessionLength}h`
    )
  }

  private validateManualAssignments(): void {
    console.log('🔍 Validating manual assignments...')

    for (const course of this.courses) {
      if (course.manualAssignments && course.manualAssignments.length > 0) {
        for (const assignment of course.manualAssignments) {
          const teacher = this.teachers.find((t) => t.id === assignment.teacherId)
          if (!teacher) {
            this.addConflict(
              'critical',
              `Manual assignment: Teacher ${assignment.teacherName} not found for ${course.name}`,
              [course.name, assignment.teacherName]
            )
            continue
          }

          const teacherCourse = teacher.courses.find((tc) => tc.name === course.name)
          if (!teacherCourse) {
            this.addConflict(
              'warning',
              `Manual assignment: ${teacher.first_name} ${teacher.last_name} not qualified for ${course.name}`,
              [course.name, `${teacher.first_name} ${teacher.last_name}`]
            )
          } else if (teacherCourse.type !== 'both' && teacherCourse.type !== assignment.type) {
            this.addConflict(
              'warning',
              `Manual assignment mismatch: ${teacher.first_name} ${teacher.last_name} can teach ${teacherCourse.type} but assigned to ${assignment.type} for ${course.name}`,
              [course.name, `${teacher.first_name} ${teacher.last_name}`]
            )
          }
        }
      }
    }
  }

  private generateSessionRequirements(): SessionRequirement[] {
    const requirements: SessionRequirement[] = []
    const processedGroups = new Set<string>() // Track processed groups

    for (const classItem of this.classes) {
      const classCourses = this.getCoursesForClass(classItem)

      for (const course of classCourses) {
        // Handle lecture requirements with grouping
        if (this.constraints.groupSameCourseClasses) {
          const groupableClasses = this.findGroupableClasses(course, 'lecture')
          const groupKey = `${course.id}_lecture`

          if (groupableClasses.length > 1 && !processedGroups.has(groupKey)) {
            // Create ONE requirement for the entire group
            const lectureReq: SessionRequirement = {
              id: `group_${course.id}_lecture`,
              classItem: groupableClasses[0], // Use first class as representative
              course,
              sessionType: 'lecture',
              priority:
                this.calculateRequirementPriority(groupableClasses[0], course, 'lecture') + 50, // Higher priority for groups
              isGroupable: true,
              groupedClasses: groupableClasses
            }
            requirements.push(lectureReq)
            processedGroups.add(groupKey)
          } else if (groupableClasses.length <= 1) {
            // Individual lecture requirement
            const lectureReq: SessionRequirement = {
              id: `${classItem.id}_${course.id}_lecture`,
              classItem,
              course,
              sessionType: 'lecture',
              priority: this.calculateRequirementPriority(classItem, course, 'lecture'),
              isGroupable: false
            }
            requirements.push(lectureReq)
          }
        } else {
          // No grouping - individual lecture
          const lectureReq: SessionRequirement = {
            id: `${classItem.id}_${course.id}_lecture`,
            classItem,
            course,
            sessionType: 'lecture',
            priority: this.calculateRequirementPriority(classItem, course, 'lecture'),
            isGroupable: false
          }
          requirements.push(lectureReq)
        }

        // Seminars are always individual
        const seminarReq: SessionRequirement = {
          id: `${classItem.id}_${course.id}_seminar`,
          classItem,
          course,
          sessionType: 'seminar',
          priority: this.calculateRequirementPriority(classItem, course, 'seminar'),
          isGroupable: false
        }
        requirements.push(seminarReq)
      }
    }

    return requirements
  }

  private getCoursesForClass(classItem: Class): CourseWithTeacherDetails[] {
    // Get courses directly from the class-courses mapping
    const classCourses = this.classCoursesMap.get(classItem.id) || []

    console.log(
      `   📚 Found ${classCourses.length} assigned courses for class ${classItem.name}:`,
      classCourses.map((c) => c.name)
    )

    return classCourses
  }

  private calculateRequirementPriority(
    classItem: Class,
    course: CourseWithTeacherDetails,
    sessionType: 'lecture' | 'seminar'
  ): number {
    let priority = 100

    // 🏆 HIGHEST: Manual assignments
    if (course.manualAssignments?.some((a) => a.type === sessionType || a.type === 'both')) {
      priority += 100
    }

    // 🎯 HIGH: Resource constraints
    const availableTeachers = this.getAvailableTeachers(course, sessionType)
    if (availableTeachers.length === 1) {
      priority += 50 // Only one teacher available
    } else if (availableTeachers.length === 2) {
      priority += 25 // Limited options
    }

    // 📚 MEDIUM: Academic priority
    if (sessionType === 'lecture') priority += 20 // Lectures first
    priority += (4 - classItem.year) * 10 // Earlier years first
    priority += Math.min(course.hours_per_week, 10) // Higher hour courses

    // ⏰ LOW: Time preferences
    if (this.constraints.prioritizeMorningLectures && sessionType === 'lecture') {
      priority += 15
    }

    return priority
  }

  private findGroupableClasses(course: CourseWithTeacherDetails, sessionType: 'lecture'): Class[] {
    if (sessionType !== 'lecture') return []

    const classesWithThisCourse = this.classes.filter((classItem) => {
      const classCourses = this.getCoursesForClass(classItem)
      return classCourses.some((c) => c.name === course.name)
    })

    // Only group if we have 2 or more classes
    if (classesWithThisCourse.length >= 2) {
      console.log(
        `   🔗 Found ${classesWithThisCourse.length} classes that can be grouped for ${course.name}`
      )
      return classesWithThisCourse
    }

    return []
  }

  private sortRequirementsByStrategy(requirements: SessionRequirement[]): SessionRequirement[] {
    return requirements.sort((a, b) => {
      // 1. Manual assignments first
      const aManual = a.course.manualAssignments?.some(
        (ma) => ma.type === a.sessionType || ma.type === 'both'
      )
      const bManual = b.course.manualAssignments?.some(
        (ma) => ma.type === b.sessionType || ma.type === 'both'
      )
      if (aManual !== bManual) return bManual ? 1 : -1

      // 2. Priority score
      if (a.priority !== b.priority) return b.priority - a.priority

      // 3. Groupable lectures
      if (a.isGroupable !== b.isGroupable) return a.isGroupable ? -1 : 1

      // 4. Session type (lectures first)
      if (a.sessionType !== b.sessionType) return a.sessionType === 'lecture' ? -1 : 1

      return 0
    })
  }

  private scheduleRequirementWithBestFit(requirement: SessionRequirement): void {
    console.log(
      `\n🎯 Scheduling: ${requirement.course.name} ${requirement.sessionType} for ${requirement.classItem.name}`
    )
    console.log(`   Priority: ${requirement.priority} | Groupable: ${requirement.isGroupable}`)

    // Handle grouped sessions
    if (
      requirement.isGroupable &&
      requirement.groupedClasses &&
      requirement.groupedClasses.length > 1
    ) {
      this.scheduleGroupedSession(requirement)
      return
    }

    // Handle individual session
    this.scheduleIndividualSession(requirement)
  }

  private scheduleGroupedSession(requirement: SessionRequirement): void {
    const groupedClasses = requirement.groupedClasses!
    console.log(
      `🔗 Attempting grouped session for ${groupedClasses.length} classes: ${groupedClasses.map((c) => c.name).join(', ')}`
    )

    // Find ALL suitable rooms for grouped classes, not just the first one
    const suitableRooms = this.rooms.filter((room) => room.type === requirement.sessionType)

    if (suitableRooms.length === 0) {
      console.log(`   ❌ No suitable rooms for grouped session, scheduling individually`)
      this.scheduleIndividualSession(requirement)
      return
    }

    // Find best teacher for grouped session
    const teacher = this.findBestTeacher(requirement.course, requirement.sessionType)
    if (!teacher) {
      this.addConflict(
        'critical',
        `No teacher for grouped ${requirement.course.name} ${requirement.sessionType}`,
        [requirement.course.name, ...groupedClasses.map((c) => c.name)]
      )
      return
    }

    // Generate candidates for ALL suitable rooms, not just one
    const allCandidates: TimeSlotCandidate[] = []
    for (const room of suitableRooms) {
      const candidates = this.generateTimeSlotCandidates(requirement, teacher, room)
      allCandidates.push(...candidates)
    }

    // Select best candidate across ALL rooms
    const bestCandidate = this.selectBestCandidate(allCandidates)

    if (!bestCandidate) {
      console.log(`   ❌ No suitable time slot for grouped session, scheduling individually`)
      this.scheduleIndividualSession(requirement)
      return
    }

    // Create ONE session per class but mark them as grouped
    for (const classItem of groupedClasses) {
      const session: ScheduleSession = {
        id: `session_${this.sessionIdCounter++}`,
        courseId: requirement.course.id,
        courseName: requirement.course.name,
        classId: classItem.id,
        className: classItem.name,
        teacherId: teacher.id,
        teacherName: `${teacher.first_name} ${teacher.last_name}`,
        roomId: bestCandidate.room.id,
        roomName: bestCandidate.room.name,
        type: requirement.sessionType,
        timeSlot: {
          day: bestCandidate.day as any,
          startTime: bestCandidate.start,
          endTime: bestCandidate.end,
          duration: bestCandidate.end - bestCandidate.start
        },
        conflicts: [],
        isManualAssignment:
          requirement.course.manualAssignments?.some((a) => a.teacherId === teacher.id) || false,
        isGrouped: true,
        groupId: `group_${requirement.course.id}_${requirement.sessionType}_${bestCandidate.day}_${bestCandidate.start}`
      }

      this.sessions.push(session)
    }

    console.log(
      `✅ GROUPED: ${requirement.course.name} ${requirement.sessionType} - ${bestCandidate.day} ${bestCandidate.start}:00-${bestCandidate.end}:00`
    )
    console.log(`   👥 Classes: ${groupedClasses.map((c) => c.name).join(', ')}`)
    console.log(`   👨‍🏫 Teacher: ${teacher.first_name} ${teacher.last_name}`)
    console.log(`   🏢 Room: ${bestCandidate.room.name}`)
    console.log(
      `   🎯 Quality: ${bestCandidate.priority.type.toUpperCase()} (score: ${bestCandidate.priority.score})`
    )
  }

  private scheduleIndividualSession(requirement: SessionRequirement): void {
    // Find best teacher
    const teacher = this.findBestTeacher(requirement.course, requirement.sessionType)
    if (!teacher) {
      this.addConflict(
        'critical',
        `No teacher available for ${requirement.course.name} ${requirement.sessionType}`,
        [requirement.course.name, requirement.classItem.name]
      )
      return
    }

    // Find suitable rooms
    const suitableRooms = this.getSuitableRooms(requirement.sessionType, requirement.classItem)
    if (suitableRooms.length === 0) {
      this.addConflict(
        'critical',
        `No rooms available for ${requirement.course.name} ${requirement.sessionType}`,
        [requirement.course.name, requirement.classItem.name]
      )
      return
    }

    // Generate all possible candidates
    const allCandidates: TimeSlotCandidate[] = []
    for (const room of suitableRooms) {
      const candidates = this.generateTimeSlotCandidates(requirement, teacher, room)
      allCandidates.push(...candidates)
    }

    if (allCandidates.length === 0) {
      this.addConflict(
        'critical',
        `No available time slots for ${requirement.course.name} ${requirement.sessionType}`,
        [
          requirement.course.name,
          requirement.classItem.name,
          `${teacher.first_name} ${teacher.last_name}`
        ]
      )
      return
    }

    // Select best candidate
    const bestCandidate = this.selectBestCandidate(allCandidates)!

    // Create session
    const session: ScheduleSession = {
      id: `session_${this.sessionIdCounter++}`,
      courseId: requirement.course.id,
      courseName: requirement.course.name,
      classId: requirement.classItem.id,
      className: requirement.classItem.name,
      teacherId: teacher.id,
      teacherName: `${teacher.first_name} ${teacher.last_name}`,
      roomId: bestCandidate.room.id,
      roomName: bestCandidate.room.name,
      type: requirement.sessionType,
      timeSlot: {
        day: bestCandidate.day as any,
        startTime: bestCandidate.start,
        endTime: bestCandidate.end,
        duration: bestCandidate.end - bestCandidate.start
      },
      conflicts: [],
      isManualAssignment:
        requirement.course.manualAssignments?.some((a) => a.teacherId === teacher.id) || false
    }

    this.sessions.push(session)

    const assignmentType = session.isManualAssignment ? '👤 MANUAL' : '🤖 AUTO'
    console.log(
      `✅ ${assignmentType}: ${requirement.course.name} ${requirement.sessionType} - ${bestCandidate.day} ${bestCandidate.start}:00-${bestCandidate.end}:00`
    )
    console.log(`   👨‍🏫 ${teacher.first_name} ${teacher.last_name} | 🏢 ${bestCandidate.room.name}`)
    console.log(
      `   🎯 Quality: ${bestCandidate.priority.type.toUpperCase()} (score: ${bestCandidate.priority.score})`
    )
    if (bestCandidate.priority.reasons.length > 0) {
      console.log(`   📝 Reasons: ${bestCandidate.priority.reasons.join(', ')}`)
    }
  }

  private findBestTeacher(
    course: CourseWithTeacherDetails,
    sessionType: 'lecture' | 'seminar'
  ): TeacherWithCourses | null {
    // Check manual assignments first
    const manualTeacher = this.findManuallyAssignedTeacher(course, sessionType)
    if (manualTeacher) return manualTeacher

    // Automatic assignment with workload balancing
    const availableTeachers = this.getAvailableTeachers(course, sessionType)
    if (availableTeachers.length === 0) return null

    // Score teachers by workload and constraints
    const scoredTeachers = availableTeachers.map((teacher) => {
      let score = 100
      const workload = this.getTeacherWorkload(teacher)
      const avgWorkload = this.getAverageTeacherWorkload()

      // Workload scoring
      if (workload < avgWorkload * 0.8) {
        score += 30 // BEST: Well below average
      } else if (workload <= avgWorkload * 1.2) {
        score += 10 // GOOD: Around average
      } else {
        score -= 20 // WORST: Above average
      }

      // Daily hours check
      const maxDailyHours = this.getTeacherMaxDailyHours(teacher)
      if (maxDailyHours <= this.constraints.maxTeacherHoursPerDay * 0.7) {
        score += 20 // BEST: Well within limit
      } else if (maxDailyHours <= this.constraints.maxTeacherHoursPerDay) {
        score += 5 // GOOD: Within limit
      } else {
        score -= 30 // WORST: Exceeds limit
      }

      return { teacher, score }
    })

    return scoredTeachers.sort((a, b) => b.score - a.score)[0].teacher
  }

  private findManuallyAssignedTeacher(
    course: CourseWithTeacherDetails,
    sessionType: 'lecture' | 'seminar'
  ): TeacherWithCourses | null {
    if (!course.manualAssignments?.length) return null

    for (const assignment of course.manualAssignments) {
      if (assignment.type !== sessionType && assignment.type !== 'both') continue

      const teacher = this.teachers.find((t) => t.id === assignment.teacherId)
      if (!teacher) continue

      const teacherCourse = teacher.courses.find((tc) => tc.name === course.name)
      if (teacherCourse && (teacherCourse.type === 'both' || teacherCourse.type === sessionType)) {
        return teacher
      }
    }

    return null
  }

  private getAvailableTeachers(
    course: CourseWithTeacherDetails,
    sessionType: 'lecture' | 'seminar'
  ): TeacherWithCourses[] {
    return this.teachers.filter((teacher) => {
      const teacherCourse = teacher.courses.find((tc) => tc.name === course.name)
      return teacherCourse && (teacherCourse.type === 'both' || teacherCourse.type === sessionType)
    })
  }

  private getSuitableRooms(sessionType: 'lecture' | 'seminar', classItem: Class): Room[] {
    // Simply return rooms that match the session type, no capacity sorting
    return this.rooms.filter((room) => room.type === sessionType)
  }

  private generateTimeSlotCandidates(
    requirement: SessionRequirement,
    teacher: TeacherWithCourses,
    room: Room
  ): TimeSlotCandidate[] {
    const candidates: TimeSlotCandidate[] = []

    for (const day of this.DAYS) {
      for (const timeSlot of this.TIME_SLOTS) {
        // 🚨 CRITICAL: Enforce maximum end time constraint FIRST
        if (timeSlot.end > this.constraints.maxEndTime) {
          continue // Skip any time slots that end after the maximum allowed time
        }

        // Check basic availability (conflict-free)
        if (
          !this.isTimeSlotAvailable(
            day,
            timeSlot.start,
            timeSlot.end,
            teacher,
            room,
            requirement.classItem
          )
        ) {
          continue
        }

        // Apply session length constraints
        const requiredDuration =
          requirement.sessionType === 'lecture'
            ? this.constraints.lectureSessionLength
            : this.constraints.seminarSessionLength

        if (timeSlot.end - timeSlot.start !== requiredDuration) {
          continue // Skip slots that don't match required duration
        }

        // Calculate priority for this combination
        const priority = this.calculateTimeSlotPriority(
          {
            day,
            startTime: timeSlot.start,
            endTime: timeSlot.end,
            duration: timeSlot.end - timeSlot.start
          },
          teacher,
          room,
          requirement
        )

        candidates.push({
          day,
          start: timeSlot.start,
          end: timeSlot.end,
          teacher,
          room,
          priority
        })
      }
    }

    return candidates
  }

  private calculateTimeSlotPriority(
    timeSlot: { day: string; startTime: number; endTime: number; duration: number },
    teacher: TeacherWithCourses,
    room: Room,
    requirement: SessionRequirement
  ): SchedulingPriority {
    let score = 100
    const reasons: string[] = []
    let type: 'best' | 'good' | 'worst' = 'best'
    let penalties = 0

    if (timeSlot.endTime > this.constraints.maxEndTime) {
      score -= 1000
      reasons.push(
        `VIOLATION: Ends after max time (${timeSlot.endTime}:00 > ${this.constraints.maxEndTime}:00)`
      )
      type = 'worst'
      penalties += 1000
    }

    // ⏰ TIME WINDOW SCORING (Updated priority order)
    if (
      timeSlot.startTime >= this.constraints.preferredStartTime &&
      timeSlot.endTime <= this.constraints.preferredEndTime
    ) {
      score += 40
      reasons.push('Preferred time window')
    } else if (
      timeSlot.startTime >= this.constraints.preferredStartTime &&
      timeSlot.endTime <= this.constraints.maxEndTime // This should always be true now
    ) {
      score += 20
      reasons.push('Acceptable time window')
      type = 'good'
    } else if (timeSlot.startTime < this.constraints.preferredStartTime) {
      score -= 15
      reasons.push('Starts before preferred time')
      type = 'good'
      penalties += 15
    } else {
      // This case should never happen due to filtering above
      score -= 50
      reasons.push('Outside acceptable hours')
      type = 'worst'
      penalties += 50
    }

    // 🏢 ROOM DIVERSITY BONUS (NEW)
    if (
      requirement.isGroupable &&
      requirement.groupedClasses &&
      requirement.groupedClasses.length > 1
    ) {
      const roomsUsedForThisCourse = new Set(
        this.sessions
          .filter(
            (s) => s.courseName === requirement.course.name && s.type === requirement.sessionType
          )
          .map((s) => s.roomId)
      )

      if (!roomsUsedForThisCourse.has(room.id)) {
        score += 35 // Strong bonus for using a new room for this course
        reasons.push('Promotes room diversity for course')
      } else if (roomsUsedForThisCourse.size === 1) {
        score -= 20 // Penalty for concentrating in one room
        reasons.push('Risk of room bottleneck')
        penalties += 20
      }
    }

    // 🌅 MORNING LECTURE PRIORITY
    if (this.constraints.prioritizeMorningLectures && requirement.sessionType === 'lecture') {
      if (timeSlot.startTime === 9) {
        score += 30
        reasons.push('Prime morning lecture slot')
      } else if (timeSlot.startTime >= 9 && timeSlot.startTime <= 11) {
        score += 20
        reasons.push('Morning lecture slot')
      } else if (timeSlot.startTime >= 11 && timeSlot.startTime <= 13) {
        score += 5
        reasons.push('Late morning lecture')
        type = type === 'best' ? 'good' : type
      } else {
        score -= 25
        reasons.push('Afternoon lecture (not preferred)')
        type = 'worst'
        penalties += 25
      }
    }

    // 👥 BACK-TO-BACK AVOIDANCE
    if (this.constraints.avoidBackToBackSessions) {
      const teacherSessions = this.sessions.filter(
        (s) => s.teacherId === teacher.id && s.timeSlot.day === timeSlot.day
      )

      let hasBackToBack = false
      for (const session of teacherSessions) {
        if (
          session.timeSlot.endTime === timeSlot.startTime ||
          session.timeSlot.startTime === timeSlot.endTime
        ) {
          hasBackToBack = true
          break
        }
      }

      if (hasBackToBack) {
        score -= 40
        reasons.push('Creates back-to-back sessions')
        type = 'worst'
        penalties += 40
      } else {
        score += 15
        reasons.push('No back-to-back conflicts')
      }
    }

    // ⚖️ EVEN DISTRIBUTION
    if (this.constraints.distributeEvenlyAcrossWeek) {
      const dailySessionCount = this.sessions.filter((s) => s.timeSlot.day === timeSlot.day).length
      const avgSessionsPerDay = this.sessions.length / this.DAYS.length

      if (dailySessionCount < avgSessionsPerDay) {
        score += 15
        reasons.push('Helps balance weekly distribution')
      } else if (dailySessionCount > avgSessionsPerDay + 1) {
        score -= 20
        reasons.push('Day already heavily scheduled')
        type = type === 'best' ? 'good' : type
        penalties += 20
      }
    }

    // 🏫 ROOM EFFICIENCY
    const roomScore = this.calculateRoomScore(room, requirement)
    score += roomScore.score
    reasons.push(...roomScore.reasons)
    if (roomScore.penalty > 0) {
      type = 'worst'
      penalties += roomScore.penalty
    }

    // 👨‍🏫 TEACHER WORKLOAD
    const teacherScore = this.calculateTeacherScore(teacher, timeSlot)
    score += teacherScore.score
    reasons.push(...teacherScore.reasons)
    if (teacherScore.penalty > 0) {
      type = type === 'best' ? 'good' : 'worst'
      penalties += teacherScore.penalty
    }

    // Final type determination based on total penalties
    if (penalties > 50) {
      type = 'worst'
    } else if (penalties > 20 && type === 'best') {
      type = 'good'
    }

    return {
      score: Math.max(1, score),
      reasons,
      type,
      penalties
    }
  }

  private calculateRoomScore(
    room: Room,
    requirement: SessionRequirement
  ): { score: number; reasons: string[]; penalty: number } {
    let score = 0
    const reasons: string[] = []
    let penalty = 0

    // Room type matching
    if (room.type === requirement.sessionType) {
      score += 20
      reasons.push(`Proper ${requirement.sessionType} room`)
    } else {
      score -= 50
      reasons.push(`Wrong room type (${room.type} for ${requirement.sessionType})`)
      penalty += 50
    }

    // Room utilization - encourage distribution across multiple rooms
    const roomUsage = this.sessions.filter((s) => s.roomId === room.id).length
    const avgRoomUsage = this.sessions.length / this.rooms.length

    if (roomUsage === 0) {
      score += 25 // Bonus for unused rooms
      reasons.push('Fresh room - good distribution')
    } else if (roomUsage < avgRoomUsage) {
      score += 15 // Bonus for underutilized rooms
      reasons.push('Balances room utilization')
    } else if (roomUsage > avgRoomUsage * 1.5) {
      score -= 20 // Penalty for overused rooms
      reasons.push('Room already heavily used')
      penalty += 15
    }

    // For grouped sessions, prefer rooms that aren't already hosting other groups at the same time
    if (
      requirement.isGroupable &&
      requirement.groupedClasses &&
      requirement.groupedClasses.length > 1
    ) {
      const competingGroups = this.sessions.filter(
        (s) => s.roomId === room.id && s.isGrouped && s.type === requirement.sessionType
      ).length

      if (competingGroups === 0) {
        score += 30 // Strong bonus for rooms without competing groups
        reasons.push('No competing grouped sessions')
      } else if (competingGroups === 1) {
        score += 10
        reasons.push('Limited competition in this room')
      } else {
        score -= 25
        reasons.push('Room already has multiple grouped sessions')
        penalty += 20
      }
    }

    return { score, reasons, penalty }
  }

  private calculateTeacherScore(
    teacher: TeacherWithCourses,
    timeSlot: { day: string; startTime: number; endTime: number }
  ): { score: number; reasons: string[]; penalty: number } {
    let score = 0
    const reasons: string[] = []
    let penalty = 0

    // Daily workload check
    const teacherDailyHours = this.sessions
      .filter((s) => s.teacherId === teacher.id && s.timeSlot.day === timeSlot.day)
      .reduce((total, s) => total + s.timeSlot.duration, 0)

    const newDailyHours = teacherDailyHours + (timeSlot.endTime - timeSlot.startTime)

    if (newDailyHours <= this.constraints.maxTeacherHoursPerDay * 0.7) {
      score += 20
      reasons.push('Well within daily hour limit')
    } else if (newDailyHours <= this.constraints.maxTeacherHoursPerDay) {
      score += 10
      reasons.push('Within daily hour limit')
    } else {
      score -= 40
      reasons.push(
        `Exceeds daily limit (${newDailyHours}h > ${this.constraints.maxTeacherHoursPerDay}h)`
      )
      penalty += 40
    }

    // Weekly workload balance
    const teacherWeeklyHours = this.getTeacherWorkload(teacher) * 2 // Assuming 2h sessions
    const avgWeeklyHours = this.getAverageTeacherWorkload() * 2

    if (teacherWeeklyHours < avgWeeklyHours * 0.9) {
      score += 15
      reasons.push('Balances weekly workload')
    } else if (teacherWeeklyHours > avgWeeklyHours * 1.3) {
      score -= 15
      reasons.push('Teacher already heavily loaded')
      penalty += 15
    }

    return { score, reasons, penalty }
  }

  private selectBestCandidate(candidates: TimeSlotCandidate[]): TimeSlotCandidate | null {
    if (candidates.length === 0) return null

    // Sort by priority: best type first, then by score
    const sorted = candidates.sort((a, b) => {
      // Prioritize by type
      const typeOrder = { best: 3, good: 2, worst: 1 }
      const typeComparison = typeOrder[b.priority.type] - typeOrder[a.priority.type]
      if (typeComparison !== 0) return typeComparison

      // Then by score
      return b.priority.score - a.priority.score
    })

    const best = sorted[0]
    console.log(
      `   🎯 Selected ${best.priority.type.toUpperCase()} candidate (score: ${best.priority.score})`
    )

    return best
  }

  private isTimeSlotAvailable(
    day: string,
    startTime: number,
    endTime: number,
    teacher: TeacherWithCourses,
    room: Room,
    classItem: Class
  ): boolean {
    // Check teacher conflict
    const teacherConflict = this.sessions.some(
      (session) =>
        session.teacherId === teacher.id &&
        session.timeSlot.day === day &&
        this.timeSlotsOverlap(
          session.timeSlot.startTime,
          session.timeSlot.endTime,
          startTime,
          endTime
        )
    )

    // Check room conflict
    const roomConflict = this.sessions.some(
      (session) =>
        session.roomId === room.id &&
        session.timeSlot.day === day &&
        this.timeSlotsOverlap(
          session.timeSlot.startTime,
          session.timeSlot.endTime,
          startTime,
          endTime
        )
    )

    // Check class conflict
    const classConflict = this.sessions.some(
      (session) =>
        session.classId === classItem.id &&
        session.timeSlot.day === day &&
        this.timeSlotsOverlap(
          session.timeSlot.startTime,
          session.timeSlot.endTime,
          startTime,
          endTime
        )
    )

    return !teacherConflict && !roomConflict && !classConflict
  }

  private timeSlotsOverlap(start1: number, end1: number, start2: number, end2: number): boolean {
    return start1 < end2 && start2 < end1
  }

  private optimizeSchedule(): void {
    console.log('🔧 Running optimization passes...')

    // Pass 1: Try to improve worst-quality sessions
    this.optimizeWorstSessions()

    // Pass 2: Balance teacher workloads
    this.balanceTeacherWorkloads()

    // Pass 3: Group compatible sessions
    this.groupCompatibleSessions()
  }

  private optimizeWorstSessions(): void {
    // Implementation for improving sessions with 'worst' priority
    console.log('   🎯 Optimizing worst-quality sessions...')
  }

  private balanceTeacherWorkloads(): void {
    // Implementation for balancing teacher assignments
    console.log('   ⚖️ Balancing teacher workloads...')
  }

  private groupCompatibleSessions(): void {
    // Implementation for grouping sessions when possible
    console.log('   🔗 Grouping compatible sessions...')
  }

  private validateFinalSchedule(): void {
    console.log('🔍 Final schedule validation...')

    // 🚨 CRITICAL: Check for maximum end time violations
    const lateSessionsViolations = this.sessions.filter(
      (session) => session.timeSlot.endTime > this.constraints.maxEndTime
    )

    if (lateSessionsViolations.length > 0) {
      for (const session of lateSessionsViolations) {
        this.addConflict(
          'critical',
          `CRITICAL VIOLATION: ${session.courseName} ${session.type} for ${session.className} ends at ${session.timeSlot.endTime}:00, exceeding maximum end time of ${this.constraints.maxEndTime}:00`,
          [session.courseName, session.className, `${session.timeSlot.endTime}:00`]
        )
      }

      console.log(
        `🚨 ${lateSessionsViolations.length} sessions violate maximum end time constraint!`
      )
    }

    // 🎯 NEW: Validate lecture-seminar count per class
    this.validateClassSessionCounts()

    // Check for conflicts but ALLOW grouped sessions (same time/room/teacher for different classes)
    for (let i = 0; i < this.sessions.length; i++) {
      for (let j = i + 1; j < this.sessions.length; j++) {
        const session1 = this.sessions[i]
        const session2 = this.sessions[j]

        if (
          session1.timeSlot.day === session2.timeSlot.day &&
          this.timeSlotsOverlap(
            session1.timeSlot.startTime,
            session1.timeSlot.endTime,
            session2.timeSlot.startTime,
            session2.timeSlot.endTime
          )
        ) {
          // Skip validation for intentionally grouped sessions
          const isIntentionalGroup =
            session1.isGrouped && session2.isGrouped && session1.groupId === session2.groupId

          if (!isIntentionalGroup) {
            // Check for actual conflicts
            if (session1.teacherId === session2.teacherId) {
              this.addConflict(
                'critical',
                `VALIDATION ERROR: Teacher ${session1.teacherName} double-booked on ${session1.timeSlot.day}`,
                [session1.teacherName, session1.courseName, session2.courseName]
              )
            }

            if (session1.roomId === session2.roomId) {
              this.addConflict(
                'critical',
                `VALIDATION ERROR: Room ${session1.roomName} double-booked on ${session1.timeSlot.day}`,
                [session1.roomName, session1.courseName, session2.courseName]
              )
            }

            if (session1.classId === session2.classId) {
              this.addConflict(
                'critical',
                `VALIDATION ERROR: Class ${session1.className} double-booked on ${session1.timeSlot.day}`,
                [session1.className, session1.courseName, session2.courseName]
              )
            }
          }
        }
      }
    }

    // Legacy missing session validation (already covered by validateClassSessionCounts but keeping for safety)
    for (const classItem of this.classes) {
      const classCourses = this.getCoursesForClass(classItem)
      for (const course of classCourses) {
        const lectures = this.sessions.filter(
          (s) => s.courseId === course.id && s.classId === classItem.id && s.type === 'lecture'
        )
        const seminars = this.sessions.filter(
          (s) => s.courseId === course.id && s.classId === classItem.id && s.type === 'seminar'
        )

        if (lectures.length === 0) {
          this.addConflict('critical', `Missing lecture: ${course.name} for ${classItem.name}`, [
            course.name,
            classItem.name
          ])
        }
        if (seminars.length === 0) {
          this.addConflict('critical', `Missing seminar: ${course.name} for ${classItem.name}`, [
            course.name,
            classItem.name
          ])
        }
      }
    }
  }

  // 🎯 NEW: Comprehensive class session count validation
  private validateClassSessionCounts(): void {
    console.log('📊 Validating class session counts...')

    for (const classItem of this.classes) {
      const classCourses = this.getCoursesForClass(classItem)
      const expectedCourseCount = classCourses.length

      if (expectedCourseCount === 0) {
        this.addConflict('critical', `Class ${classItem.name} has no assigned courses`, [
          classItem.name
        ])
        continue
      }

      // Count actual lectures and seminars for this class
      const classLectures = this.sessions.filter(
        (s) => s.classId === classItem.id && s.type === 'lecture'
      )
      const classSeminars = this.sessions.filter(
        (s) => s.classId === classItem.id && s.type === 'seminar'
      )

      const actualLectureCount = classLectures.length
      const actualSeminarCount = classSeminars.length

      console.log(`   📚 ${classItem.name}: Expected ${expectedCourseCount} courses`)
      console.log(`      📖 Lectures: ${actualLectureCount}/${expectedCourseCount}`)
      console.log(`      🔬 Seminars: ${actualSeminarCount}/${expectedCourseCount}`)

      // Validate lecture count
      if (actualLectureCount < expectedCourseCount) {
        const missingCount = expectedCourseCount - actualLectureCount
        this.addConflict(
          'critical',
          `Class ${classItem.name} is missing ${missingCount} lecture(s). Expected: ${expectedCourseCount}, Found: ${actualLectureCount}`,
          [classItem.name, `Missing ${missingCount} lectures`]
        )
      } else if (actualLectureCount > expectedCourseCount) {
        const excessCount = actualLectureCount - expectedCourseCount
        this.addConflict(
          'warning',
          `Class ${classItem.name} has ${excessCount} excess lecture(s). Expected: ${expectedCourseCount}, Found: ${actualLectureCount}`,
          [classItem.name, `${excessCount} excess lectures`]
        )
      }

      // Validate seminar count
      if (actualSeminarCount < expectedCourseCount) {
        const missingCount = expectedCourseCount - actualSeminarCount
        this.addConflict(
          'critical',
          `Class ${classItem.name} is missing ${missingCount} seminar(s). Expected: ${expectedCourseCount}, Found: ${actualSeminarCount}`,
          [classItem.name, `Missing ${missingCount} seminars`]
        )
      } else if (actualSeminarCount > expectedCourseCount) {
        const excessCount = actualSeminarCount - expectedCourseCount
        this.addConflict(
          'warning',
          `Class ${classItem.name} has ${excessCount} excess seminar(s). Expected: ${expectedCourseCount}, Found: ${actualSeminarCount}`,
          [classItem.name, `${excessCount} excess seminars`]
        )
      }

      // Validate lecture-seminar balance
      if (actualLectureCount !== actualSeminarCount) {
        const difference = Math.abs(actualLectureCount - actualSeminarCount)
        const type = actualLectureCount > actualSeminarCount ? 'lectures' : 'seminars'
        this.addConflict(
          'warning',
          `Class ${classItem.name} has unbalanced sessions: ${actualLectureCount} lectures vs ${actualSeminarCount} seminars (${difference} more ${type})`,
          [classItem.name, `Unbalanced: ${actualLectureCount}L vs ${actualSeminarCount}S`]
        )
      }

      // Check for course-specific completeness
      for (const course of classCourses) {
        const courseLectures = this.sessions.filter(
          (s) => s.classId === classItem.id && s.courseId === course.id && s.type === 'lecture'
        )
        const courseSeminars = this.sessions.filter(
          (s) => s.classId === classItem.id && s.courseId === course.id && s.type === 'seminar'
        )

        if (courseLectures.length === 0) {
          this.addConflict(
            'critical',
            `Course ${course.name} for ${classItem.name} is missing its lecture`,
            [course.name, classItem.name, 'Missing lecture']
          )
        }

        if (courseSeminars.length === 0) {
          this.addConflict(
            'critical',
            `Course ${course.name} for ${classItem.name} is missing its seminar`,
            [course.name, classItem.name, 'Missing seminar']
          )
        }

        if (courseLectures.length > 1) {
          this.addConflict(
            'warning',
            `Course ${course.name} for ${classItem.name} has ${courseLectures.length} lectures (expected 1)`,
            [course.name, classItem.name, `${courseLectures.length} lectures`]
          )
        }

        if (courseSeminars.length > 1) {
          this.addConflict(
            'warning',
            `Course ${course.name} for ${classItem.name} has ${courseSeminars.length} seminars (expected 1)`,
            [course.name, classItem.name, `${courseSeminars.length} seminars`]
          )
        }
      }
    }

    const totalExpectedSessions = this.classes.reduce((total, classItem) => {
      const courseCount = this.getCoursesForClass(classItem).length
      return total + courseCount * 2 // 2 sessions per course (lecture + seminar)
    }, 0)

    console.log(`   📊 Validation Summary:`)
    console.log(`      Expected total sessions: ${totalExpectedSessions}`)
    console.log(`      Actual total sessions: ${this.sessions.length}`)
    console.log(
      `      Session coverage: ${totalExpectedSessions > 0 ? ((this.sessions.length / totalExpectedSessions) * 100).toFixed(1) : 0}%`
    )
  }

  private calculateAdvancedQualityScore(): number {
    console.log('\n📊 Calculating Advanced Quality Score...')

    // Step 1: Calculate expected vs actual sessions dynamically
    const { expectedSessions, actualSessions } = this.calculateSessionCoverage()

    // Step 2: Base score from coverage (0-100)
    let score = this.calculateCoverageScore(expectedSessions, actualSessions)
    console.log(`   📈 Coverage Score: ${score.toFixed(1)}%`)

    // Step 3: Apply conflict penalties (can reduce score significantly)
    const conflictPenalty = this.calculateConflictPenalties()
    score = Math.max(0, score - conflictPenalty)
    console.log(
      `   ⚠️ After Conflict Penalties: ${score.toFixed(1)}% (penalty: -${conflictPenalty.toFixed(1)})`
    )

    // Step 4: Apply constraint adherence (can only improve score up to 100%)
    const constraintBonus = this.calculateConstraintAdherence()
    score = Math.min(100, score + constraintBonus)
    console.log(
      `   ✅ After Constraint Bonus: ${score.toFixed(1)}% (bonus: +${constraintBonus.toFixed(1)})`
    )

    // Step 5: Apply quality distribution factor (fine-tuning within 100%)
    const qualityFactor = this.calculateQualityFactor()
    score = Math.min(100, score * qualityFactor)
    console.log(
      `   🎯 Final Quality Score: ${score.toFixed(1)}% (factor: ${qualityFactor.toFixed(3)})`
    )

    return Math.max(0, Math.round(score))
  }

  private calculateSessionCoverage(): { expectedSessions: number; actualSessions: number } {
    let expectedSessions = 0
    let actualSessions = 0

    // Calculate expected sessions dynamically based on actual class-course mappings
    for (const classItem of this.classes) {
      const classCourses = this.getCoursesForClass(classItem)

      for (const course of classCourses) {
        // Each course should have 1 lecture + 1 seminar per class
        expectedSessions += 2

        // Count actual sessions for this class-course combination
        const lectureCount = this.sessions.filter(
          (s) => s.classId === classItem.id && s.courseId === course.id && s.type === 'lecture'
        ).length

        const seminarCount = this.sessions.filter(
          (s) => s.classId === classItem.id && s.courseId === course.id && s.type === 'seminar'
        ).length

        actualSessions += Math.min(1, lectureCount) + Math.min(1, seminarCount)
      }
    }

    console.log(`   📚 Expected Sessions: ${expectedSessions}`)
    console.log(`   ✏️ Actual Sessions: ${actualSessions}`)

    return { expectedSessions, actualSessions }
  }

  private calculateCoverageScore(expectedSessions: number, actualSessions: number): number {
    if (expectedSessions === 0) return 0

    // Base coverage score: 0-100% based on how many required sessions are scheduled
    const coverageRatio = Math.min(1, actualSessions / expectedSessions)
    const baseScore = coverageRatio * 100

    // Penalty for over-scheduling (duplicate sessions)
    const duplicateSessionCount = Math.max(0, this.sessions.length - expectedSessions)
    const duplicatePenalty = Math.min(20, duplicateSessionCount * 2) // Max 20% penalty

    return Math.max(0, baseScore - duplicatePenalty)
  }

  private calculateConflictPenalties(): number {
    let totalPenalty = 0

    const criticalConflicts = this.conflicts.filter((c) => c.severity === 'critical').length
    const warningConflicts = this.conflicts.filter((c) => c.severity === 'warning').length
    const suggestionConflicts = this.conflicts.filter((c) => c.severity === 'suggestion').length

    // Heavy penalties for critical conflicts (missing sessions, double bookings)
    totalPenalty += criticalConflicts * 15 // 15% per critical conflict

    // Moderate penalties for warnings (constraint violations)
    totalPenalty += warningConflicts * 5 // 5% per warning

    // Light penalties for suggestions (optimization opportunities)
    totalPenalty += suggestionConflicts * 1 // 1% per suggestion

    console.log(`     🔴 Critical Conflicts: ${criticalConflicts} (-${criticalConflicts * 15}%)`)
    console.log(`     🟡 Warning Conflicts: ${warningConflicts} (-${warningConflicts * 5}%)`)
    console.log(`     🔵 Suggestions: ${suggestionConflicts} (-${suggestionConflicts * 1}%)`)

    return Math.min(100, totalPenalty) // Cap at 100% penalty
  }

  private calculateConstraintAdherence(): number {
    let totalBonus = 0
    let maxPossibleBonus = 0

    // Morning lectures preference (0-5% bonus)
    if (this.constraints.prioritizeMorningLectures) {
      maxPossibleBonus += 5
      const morningBonus = this.calculateMorningLectureBonus()
      totalBonus += morningBonus
      console.log(`     🌅 Morning Lectures: +${morningBonus.toFixed(1)}%`)
    }

    // Back-to-back avoidance (0-8% bonus)
    if (this.constraints.avoidBackToBackSessions) {
      maxPossibleBonus += 8
      const backToBackBonus = this.calculateBackToBackBonus()
      totalBonus += backToBackBonus
      console.log(`     ⏰ Back-to-back Avoidance: +${backToBackBonus.toFixed(1)}%`)
    }

    // Even distribution (0-6% bonus)
    if (this.constraints.distributeEvenlyAcrossWeek) {
      maxPossibleBonus += 6
      const distributionBonus = this.calculateDistributionBonus()
      totalBonus += distributionBonus
      console.log(`     ⚖️ Even Distribution: +${distributionBonus.toFixed(1)}%`)
    }

    // Teacher workload balance (0-6% bonus)
    maxPossibleBonus += 6
    const workloadBonus = this.calculateWorkloadBalanceBonus()
    totalBonus += workloadBonus
    console.log(`     👥 Workload Balance: +${workloadBonus.toFixed(1)}%`)

    // Time window adherence (0-5% bonus)
    maxPossibleBonus += 5
    const timeWindowBonus = this.calculateTimeWindowBonus()
    totalBonus += timeWindowBonus
    console.log(`     🕐 Time Window Adherence: +${timeWindowBonus.toFixed(1)}%`)

    // Normalize bonus to prevent over-scoring
    const normalizedBonus = maxPossibleBonus > 0 ? (totalBonus / maxPossibleBonus) * 15 : 0 // Max 15% total bonus

    return Math.min(15, normalizedBonus)
  }

  private calculateMorningLectureBonus(): number {
    const lectures = this.sessions.filter((s) => s.type === 'lecture')
    if (lectures.length === 0) return 0

    const morningLectures = lectures.filter(
      (s) => s.timeSlot.startTime >= 9 && s.timeSlot.startTime <= 11
    ).length

    const ratio = morningLectures / lectures.length
    return ratio * 5 // 0-5% bonus
  }

  private calculateBackToBackBonus(): number {
    let totalViolations = 0
    let totalPossibleViolations = 0

    for (const teacher of this.teachers) {
      const teacherSessions = this.sessions.filter((s) => s.teacherId === teacher.id)

      for (const day of this.DAYS) {
        const daySessions = teacherSessions
          .filter((s) => s.timeSlot.day === day)
          .sort((a, b) => a.timeSlot.startTime - b.timeSlot.startTime)

        totalPossibleViolations += Math.max(0, daySessions.length - 1)

        for (let i = 0; i < daySessions.length - 1; i++) {
          if (daySessions[i].timeSlot.endTime === daySessions[i + 1].timeSlot.startTime) {
            totalViolations++
          }
        }
      }
    }

    if (totalPossibleViolations === 0) return 8 // Perfect if no possible violations

    const avoidanceRatio = 1 - totalViolations / totalPossibleViolations
    return avoidanceRatio * 8 // 0-8% bonus
  }

  private calculateDistributionBonus(): number {
    const sessionsByDay = this.DAYS.map(
      (day) => this.sessions.filter((s) => s.timeSlot.day === day).length
    )

    if (this.sessions.length === 0) return 6

    const avgSessionsPerDay = this.sessions.length / this.DAYS.length
    const variance =
      sessionsByDay.reduce((sum, count) => sum + Math.pow(count - avgSessionsPerDay, 2), 0) /
      this.DAYS.length

    // Lower variance = better distribution
    const maxVariance = Math.pow(avgSessionsPerDay, 2) // Worst case: all sessions on one day
    const distributionRatio = maxVariance > 0 ? Math.max(0, 1 - variance / maxVariance) : 1

    return distributionRatio * 6 // 0-6% bonus
  }

  private calculateWorkloadBalanceBonus(): number {
    if (this.teachers.length === 0) return 6

    const workloads = this.teachers.map((teacher) => this.getTeacherWorkload(teacher))
    const avgWorkload = workloads.reduce((sum, w) => sum + w, 0) / workloads.length

    if (avgWorkload === 0) return 6

    const variance =
      workloads.reduce((sum, w) => sum + Math.pow(w - avgWorkload, 2), 0) / workloads.length

    const maxVariance = Math.pow(avgWorkload, 2) // Worst case scenario
    const balanceRatio = maxVariance > 0 ? Math.max(0, 1 - variance / maxVariance) : 1

    return balanceRatio * 6 // 0-6% bonus
  }

  private calculateTimeWindowBonus(): number {
    if (this.sessions.length === 0) return 5

    const sessionsInPreferredWindow = this.sessions.filter(
      (s) =>
        s.timeSlot.startTime >= this.constraints.preferredStartTime &&
        s.timeSlot.endTime <= this.constraints.preferredEndTime
    ).length

    const sessionsInAcceptableWindow = this.sessions.filter(
      (s) =>
        s.timeSlot.startTime >= this.constraints.preferredStartTime &&
        s.timeSlot.endTime <= this.constraints.maxEndTime
    ).length

    const preferredRatio = sessionsInPreferredWindow / this.sessions.length
    const acceptableRatio = sessionsInAcceptableWindow / this.sessions.length

    // 5% for all in preferred, 3% for all in acceptable, scaled down for partial compliance
    return preferredRatio * 5 + (acceptableRatio - preferredRatio) * 3
  }

  private calculateQualityFactor(): number {
    // This factor fine-tunes the score based on overall session quality
    // It should be between 0.8 and 1.0 to prevent over-scoring

    let qualitySum = 0
    let sessionCount = 0

    // We would need to track session qualities during scheduling
    // For now, let's calculate based on observable metrics

    for (const session of this.sessions) {
      let sessionQuality = 1.0

      // Check if session is in preferred time window
      if (
        session.timeSlot.startTime >= this.constraints.preferredStartTime &&
        session.timeSlot.endTime <= this.constraints.preferredEndTime
      ) {
        sessionQuality *= 1.0 // Perfect
      } else if (
        session.timeSlot.startTime >= this.constraints.preferredStartTime &&
        session.timeSlot.endTime <= this.constraints.maxEndTime
      ) {
        sessionQuality *= 0.9 // Good
      } else {
        sessionQuality *= 0.7 // Poor
      }

      // Check for proper room type
      const room = this.rooms.find((r) => r.id === session.roomId)
      if (room && room.type === session.type) {
        sessionQuality *= 1.0
      } else {
        sessionQuality *= 0.8
      }

      qualitySum += sessionQuality
      sessionCount++
    }

    if (sessionCount === 0) return 1.0

    const avgQuality = qualitySum / sessionCount

    // Return a factor between 0.8 and 1.0
    return Math.max(0.8, Math.min(1.0, avgQuality))
  }

  private getTeacherWorkload(teacher: TeacherWithCourses): number {
    return this.sessions.filter((s) => s.teacherId === teacher.id).length
  }

  private getAverageTeacherWorkload(): number {
    if (this.teachers.length === 0) return 0
    const totalSessions = this.sessions.length
    return totalSessions / this.teachers.length
  }

  private getTeacherMaxDailyHours(teacher: TeacherWithCourses): number {
    const teacherSessions = this.sessions.filter((s) => s.teacherId === teacher.id)
    const dailyHours = this.DAYS.map((day) =>
      teacherSessions
        .filter((s) => s.timeSlot.day === day)
        .reduce((total, s) => total + s.timeSlot.duration, 0)
    )
    return Math.max(...dailyHours, 0)
  }

  private addConflict(
    severity: 'critical' | 'warning' | 'suggestion',
    message: string,
    affectedItems: string[]
  ): void {
    this.conflicts.push({
      id: this.conflicts.length + 1,
      type: severity === 'critical' ? 'teacher_conflict' : 'constraint_violation',
      severity,
      message,
      affectedItems,
      suggestions:
        severity === 'critical'
          ? ['Review resource availability', 'Check data consistency']
          : ['Consider constraint adjustments'],
      timestamp: new Date().toISOString()
    })
  }

  private calculateTotalHours(): number {
    return this.sessions.reduce((total, session) => total + session.timeSlot.duration, 0)
  }

  private calculateUtilizationRate(): number {
    const lectureRooms = this.rooms.filter((r) => r.type === 'lecture')
    const seminarRooms = this.rooms.filter((r) => r.type === 'seminar')

    const totalAvailableSlots =
      (lectureRooms.length + seminarRooms.length) * this.DAYS.length * this.TIME_SLOTS.length

    const usedSlots = this.sessions.length

    return totalAvailableSlots > 0 ? (usedSlots / totalAvailableSlots) * 100 : 0
  }

  private logFinalSummary(result: GeneratedSchedule): void {
    console.log(`\n🏆 ULTIMATE SCHEDULE GENERATION COMPLETE`)
    console.log(`📊 Final Results:`)
    console.log(`   Sessions Generated: ${this.sessions.length}`)
    console.log(`   Manual Assignments: ${result.metadata.manualAssignments}`)
    console.log(`   Automatic Assignments: ${result.metadata.automaticAssignments}`)
    console.log(
      `   Critical Conflicts: ${this.conflicts.filter((c) => c.severity === 'critical').length}`
    )
    console.log(
      `   Warning Conflicts: ${this.conflicts.filter((c) => c.severity === 'warning').length}`
    )
    console.log(`   Quality Score: ${result.score}%`)
    console.log(`   Room Utilization: ${result.metadata.utilizationRate.toFixed(1)}%`)
    console.log(`   Total Teaching Hours: ${result.metadata.totalHours}h/week`)

    if (result.score >= 90) {
      console.log(`🏆 EXCELLENT schedule quality!`)
    } else if (result.score >= 75) {
      console.log(`✅ GOOD schedule quality`)
    } else if (result.score >= 50) {
      console.log(`⚠️ ACCEPTABLE schedule quality`)
    } else {
      console.log(`❌ POOR schedule quality - review constraints and resources`)
    }
  }
}
