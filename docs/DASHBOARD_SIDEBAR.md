# Dashboard Sidebar

The Dashboard Sidebar component provides navigation for both professor and student dashboards with responsive design and scrollable navigation.

## Features

- **Responsive Design**: Adapts to different screen sizes
- **Scrollable Navigation**: All menu items are accessible on smaller devices
- **Collapsible**: Can be collapsed to save space on larger screens
- **Role-based Navigation**: Different menu items for professors and students
- **Quick Actions**: Professor-specific quick action buttons
- **Dark Mode Support**: Fully supports dark mode theme
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Navigation Items

### Professor Navigation
- Dashboard
- Classes
- Notes
- Assignments
- Quizzes
- Practice
- Attendance
- Students
- Calendar
- Analytics
- Settings

### Student Navigation
- Dashboard
- Classes
- Notes
- Assignments
- Quizzes
- Practice
- Attendance
- Calendar
- Settings

## Scrolling Behavior

### Desktop/Larger Screens
- Navigation section is scrollable when content overflows
- Header and footer remain fixed
- Quick actions section (for professors) remains fixed
- Custom styled scrollbar for better visual integration

### Mobile/Smaller Screens
- Navigation section is scrollable to access all menu items
- Scrollbar is hidden for cleaner mobile experience
- Touch scrolling works naturally
- All navigation items remain accessible

## Layout Structure

```
┌─────────────────────────────────┐
│           Header (Fixed)        │
├─────────────────────────────────┤
│                                 │
│      Navigation (Scrollable)    │
│                                 │
│  • Dashboard                    │
│  • Classes                      │
│  • Notes                        │
│  • Assignments                  │
│  • Quizzes                      │
│  • Practice                     │
│  • Attendance                   │
│  • Students                     │
│  • Calendar                     │
│  • Analytics                    │
│  • Settings                     │
│                                 │
├─────────────────────────────────┤
│     Quick Actions (Fixed)       │
│  [Create Class] [New Note]      │
│  [New Quiz]                     │
├─────────────────────────────────┤
│           Footer (Fixed)        │
└─────────────────────────────────┘
```

## CSS Classes

### Layout Classes
- `flex-shrink-0`: Prevents header, footer, and quick actions from shrinking
- `flex-1`: Makes navigation section take remaining space
- `overflow-y-auto`: Enables vertical scrolling for navigation
- `overflow-x-hidden`: Prevents horizontal scrolling

### Responsive Classes
- `md:hidden`: Hides elements on medium screens and up
- `hidden md:flex`: Shows elements only on medium screens and up
- `w-16`: Collapsed sidebar width (64px)
- `w-64`: Expanded sidebar width (256px)

## Custom Scrollbar Styling

### Desktop Scrollbar
- Width: 4px
- Rounded corners
- Light gray color with hover effect
- Dark mode support

### Mobile Scrollbar
- Hidden for cleaner mobile experience
- Touch scrolling still works
- No visual scrollbar indicator

## Accessibility

- Proper `nav` role for navigation section
- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly
- High contrast support

## Browser Support

- Modern browsers with CSS Flexbox support
- Touch devices supported
- Mobile browsers with touch scrolling
- Desktop browsers with mouse wheel scrolling

## Performance

- Efficient rendering with React hooks
- Minimal re-renders
- Smooth scrolling performance
- Optimized for mobile devices
