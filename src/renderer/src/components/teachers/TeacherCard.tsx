import { motion } from 'framer-motion'
import {
  Mail,
  Phone,
  BookOpen,
  Edit,
  Trash2,
  UserCog,
  MoreHorizontal,
  GraduationCap,
  Users
} from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { TeacherWithCourses, CourseType } from '@shared/types/database'

interface TeacherCardProps {
  teacher: TeacherWithCourses
  onEdit: () => void
  onDelete: () => void
  onManageSubjects: () => void
  index: number
}

export const TeacherCard = ({
  teacher,
  onEdit,
  onDelete,
  onManageSubjects,
  index
}: TeacherCardProps) => {
  const initials = `${teacher.first_name[0]}${teacher.last_name[0]}`

  // Get type color for visual indicators
  const getTypeColor = (type: CourseType) => {
    switch (type) {
      case 'lecture':
        return 'blue'
      case 'seminar':
        return 'green'
      case 'both':
        return 'lime'
      default:
        return 'gray'
    }
  }

  // Get type icon
  const getTypeIcon = (type: CourseType) => {
    switch (type) {
      case 'lecture':
        return <GraduationCap className="w-3 h-3" />
      case 'seminar':
        return <Users className="w-3 h-3" />
      case 'both':
        return <BookOpen className="w-3 h-3" />
      default:
        return <BookOpen className="w-3 h-3" />
    }
  }

  // Get type label
  const getTypeLabel = (type: CourseType) => {
    switch (type) {
      case 'lecture':
        return 'L'
      case 'seminar':
        return 'S'
      case 'both':
        return 'L+S'
      default:
        return '?'
    }
  }

  const totalCourseAssignments = teacher.courses.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-black rounded-lg p-6 border border-white/20 hover:border-lime-500 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-lime-500 rounded-full flex items-center justify-center text-black text-lg font-bold">
            {initials}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {teacher.first_name} {teacher.last_name}
            </h3>
            <div className="text-white/70 text-sm">
              {totalCourseAssignments} course assignment{totalCourseAssignments !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" className="bg-white/10 hover:bg-white/20 text-white">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-black border-white/20">
            <DropdownMenuItem onClick={onEdit} className="text-white hover:text-lime-500">
              <Edit className="w-4 h-4 mr-2" />
              Edit Teacher
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onManageSubjects} className="text-white hover:text-lime-500">
              <UserCog className="w-4 h-4 mr-2" />
              Manage Courses
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-500 hover:text-red-400">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        {teacher.email && (
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <Mail className="w-4 h-4" />
            <span className="truncate">{teacher.email}</span>
          </div>
        )}
        {teacher.phone && (
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <Phone className="w-4 h-4" />
            <span>{teacher.phone}</span>
          </div>
        )}
      </div>

      {/* Course Assignments */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-white text-sm font-medium">
          <BookOpen className="w-4 h-4" />
          <span>Course Assignments</span>
        </div>

        {teacher.courses.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
            {/* Show all course assignments with type details */}
            {teacher.courses.map((course, idx) => {
              const typeColor = getTypeColor(course.type)

              return (
                <div
                  key={`${course.id}-${course.type}`}
                  className={`flex items-center justify-between p-2 bg-${typeColor}-500/10 border border-${typeColor}-500/20 rounded text-xs`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className={`flex items-center gap-1 px-1.5 py-0.5 bg-${typeColor}-500/20 border border-${typeColor}-500/30 rounded text-${typeColor}-400`}
                    >
                      {getTypeIcon(course.type)}
                      <span className="text-xs font-medium">{getTypeLabel(course.type)}</span>
                    </div>
                    <span className={`text-${typeColor}-400 font-medium truncate`}>
                      {course.name}
                    </span>
                  </div>
                </div>
              )
            })}

            {/* Simple summary */}
            <div className="pt-2 border-t border-white/10">
              <div className="text-center">
                <div className="text-white/70 text-xs">
                  Teaching {totalCourseAssignments} course{totalCourseAssignments !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-white/50 text-sm bg-white/5 rounded border border-white/10">
            <BookOpen className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <div>No course assignments</div>
            <div className="text-xs mt-1">Click "Manage Courses" to assign</div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
        <Button
          size="sm"
          onClick={onManageSubjects}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white"
        >
          <UserCog className="w-3 h-3 mr-1" />
          Manage Courses
        </Button>
        <Button
          size="sm"
          onClick={onEdit}
          className="bg-lime-500/20 hover:bg-lime-500/30 text-lime-400"
        >
          <Edit className="w-3 h-3" />
        </Button>
      </div>
    </motion.div>
  )
}
