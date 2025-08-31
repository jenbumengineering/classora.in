import React from 'react'
import { render, screen } from '@testing-library/react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'

// Mock the providers
jest.mock('@/components/providers/SettingsProvider', () => ({
  useSettings: () => ({
    settings: { siteName: 'Test Site' }
  })
}))

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard'
}))

describe('DashboardSidebar', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    userRole: 'PROFESSOR',
    isCollapsed: false,
    onToggleCollapse: jest.fn()
  }

  it('renders all navigation items for professor', () => {
    render(<DashboardSidebar {...defaultProps} />)

    // Check that all professor navigation items are rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Classes')).toBeInTheDocument()
    expect(screen.getByText('Notes')).toBeInTheDocument()
    expect(screen.getByText('Assignments')).toBeInTheDocument()
    expect(screen.getByText('Quizzes')).toBeInTheDocument()
    expect(screen.getByText('Practice')).toBeInTheDocument()
    expect(screen.getByText('Attendance')).toBeInTheDocument()
    expect(screen.getByText('Students')).toBeInTheDocument()
    expect(screen.getByText('Calendar')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders all navigation items for student', () => {
    render(<DashboardSidebar {...defaultProps} userRole="STUDENT" />)

    // Check that all student navigation items are rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Classes')).toBeInTheDocument()
    expect(screen.getByText('Notes')).toBeInTheDocument()
    expect(screen.getByText('Assignments')).toBeInTheDocument()
    expect(screen.getByText('Quizzes')).toBeInTheDocument()
    expect(screen.getByText('Practice')).toBeInTheDocument()
    expect(screen.getByText('Attendance')).toBeInTheDocument()
    expect(screen.getByText('Calendar')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('has scrollable navigation section', () => {
    render(<DashboardSidebar {...defaultProps} />)

    const navElement = screen.getByRole('navigation')
    expect(navElement).toHaveClass('overflow-y-auto')
    expect(navElement).toHaveClass('overflow-x-hidden')
  })

  it('has fixed header and footer sections', () => {
    render(<DashboardSidebar {...defaultProps} />)

    // The header and footer should have flex-shrink-0 class
    const header = document.querySelector('.flex-shrink-0')
    expect(header).toBeInTheDocument()
  })

  it('shows quick actions for professors when not collapsed', () => {
    render(<DashboardSidebar {...defaultProps} />)

    expect(screen.getByText('Quick Actions')).toBeInTheDocument()
    expect(screen.getByText('Create Class')).toBeInTheDocument()
    expect(screen.getByText('New Note')).toBeInTheDocument()
    expect(screen.getByText('New Quiz')).toBeInTheDocument()
  })

  it('hides quick actions when collapsed', () => {
    render(<DashboardSidebar {...defaultProps} isCollapsed={true} />)

    expect(screen.queryByText('Quick Actions')).not.toBeInTheDocument()
    expect(screen.queryByText('Create Class')).not.toBeInTheDocument()
  })

  it('hides quick actions for students', () => {
    render(<DashboardSidebar {...defaultProps} userRole="STUDENT" />)

    expect(screen.queryByText('Quick Actions')).not.toBeInTheDocument()
    expect(screen.queryByText('Create Class')).not.toBeInTheDocument()
  })

  it('renders with correct width when collapsed', () => {
    render(<DashboardSidebar {...defaultProps} isCollapsed={true} />)

    const sidebar = document.querySelector('.w-16')
    expect(sidebar).toBeInTheDocument()
  })

  it('renders with correct width when expanded', () => {
    render(<DashboardSidebar {...defaultProps} isCollapsed={false} />)

    const sidebar = document.querySelector('.w-64')
    expect(sidebar).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<DashboardSidebar {...defaultProps} />)

    const navElement = screen.getByRole('navigation')
    expect(navElement).toBeInTheDocument()

    // Check that all navigation links are accessible
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
  })
})
