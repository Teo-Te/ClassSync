import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import {
  ClassCreateDto,
  ClassUpdateDto,
  TeacherCreateDto,
  TeacherUpdateDto,
  CourseCreateDto,
  ScheduleCreateDto
} from '@shared/types/dto'

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
    getSubjects: (id: number) => ipcRenderer.invoke('teachers:getSubjects', id),
    addSubject: (id: number, subject: string) =>
      ipcRenderer.invoke('teachers:addSubject', id, subject),
    removeSubject: (id: number, subject: string) =>
      ipcRenderer.invoke('teachers:removeSubject', id, subject)
  },
  courses: {
    getByClassId: (classId: number) => ipcRenderer.invoke('courses:getByClassId', classId),
    create: (data: CourseCreateDto) => ipcRenderer.invoke('courses:create', data),
    delete: (id: number) => ipcRenderer.invoke('courses:delete', id),
    assignTeacher: (courseId: number, teacherId: number) =>
      ipcRenderer.invoke('courses:assignTeacher', courseId, teacherId),
    removeTeacher: (courseId: number, teacherId: number) =>
      ipcRenderer.invoke('courses:removeTeacher', courseId, teacherId),
    getAssignedTeachers: (courseId: number) =>
      ipcRenderer.invoke('courses:getAssignedTeachers', courseId),
    getCoursesWithTeachers: (classId: number) =>
      ipcRenderer.invoke('courses:getCoursesWithTeachers', classId)
  },
  schedules: {
    getAll: () => ipcRenderer.invoke('schedules:getAll'),
    generate: (classId: number) => ipcRenderer.invoke('schedules:generate', classId),
    getById: (id: number) => ipcRenderer.invoke('schedules:getById', id),
    create: (data: ScheduleCreateDto) => ipcRenderer.invoke('schedules:create', data)
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
