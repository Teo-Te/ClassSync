// src/renderer/src/screens/Courses.tsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, BookOpen, Edit, Trash2, MoreHorizontal } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { AddCourseDialog } from '@renderer/components/courses/AddCourseDialog'
import { Course } from '@shared/types/database'

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      setLoading(true)
      const data = await window.api.courses.getAll()
      setCourses(data)
    } catch (error) {
      console.error('Failed to load courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCourse = async (data: any) => {
    try {
      const newCourse = await window.api.courses.create(data)
      setCourses([...courses, newCourse])
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Failed to create course:', error)
    }
  }

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course)
    setIsDialogOpen(true)
  }

  const handleUpdateCourse = async (data: any) => {
    if (!editingCourse) return

    try {
      await window.api.courses.update(editingCourse.id, data)
      setCourses(courses.map((c) => (c.id === editingCourse.id ? { ...c, ...data } : c)))
      setIsDialogOpen(false)
      setEditingCourse(null)
    } catch (error) {
      console.error('Failed to update course:', error)
    }
  }

  const handleDeleteCourse = async (id: number) => {
    try {
      await window.api.courses.delete(id)
      setCourses(courses.filter((c) => c.id !== id))
    } catch (error) {
      console.error('Failed to delete course:', error)
    }
  }

  const filteredCourses = courses.filter((course) =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingCourse(null)
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
          <h1 className="text-3xl font-bold text-white">Courses</h1>
          <p className="text-white/70 mt-1">Manage available courses for your institution</p>
        </div>

        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-lime-500 hover:bg-lime-600 text-black font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Course
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/50" />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-black border-white/30 text-white placeholder:text-white/50 focus:border-lime-500"
          />
        </div>
      </motion.div>

      {/* Courses Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-black border border-white/20 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-white/20 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-black rounded-lg p-6 border border-white/20 hover:border-lime-500 transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{course.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-white/70">
                    <span>{course.hours_per_week}h/week</span>
                    <span>
                      {course.lecture_hours}L + {course.seminar_hours}S
                    </span>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" className="bg-white/10 hover:bg-white/20 text-white">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-black border-white/20">
                    <DropdownMenuItem
                      onClick={() => handleEditCourse(course)}
                      className="text-white hover:text-lime-500"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteCourse(course.id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && filteredCourses.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <BookOpen className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <div className="text-white text-lg mb-2">
            {searchTerm ? 'No courses found matching your search' : 'No courses found'}
          </div>
          <p className="text-white/70 mb-4">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Get started by creating your first course'}
          </p>
          {!searchTerm && (
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-lime-500 hover:bg-lime-600 text-black"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Course
            </Button>
          )}
        </motion.div>
      )}

      {/* Course Dialog */}
      <AddCourseDialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={editingCourse ? handleUpdateCourse : handleCreateCourse}
        editingCourse={editingCourse}
      />
    </div>
  )
}

export default Courses
