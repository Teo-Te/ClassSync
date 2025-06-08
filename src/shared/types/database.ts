export interface Class {
  id: number
  name: string
  year: number
  semester: number
  created_at: string
}

export interface Course {
  id: number
  class_id: number
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
  created_at: string
}

export interface TeacherSubject {
  id: number
  teacher_id: number
  subject_name: string
}

export interface CourseTeacher {
  id: number
  course_id: number
  teacher_id: number
}

export interface Schedule {
  id: number
  uuid: string
  name: string
  class_id: number
  data: string // JSON string
  created_at: string
}

// Create a parsed version with actual data object
export interface ParsedSchedule extends Omit<Schedule, 'data'> {
  data: ScheduleData
}

// Define schedule data structure
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

export interface CourseWithTeachers extends Course {
  teachers: number[]
}
