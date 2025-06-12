import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { GeneratedSchedule, ScheduleSession, Room, Teacher, Class } from '@shared/types/database'

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json'
export type ExportScope = 'all' | 'teacher' | 'class' | 'room'

export interface ExportOptions {
  format: ExportFormat
  scope: ExportScope
  selectedId?: number
  selectedName?: string
  includeConflicts?: boolean
  includeMetadata?: boolean
}

export class ScheduleExporter {
  private schedule: GeneratedSchedule
  private rooms: Room[]
  private teachers: Teacher[]
  private classes: Class[]

  constructor(schedule: GeneratedSchedule, rooms: Room[], teachers: Teacher[], classes: Class[]) {
    this.schedule = schedule
    this.rooms = rooms
    this.teachers = teachers
    this.classes = classes
  }

  async export(options: ExportOptions): Promise<void> {
    const data = this.prepareData(options)

    switch (options.format) {
      case 'pdf':
        await this.exportToPDF(data, options)
        break
      case 'excel':
        this.exportToExcel(data, options)
        break
      case 'csv':
        this.exportToCSV(data, options)
        break
      case 'json':
        this.exportToJSON(data, options)
        break
    }
  }

  private prepareData(options: ExportOptions) {
    if (options.scope === 'all') {
      // For 'all' scope, prepare data for every teacher, class, and room
      return this.prepareBulkData(options)
    } else {
      // For specific scope, prepare data for selected entity
      return this.prepareSpecificData(options)
    }
  }

  private prepareBulkData(options: ExportOptions) {
    const allTables: any[] = []

    // Generate table for each teacher
    this.teachers.forEach((teacher) => {
      const teacherSessions = this.schedule.sessions.filter((s) => s.teacherId === teacher.id)
      if (teacherSessions.length > 0) {
        const table = this.generateScheduleTable(
          teacherSessions,
          'teacher',
          `${teacher.first_name} ${teacher.last_name}`
        )
        allTables.push({
          type: 'teacher',
          title: `Teacher: ${teacher.first_name} ${teacher.last_name}`,
          table,
          sessions: teacherSessions
        })
      }
    })

    // Generate table for each class
    this.classes.forEach((classItem) => {
      const classSessions = this.schedule.sessions.filter((s) => s.classId === classItem.id)
      if (classSessions.length > 0) {
        const table = this.generateScheduleTable(classSessions, 'class', classItem.name)
        allTables.push({
          type: 'class',
          title: `Class: ${classItem.name}`,
          table,
          sessions: classSessions
        })
      }
    })

    // Generate table for each room
    this.rooms.forEach((room) => {
      const roomSessions = this.schedule.sessions.filter((s) => s.roomId === room.id)
      if (roomSessions.length > 0) {
        const table = this.generateScheduleTable(roomSessions, 'room', room.name)
        allTables.push({
          type: 'room',
          title: `Room: ${room.name}`,
          table,
          sessions: roomSessions
        })
      }
    })

    return {
      tables: allTables,
      metadata: {
        title: 'ClassSync Complete Schedule Export',
        generatedAt: new Date().toLocaleString(),
        totalSessions: this.schedule.sessions.length,
        conflicts: options.includeConflicts ? this.schedule.conflicts : [],
        scope: options.scope
      }
    }
  }

  private prepareSpecificData(options: ExportOptions) {
    let sessions = this.schedule.sessions
    let entityName = ''

    // Filter sessions based on scope
    if (options.selectedId) {
      sessions = sessions.filter((session) => {
        switch (options.scope) {
          case 'teacher':
            return session.teacherId === options.selectedId
          case 'class':
            return session.classId === options.selectedId
          case 'room':
            return session.roomId === options.selectedId
          default:
            return true
        }
      })
      entityName = options.selectedName || ''
    }

    const table = this.generateScheduleTable(sessions, options.scope, entityName)

    return {
      tables: [
        {
          type: options.scope,
          title: this.getExportTitle(options),
          table,
          sessions
        }
      ],
      metadata: {
        title: this.getExportTitle(options),
        generatedAt: new Date().toLocaleString(),
        totalSessions: sessions.length,
        conflicts: options.includeConflicts ? this.schedule.conflicts : [],
        scope: options.scope,
        selectedName: options.selectedName
      }
    }
  }

