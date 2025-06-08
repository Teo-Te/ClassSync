import { motion } from 'framer-motion'
import { BookOpen, Clock, Users, UserPlus, Trash2, MoreHorizontal } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { Course, Teacher } from '@shared/types/database'

interface CourseCardProps {
  course: Course & { teachers?: number[] }
  teachers: Teacher[]
  onAssignTeacher: () => void
  onDelete: () => void
}

export const CourseCard = ({ course, teachers, onAssignTeacher, onDelete }: CourseCardProps) => {
  const assignedTeachers = teachers.filter((teacher) => course.teachers?.includes(teacher.id))

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-black rounded-lg p-6 border border-white/20 hover:border-lime-500 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">{course.name}</h3>
          <div className="flex items-center gap-4 text-sm text-white/70">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{course.hours_per_week}h/week</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span>
                {course.lecture_hours}L + {course.seminar_hours}S
              </span>
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
            <DropdownMenuItem onClick={onAssignTeacher} className="text-white hover:text-lime-500">
              <UserPlus className="w-4 h-4 mr-2" />
              Assign Teacher
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-500 hover:text-red-400">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Assigned Teachers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/70">Assigned Teachers</span>
          <span className="text-xs text-lime-500">{assignedTeachers.length}</span>
        </div>

        {assignedTeachers.length === 0 ? (
          <div className="text-center py-3 border border-dashed border-white/20 rounded">
            <Users className="w-6 h-6 text-white/30 mx-auto mb-1" />
            <p className="text-xs text-white/50">No teachers assigned</p>
          </div>
        ) : (
          <div className="space-y-2">
            {assignedTeachers.slice(0, 2).map((teacher) => (
              <div key={teacher.id} className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 bg-lime-500 rounded-full flex items-center justify-center text-black text-xs font-medium">
                  {teacher.first_name[0]}
                  {teacher.last_name[0]}
                </div>
                <span className="text-white">
                  {teacher.first_name} {teacher.last_name}
                </span>
              </div>
            ))}
            {assignedTeachers.length > 2 && (
              <p className="text-xs text-white/50">+{assignedTeachers.length - 2} more</p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-white/20">
        <Button
          onClick={onAssignTeacher}
          size="sm"
          className="w-full bg-lime-500 hover:bg-lime-600 text-black"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {assignedTeachers.length === 0 ? 'Assign Teacher' : 'Manage Teachers'}
        </Button>
      </div>
    </motion.div>
  )
}
