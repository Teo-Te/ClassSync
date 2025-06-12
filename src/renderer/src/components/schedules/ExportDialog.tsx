// src/renderer/src/components/schedules/ExportDialog.tsx
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Download,
  FileText,
  Table,
  Database,
  Users,
  Building,
  GraduationCap,
  Calendar,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent } from '@renderer/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { Label } from '@renderer/components/ui/label'
import { Checkbox } from '@renderer/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import {
  ScheduleExporter,
  ExportFormat,
  ExportScope,
  ExportOptions
} from '@renderer/lib/utils/exportSchedule'
import { GeneratedSchedule, Room, Teacher, Class } from '@shared/types/database'

interface ExportDialogProps {
  schedule: GeneratedSchedule
  rooms: Room[]
  teachers: Teacher[]
  classes: Class[]
  onClose: () => void
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  schedule,
  rooms,
  teachers,
  classes,
  onClose
}) => {
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [scope, setScope] = useState<ExportScope>('all')
  const [selectedId, setSelectedId] = useState<number | undefined>()
  const [selectedName, setSelectedName] = useState<string>('')
  const [includeConflicts, setIncludeConflicts] = useState(true)
  const [includeMetadata, setIncludeMetadata] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  const formatOptions = [
    {
      value: 'pdf',
      label: 'PDF',
      description: 'Print-ready format with tables and styling',
      icon: FileText,
      color: 'text-red-400'
    },
    {
      value: 'excel',
      label: 'Excel',
      description: 'Spreadsheet with multiple sheets and statistics',
      icon: Table,
      color: 'text-green-400'
    },
    {
      value: 'csv',
      label: 'CSV',
      description: 'Simple comma-separated values for data analysis',
      icon: Database,
      color: 'text-blue-400'
    },
    {
      value: 'json',
      label: 'JSON',
      description: 'Raw data format for developers and integrations',
      icon: Database,
      color: 'text-purple-400'
    }
  ]

  const scopeOptions = [
    {
      value: 'all',
      label: 'Complete Schedule',
      description: 'Export all sessions for all classes, teachers, and rooms',
      icon: Calendar,
      color: 'text-lime-400'
    },
    {
      value: 'teacher',
      label: 'Teacher Schedule',
      description: 'Export schedule for a specific teacher',
      icon: Users,
      color: 'text-blue-400'
    },
    {
      value: 'class',
      label: 'Class Schedule',
      description: 'Export schedule for a specific class',
      icon: GraduationCap,
      color: 'text-purple-400'
    },
    {
      value: 'room',
      label: 'Room Schedule',
      description: 'Export schedule for a specific room',
      icon: Building,
      color: 'text-green-400'
    }
  ]

  const handleExport = async () => {
    try {
      setExporting(true)

      const options: ExportOptions = {
        format,
        scope,
        selectedId: scope !== 'all' ? selectedId : undefined,
        selectedName: scope !== 'all' ? selectedName : undefined,
        includeConflicts,
        includeMetadata
      }

      const exporter = new ScheduleExporter(schedule, rooms, teachers, classes)
      await exporter.export(options)

      setExportSuccess(true)
      setTimeout(() => {
        setExportSuccess(false)
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExporting(false)
    }
  }

  const getSelectionOptions = () => {
    switch (scope) {
      case 'teacher':
        return teachers.map((t) => ({
          id: t.id,
          name: `${t.first_name} ${t.last_name}`
        }))
      case 'class':
        return classes.map((c) => ({
          id: c.id,
          name: c.name
        }))
      case 'room':
        return rooms.map((r) => ({
          id: r.id,
          name: r.name
        }))
      default:
        return []
    }
  }

  const isValidSelection = scope === 'all' || (selectedId && selectedName)

  if (exportSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      >
        <Card className="bg-black border-green-500/50 max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Export Successful!</h3>
            <p className="text-white/70">Your schedule has been exported successfully.</p>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-black border border-white/20 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <Download className="w-6 h-6 text-lime-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Export Schedule</h2>
              <p className="text-white/70 text-sm">Choose format and scope for your export</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-8">
          {/* Format Selection */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Export Format</h3>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formatOptions.map((option) => (
                  <Card
                    key={option.value}
                    className={`cursor-pointer transition-all duration-200 ${
                      format === option.value
                        ? 'bg-white/10 border-lime-500/50 ring-1 ring-lime-500/30'
                        : 'bg-white/5 border-white/20 hover:bg-white/10'
                    }`}
                    onClick={() => setFormat(option.value as ExportFormat)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <option.icon className={`w-6 h-6 ${option.color} mt-1`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-white">{option.label}</h4>
                            <RadioGroupItem
                              value={option.value}
                              className="text-lime-400 border-lime-400"
                            />
                          </div>
                          <p className="text-white/70 text-sm mt-1">{option.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Scope Selection */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Export Scope</h3>
            <RadioGroup
              value={scope}
              onValueChange={(value) => {
                setScope(value as ExportScope)
                setSelectedId(undefined)
                setSelectedName('')
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scopeOptions.map((option) => (
                  <Card
                    key={option.value}
                    className={`cursor-pointer transition-all duration-200 ${
                      scope === option.value
                        ? 'bg-white/10 border-lime-500/50 ring-1 ring-lime-500/30'
                        : 'bg-white/5 border-white/20 hover:bg-white/10'
                    }`}
                    onClick={() => {
                      setScope(option.value as ExportScope)
                      setSelectedId(undefined)
                      setSelectedName('')
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <option.icon className={`w-6 h-6 ${option.color} mt-1`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-white">{option.label}</h4>
                            <RadioGroupItem
                              value={option.value}
                              className="text-lime-400 border-lime-400"
                            />
                          </div>
                          <p className="text-white/70 text-sm mt-1">{option.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </RadioGroup>

            {/* Selection Dropdown for specific scopes */}
            {scope !== 'all' && (
              <div className="mt-4">
                <Label className="text-white text-sm mb-2 block">
                  Select {scope.charAt(0).toUpperCase() + scope.slice(1)}
                </Label>
                <Select
                  value={selectedId?.toString()}
                  onValueChange={(value) => {
                    const id = parseInt(value)
                    const option = getSelectionOptions().find((o) => o.id === id)
                    setSelectedId(id)
                    setSelectedName(option?.name || '')
                  }}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder={`Choose a ${scope}...`} />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/20">
                    {getSelectionOptions().map((option) => (
                      <SelectItem
                        key={option.id}
                        value={option.id.toString()}
                        className="text-white hover:bg-white/10"
                      >
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Export Options */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Export Options</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="conflicts"
                  checked={includeConflicts}
                  onCheckedChange={(checked) => setIncludeConflicts(checked === true)}
                  className="border-white/30 text-lime-400"
                />
                <Label htmlFor="conflicts" className="text-white">
                  Include conflict information
                </Label>
              </div>
            </div>
          </div>

          {/* Export Summary */}
          <Card className="bg-white/5 border-white/20">
            <CardContent className="p-4">
              <h4 className="text-white font-medium mb-2">Export Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">Format:</span>
                  <span className="text-white">
                    {formatOptions.find((f) => f.value === format)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Scope:</span>
                  <span className="text-white">
                    {scope === 'all' ? 'Complete Schedule' : `${selectedName || 'Not selected'}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Sessions:</span>
                  <span className="text-white">
                    {scope === 'all'
                      ? schedule.sessions.length
                      : schedule.sessions.filter((s) => {
                          switch (scope) {
                            case 'teacher':
                              return s.teacherId === selectedId
                            case 'class':
                              return s.classId === selectedId
                            case 'room':
                              return s.roomId === selectedId
                            default:
                              return true
                          }
                        }).length}{' '}
                    sessions
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning for invalid selection */}
          {!isValidSelection && (
            <Card className="bg-red-500/10 border-red-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Please select a {scope} to export</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/20">
          <div className="text-sm text-white/70">
            Export will download automatically to your default downloads folder
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="default"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>

            <Button
              onClick={handleExport}
              disabled={!isValidSelection || exporting}
              className="bg-lime-500 hover:bg-lime-600 text-black"
            >
              {exporting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-black border-t-transparent rounded-full mr-2"
                  />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export Schedule
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
