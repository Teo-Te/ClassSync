import { ElectronAPI } from '@electron-toolkit/preload'
import {
  Class,
  Teacher,
  Course,
  Schedule,
  CourseWithTeachers,
  CourseWithTeacherDetails,
  AssignmentType,
  CourseType,
  Room,
  RoomType,
  GeneratedSchedule,
  SavedSchedule,
  ParsedSavedSchedule,
  AppSettings
} from '@shared/types/database'
import {
  ClassCreateDto,
  ClassUpdateDto,
  TeacherCreateDto,
  TeacherUpdateDto,
  CourseCreateDto,
  ScheduleCreateDto,
  CreateRoomDto,
  UpdateRoomDto,
  UpdateSettingsDto
} from '@shared/types/dto'

interface DatabaseSeedResult {
  success: boolean
  message: string
  error?: Error
}

interface DatabaseClearResult {
  success: boolean
  message: string
  error?: string
}

interface DatabaseExecuteResult {
  changes: number
  lastInsertRowid?: number
}

// Schedule save data type
interface ScheduleSaveData {
  name: string
  description?: string
  data: GeneratedSchedule
  metadata?: any
}

// Schedule update data type
interface ScheduleUpdateData {
  name?: string
  description?: string
  data?: GeneratedSchedule
  metadata?: any
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      classes: {
        getAll: () => Promise<Class[]>
        getAllWithCourseCounts: () => Promise<(Class & { courseCount: number })[]>
        getById: (id: number) => Promise<Class | null>
        create: (data: ClassCreateDto) => Promise<Class>
        update: (id: number, data: ClassUpdateDto) => Promise<boolean>
        delete: (id: number) => Promise<boolean>
      }

      teachers: {
        getAll: () => Promise<Teacher[]>
        getById: (id: number) => Promise<Teacher | null>
        create: (data: TeacherCreateDto) => Promise<Teacher>
        update: (id: number, data: TeacherUpdateDto) => Promise<boolean>
        delete: (id: number) => Promise<boolean>
        getCourses: (id: number) => Promise<Course[]>
        getCoursesWithTypes: (teacherId: number) => Promise<(Course & { type: CourseType })[]>
        assignCourse: (teacherId: number, courseId: number, type: CourseType) => Promise<boolean>
        removeCourse: (teacherId: number, courseId: number) => Promise<boolean>
        getAvailableCourses: (teacherId: number) => Promise<Course[]>
        updateCourseType: (
          teacherId: number,
          courseId: number,
          type: CourseType
        ) => Promise<boolean>
      }

      courses: {
        getAll: () => Promise<Course[]>
        getByClassId: (classId: number) => Promise<Course[]>
        getCoursesWithTeachers: (classId: number) => Promise<CourseWithTeachers[]>
        getCoursesWithTeacherDetails: (classId: number) => Promise<CourseWithTeacherDetails[]>
        getAvailableForClass: (classId: number) => Promise<Course[]>
        create: (data: CourseCreateDto) => Promise<Course>
        update: (id: number, data: any) => Promise<boolean>
        delete: (id: number) => Promise<boolean>
        assignToClass: (courseId: number, classId: number) => Promise<boolean>
        removeFromClass: (courseId: number, classId: number) => Promise<boolean>
        assignTeacher: (
          courseId: number,
          teacherId: number,
          type: AssignmentType
        ) => Promise<boolean>
        removeTeacher: (courseId: number, teacherId: number) => Promise<boolean>
        removeTeacherByType: (courseId: number, type: AssignmentType) => Promise<boolean>
        getEligibleTeachers: (courseId: number, type?: AssignmentType) => Promise<Teacher[]>
        getAssignedTeachers: (courseId: number) => Promise<(Teacher & { type: AssignmentType })[]>
      }

      schedules: {
        // Original schedule methods
        getAll: () => Promise<Schedule[]>
        generate: (classId: number) => Promise<Schedule>
        getById: (id: number) => Promise<Schedule | null>
        create: (data: ScheduleCreateDto) => Promise<Schedule>

        // New saved schedule methods
        save: (data: ScheduleSaveData) => Promise<SavedSchedule>
        getSaved: () => Promise<SavedSchedule[]>
        load: (id: number) => Promise<ParsedSavedSchedule | null>
        update: (id: number, data: ScheduleUpdateData) => Promise<boolean>
        deleteSaved: (id: number) => Promise<boolean>
        search: (query: string) => Promise<SavedSchedule[]>
      }

      rooms: {
        getAll: () => Promise<Room[]>
        getById: (id: number) => Promise<Room | null>
        getByType: (type: RoomType) => Promise<Room[]>
        create: (data: CreateRoomDto) => Promise<Room>
        update: (id: number, data: UpdateRoomDto) => Promise<boolean>
        delete: (id: number) => Promise<boolean>
        getStats: () => Promise<
          Array<{
            type: RoomType
            count: number
            total_capacity: number
            avg_capacity: number
          }>
        >
      }

      settings: {
        get: () => Promise<AppSettings>
        update: (data: UpdateSettingsDto) => Promise<boolean>
        updateRoomCounts: (lectureCount: number, seminarCount: number) => Promise<boolean>

        // Add these generic setting methods for AI configuration
        getSetting: (key: string) => Promise<string | null>
        setSetting: (key: string, value: string) => Promise<boolean>
        removeSetting: (key: string) => Promise<boolean>
        getAllSettings: () => Promise<Record<string, string>>
      }

      database: {
        execute: (sql: string, params?: any[]) => Promise<DatabaseExecuteResult>
        seed: () => Promise<DatabaseSeedResult>
        clear: () => Promise<DatabaseClearResult>
      }
    }
  }
}

export {}
