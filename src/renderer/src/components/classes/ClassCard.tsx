import { motion } from 'framer-motion'
import { MoreHorizontal, Edit, Trash2, BookOpen, Calendar } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { Class } from '@shared/types/database'
import { useNavigate } from 'react-router-dom'

interface ClassCardProps {
  classItem: Class
  onEdit: (classItem: Class) => void
  onDelete: (id: number) => void
}

export const ClassCard = ({ classItem, onEdit, onDelete }: ClassCardProps) => {
  const navigate = useNavigate()

  const getSemesterText = (semester: number) => {
    return semester === 1 ? '1st Semester' : '2nd Semester'
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-black rounded-lg p-6 border border-white/20 hover:border-lime-500 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-1">{classItem.name}</h3>
          <div className="flex items-center gap-4 text-sm text-white/70">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Year {classItem.year}</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span>{getSemesterText(classItem.semester)}</span>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-black border-white/20">
            <DropdownMenuItem onClick={() => onEdit(classItem)} className="text-white">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(classItem.id)} className="text-red-500">
              <Trash2 className="w-4 h-4 mr-2 text-red-500" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
        <div className="text-center">
          <div className="text-lg font-semibold text-lime-500">0</div>
          <div className="text-xs text-white/50">Courses</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-lime-500">0</div>
          <div className="text-xs text-white/50">Schedules</div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-white/20">
        <Button
          onClick={() => navigate(`/classes/${classItem.id}`)}
          variant="default"
          size="sm"
          className="w-full border-white border hover:border-lime-500 hover:text-lime-500"
        >
          View Details
        </Button>
      </div>
    </motion.div>
  )
}
