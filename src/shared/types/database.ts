export type AssignmentType = 'lecture' | 'seminar'
export type CourseType = 'lecture' | 'seminar' | 'both'
export type RoomType = 'lecture' | 'seminar'

export interface Class {
  id: number
  name: string
  year: number
  semester: number
  created_at: string
}

export interface Course {
  id: number
  name: string
  hours_per_week: number
  lecture_hours: number
  seminar_hours: number
  created_at: string
}

export interface Teacher {
  id: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
  created_at: string
}

export interface ClassCourse {
  id: number
  class_id: number
  course_id: number
  created_at: string
}

export interface TeacherCourse {
  id: number
  teacher_id: number
  course_id: number
  created_at: string
  type: CourseType
}

export interface TeacherSubject {
  id: number
  teacher_id: number
  subject_name: string
  created_at: string
}

export interface CourseTeacher {
  id: number
  course_id: number
  teacher_id: number
  created_at: string
  type: AssignmentType
}

export interface Schedule {
  id: number
  uuid: string
  name: string
  class_id: number
  data: string // JSON string
  created_at: string
}

export interface ScheduleMetadata {
  generatedAt: string
  constraints: ScheduleConstraints
  totalHours: number
  utilizationRate: number
  manualAssignments: number
  automaticAssignments: number
  optimizedBy?: string
  aiOptimizationHistory?: {
    timestamp: string
    type: 'fix' | 'refine'
    improvements: string[]
    conflictsResolved: number
  }[]
  revalidatedAt?: string // Add this optional property
  revalidationConflicts?: number // Add this too
  revalidationScore?: number // And this
  revalidationError?: string // And this for error cases
}

export interface ParsedSchedule extends Omit<Schedule, 'data'> {
  data: ScheduleData
}

export interface ScheduleData {
  days: ScheduleDay[]
}

export interface ScheduleDay {
  dayName: string
  slots: (ScheduleSlot | null)[]
}

export interface ScheduleSlot {
  courseId: number
  courseName: string
  type: 'lecture' | 'seminar'
  teacherId: number
  teacherName: string
}

// Extended interfaces for joined data
export interface CourseWithTeachers extends Course {
  teachers: number[]
}

export interface CourseWithClassInfo extends Course {
  isAssigned?: boolean
  assignedAt?: string
}

// Updated: TeacherWithCourses now includes course types
export interface TeacherWithCourses extends Teacher {
  courses: (Course & { type: CourseType })[] // THIS IS THE KEY CHANGE
}

export interface ClassWithCourses extends Class {
  courses: CourseWithTeachers[]
  totalHours: number
}

export interface CourseAssignment {
  course: Course
  assignedTeachers: Teacher[]
  assignedAt: string
}

// Remove duplicate ClassWithCourses interface (keeping the one with courseCount)
export interface ClassWithCourseCounts extends Class {
  courseCount: number
}

export interface TeacherCourseWithDetails extends TeacherCourse {
  course_name: string
  course_hours: number
}

export interface CourseWithTeacherDetails extends Course {
  lectureTeacher?: Teacher
  seminarTeacher?: Teacher
  teachers: number[] // Keep for backward compatibility
}

// Add new type for course with assignment type
export interface CourseWithType extends Course {
  type: CourseType
}

export interface Room {
  id: number
  name: string
  type: RoomType
  capacity: number
  created_at: string
}

export interface AppSettings {
  id: number
  lecture_rooms_count: number
  seminar_rooms_count: number
  updated_at: string
}

export interface ScheduleConstraints {
  // Time constraints
  preferredStartTime: number // 9 AM = 9
  preferredEndTime: number // 1 PM = 13
  maxEndTime: number // 3 PM = 15

  // Teacher constraints
  maxTeacherHoursPerDay: number // 4 hours preferred, 6 max
  avoidBackToBackSessions: boolean

  // Session constraints
  lectureSessionLength: number // 2 hours
  seminarSessionLength: number // 2 hours
  avoidSplittingSessions: boolean

  // Scheduling preferences
  prioritizeMorningLectures: boolean
  groupSameCourseClasses: boolean
  distributeEvenlyAcrossWeek: boolean
}

export interface TimeSlot {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'
  startTime: number // 24-hour format
  endTime: number
  duration: number // in hours
}

export interface ScheduleConflict {
  id: number
  type: 'teacher_conflict' | 'room_conflict' | 'constraint_violation' | 'validation_error' // Add validation_error
  severity: 'critical' | 'warning' | 'suggestion'
  message: string
  affectedItems: string[]
  suggestions: string[]
  timestamp: string
}

export interface ScheduleSession {
  id: string
  courseId: number
  courseName: string
  classId: number
  className: string
  teacherId: number
  teacherName: string
  roomId: number
  roomName: string
  type: 'lecture' | 'seminar'
  timeSlot: TimeSlot
  conflicts: ScheduleConflict[]
  isManualAssignment: boolean
  isGrouped?: boolean
  groupId?: string
}

export interface GeneratedSchedule {
  id: number
  name: string
  sessions: ScheduleSession[]
  conflicts: ScheduleConflict[]
  score: number
  createdAt: string
  metadata: {
    generatedAt: string
    constraints: ScheduleConstraints
    totalHours: number
    utilizationRate: number
    manualAssignments: number
    automaticAssignments: number
    optimizedBy?: string
    revalidatedAt?: string
    revalidationScore?: number
    revalidationConflicts?: number
    revalidationError?: string
    aiOptimizationHistory?: Array<{
      timestamp: string
      type: 'fix' | 'refine'
      improvements: string[]
      conflictsResolved: number
    }>
  }
}

export interface RoomWithCapacity extends Room {
  isAuditorium?: boolean
}

export type ScheduleViewType = 'overview' | 'rooms' | 'teachers' | 'classes'

export interface ScheduleView {
  type: ScheduleViewType
  selectedId?: number
  selectedName?: string
}

export interface RoomSchedule {
  room: Room
  sessions: ScheduleSession[]
  utilization: number
}

export interface TeacherSchedule {
  teacher: TeacherWithCourses
  sessions: ScheduleSession[]
  workloadHours: number
}

export interface ClassSchedule {
  class: Class
  sessions: ScheduleSession[]
  totalHours: number
}

export interface ManualTeacherAssignment {
  teacherId: number
  teacherName: string
  type: 'lecture' | 'seminar' | 'both'
  isManual: boolean
}

export interface CourseWithTeacherDetails extends Course {
  manualAssignments?: ManualTeacherAssignment[] // Use a different property name
  lectureTeacher?: Teacher // Keep these for backward compatibility
  seminarTeacher?: Teacher
}

export interface CourseWithManualAssignments {
  id: number
  name: string
  hours_per_week: number
  lecture_hours: number
  seminar_hours: number
  created_at: string
  teachers: ManualTeacherAssignment[]
}

export interface SavedSchedule {
  id: number
  uuid: string
  name: string
  description?: string
  data: string
  metadata?: string
  created_at: string
  updated_at?: string
}

export interface ParsedSavedSchedule extends Omit<SavedSchedule, 'data' | 'metadata'> {
  data: GeneratedSchedule
  metadata?: any
}
