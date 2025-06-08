import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { ClassCard } from '@renderer/components/classes/ClassCard'
import { ClassDialog } from '@renderer/components/classes/ClassDialog'
import { Class } from '@shared/types/database'

const Classes = () => {
  const [classes, setClasses] = useState<Class[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClasses()
  }, [])

  const loadClasses = async () => {
    try {
      setLoading(true)
      const data = await window.api.classes.getAll()
      setClasses(data)
    } catch (error) {
      console.error('Failed to load classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClass = async (data: any) => {
    try {
      const newClass = await window.api.classes.create(data)
      setClasses([...classes, newClass])
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Failed to create class:', error)
    }
  }

  const handleEditClass = (classItem: Class) => {
    setEditingClass(classItem)
    setIsDialogOpen(true)
  }

  const handleUpdateClass = async (data: any) => {
    if (!editingClass) return

    try {
      await window.api.classes.update(editingClass.id, data)
      setClasses(classes.map((c) => (c.id === editingClass.id ? { ...c, ...data } : c)))
      setIsDialogOpen(false)
      setEditingClass(null)
    } catch (error) {
      console.error('Failed to update class:', error)
    }
  }

  const handleDeleteClass = async (id: number) => {
    try {
      await window.api.classes.delete(id)
      setClasses(classes.filter((c) => c.id !== id))
    } catch (error) {
      console.error('Failed to delete class:', error)
    }
  }

  const filteredClasses = classes.filter((classItem) =>
    classItem.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingClass(null)
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
          <h1 className="text-3xl font-bold text-white">Classes</h1>
          <p className="text-white/70 mt-1">Manage your academic classes and their courses</p>
        </div>

        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-lime-500 hover:bg-lime-600 text-black font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Class
        </Button>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/50" />
          <Input
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-black border-white/30 text-white placeholder:text-white/50 focus:border-lime-500"
          />
        </div>

        <Button
          variant="outline"
          className="border-white/30 text-black hover:text-lime-500 hover:border-lime-500 hover:bg-gray-100"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </motion.div>

      {/* Classes Grid */}
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
          {filteredClasses.map((classItem, index) => (
            <motion.div
              key={classItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ClassCard
                classItem={classItem}
                onEdit={handleEditClass}
                onDelete={handleDeleteClass}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && filteredClasses.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <div className="text-white text-lg mb-2">
            {searchTerm ? 'No classes found matching your search' : 'No classes found'}
          </div>
          <p className="text-white/70 mb-4">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Get started by creating your first class'}
          </p>
          {!searchTerm && (
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-lime-500 hover:bg-lime-600 text-black"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Class
            </Button>
          )}
        </motion.div>
      )}

      {/* Class Dialog */}
      <ClassDialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={editingClass ? handleUpdateClass : handleCreateClass}
        editingClass={editingClass}
      />
    </div>
  )
}

export default Classes
