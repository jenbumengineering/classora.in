# ResizableTable Component

The `ResizableTable` component is a reusable table component that provides column resizing and show/hide functionality for the notes, assignments, and quizzes pages in both professor and student dashboards.

## Features

- **Column Resizing**: Users can drag column borders to resize columns
- **Column Visibility**: Users can show/hide columns using the settings dropdown
- **Responsive Design**: Works well on different screen sizes
- **Dark Mode Support**: Fully supports dark mode theme
- **Custom Cell Rendering**: Supports custom render functions for cell content
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Usage

```tsx
import { ResizableTable, Column } from '@/components/ui/ResizableTable'

const columns: Column[] = [
  {
    key: 'name',
    label: 'Name',
    width: 200,
    minWidth: 100,
    maxWidth: 400,
    visible: true,
    render: (value, row) => <span>{value.toUpperCase()}</span>
  },
  {
    key: 'email',
    label: 'Email',
    width: 250,
    minWidth: 150,
    maxWidth: 500,
    visible: true
  }
]

const data = [
  { name: 'John Doe', email: 'john@example.com' },
  { name: 'Jane Smith', email: 'jane@example.com' }
]

function MyComponent() {
  return (
    <ResizableTable
      columns={columns}
      data={data}
      title="Users List"
      description="5 users found"
      onColumnVisibilityChange={(updatedColumns) => {
        console.log('Columns updated:', updatedColumns)
      }}
    />
  )
}
```

## Column Configuration

Each column can be configured with the following properties:

- `key`: Unique identifier for the column (should match data property)
- `label`: Display name for the column header
- `width`: Initial width in pixels (default: 150)
- `minWidth`: Minimum width in pixels (default: 100)
- `maxWidth`: Maximum width in pixels (default: 400)
- `visible`: Whether the column is visible (default: true)
- `sortable`: Whether the column is sortable (future feature)
- `render`: Custom render function for cell content

## Props

- `columns`: Array of column configurations
- `data`: Array of data objects to display
- `title`: Optional table title
- `description`: Optional table description
- `onColumnVisibilityChange`: Optional callback when column visibility changes
- `className`: Optional CSS class name

## Implementation Details

### Column Resizing
- Users can drag the right border of any column header to resize it
- Resizing respects min/max width constraints
- Visual feedback shows the resize handle on hover
- Text selection is disabled during resize operations

### Column Visibility
- Settings button (gear icon) opens a dropdown with column visibility options
- Individual checkboxes for each column
- "Show All" and "Hide All" buttons for bulk operations
- Dropdown closes when clicking outside
- Changes are applied immediately

### Styling
- Uses Tailwind CSS for styling
- Supports both light and dark themes
- Responsive design with horizontal scrolling
- Custom scrollbar styling for the settings dropdown

## Browser Support

- Modern browsers with CSS Grid support
- Touch devices supported for column resizing
- Keyboard navigation support

## Performance

- Efficient rendering with React hooks
- Minimal re-renders during resize operations
- Optimized event handling for mouse interactions

## Accessibility

- Proper ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader friendly
- High contrast support in both themes
