import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
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
import { Room, RoomType } from '@shared/types/database'

const api = {
  classes: {
    getAll: () => ipcRenderer.invoke('classes:getAll'),
    getById: (id: number) => ipcRenderer.invoke('classes:getById', id),
    create: (data: ClassCreateDto) => ipcRenderer.invoke('classes:create', data),
    update: (id: number, data: ClassUpdateDto) => ipcRenderer.invoke('classes:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('classes:delete', id)
  },
  teachers: {
    getAll: () => ipcRenderer.invoke('teachers:getAll'),
    getById: (id: number) => ipcRenderer.invoke('teachers:getById', id),
    create: (data: TeacherCreateDto) => ipcRenderer.invoke('teachers:create', data),
    update: (id: number, data: TeacherUpdateDto) => ipcRenderer.invoke('teachers:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('teachers:delete', id),

    // Updated course-based methods
    getCourses: (id: number) => ipcRenderer.invoke('teachers:getCourses', id),
    getCoursesWithTypes: (teacherId: number) =>
      ipcRenderer.invoke('teachers:getCoursesWithTypes', teacherId),
    assignCourse: (teacherId: number, courseId: number, type: string) =>
      ipcRenderer.invoke('teachers:assignCourse', teacherId, courseId, type),
    removeCourse: (teacherId: number, courseId: number) =>
      ipcRenderer.invoke('teachers:removeCourse', teacherId, courseId),
    getAvailableCourses: (teacherId: number) =>
      ipcRenderer.invoke('teachers:getAvailableCourses', teacherId),
    updateCourseType: (teacherId: number, courseId: number, type: string) =>
      ipcRenderer.invoke('teachers:updateCourseType', teacherId, courseId, type)
  },
  courses: {
    getAll: () => ipcRenderer.invoke('courses:getAll'),
    getByClassId: (classId: number) => ipcRenderer.invoke('courses:getByClassId', classId),
    getCoursesWithTeachers: (classId: number) =>
      ipcRenderer.invoke('courses:getCoursesWithTeachers', classId),
    getAvailableForClass: (classId: number) =>
      ipcRenderer.invoke('courses:getAvailableForClass', classId),
    create: (data: any) => ipcRenderer.invoke('courses:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('courses:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('courses:delete', id),
    assignToClass: (courseId: number, classId: number) =>
      ipcRenderer.invoke('courses:assignToClass', courseId, classId),
    removeFromClass: (courseId: number, classId: number) =>
      ipcRenderer.invoke('courses:removeFromClass', courseId, classId),
    assignTeacher: (courseId: number, teacherId: number, type: string) =>
      ipcRenderer.invoke('courses:assignTeacher', courseId, teacherId, type),
    removeTeacher: (courseId: number, teacherId: number) =>
      ipcRenderer.invoke('courses:removeTeacher', courseId, teacherId),
    removeTeacherByType: (courseId: number, type: string) =>
      ipcRenderer.invoke('courses:removeTeacherByType', courseId, type),
    getEligibleTeachers: (courseId: number, type?: string) =>
      ipcRenderer.invoke('courses:getEligibleTeachers', courseId, type),
    getAssignedTeachers: (courseId: number) =>
      ipcRenderer.invoke('courses:getAssignedTeachers', courseId),
    getCoursesWithTeacherDetails: (classId: number) =>
      ipcRenderer.invoke('courses:getCoursesWithTeacherDetails', classId)
  },
  schedules: {
    getAll: () => ipcRenderer.invoke('schedules:getAll'),
    generate: (classId: number) => ipcRenderer.invoke('schedules:generate', classId),
    getById: (id: number) => ipcRenderer.invoke('schedules:getById', id),
    create: (data: ScheduleCreateDto) => ipcRenderer.invoke('schedules:create', data)
  },
  rooms: {
    getAll: () => ipcRenderer.invoke('rooms:getAll'),
    getById: (id: number) => ipcRenderer.invoke('rooms:getById', id),
    getByType: (type: RoomType) => ipcRenderer.invoke('rooms:getByType', type),
    create: (data: CreateRoomDto) => ipcRenderer.invoke('rooms:create', data),
    update: (id: number, data: UpdateRoomDto) => ipcRenderer.invoke('rooms:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('rooms:delete', id),
    getStats: () => ipcRenderer.invoke('rooms:getStats')
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (data: UpdateSettingsDto) => ipcRenderer.invoke('settings:update', data),
    updateRoomCounts: (lectureCount: number, seminarCount: number) =>
      ipcRenderer.invoke('settings:updateRoomCounts', lectureCount, seminarCount)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
