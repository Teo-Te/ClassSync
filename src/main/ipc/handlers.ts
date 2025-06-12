import { ipcMain } from 'electron'
import ClassRepository from '../db/repositories/ClassRepository'
import TeacherRepository from '../db/repositories/TeacherRepository'
import CourseRepository from '../db/repositories/CourseRepository'
import ScheduleRepository from '../db/repositories/ScheduleRepository'
import { generateSchedule } from '../services/schedulerService'
import { AssignmentType, CourseType, GeneratedSchedule } from '@shared/types/database'
import RoomRepository from '../db/repositories/RoomRepository'
import SettingsRepository from '../db/repositories/SettingsRepository'
import { getDatabase } from '../db'

// Initialize repositories
const classRepository = new ClassRepository()
const teacherRepository = new TeacherRepository()
const courseRepository = new CourseRepository()
const scheduleRepository = new ScheduleRepository()
const roomRepository = new RoomRepository()
const settingsRepository = new SettingsRepository()

export function setupIpcHandlers(): void {
  // Class handlers
  ipcMain.handle('classes:getAll', async () => {
    try {
      return classRepository.getAll()
    } catch (error) {
      console.error('Error in classes:getAll', error)
      throw new Error('Failed to get classes')
    }
  })

  ipcMain.handle('classes:getById', async (_, id: number) => {
    try {
      return classRepository.getById(id)
    } catch (error) {
      console.error(`Error in classes:getById for id ${id}`, error)
      throw new Error(`Failed to get class with id ${id}`)
    }
  })

  ipcMain.handle('classes:create', async (_, data) => {
    try {
      return classRepository.create(data)
    } catch (error) {
      console.error('Error in classes:create', error)
      throw new Error('Failed to create class')
    }
  })

  ipcMain.handle('classes:update', async (_, id: number, data) => {
    try {
      return classRepository.update(id, data)
    } catch (error) {
      console.error(`Error in classes:update for id ${id}`, error)
      throw new Error(`Failed to update class with id ${id}`)
    }
  })

  ipcMain.handle('classes:delete', async (_, id: number) => {
    try {
      return classRepository.delete(id)
    } catch (error) {
      console.error(`Error in classes:delete for id ${id}`, error)
      throw new Error(`Failed to delete class with id ${id}`)
    }
  })

  // Teacher handlers
  ipcMain.handle('teachers:getAll', async () => {
    try {
      return teacherRepository.getAll()
    } catch (error) {
      console.error('Error in teachers:getAll', error)
      throw new Error('Failed to get teachers')
    }
  })

  ipcMain.handle('teachers:getById', async (_, id: number) => {
    try {
      return teacherRepository.getById(id)
    } catch (error) {
      console.error(`Error in teachers:getById for id ${id}`, error)
      throw new Error(`Failed to get teacher with id ${id}`)
    }
  })

  ipcMain.handle('teachers:create', async (_, data) => {
    try {
      return teacherRepository.create(data)
    } catch (error) {
      console.error('Error in teachers:create', error)
      throw new Error('Failed to create teacher')
    }
  })

  ipcMain.handle('teachers:update', async (_, id: number, data) => {
    try {
      return teacherRepository.update(id, data)
    } catch (error) {
      console.error(`Error in teachers:update for id ${id}`, error)
      throw new Error(`Failed to update teacher with id ${id}`)
    }
  })

  ipcMain.handle('teachers:delete', async (_, id: number) => {
    try {
      return teacherRepository.delete(id)
    } catch (error) {
      console.error(`Error in teachers:delete for id ${id}`, error)
      throw new Error(`Failed to delete teacher with id ${id}`)
    }
  })

  ipcMain.handle('teachers:getSubjects', async (_, id: number) => {
    try {
      return teacherRepository.getSubjects(id)
    } catch (error) {
      console.error(`Error in teachers:getSubjects for id ${id}`, error)
      throw new Error(`Failed to get subjects for teacher with id ${id}`)
    }
  })

  ipcMain.handle('teachers:addSubject', async (_, id: number, subject: string) => {
    try {
      return teacherRepository.addSubject(id, subject)
    } catch (error) {
      console.error(`Error in teachers:addSubject for id ${id}`, error)
      throw new Error(`Failed to add subject for teacher with id ${id}`)
    }
  })

  ipcMain.handle('teachers:removeSubject', async (_, id: number, subject: string) => {
    try {
      return teacherRepository.removeSubject(id, subject)
    } catch (error) {
      console.error(`Error in teachers:removeSubject for id ${id}`, error)
      throw new Error(`Failed to remove subject for teacher with id ${id}`)
    }
  })

  // Course handlers
  ipcMain.handle('courses:getByClassId', async (_, classId: number) => {
    try {
      return courseRepository.getByClassId(classId)
    } catch (error) {
      console.error(`Error in courses:getByClassId for classId ${classId}`, error)
      throw new Error(`Failed to get courses for class with id ${classId}`)
    }
  })

  ipcMain.handle('courses:create', async (_, data) => {
    try {
      return courseRepository.create(data)
    } catch (error) {
      console.error('Error in courses:create', error)
      throw new Error('Failed to create course')
    }
  })

  ipcMain.handle('courses:removeTeacher', async (_, courseId: number, teacherId: number) => {
    try {
      return courseRepository.removeTeacher(courseId, teacherId)
    } catch (error) {
      console.error(`Error in courses:removeTeacher for courseId ${courseId}`, error)
      throw new Error(`Failed to remove teacher from course with id ${courseId}`)
    }
  })

  // Schedule handlers
  ipcMain.handle('schedules:getAll', async () => {
    try {
      return scheduleRepository.getAll()
    } catch (error) {
      console.error('Error in schedules:getAll', error)
      throw new Error('Failed to get schedules')
    }
  })

  ipcMain.handle('schedules:getById', async (_, id: number) => {
    try {
      return scheduleRepository.getById(id)
    } catch (error) {
      console.error(`Error in schedules:getById for id ${id}`, error)
      throw new Error(`Failed to get schedule with id ${id}`)
    }
  })

  ipcMain.handle('schedules:create', async (_, data) => {
    try {
      return scheduleRepository.create(data)
    } catch (error) {
      console.error('Error in schedules:create', error)
      throw new Error('Failed to create schedule')
    }
  })

  ipcMain.handle('schedules:generate', async (_, classId: number) => {
    try {
      return generateSchedule(classId)
    } catch (error) {
      console.error(`Error in schedules:generate for classId ${classId}`, error)
      throw new Error(`Failed to generate schedule for class with id ${classId}`)
    }
  })

  ipcMain.handle('courses:delete', async (_, id: number) => {
    try {
      return courseRepository.delete(id)
    } catch (error) {
      console.error(`Error in courses:delete for id ${id}`, error)
      throw new Error(`Failed to delete course with id ${id}`)
    }
  })

  ipcMain.handle('courses:getCoursesWithTeachers', async (_, classId: number) => {
    try {
      return courseRepository.getCoursesWithTeachers(classId)
    } catch (error) {
      console.error(`Error in courses:getCoursesWithTeachers for classId ${classId}`, error)
      throw new Error(`Failed to get courses with teachers for class with id ${classId}`)
    }
  })

  // src/main/ipc/handlers.ts - Add these new handlers
  ipcMain.handle('courses:getAll', async () => {
    try {
      return courseRepository.getAll()
    } catch (error) {
      console.error('Error in courses:getAll', error)
      throw new Error('Failed to get all courses')
    }
  })

  ipcMain.handle('courses:assignToClass', async (_, courseId: number, classId: number) => {
    try {
      return courseRepository.assignToClass(courseId, classId)
    } catch (error) {
      console.error(
        `Error in courses:assignToClass for courseId ${courseId}, classId ${classId}`,
        error
      )
      throw new Error(`Failed to assign course ${courseId} to class ${classId}`)
    }
  })

  ipcMain.handle('courses:removeFromClass', async (_, courseId: number, classId: number) => {
    try {
      return courseRepository.removeFromClass(courseId, classId)
    } catch (error) {
      console.error(
        `Error in courses:removeFromClass for courseId ${courseId}, classId ${classId}`,
        error
      )
      throw new Error(`Failed to remove course ${courseId} from class ${classId}`)
    }
  })

  ipcMain.handle('courses:getAvailableForClass', async (_, classId: number) => {
    try {
      return courseRepository.getAvailableForClass(classId)
    } catch (error) {
      console.error(`Error in courses:getAvailableForClass for classId ${classId}`, error)
      throw new Error(`Failed to get available courses for class ${classId}`)
    }
  })

  ipcMain.handle('courses:update', async (_, id: number, data: any) => {
    try {
      return courseRepository.update(id, data)
    } catch (error) {
      console.error(`Error in courses:update for id ${id}`, error)
      throw new Error(`Failed to update course with id ${id}`)
    }
  })

  // src/main/ipc/handlers.ts - Add these new handlers
  ipcMain.handle('teachers:getCourses', async (_, teacherId: number) => {
    try {
      return teacherRepository.getTeacherCourses(teacherId)
    } catch (error) {
      console.error(`Error in teachers:getCourses for teacherId ${teacherId}`, error)
      throw new Error(`Failed to get courses for teacher ${teacherId}`)
    }
  })

  ipcMain.handle('teachers:removeCourse', async (_, teacherId: number, courseId: number) => {
    try {
      return teacherRepository.removeCourse(teacherId, courseId)
    } catch (error) {
      console.error(
        `Error in teachers:removeCourse for teacherId ${teacherId}, courseId ${courseId}`,
        error
      )
      throw new Error(`Failed to remove course ${courseId} from teacher ${teacherId}`)
    }
  })

  ipcMain.handle('teachers:getAvailableCourses', async (_, teacherId: number) => {
    try {
      return teacherRepository.getAvailableCoursesForTeacher(teacherId)
    } catch (error) {
      console.error(`Error in teachers:getAvailableCourses for teacherId ${teacherId}`, error)
      throw new Error(`Failed to get available courses for teacher ${teacherId}`)
    }
  })

  ipcMain.handle('courses:getAssignedTeachers', async (_, courseId: number) => {
    try {
      const teachers = courseRepository.getAssignedTeachers(courseId)
      return teachers
    } catch (error) {
      console.error('Error in courses:getAssignedTeachers', error)
      throw new Error('Failed to get assigned teachers')
    }
  })

  ipcMain.handle(
    'courses:getEligibleTeachers',
    async (_, courseId: number, type?: AssignmentType) => {
      try {
        const teachers = courseRepository.getEligibleTeachers(courseId, type)
        return teachers
      } catch (error) {
        console.error('Error in courses:getEligibleTeachers', error)
        throw new Error('Failed to get eligible teachers')
      }
    }
  )

  // Assign teacher with type
  ipcMain.handle(
    'courses:assignTeacher',
    async (_, courseId: number, teacherId: number, type: AssignmentType) => {
      try {
        const result = courseRepository.assignTeacher(courseId, teacherId, type)
        return result
      } catch (error) {
        console.error('Error in courses:assignTeacher', error)
        throw new Error('Failed to assign teacher')
      }
    }
  )

  // Remove teacher by type
  ipcMain.handle(
    'courses:removeTeacherByType',
    async (_, courseId: number, type: AssignmentType) => {
      try {
        const result = courseRepository.removeTeacherByType(courseId, type)
        return result
      } catch (error) {
        console.error('Error in courses:removeTeacherByType', error)
        throw new Error('Failed to remove teacher')
      }
    }
  )

  // Get courses with teacher details
  ipcMain.handle('courses:getCoursesWithTeacherDetails', async (_, classId: number) => {
    try {
      const courses = courseRepository.getCoursesWithTeacherDetails(classId)
      return courses
    } catch (error) {
      console.error('Error in courses:getCoursesWithTeacherDetails', error)
      throw new Error('Failed to get courses with teacher details')
    }
  })

  // Teacher course management with types
  ipcMain.handle('teachers:getCoursesWithTypes', async (_, teacherId: number) => {
    try {
      const courses = teacherRepository.getTeacherCoursesWithTypes(teacherId)
      return courses
    } catch (error) {
      console.error('Error in teachers:getCoursesWithTypes', error)
      throw new Error('Failed to get teacher courses with types')
    }
  })

  ipcMain.handle(
    'teachers:assignCourse',
    async (_, teacherId: number, courseId: number, type: CourseType) => {
      try {
        const result = teacherRepository.assignCourse(teacherId, courseId, type)
        return result
      } catch (error) {
        console.error('Error in teachers:assignCourse', error)
        throw new Error('Failed to assign course to teacher')
      }
    }
  )

  ipcMain.handle(
    'teachers:updateCourseType',
    async (_, teacherId: number, courseId: number, type: CourseType) => {
      try {
        const result = teacherRepository.updateCourseType(teacherId, courseId, type)
        return result
      } catch (error) {
        console.error('Error in teachers:updateCourseType', error)
        throw new Error('Failed to update course type')
      }
    }
  )

  ipcMain.handle('rooms:getAll', async () => {
    try {
      const rooms = roomRepository.getAll()

      return rooms
    } catch (error) {
      console.error('Error in rooms:getAll', error)
      throw new Error('Failed to get rooms')
    }
  })

  ipcMain.handle('rooms:getById', async (_, id: number) => {
    try {
      const room = roomRepository.getById(id)

      return room
    } catch (error) {
      console.error('Error in rooms:getById', error)
      throw new Error('Failed to get room')
    }
  })

  ipcMain.handle('rooms:getByType', async (_, type: string) => {
    try {
      const rooms = roomRepository.getByType(type as any)

      return rooms
    } catch (error) {
      console.error('Error in rooms:getByType', error)
      throw new Error('Failed to get rooms by type')
    }
  })

  ipcMain.handle('rooms:create', async (_, data: any) => {
    try {
      const room = roomRepository.create(data)

      return room
    } catch (error) {
      console.error('Error in rooms:create', error)
      throw new Error('Failed to create room')
    }
  })

  ipcMain.handle('rooms:update', async (_, id: number, data: any) => {
    try {
      const success = roomRepository.update(id, data)

      return success
    } catch (error) {
      console.error('Error in rooms:update', error)
      throw new Error('Failed to update room')
    }
  })

  ipcMain.handle('rooms:delete', async (_, id: number) => {
    try {
      const success = roomRepository.delete(id)

      return success
    } catch (error) {
      console.error('Error in rooms:delete', error)
      throw new Error('Failed to delete room')
    }
  })

  ipcMain.handle('rooms:getStats', async () => {
    try {
      const stats = roomRepository.getRoomStats()

      return stats
    } catch (error) {
      console.error('Error in rooms:getStats', error)
      throw new Error('Failed to get room stats')
    }
  })

  // Settings handlers
  ipcMain.handle('settings:get', async () => {
    try {
      const settings = settingsRepository.get()

      return settings
    } catch (error) {
      console.error('Error in settings:get', error)
      throw new Error('Failed to get settings')
    }
  })

  ipcMain.handle('settings:update', async (_, data: any) => {
    try {
      const success = settingsRepository.update(data)
      return success
    } catch (error) {
      console.error('Error in settings:update', error)
      throw new Error('Failed to update settings')
    }
  })

  ipcMain.handle(
    'settings:updateRoomCounts',
    async (_, lectureCount: number, seminarCount: number) => {
      try {
        const success = settingsRepository.updateRoomCounts(lectureCount, seminarCount)
        return success
      } catch (error) {
        console.error('Error in settings:updateRoomCounts', error)
        throw new Error('Failed to update room counts')
      }
    }
  )

  ipcMain.handle('database:execute', async (_, sql: string, params: any[] = []) => {
    try {
      console.log('IPC: Executing SQL:', sql)
      const db = getDatabase()

      if (params.length > 0) {
        const result = db.prepare(sql).run(...params)
        return result
      } else {
        const result = db.prepare(sql).run()
        return result
      }
    } catch (error) {
      console.error('Error in database:execute', error)
      throw error
    }
  })

  ipcMain.handle('database:seed', async () => {
    try {
      console.log('IPC: Starting database seeding')
      return { success: true, message: 'Ready to seed database' }
    } catch (error) {
      console.error('Error in database:seed', error)
      return { success: false, message: 'Database seeding failed', error: error as Error }
    }
  })

  ipcMain.handle('database:clear', async () => {
    try {
      console.log('IPC: Clearing database')
      const db = getDatabase()

      // Clear in correct order to avoid foreign key constraints
      db.prepare('DELETE FROM teacher_courses').run()
      db.prepare('DELETE FROM class_courses').run()
      db.prepare('DELETE FROM schedules').run()
      db.prepare('DELETE FROM teachers').run()
      db.prepare('DELETE FROM courses').run()
      db.prepare('DELETE FROM classes').run()
      db.prepare('DELETE FROM rooms').run()

      console.log('IPC: Database cleared successfully')
      return { success: true, message: 'Database cleared successfully' }
    } catch (error) {
      console.error('Error in database:clear', error)
      return { success: false, message: 'Database clear failed', error: error as Error }
    }
  })

  ipcMain.handle(
    'schedules:save',
    async (
      _,
      data: {
        name: string
        description?: string
        data: GeneratedSchedule
        metadata?: any
      }
    ) => {
      try {
        return scheduleRepository.create(data)
      } catch (error) {
        console.error('Error in schedules:save', error)
        throw new Error('Failed to save schedule')
      }
    }
  )

  // Get all saved schedules
  ipcMain.handle('schedules:getSaved', async () => {
    try {
      return scheduleRepository.getAll()
    } catch (error) {
      console.error('Error in schedules:getSaved', error)
      throw new Error('Failed to get saved schedules')
    }
  })

  // Load saved schedule by ID
  ipcMain.handle('schedules:load', async (_, id: number) => {
    try {
      return scheduleRepository.getById(id)
    } catch (error) {
      console.error('Error in schedules:load', error)
      throw new Error('Failed to load schedule')
    }
  })

  // Update saved schedule
  ipcMain.handle(
    'schedules:update',
    async (
      _,
      id: number,
      data: {
        name?: string
        description?: string
        data?: GeneratedSchedule
        metadata?: any
      }
    ) => {
      try {
        return scheduleRepository.update(id, data)
      } catch (error) {
        console.error('Error in schedules:update', error)
        throw new Error('Failed to update schedule')
      }
    }
  )

  // Delete saved schedule
  ipcMain.handle('schedules:deleteSaved', async (_, id: number) => {
    try {
      return scheduleRepository.delete(id)
    } catch (error) {
      console.error('Error in schedules:deleteSaved', error)
      throw new Error('Failed to delete schedule')
    }
  })

  // Search schedules
  ipcMain.handle('schedules:search', async (_, query: string) => {
    try {
      return scheduleRepository.search(query)
    } catch (error) {
      console.error('Error in schedules:search', error)
      throw new Error('Failed to search schedules')
    }
  })

  // src/main/ipc/handlers.ts
  // Update the generic setting handlers to use generic_settings table

  ipcMain.handle('get-setting', async (_, key: string) => {
    try {
      const db = getDatabase()
      const stmt = db.prepare('SELECT value FROM generic_settings WHERE key = ?')
      const result = stmt.get(key) as { value: string } | undefined
      return result?.value || null
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error)
      return null
    }
  })

  ipcMain.handle('set-setting', async (_, key: string, value: string) => {
    try {
      const db = getDatabase()
      const stmt = db.prepare(`
      INSERT OR REPLACE INTO generic_settings (key, value, updated_at) 
      VALUES (?, ?, datetime('now'))
    `)
      stmt.run(key, value)
      return true
    } catch (error) {
      console.error(`Error setting ${key}:`, error)
      return false
    }
  })

  ipcMain.handle('remove-setting', async (_, key: string) => {
    try {
      const db = getDatabase()
      const stmt = db.prepare('DELETE FROM generic_settings WHERE key = ?')
      stmt.run(key)
      return true
    } catch (error) {
      console.error(`Error removing setting ${key}:`, error)
      return false
    }
  })

  ipcMain.handle('get-all-settings', async () => {
    try {
      const db = getDatabase()
      const stmt = db.prepare('SELECT key, value FROM generic_settings')
      const results = stmt.all() as { key: string; value: string }[]

      const settings: Record<string, string> = {}
      results.forEach((row) => {
        settings[row.key] = row.value
      })
      return settings
    } catch (error) {
      console.error('Error getting all settings:', error)
      return {}
    }
  })
}
