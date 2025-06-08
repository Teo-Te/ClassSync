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

export interface TeacherCreateDto {
  first_name: string
  last_name: string
  subjects?: string[]
}

export interface TeacherUpdateDto {
  first_name?: string
  last_name?: string
}

export interface CourseCreateDto {
  class_id: number
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
