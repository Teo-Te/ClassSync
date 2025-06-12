import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings as SettingsIcon,
  Building,
  Users,
  GraduationCap,
  Plus,
  Trash2,
  Edit,
  Save,
  Info,
  Github,
  Monitor,
  MapPin,
  Database,
  Sparkles
} from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@renderer/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Room, RoomType } from '@shared/types/database'
import { seedDatabase } from '@renderer/lib/seed'
import AISettings from '@renderer/components/schedules/ai/AISettings'

const Settings = () => {
  const [rooms, setRooms] = useState<Room[]>([])
  const [lectureRoomsCount, setLectureRoomsCount] = useState(0)
  const [seminarRoomsCount, setSeminarRoomsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)

  // Room dialog states
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [roomFormData, setRoomFormData] = useState({
    name: '',
    type: 'lecture' as RoomType,
    capacity: 50
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const [roomsData, settingsData] = await Promise.all([
        window.api.rooms.getAll(),
        window.api.settings.get()
      ])

      setRooms(roomsData)
      setLectureRoomsCount(settingsData.lecture_rooms_count)
      setSeminarRoomsCount(settingsData.seminar_rooms_count)
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSeedDatabase = async () => {
    try {
      setSeeding(true)
      const result = await seedDatabase()
      if (result.success) {
        console.log('✅ Database seeded successfully')
        // You might want to show a success toast/notification
      } else {
        console.error('❌ Database seeding failed:', result.message)
      }
    } catch (error) {
      console.error('❌ Failed to seed database:', error)
    } finally {
      setSeeding(false)
    }
  }

  const handleSaveRoomCounts = async () => {
    try {
      setSaving(true)
      await window.api.settings.updateRoomCounts(lectureRoomsCount, seminarRoomsCount)
    } catch (error) {
      console.error('Failed to save room counts:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddRoom = () => {
    setEditingRoom(null)
    setRoomFormData({ name: '', type: 'lecture', capacity: 50 })
    setIsRoomDialogOpen(true)
  }

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room)
    setRoomFormData({
      name: room.name,
      type: room.type,
      capacity: room.capacity
    })
    setIsRoomDialogOpen(true)
  }

  const handleSaveRoom = async () => {
    try {
      if (editingRoom) {
        await window.api.rooms.update(editingRoom.id, roomFormData)
        setRooms(rooms.map((r) => (r.id === editingRoom.id ? { ...r, ...roomFormData } : r)))
      } else {
        const newRoom = await window.api.rooms.create(roomFormData)
        setRooms([...rooms, newRoom])
      }
      setIsRoomDialogOpen(false)
    } catch (error) {
      console.error('Failed to save room:', error)
    }
  }

  const handleDeleteRoom = async (roomId: number) => {
    try {
      await window.api.rooms.delete(roomId)
      setRooms(rooms.filter((r) => r.id !== roomId))
    } catch (error) {
      console.error('Failed to delete room:', error)
    }
  }

  const lectureRooms = rooms.filter((r) => r.type === 'lecture')
  const seminarRooms = rooms.filter((r) => r.type === 'seminar')

  if (loading) {
    return (
      <div className="container mx-auto p-6 bg-black min-h-screen">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/20 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/10 rounded-lg p-6 h-48"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8 bg-black min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="w-12 h-12 bg-lime-500 rounded-lg flex items-center justify-center">
          <SettingsIcon className="w-6 h-6 text-black" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-white/70">Manage rooms, preferences, and application settings</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Room Configuration */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <Card className="bg-black border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                AI Configuration
              </CardTitle>
              <CardDescription className="text-white/70">
                Configure AI settings for schedule optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <AISettings onClose={() => {}} />
            </CardContent>
          </Card>

          {/* Room Management */}
          <Card className="bg-black border-white/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-lime-500" />
                  Room Management
                </CardTitle>
                <CardDescription className="text-white/70">
                  Manage individual rooms and their details
                </CardDescription>
              </div>
              <Button
                onClick={handleAddRoom}
                size="sm"
                className="bg-lime-500 hover:bg-lime-600 text-black"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Room
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Lecture Rooms */}
                <div>
                  <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-500" />
                    Lecture Rooms ({lectureRooms.length})
                  </h4>
                  {lectureRooms.length > 0 ? (
                    <div className="space-y-2">
                      {lectureRooms.map((room) => (
                        <div
                          key={room.id}
                          className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded"
                        >
                          <div>
                            <span className="text-blue-400 font-medium">{room.name}</span>
                            <span className="text-blue-400/70 text-sm ml-2">
                              Capacity: {room.capacity}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleEditRoom(room)}
                              className="bg-white/10 hover:bg-white/20 text-white"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleDeleteRoom(room.id)}
                              className="bg-red-500/20 hover:bg-red-500/30 text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-blue-400/50 text-sm bg-blue-500/5 border border-blue-500/10 rounded">
                      No lecture rooms added yet
                    </div>
                  )}
                </div>

                {/* Seminar Rooms */}
                <div>
                  <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-500" />
                    Seminar Rooms ({seminarRooms.length})
                  </h4>
                  {seminarRooms.length > 0 ? (
                    <div className="space-y-2">
                      {seminarRooms.map((room) => (
                        <div
                          key={room.id}
                          className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded"
                        >
                          <div>
                            <span className="text-green-400 font-medium">{room.name}</span>
                            <span className="text-green-400/70 text-sm ml-2">
                              Capacity: {room.capacity}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleEditRoom(room)}
                              className="bg-white/10 hover:bg-white/20 text-white"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleDeleteRoom(room.id)}
                              className="bg-red-500/20 hover:bg-red-500/30 text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-green-400/50 text-sm bg-green-500/5 border border-green-500/10 rounded">
                      No seminar rooms added yet
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* App Information */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Application Info */}
          <Card className="bg-black border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-lime-500" />
                Application Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-white/70">Application Name</span>
                  <span className="text-white font-medium">ClassSync</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-white/70">Version</span>
                  <span className="text-lime-400 font-medium">v1.0.0</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-white/70">Developer</span>
                  <span className="text-white font-medium">Arteo Fejzo</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-white/70">Platform</span>
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-white/70" />
                    <span className="text-white font-medium">Electron-Vite + React</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-white/70">More from the developer</span>
                  <Button
                    size="sm"
                    className="bg-white/10 hover:bg-white/20 text-white"
                    onClick={() => {
                      // Open GitHub or your repository
                      window.open('https://github.com/Teo-Te', '_blank')
                    }}
                  >
                    <Github className="w-4 h-4 mr-1" />
                    GitHub
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Stats */}
          <Card className="bg-black border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Monitor className="w-5 h-5 text-lime-500" />
                System Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white/5 rounded">
                  <div className="text-2xl font-bold text-lime-400">
                    {lectureRooms.length + seminarRooms.length}
                  </div>
                  <div className="text-white/70 text-sm">Total Rooms</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded">
                  <div className="text-2xl font-bold text-blue-400">{lectureRooms.length}</div>
                  <div className="text-white/70 text-sm">Lecture Rooms</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded">
                  <div className="text-2xl font-bold text-green-400">{seminarRooms.length}</div>
                  <div className="text-white/70 text-sm">Seminar Rooms</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded">
                  <div className="text-2xl font-bold text-white">
                    {rooms.reduce((acc, room) => acc + room.capacity, 0)}
                  </div>
                  <div className="text-white/70 text-sm">Total Capacity</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Management */}
          <Card className="bg-black border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-lime-500" />
                Database Management
              </CardTitle>
              <CardDescription className="text-white/70">
                Initialize database with sample IT engineering data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleSeedDatabase}
                disabled={seeding}
                className="w-full bg-lime-500 hover:bg-lime-600 text-black"
              >
                {seeding ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                    Seeding Database...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Seed Sample Data
                  </>
                )}
              </Button>

              {seeding && (
                <div className="mt-3 text-sm text-white/70">
                  Creating 15 teachers, 20 courses, 9 classes and their assignments...
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Room Dialog */}
      <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
        <DialogContent className="bg-black border-white/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingRoom ? 'Edit Room' : 'Add New Room'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="room-name" className="text-white">
                Room Name
              </Label>
              <Input
                id="room-name"
                value={roomFormData.name}
                onChange={(e) => setRoomFormData({ ...roomFormData, name: e.target.value })}
                placeholder="e.g., Lecture Hall A, Seminar Room 101"
                className="bg-black border-white/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room-type" className="text-white">
                Room Type
              </Label>
              <Select
                value={roomFormData.type}
                onValueChange={(value: RoomType) =>
                  setRoomFormData({ ...roomFormData, type: value })
                }
              >
                <SelectTrigger className="bg-black border-white/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/30">
                  <SelectItem value="lecture" className="text-white hover:bg-white/10">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-500" />
                      Lecture Room
                    </div>
                  </SelectItem>
                  <SelectItem value="seminar" className="text-white hover:bg-white/10">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-500" />
                      Seminar Room
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="room-capacity" className="text-white">
                Capacity
              </Label>
              <Input
                id="room-capacity"
                type="number"
                min="1"
                value={roomFormData.capacity}
                onChange={(e) =>
                  setRoomFormData({ ...roomFormData, capacity: Number(e.target.value) })
                }
                className="bg-black border-white/30 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsRoomDialogOpen(false)}
              className="bg-white/10 hover:bg-white/20 text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveRoom}
              className="bg-lime-500 hover:bg-lime-600 text-black"
              disabled={!roomFormData.name.trim()}
            >
              {editingRoom ? 'Update' : 'Add'} Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Settings
