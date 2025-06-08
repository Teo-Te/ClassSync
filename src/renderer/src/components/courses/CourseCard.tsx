import { motion } from 'framer-motion'
import {
  BookOpen,
  Clock,
  Users,
  UserPlus,
  Trash2,
  MoreHorizontal,
  GraduationCap,
  Users as Seminar
} from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { CourseWithTeacherDetails, Teacher } from '@shared/types/database'

interface CourseCardProps {
  course: CourseWithTeacherDetails // Updated type
  teachers: Teacher[]
  onAssignLectureTeacher: () => void // Split into two buttons
  onAssignSeminarTeacher: () => void
  onRemoveFromClass: () => void
}

export const CourseCard = ({
  course,
  teachers,
  onAssignLectureTeacher,
  onAssignSeminarTeacher,
  onRemoveFromClass
}: CourseCardProps) => {
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
              onClick={onRemoveFromClass}
              className="text-red-500 hover:text-red-400"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove from Class
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Teacher Assignments */}
      <div className="space-y-4">
        {/* Lecture Teacher */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white">Lecture Teacher</span>
            </div>
            <span className="text-xs text-blue-400">{course.lecture_hours}h</span>
          </div>

          {course.lectureTeacher ? (
            <div className="flex items-center gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-black text-xs font-medium">
                {course.lectureTeacher.first_name[0]}
                {course.lectureTeacher.last_name[0]}
              </div>
              <span className="text-white text-sm">
                {course.lectureTeacher.first_name} {course.lectureTeacher.last_name}
              </span>
            </div>
          ) : (
            <div className="text-center py-2 border border-dashed border-white/20 rounded">
              <span className="text-xs text-white/50">No lecture teacher assigned</span>
            </div>
          )}
        </div>

        {/* Seminar Teacher */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Seminar className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-white">Seminar Teacher</span>
            </div>
            <span className="text-xs text-green-400">{course.seminar_hours}h</span>
          </div>

          {course.seminarTeacher ? (
            <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-black text-xs font-medium">
                {course.seminarTeacher.first_name[0]}
                {course.seminarTeacher.last_name[0]}
              </div>
              <span className="text-white text-sm">
                {course.seminarTeacher.first_name} {course.seminarTeacher.last_name}
              </span>
            </div>
          ) : (
            <div className="text-center py-2 border border-dashed border-white/20 rounded">
              <span className="text-xs text-white/50">No seminar teacher assigned</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/20">
        <Button
          onClick={onAssignLectureTeacher}
          size="sm"
          className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
        >
          <GraduationCap className="w-4 h-4 mr-1" />
          {course.lectureTeacher ? 'Change' : 'Assign'} Lecture
        </Button>

        <Button
          onClick={onAssignSeminarTeacher}
          size="sm"
          className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
        >
          <Seminar className="w-4 h-4 mr-1" />
          {course.seminarTeacher ? 'Change' : 'Assign'} Seminar
        </Button>
      </div>
    </motion.div>
  )
}