  private generateScheduleTable(sessions: ScheduleSession[], scope: string, entityName: string) {
    // Get all unique time slots from the sessions and sort them properly
    const timeSlotSet = new Set<string>()
    sessions.forEach((s) => {
      const timeSlot = `${s.timeSlot.startTime.toString().padStart(2, '0')}-${s.timeSlot.endTime.toString().padStart(2, '0')}`
      timeSlotSet.add(timeSlot)
    })

    const timeSlots = Array.from(timeSlotSet).sort((a, b) => {
      const [startA] = a.split('-').map(Number)
      const [startB] = b.split('-').map(Number)
      return startA - startB
    })

    // Use short day names
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    const dayMapping = {
      Monday: 'Mon',
      Tuesday: 'Tue',
      Wednesday: 'Wed',
      Thursday: 'Thu',
      Friday: 'Fri'
    }

    const scheduleTable = days.map((shortDay) => {
      const dayRow: any = { Day: shortDay }

      timeSlots.forEach((timeSlot) => {
        const [startTime, endTime] = timeSlot.split('-').map(Number)

        // Find the full day name for filtering sessions
        const fullDay = Object.keys(dayMapping).find(
          (key) => dayMapping[key as keyof typeof dayMapping] === shortDay
        )

        const sessionsAtTime = sessions.filter(
          (s) => s.timeSlot.day === fullDay && s.timeSlot.startTime === startTime
        )

        if (sessionsAtTime.length > 0) {
          // Format the content based on scope with better structure
          dayRow[timeSlot] = sessionsAtTime
            .map((s) => {
              switch (scope) {
                case 'teacher':
                  return `${s.courseName} - (${s.className}) - Room ${s.roomName}`
                case 'class':
                  return `${s.courseName} - ${s.teacherName} - Room ${s.roomName}`
                case 'room':
                  return `${s.courseName} - (${s.className}) - ${s.teacherName}`
                default:
                  return `${s.courseName} - (${s.className}) - ${s.teacherName} - Room ${s.roomName}`
              }
            })
            .join('\n')
        } else {
          dayRow[timeSlot] = ''
        }
      })
      return dayRow
    })

    return {
      data: scheduleTable,
      timeSlots,
      entityName
    }
  }

  private getExportTitle(options: ExportOptions): string {
    const baseTitle = 'ClassSync Schedule Export'

    switch (options.scope) {
      case 'teacher':
        return `${baseTitle} - Teacher: ${options.selectedName}`
      case 'class':
        return `${baseTitle} - Class: ${options.selectedName}`
      case 'room':
        return `${baseTitle} - Room: ${options.selectedName}`
      default:
        return `${baseTitle} - Complete Schedule`
    }
  }

  // src/renderer/src/lib/utils/exportSchedule.ts
  // Update the exportToPDF and renderPDFTable methods

