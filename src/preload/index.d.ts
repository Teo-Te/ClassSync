import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      classes: {
        getAll: () => Promise<any[]>
        getById: (id: number) => Promise<any>
        create: (data: any) => Promise<any>
        update: (id: number, data: any) => Promise<boolean>
        delete: (id: number) => Promise<boolean>
      }
      teachers: {
        getAll: () => Promise<any[]>
        getById: (id: number) => Promise<any>
        create: (data: any) => Promise<any>
        update: (id: number, data: any) => Promise<boolean>
        delete: (id: number) => Promise<boolean>
        getSubjects: (id: number) => Promise<string[]>
        addSubject: (id: number, subject: string) => Promise<boolean>
        removeSubject: (id: number, subject: string) => Promise<boolean>
      }
      courses: {
        getByClassId: (classId: number) => Promise<any[]>
        create: (data: any) => Promise<any>
        assignTeacher: (courseId: number, teacherId: number) => Promise<boolean>
        removeTeacher: (courseId: number, teacherId: number) => Promise<boolean>
        getAssignedTeachers: (courseId: number) => Promise<any[]>
        delete: (id: number) => Promise<boolean>
        getCoursesWithTeachers: (classId: number) => Promise<any[]>
      }
      schedules: {
        getAll: () => Promise<any[]>
        generate: (classId: number) => Promise<any>
        getById: (id: number) => Promise<any>
        create: (data: any) => Promise<any>
      }
    }
  }
}
