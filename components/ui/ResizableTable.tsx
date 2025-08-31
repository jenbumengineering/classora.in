'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Settings, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from './Button'
import { Card, CardContent, CardHeader, CardTitle } from './Card'

export interface Column {
  key: string
  label: string
  width?: number
  minWidth?: number
  maxWidth?: number
  visible?: boolean
  sortable?: boolean
  render?: (value: any, row: any) => React.ReactNode
}

interface ResizableTableProps {
  columns: Column[]
  data: any[]
  title?: string
  description?: string
  onColumnVisibilityChange?: (columns: Column[]) => void
  onRowClick?: (row: any) => void
  className?: string
}

export function ResizableTable({
  columns,
  data,
  title,
  description,
  onColumnVisibilityChange,
  onRowClick,
  className = ''
}: ResizableTableProps) {
  const [tableColumns, setTableColumns] = useState<Column[]>(columns.map(col => ({
    ...col,
    width: col.width || 150,
    minWidth: col.minWidth || 100,
    maxWidth: col.maxWidth || 400,
    visible: col.visible !== false
  })))
  
  const [isResizing, setIsResizing] = useState(false)
  const [resizingColumn, setResizingColumn] = useState<number | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)

  const visibleColumns = tableColumns.filter(col => col.visible)

  // Sorting function
  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue)
        return sortConfig.direction === 'asc' ? comparison : -comparison
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        const comparison = aValue.getTime() - bValue.getTime()
        return sortConfig.direction === 'asc' ? comparison : -comparison
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue
        return sortConfig.direction === 'asc' ? comparison : -comparison
      }

      // For other types, convert to string and compare
      const aString = String(aValue)
      const bString = String(bValue)
      const comparison = aString.localeCompare(bString)
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [data, sortConfig])

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        if (current.direction === 'asc') {
          return { key, direction: 'desc' }
        } else {
          return null // Remove sorting
        }
      } else {
        return { key, direction: 'asc' }
      }
    })
  }

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-500" />
      : <ChevronDown className="w-4 h-4 text-blue-500" />
  }

  const handleMouseDown = useCallback((e: React.MouseEvent, columnIndex: number) => {
    e.preventDefault()
    setIsResizing(true)
    setResizingColumn(columnIndex)
    setStartX(e.clientX)
    setStartWidth(tableColumns[columnIndex].width || 150)
    document.body.classList.add('resizing')
  }, [tableColumns])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || resizingColumn === null) return

    const deltaX = e.clientX - startX
    const newWidth = Math.max(
      tableColumns[resizingColumn].minWidth || 100,
      Math.min(
        tableColumns[resizingColumn].maxWidth || 400,
        startWidth + deltaX
      )
    )

    setTableColumns(prev => prev.map((col, index) => 
      index === resizingColumn ? { ...col, width: newWidth } : col
    ))
  }, [isResizing, resizingColumn, startX, startWidth, tableColumns])

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
    setResizingColumn(null)
    document.body.classList.remove('resizing')
  }, [])

  // Handle click outside to close settings dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowColumnSettings(false)
      }
    }

    if (showColumnSettings) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showColumnSettings])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  const toggleColumnVisibility = (columnKey: string) => {
    const updatedColumns = tableColumns.map(col => 
      col.key === columnKey ? { ...col, visible: !col.visible } : col
    )
    setTableColumns(updatedColumns)
    onColumnVisibilityChange?.(updatedColumns)
  }

  const toggleAllColumns = (visible: boolean) => {
    const updatedColumns = tableColumns.map(col => ({ ...col, visible }))
    setTableColumns(updatedColumns)
    onColumnVisibilityChange?.(updatedColumns)
  }

  const getCellValue = (row: any, column: Column) => {
    const value = row[column.key]
    return column.render ? column.render(value, row) : value
  }

  return (
    <Card className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${className}`}>
      {(title || description) && (
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              {title && <CardTitle className="text-gray-900 dark:text-white">{title}</CardTitle>}
              {description && <p className="text-gray-600 dark:text-gray-400 mt-1">{description}</p>}
            </div>
            <div className="relative" ref={settingsRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowColumnSettings(!showColumnSettings)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <Settings className="w-4 h-4" />
              </Button>
              
              {showColumnSettings && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Column Visibility</h4>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAllColumns(true)}
                          className="text-xs"
                        >
                          Show All
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAllColumns(false)}
                          className="text-xs"
                        >
                          Hide All
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {tableColumns.map((column) => (
                        <label key={column.key} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={column.visible}
                            onChange={() => toggleColumnVisibility(column.key)}
                            className="rounded border-gray-300 dark:border-gray-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{column.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent>
        <div className="overflow-x-auto">
          <table ref={tableRef} className="w-full" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                {visibleColumns.map((column, index) => (
                  <th
                    key={column.key}
                    className={`text-left py-4 px-4 font-semibold text-gray-900 dark:text-white relative select-none ${
                      column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors' : ''
                    }`}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <span>{column.label}</span>
                        {column.sortable && getSortIcon(column.key)}
                      </span>
                      {index < visibleColumns.length - 1 && (
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 hover:opacity-50"
                          onMouseDown={(e) => handleMouseDown(e, tableColumns.findIndex(col => col.key === column.key))}
                        />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {visibleColumns.map((column) => (
                    <td
                      key={column.key}
                      className="py-4 px-4 overflow-hidden"
                      style={{ width: column.width }}
                    >
                      <div className="truncate">
                        {getCellValue(row, column)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          
          {sortedData.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>No data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
