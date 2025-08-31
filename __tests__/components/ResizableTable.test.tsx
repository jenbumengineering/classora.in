import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ResizableTable, Column } from '@/components/ui/ResizableTable'

const mockColumns: Column[] = [
  {
    key: 'name',
    label: 'Name',
    width: 200,
    minWidth: 100,
    maxWidth: 400,
    visible: true
  },
  {
    key: 'email',
    label: 'Email',
    width: 250,
    minWidth: 150,
    maxWidth: 500,
    visible: true
  },
  {
    key: 'status',
    label: 'Status',
    width: 120,
    minWidth: 80,
    maxWidth: 200,
    visible: true
  }
]

const mockData = [
  { name: 'John Doe', email: 'john@example.com', status: 'Active' },
  { name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' }
]

describe('ResizableTable', () => {
  it('renders table with correct columns and data', () => {
    render(
      <ResizableTable
        columns={mockColumns}
        data={mockData}
        title="Test Table"
        description="Test description"
      />
    )

    expect(screen.getByText('Test Table')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })

  it('shows column settings dropdown when settings button is clicked', () => {
    render(
      <ResizableTable
        columns={mockColumns}
        data={mockData}
        title="Test Table"
      />
    )

    const settingsButton = screen.getByRole('button')
    fireEvent.click(settingsButton)

    expect(screen.getByText('Column Visibility')).toBeInTheDocument()
    expect(screen.getByText('Show All')).toBeInTheDocument()
    expect(screen.getByText('Hide All')).toBeInTheDocument()
  })

  it('toggles column visibility when checkbox is clicked', () => {
    render(
      <ResizableTable
        columns={mockColumns}
        data={mockData}
        title="Test Table"
      />
    )

    const settingsButton = screen.getByRole('button')
    fireEvent.click(settingsButton)

    const nameCheckbox = screen.getByLabelText('Name')
    fireEvent.click(nameCheckbox)

    // The Name column should be hidden from the table (but still visible in dropdown)
    const tableHeaders = screen.getAllByRole('columnheader')
    const nameHeader = tableHeaders.find(header => header.textContent?.includes('Name'))
    expect(nameHeader).toBeUndefined()
  })

  it('shows all columns when "Show All" is clicked', () => {
    render(
      <ResizableTable
        columns={mockColumns}
        data={mockData}
        title="Test Table"
      />
    )

    const settingsButton = screen.getByRole('button')
    fireEvent.click(settingsButton)

    // First hide a column
    const nameCheckbox = screen.getByLabelText('Name')
    fireEvent.click(nameCheckbox)

    // Then show all
    const showAllButton = screen.getByText('Show All')
    fireEvent.click(showAllButton)

    // All columns should be visible in the table
    const tableHeaders = screen.getAllByRole('columnheader')
    expect(tableHeaders).toHaveLength(3)
    expect(tableHeaders[0]).toHaveTextContent('Name')
    expect(tableHeaders[1]).toHaveTextContent('Email')
    expect(tableHeaders[2]).toHaveTextContent('Status')
  })

  it('hides all columns when "Hide All" is clicked', () => {
    render(
      <ResizableTable
        columns={mockColumns}
        data={mockData}
        title="Test Table"
      />
    )

    const settingsButton = screen.getByRole('button')
    fireEvent.click(settingsButton)

    const hideAllButton = screen.getByText('Hide All')
    fireEvent.click(hideAllButton)

    // All columns should be hidden from the table
    const tableHeaders = screen.queryAllByRole('columnheader')
    expect(tableHeaders).toHaveLength(0)
  })

  it('renders custom cell content when render function is provided', () => {
    const columnsWithRender: Column[] = [
      {
        key: 'name',
        label: 'Name',
        width: 200,
        render: (value) => <span data-testid="custom-name">{value.toUpperCase()}</span>
      }
    ]

    render(
      <ResizableTable
        columns={columnsWithRender}
        data={[{ name: 'john' }]}
        title="Test Table"
      />
    )

    expect(screen.getByTestId('custom-name')).toBeInTheDocument()
    expect(screen.getByText('JOHN')).toBeInTheDocument()
  })
})
