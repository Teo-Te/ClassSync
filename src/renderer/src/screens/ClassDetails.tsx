// src/renderer/src/screens/ClassDetails.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, BookOpen, Users } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { CourseCard } from '@renderer/components/courses/CourseCard'
import { AddCourseDialog } from '@renderer/components/courses/AddCourseDialog'
import { AssignTeacherDialog } from '@renderer/components/courses/AssignTeacherDialog'
import { Class, CourseWithTeachers, Teacher } from '@shared/types/database'
import { AssignCourseDialog } from '@renderer/components/courses/AssignCourseDialog'

const ClassDetails = () => {
  const { classId } = useParams<{ classId: string }>()
  console.log('Class ID:', classId)
  const navigate = useNavigate()

  const [isAssignCourseOpen, setIsAssignCourseOpen] = useState(false)
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])

  const [classData, setClassData] = useState<Class | null>(null)
  const [courses, setCourses] = useState<CourseWithTeachers[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false)
  const [isAssignTeacherOpen, setIsAssignTeacherOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<CourseWithTeachers | null>(null)

  useEffect(() => {
    if (classId) {
      loadClassData()
    }
  }, [classId])

  const loadAvailableCourses = async () => {
    try {
      const available = await window.api.courses.getAvailableForClass(Number(classId))
      setAvailableCourses(available)
    } catch (error) {
      console.error('Failed to load available courses:', error)
    }
  }

  const handleAssignCourse = async (courseId: number) => {
    try {
      await window.api.courses.assignToClass(courseId, Number(classId))
      setIsAssignCourseOpen(false)
      loadClassData() // Reload to show updated courses
    } catch (error) {
      console.error('Failed to assign course:', error)
    }
  }

  const loadClassData = async () => {
    try {
      setLoading(true)
      const [classInfo, coursesWithTeachers, allTeachers] = await Promise.all([
        window.api.classes.getById(Number(classId)),
        window.api.courses.getCoursesWithTeachers(Number(classId)),
        window.api.teachers.getAll()
      ])

      setClassData(classInfo)
      setCourses(coursesWithTeachers)
      setTeachers(allTeachers)
    } catch (error) {
      console.error('Failed to load class data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCourse = async (courseData: any) => {
    try {
      const newCourse = await window.api.courses.create({
        ...courseData,
        class_id: Number(classId)
      })
      setCourses([...courses, newCourse])
      setIsAddCourseOpen(false)
    } catch (error) {
      console.error('Failed to add course:', error)
    }
  }

  const handleDeleteCourse = async (courseId: number) => {
    try {
      await window.api.courses.delete(courseId)
      setCourses(courses.filter((c) => c.id !== courseId))
    } catch (error) {
      console.error('Failed to delete course:', error)
    }
  }

  const handleAssignTeacher = (course: CourseWithTeachers) => {
    setSelectedCourse(course)
    setIsAssignTeacherOpen(true)
  }

  const handleTeacherAssigned = async (teacherId: number) => {
    if (!selectedCourse) return

    try {
      await window.api.courses.assignTeacher(selectedCourse.id, teacherId)
      setIsAssignTeacherOpen(false)
      setSelectedCourse(null)
      loadClassData()
    } catch (error) {
      console.error('Failed to assign teacher:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 bg-black min-h-screen">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/20 rounded w-1/3"></div>
          <div className="h-4 bg-white/20 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/10 rounded-lg p-6 h-48"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!classData) {
    return (
      <div className="container mx-auto p-6 bg-black min-h-screen text-center">
        <h1 className="text-2xl text-white">Class not found</h1>
        <Button onClick={() => navigate('/classes')} className="mt-4 bg-lime-500 text-black">
          Back to Classes
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6 bg-black min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button
          onClick={() => navigate('/classes')}
          className="bg-white/10 hover:bg-white/20 text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">{classData.name}</h1>
          <p className="text-white/70">
            Year {classData.year} • {classData.semester === 1 ? '1st' : '2nd'} Semester
          </p>
        </div>

        <Button
          onClick={() => setIsAddCourseOpen(true)}
          className="bg-lime-500 hover:bg-lime-600 text-black"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Course
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-black border border-white/20 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-lime-500" />
            <div>
              <div className="text-2xl font-bold text-white">{courses.length}</div>
              <div className="text-white/70">Total Courses</div>
            </div>
          </div>
        </div>

        <div className="bg-black border border-white/20 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-lime-500" />
            <div>
              <div className="text-2xl font-bold text-white">
                {courses.reduce((acc, course) => acc + (course.teachers?.length || 0), 0)}
              </div>
              <div className="text-white/70">Assigned Teachers</div>
            </div>
          </div>
        </div>

        <div className="bg-black border border-white/20 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-lime-500" />
            <div>
              <div className="text-2xl font-bold text-white">
                {courses.reduce((acc, course) => acc + course.hours_per_week, 0)}
              </div>
              <div className="text-white/70">Total Hours/Week</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Courses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h2 className="text-xl font-semibold text-white">Courses</h2>

        {courses.length === 0 ? (
          <div className="text-center py-12 bg-black border border-white/20 rounded-lg">
            <BookOpen className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <h3 className="text-lg text-white mb-2">No courses yet</h3>
            <p className="text-white/70 mb-4">Add your first course to get started</p>
            <Button
              onClick={() => {
                loadAvailableCourses()
                setIsAssignCourseOpen(true)
              }}
              className="bg-lime-500 hover:bg-lime-600 text-black"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Course
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <CourseCard
                  course={course}
                  teachers={teachers}
                  onAssignTeacher={() => handleAssignTeacher(course)}
                  onDelete={() => handleDeleteCourse(course.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <AssignCourseDialog
        open={isAssignCourseOpen}
        onClose={() => setIsAssignCourseOpen(false)}
        onSubmit={handleAssignCourse}
        availableCourses={availableCourses}
      />

      <AssignTeacherDialog
        open={isAssignTeacherOpen}
        onClose={() => setIsAssignTeacherOpen(false)}
        onSubmit={handleTeacherAssigned}
        course={selectedCourse}
        teachers={teachers}
      />
    </div>
  )
}

export default ClassDetails
