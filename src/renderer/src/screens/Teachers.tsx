import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  Users,
  Mail,
  Phone,
  BookOpen,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { TeacherCard } from '@renderer/components/teachers/TeacherCard'
import { AddTeacherDialog } from '@renderer/components/teachers/AddTeacherDialog'
import { TeacherCoursesDialog } from '@renderer/components/teachers/TeacherSubjectsDialog'
import { DeleteConfirmDialog } from '@renderer/components/teachers/DeleteConfirmDialog'
import { Teacher, TeacherWithCourses, Course, CourseType } from '@shared/types/database'

const Teachers = () => {
  const [teachers, setTeachers] = useState<TeacherWithCourses[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isCoursesDialogOpen, setIsCoursesDialogOpen] = useState(false) // Changed from isSubjectsDialogOpen
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherWithCourses | null>(null)
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null)

  useEffect(() => {
    loadTeachers()
  }, [])

  const loadTeachers = async () => {
    try {
      setLoading(true)
      const data = await window.api.teachers.getAll()

      // Load courses with types for each teacher
      const teachersWithCourses = await Promise.all(
        data.map(async (teacher: Teacher) => {
          try {
            // Use getCoursesWithTypes instead of getCourses to get the type property
            const courses = await window.api.teachers.getCoursesWithTypes(teacher.id)
            return { ...teacher, courses }
          } catch (error) {
            console.error(`Failed to load courses for teacher ${teacher.id}:`, error)
            return { ...teacher, courses: [] as (Course & { type: CourseType })[] }
          }
        })
      )

      setTeachers(teachersWithCourses)
    } catch (error) {
      console.error('Failed to load teachers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeacher = async (data: any) => {
    try {
      const newTeacher = await window.api.teachers.create(data)

      // Note: Course assignments are handled separately via the TeacherCoursesDialog
      // We don't assign courses during teacher creation anymore
      setTeachers([...teachers, { ...newTeacher, courses: [] }])
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Failed to create teacher:', error)
    }
  }

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setIsAddDialogOpen(true)
  }

  const handleUpdateTeacher = async (data: any) => {
    if (!editingTeacher) return

    try {
      await window.api.teachers.update(editingTeacher.id, data)

      // Update teacher in list
      setTeachers(teachers.map((t) => (t.id === editingTeacher.id ? { ...t, ...data } : t)))

      setIsAddDialogOpen(false)
      setEditingTeacher(null)
    } catch (error) {
      console.error('Failed to update teacher:', error)
    }
  }

  const handleManageCourses = (teacher: TeacherWithCourses) => {
    // Changed from handleManageSubjects
    setSelectedTeacher(teacher)
    setIsCoursesDialogOpen(true) // Changed from setIsSubjectsDialogOpen
  }

  const handleCoursesUpdated = (
    teacherId: number,
    newCourses: (Course & { type: CourseType })[]
  ) => {
    setTeachers(teachers.map((t) => (t.id === teacherId ? { ...t, courses: newCourses } : t)))
  }

  const handleDeleteTeacher = (teacher: Teacher) => {
    setTeacherToDelete(teacher)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteTeacher = async () => {
    if (!teacherToDelete) return

    try {
      await window.api.teachers.delete(teacherToDelete.id)
      setTeachers(teachers.filter((t) => t.id !== teacherToDelete.id))
      setIsDeleteDialogOpen(false)
      setTeacherToDelete(null)
    } catch (error) {
      console.error('Failed to delete teacher:', error)
    }
  }

  const filteredTeachers = teachers.filter(
    (teacher) =>
      `${teacher.first_name} ${teacher.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.courses.some((course) => course.name.toLowerCase().includes(searchTerm.toLowerCase())) // Changed from subjects to courses
  )

  const handleCloseAddDialog = () => {
    setIsAddDialogOpen(false)
    setEditingTeacher(null)
  }

  return (
    <div className="container mx-auto p-6 space-y-6 bg-black min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Teachers</h1>
          <p className="text-white/70 mt-1">Manage teachers and their courses</p>{' '}
          {/* Changed description */}
        </div>

        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-lime-500 hover:bg-lime-600 text-black font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Teacher
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-black border border-white/20 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-lime-500" />
            <div>
              <div className="text-2xl font-bold text-white">{teachers.length}</div>
              <div className="text-white/70">Total Teachers</div>
            </div>
          </div>
        </div>

        <div className="bg-black border border-white/20 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-lime-500" />
            <div>
              <div className="text-2xl font-bold text-white">
                {teachers.reduce((acc, teacher) => acc + teacher.courses.length, 0)}{' '}
                {/* Changed from subjects to courses */}
              </div>
              <div className="text-white/70">Course Assignments</div> {/* Changed label */}
            </div>
          </div>
        </div>

        <div className="bg-black border border-white/20 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Mail className="w-8 h-8 text-lime-500" />
            <div>
              <div className="text-2xl font-bold text-white">
                {teachers.filter((t) => t.email).length}
              </div>
              <div className="text-white/70">With Email</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/50" />
          <Input
            placeholder="Search teachers by name, email, or courses..." // Changed from subjects to courses
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-black border-white/30 text-white placeholder:text-white/50 focus:border-lime-500"
          />
        </div>
      </motion.div>

      {/* Teachers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-black border border-white/20 rounded-lg p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-white/20 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-white/20 rounded w-full"></div>
                <div className="h-3 bg-white/20 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredTeachers.map((teacher, index) => (
            <TeacherCard
              key={teacher.id}
              teacher={teacher}
              onEdit={() => handleEditTeacher(teacher)}
              onDelete={() => handleDeleteTeacher(teacher)}
              onManageSubjects={() => handleManageCourses(teacher)} // Changed to handleManageCourses
              index={index}
            />
          ))}
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && filteredTeachers.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <Users className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <div className="text-white text-lg mb-2">
            {searchTerm ? 'No teachers found matching your search' : 'No teachers found'}
          </div>
          <p className="text-white/70 mb-4">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Get started by adding your first teacher'}
          </p>
          {!searchTerm && (
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-lime-500 hover:bg-lime-600 text-black"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Teacher
            </Button>
          )}
        </motion.div>
      )}

      {/* Dialogs */}
      <AddTeacherDialog
        open={isAddDialogOpen}
        onClose={handleCloseAddDialog}
        onSubmit={editingTeacher ? handleUpdateTeacher : handleCreateTeacher}
        editingTeacher={editingTeacher}
      />

      <TeacherCoursesDialog // Changed component name
        open={isCoursesDialogOpen} // Changed state variable
        onClose={() => setIsCoursesDialogOpen(false)} // Changed state variable
        teacher={selectedTeacher}
        onCoursesUpdated={handleCoursesUpdated} // Changed handler name
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDeleteTeacher}
        teacher={teacherToDelete}
      />
    </div>
  )
}

export default Teachers