  private async exportToPDF(data: any, options: ExportOptions): Promise<void> {
    const pdf = new jsPDF('landscape', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.width
    const pageHeight = pdf.internal.pageSize.height

    // Set default colors to ensure everything is visible
    pdf.setTextColor(0, 0, 0) // BLACK text by default
    pdf.setDrawColor(0, 0, 0) // BLACK lines by default
    pdf.setFillColor(255, 255, 255) // WHITE fill by default

    // Title page
    pdf.setFontSize(22)
    pdf.setFont('helvetica', 'bold')
    pdf.text(data.metadata.title, pageWidth / 2, 40, { align: 'center' })

    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Generated: ${data.metadata.generatedAt}`, pageWidth / 2, 55, { align: 'center' })
    pdf.text(`Total Sessions: ${data.metadata.totalSessions}`, pageWidth / 2, 65, {
      align: 'center'
    })

    // Add a separator line
    pdf.setLineWidth(1)
    pdf.line(50, 75, pageWidth - 50, 75)

    // Generate each table - ALL tables start on separate pages
    for (let i = 0; i < data.tables.length; i++) {
      const tableData = data.tables[i]

      // Add new page for EVERY table (including the first one)
      pdf.addPage()
      // Reset colors on new page
      pdf.setTextColor(0, 0, 0)
      pdf.setDrawColor(0, 0, 0)
      pdf.setFillColor(255, 255, 255)

      this.renderPDFTable(pdf, tableData, pageWidth, pageHeight, 20) // Always start at y=20
    }

    // Conflicts section
    if (options.includeConflicts && data.metadata.conflicts.length > 0) {
      pdf.addPage()
      pdf.setTextColor(0, 0, 0) // Ensure black text
      let yPosition = 20

      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Schedule Conflicts', 20, yPosition)
      yPosition += 15

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      data.metadata.conflicts.forEach((conflict: any) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage()
          pdf.setTextColor(0, 0, 0) // Reset color on new page
          yPosition = 20
        }
        const lines = pdf.splitTextToSize(`• ${conflict.message}`, pageWidth - 40)
        pdf.text(lines, 25, yPosition)
        yPosition += lines.length * 6
      })
    }

    // Save the PDF
    const filename = `${this.sanitizeFilename(data.metadata.title)}.pdf`
    pdf.save(filename)
  }

  private renderPDFTable(
    pdf: jsPDF,
    tableData: any,
    pageWidth: number,
    pageHeight: number,
    startY: number
  ) {
    const { table, title } = tableData
    let yPosition = startY

    // Table title with better styling
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0) // BLACK text
    pdf.text(title, 20, yPosition)

    // Add a line under the title
    pdf.setLineWidth(0.5)
    pdf.setDrawColor(0, 0, 0) // BLACK line
    pdf.line(20, yPosition + 2, pageWidth - 20, yPosition + 2)
    yPosition += 20

    // Table setup with SMALLER cell height
    const cellHeight = 12 // Reduced from 20 to 12 for better text-to-cell ratio
    const dayWidth = 25
    const availableWidth = pageWidth - dayWidth - 40
    const timeSlotWidth = Math.max(50, availableWidth / table.timeSlots.length)

    // Function to draw header (reusable for new pages)
    const drawHeader = (y: number) => {
      // Set header styling - WHITE background like Day column
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10)
      pdf.setFillColor(255, 255, 255) // WHITE background
      pdf.setTextColor(0, 0, 0) // BLACK text
      pdf.setDrawColor(0, 0, 0) // BLACK borders
      pdf.setLineWidth(0.8)

      // Day header cell
      pdf.rect(20, y, dayWidth, cellHeight, 'FD') // Fill and Draw borders
      pdf.text('Day', 20 + dayWidth / 2, y + cellHeight / 2 + 2, { align: 'center' })

      // Time slot header cells - same styling as Day column
      table.timeSlots.forEach((timeSlot: string, index: number) => {
        const x = 20 + dayWidth + index * timeSlotWidth
        pdf.setFillColor(255, 255, 255) // WHITE background
        pdf.rect(x, y, timeSlotWidth, cellHeight, 'FD')

        // Format time display (09-11 becomes 09:00-11:00)
        const [start, end] = timeSlot.split('-')
        const displayTime = `${start}:00-${end}:00`

        pdf.setTextColor(0, 0, 0) // BLACK text
        pdf.text(displayTime, x + timeSlotWidth / 2, y + cellHeight / 2 + 2, { align: 'center' })
      })
    }

    // Draw initial header
    drawHeader(yPosition)
    yPosition += cellHeight

    // Data rows with WHITE backgrounds like Day column
    pdf.setLineWidth(0.5)
    pdf.setDrawColor(0, 0, 0) // BLACK borders

    table.data.forEach((row: any, rowIndex: number) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 50) {
        // Adjusted for smaller cell height
        pdf.addPage()
        yPosition = 20

        // Redraw header on new page
        drawHeader(yPosition)
        yPosition += cellHeight
      }

      // Day cell - reference styling (WHITE background, BLACK text)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10)
      pdf.setFillColor(255, 255, 255) // WHITE background like Day column
      pdf.setTextColor(0, 0, 0) // BLACK text like Day column
      pdf.rect(20, yPosition, dayWidth, cellHeight, 'FD')
      pdf.text(row.Day, 20 + dayWidth / 2, yPosition + cellHeight / 2 + 2, { align: 'center' })

      // Time slot cells with same styling as Day column
      table.timeSlots.forEach((timeSlot: string, index: number) => {
        const x = 20 + dayWidth + index * timeSlotWidth

        // Use SAME styling as Day column
        pdf.setFillColor(255, 255, 255) // WHITE background like Day column
        pdf.rect(x, yPosition, timeSlotWidth, cellHeight, 'FD')

        const content = row[timeSlot] || ''
        if (content) {
          // Split content into parts for better formatting with adjusted spacing
          const sessions = content.split('\n')
          let textY = yPosition + 3 // Reduced starting padding for smaller cells

          sessions.forEach((session: string) => {
            if (textY > yPosition + cellHeight - 2) return // Don't overflow cell

            // Parse the session content to format it better
            const parts = session.split(' - ')

            if (parts.length >= 2) {
              // Course name (larger, bold) - BLACK text like Day column
              pdf.setFont('helvetica', 'bold')
              pdf.setFontSize(7) // Reduced from 8 to 7 for smaller cells
              pdf.setTextColor(0, 0, 0) // BLACK text like Day column
              const courseText = pdf.splitTextToSize(parts[0], timeSlotWidth - 4)
              pdf.text(courseText[0] || parts[0], x + 2, textY)
              textY += 3 // Reduced line spacing

              // Additional info (smaller, normal) - BLACK text like Day column
              pdf.setFont('helvetica', 'normal')
              pdf.setFontSize(6) // Reduced from 7 to 6 for smaller cells
              pdf.setTextColor(0, 0, 0) // BLACK text like Day column (not gray!)

              for (let i = 1; i < parts.length && textY <= yPosition + cellHeight - 2; i++) {
                const infoText = pdf.splitTextToSize(parts[i], timeSlotWidth - 4)
                pdf.text(infoText[0] || parts[i], x + 2, textY)
                textY += 2.5 // Reduced line spacing
              }

              textY += 1 // Reduced space between sessions
            } else {
              // Fallback for simple content - BLACK text like Day column
              pdf.setFont('helvetica', 'normal')
              pdf.setFontSize(6) // Reduced font size for smaller cells
              pdf.setTextColor(0, 0, 0) // BLACK text like Day column
              const lines = pdf.splitTextToSize(session, timeSlotWidth - 4)
              lines.slice(0, 2).forEach((line: string) => {
                if (textY <= yPosition + cellHeight - 2) {
                  pdf.text(line, x + 2, textY)
                  textY += 2.5
                }
              })
            }
          })
        }
      })

      yPosition += cellHeight
    })
  }

  private exportToExcel(data: any, options: ExportOptions): void {
    const workbook = XLSX.utils.book_new()

    if (options.scope === 'all') {
      // For bulk export, organize by entity type
      this.createBulkExcelSheets(workbook, data)
    } else {
      // For single entity export, create a simple sheet
      this.createSingleEntityExcelSheet(workbook, data)
    }

    // Combined sessions detail sheet
    const allSessions = data.tables.flatMap((t: any) => t.sessions)
    const sessionsData = allSessions.map((session: ScheduleSession) => ({
      Day: session.timeSlot.day,
      Time: this.formatTimeSlotForExcel(session.timeSlot.startTime, session.timeSlot.endTime),
      Course: session.courseName,
      Type: session.type,
      Class: session.className,
      Teacher: session.teacherName,
      Room: session.roomName,
      Duration: `${session.timeSlot.duration}h`,
      Grouped: session.isGrouped ? 'Yes' : 'No'
    }))

    const sessionsSheet = XLSX.utils.json_to_sheet(sessionsData)
    XLSX.utils.book_append_sheet(workbook, sessionsSheet, 'All Sessions')

    // Statistics sheet
    const stats = this.generateStatistics(allSessions)
    const statsSheet = XLSX.utils.json_to_sheet(stats)
    XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistics')

    // Conflicts sheet (if included)
    if (options.includeConflicts && data.metadata.conflicts.length > 0) {
      const conflictsData = data.metadata.conflicts.map((conflict: any, index: number) => ({
        ID: index + 1,
        Type: conflict.type || 'General',
        Message: conflict.message,
        Severity: conflict.severity || 'Medium'
      }))

      const conflictsSheet = XLSX.utils.json_to_sheet(conflictsData)
      XLSX.utils.book_append_sheet(workbook, conflictsSheet, 'Conflicts')
    }

    // Save the workbook
    const filename = `${this.sanitizeFilename(data.metadata.title)}.xlsx`
    XLSX.writeFile(workbook, filename)
  }

  private createBulkExcelSheets(workbook: any, data: any): void {
    // Group tables by type
    const teacherTables = data.tables.filter((t: any) => t.type === 'teacher')
    const classTables = data.tables.filter((t: any) => t.type === 'class')
    const roomTables = data.tables.filter((t: any) => t.type === 'room')

    // Create Teacher Schedules sheet
    if (teacherTables.length > 0) {
      const teacherSheetData = this.createCombinedSheetData(teacherTables, 'Teacher Schedules')
      const teacherSheet = XLSX.utils.aoa_to_sheet(teacherSheetData)

      // Set column widths for better readability
      teacherSheet['!cols'] = [
        { width: 15 }, // Entity name
        { width: 8 }, // Day
        { width: 12 }, // Time slots...
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 12 }
      ]

      XLSX.utils.book_append_sheet(workbook, teacherSheet, 'Teacher Schedules')
    }

    // Create Class Schedules sheet
    if (classTables.length > 0) {
      const classSheetData = this.createCombinedSheetData(classTables, 'Class Schedules')
      const classSheet = XLSX.utils.aoa_to_sheet(classSheetData)

      classSheet['!cols'] = [
        { width: 15 }, // Entity name
        { width: 8 }, // Day
        { width: 12 }, // Time slots...
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 12 }
      ]

      XLSX.utils.book_append_sheet(workbook, classSheet, 'Class Schedules')
    }

    // Create Room Schedules sheet
    if (roomTables.length > 0) {
      const roomSheetData = this.createCombinedSheetData(roomTables, 'Room Schedules')
      const roomSheet = XLSX.utils.aoa_to_sheet(roomSheetData)

      roomSheet['!cols'] = [
        { width: 15 }, // Entity name
        { width: 8 }, // Day
        { width: 12 }, // Time slots...
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 12 }
      ]

      XLSX.utils.book_append_sheet(workbook, roomSheet, 'Room Schedules')
    }
  }

  private createSingleEntityExcelSheet(workbook: any, data: any): void {
    // For single entity export, create a simple table
    if (data.tables.length > 0) {
      const tableData = data.tables[0]
      const sheet = XLSX.utils.json_to_sheet(tableData.table.data)

      // Set column widths
      sheet['!cols'] = [
        { width: 8 }, // Day
        { width: 20 }, // Time slots with wider columns for content
        { width: 20 },
        { width: 20 },
        { width: 20 },
        { width: 20 },
        { width: 20 },
        { width: 20 },
        { width: 20 }
      ]

      const sheetName = this.sanitizeSheetName(tableData.title)
      XLSX.utils.book_append_sheet(workbook, sheet, sheetName)
    }
  }

  private createCombinedSheetData(tables: any[], sheetTitle: string): any[][] {
    const sheetData: any[][] = []

    // Add sheet title
    sheetData.push([sheetTitle])
    sheetData.push([]) // Empty row

    tables.forEach((tableData: any, tableIndex: number) => {
      // Add table title
      sheetData.push([tableData.title])

      // Get all unique time slots across all tables for consistent headers
      const allTimeSlots = new Set<string>()
      tables.forEach((t) => {
        t.table.timeSlots.forEach((slot: string) => allTimeSlots.add(slot))
      })
      const sortedTimeSlots = Array.from(allTimeSlots).sort((a, b) => {
        const [startA] = a.split('-').map(Number)
        const [startB] = b.split('-').map(Number)
        return startA - startB
      })

      // Create header row
      const headerRow = [
        'Entity',
        'Day',
        ...sortedTimeSlots.map((slot) => {
          const [start, end] = slot.split('-')
          return `${start}:00-${end}:00`
        })
      ]
      sheetData.push(headerRow)

      // Add data rows for this table
      const entityName = tableData.title.split(': ')[1] || tableData.title

      tableData.table.data.forEach((row: any) => {
        const dataRow = [entityName, row.Day]

        // Add cell content for each time slot
        sortedTimeSlots.forEach((timeSlot) => {
          const content = row[timeSlot] || ''
          // Clean up the content for Excel (remove line breaks, make it more readable)
          const cleanContent = content.replace(/\n/g, '; ').replace(/\s+/g, ' ').trim()
          dataRow.push(cleanContent)
        })

        sheetData.push(dataRow)
      })

      // Add separator rows between tables (except for the last table)
      if (tableIndex < tables.length - 1) {
        sheetData.push([]) // Empty row
        sheetData.push([]) // Another empty row for better separation
      }
    })

    return sheetData
  }

  private formatTimeSlotForExcel(startTime: number, endTime: number): string {
    const formatHour = (hour: number) => hour.toString().padStart(2, '0')
    return `${formatHour(startTime)}:00-${formatHour(endTime)}:00`
  }

  private exportToCSV(data: any, options: ExportOptions): void {
    // For CSV, combine all sessions from all tables
    const allSessions = data.tables.flatMap((t: any) => t.sessions)
    const sessionsData = allSessions.map((session: ScheduleSession) => ({
      Day: session.timeSlot.day,
      Time: `${session.timeSlot.startTime}:00-${session.timeSlot.endTime}:00`,
      Course: session.courseName,
      Type: session.type,
      Class: session.className,
      Teacher: session.teacherName,
      Room: session.roomName,
      Duration: `${session.timeSlot.duration}h`,
      Grouped: session.isGrouped ? 'Yes' : 'No'
    }))

    const csv = this.convertToCSV(sessionsData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const filename = `${this.sanitizeFilename(data.metadata.title)}.csv`
    saveAs(blob, filename)
  }

  private exportToJSON(data: any, options: ExportOptions): void {
    const exportData = {
      metadata: data.metadata,
      tables: data.tables.map((t: any) => ({
        type: t.type,
        title: t.title,
        schedule: t.table.data,
        sessions: t.sessions
      })),
      ...(options.includeConflicts && { conflicts: data.metadata.conflicts }),
      ...(options.includeMetadata && { scheduleMetadata: this.schedule.metadata })
    }

    const json = JSON.stringify(exportData, null, 2)
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
    const filename = `${this.sanitizeFilename(data.metadata.title)}.json`
    saveAs(blob, filename)
  }

  private generateStatistics(sessions: ScheduleSession[]) {
    const teacherHours = new Map<string, number>()
    const classHours = new Map<string, number>()
    const roomUtilization = new Map<string, number>()
    const dayDistribution = new Map<string, number>()

    sessions.forEach((session) => {
      // Teacher hours
      const teacherKey = session.teacherName
      teacherHours.set(teacherKey, (teacherHours.get(teacherKey) || 0) + session.timeSlot.duration)

      // Class hours
      const classKey = session.className
      classHours.set(classKey, (classHours.get(classKey) || 0) + session.timeSlot.duration)

      // Room utilization
      const roomKey = session.roomName
      roomUtilization.set(roomKey, (roomUtilization.get(roomKey) || 0) + session.timeSlot.duration)

      // Day distribution
      const dayKey = session.timeSlot.day
      dayDistribution.set(dayKey, (dayDistribution.get(dayKey) || 0) + 1)
    })

    const stats = [
      { Category: 'Overview', Item: 'Total Sessions', Value: sessions.length },
      {
        Category: 'Overview',
        Item: 'Total Hours',
        Value: sessions.reduce((sum, s) => sum + s.timeSlot.duration, 0)
      },
      {
        Category: 'Overview',
        Item: 'Grouped Sessions',
        Value: sessions.filter((s) => s.isGrouped).length
      },
      ...Array.from(teacherHours.entries()).map(([teacher, hours]) => ({
        Category: 'Teacher Hours',
        Item: teacher,
        Value: `${hours}h`
      })),
      ...Array.from(classHours.entries()).map(([className, hours]) => ({
        Category: 'Class Hours',
        Item: className,
        Value: `${hours}h`
      })),
      ...Array.from(roomUtilization.entries()).map(([room, hours]) => ({
        Category: 'Room Utilization',
        Item: room,
        Value: `${hours}h`
      })),
      ...Array.from(dayDistribution.entries()).map(([day, count]) => ({
        Category: 'Day Distribution',
        Item: day,
        Value: `${count} sessions`
      }))
    ]

    return stats
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return ''

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
          })
          .join(',')
      )
    ].join('\n')

    return csvContent
  }

  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  }

  private sanitizeSheetName(sheetName: string): string {
    // Excel sheet names have specific requirements
    return sheetName.replace(/[\/\\\?\*\[\]]/g, '_').substring(0, 31)
  }
}
