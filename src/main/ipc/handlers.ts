import { ipcMain } from 'electron'
import ClassRepository from '../db/repositories/ClassRepository'
import TeacherRepository from '../db/repositories/TeacherRepository'
import CourseRepository from '../db/repositories/CourseRepository'
import ScheduleRepository from '../db/repositories/ScheduleRepository'
import { generateSchedule } from '../services/schedulerService'

// Initialize repositories
const classRepository = new ClassRepository()
const teacherRepository = new TeacherRepository()
const courseRepository = new CourseRepository()
const scheduleRepository = new ScheduleRepository()

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

  ipcMain.handle('courses:assignTeacher', async (_, courseId: number, teacherId: number) => {
    try {
      return courseRepository.assignTeacher(courseId, teacherId)
    } catch (error) {
      console.error(`Error in courses:assignTeacher for courseId ${courseId}`, error)
      throw new Error(`Failed to assign teacher to course with id ${courseId}`)
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

  ipcMain.handle('courses:getAssignedTeachers', async (_, courseId: number) => {
    try {
      return courseRepository.getAssignedTeachers(courseId)
    } catch (error) {
      console.error(`Error in courses:getAssignedTeachers for courseId ${courseId}`, error)
      throw new Error(`Failed to get assigned teachers for course with id ${courseId}`)
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
}
