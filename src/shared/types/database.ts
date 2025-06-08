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
