import { GeneratedSchedule, RoomType } from './database'

export interface ClassCreateDto {
  name: string
  year: number
  semester: number
}

export interface ClassUpdateDto {
  name?: string
  year?: number
  semester?: number
}

// Updated TeacherCreateDto - added email and phone
export interface TeacherCreateDto {
  first_name: string
  last_name: string
  email?: string
  phone?: string
  subjects?: string[] // Optional subjects they can teach
}

// Updated TeacherUpdateDto - added email and phone
export interface TeacherUpdateDto {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
}

// Updated CourseCreateDto - removed class_id (courses are now global)
export interface CourseCreateDto {
  name: string
  hours_per_week?: number // Defaults to 4
  lecture_hours?: number // Defaults to 2
  seminar_hours?: number // Defaults to 2
}

export interface CourseUpdateDto {
  name?: string
  hours_per_week?: number
  lecture_hours?: number
  seminar_hours?: number
}

export interface ScheduleCreateDto {
  name: string
  class_id: number
}

// New DTOs for the junction tables and new functionality

// For assigning courses to classes
export interface CourseAssignmentDto {
  course_id: number
  class_id: number
}

// For teacher subject assignments
export interface TeacherSubjectDto {
  teacher_id: number
  subject_name: string
}

// For assigning teachers to courses
export interface CourseTeacherAssignmentDto {
  course_id: number
  teacher_id: number
}

// For bulk operations
export interface BulkCourseAssignmentDto {
  class_id: number
  course_ids: number[]
}

export interface BulkTeacherSubjectDto {
  teacher_id: number
  subject_names: string[]
}

// For search and filtering
export interface CourseFilterDto {
  search?: string
  hours_per_week?: number
  assigned_to_class?: number
  available_for_class?: number
}

export interface TeacherFilterDto {
  search?: string
  has_subject?: string
  assigned_to_course?: number
}

export interface CreateRoomDto {
  name: string
  type: RoomType
  capacity: number
}

export interface UpdateRoomDto {
  name?: string
  type?: RoomType
  capacity?: number
}

export interface UpdateSettingsDto {
  lecture_rooms_count?: number
  seminar_rooms_count?: number
}

export interface ScheduleSaveDto {
  name: string
  description?: string
  data: GeneratedSchedule
  metadata?: any
}
