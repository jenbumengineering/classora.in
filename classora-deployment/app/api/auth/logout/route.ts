import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Clear session cookie
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    )
    
    // Clear the session cookie
    response.cookies.delete('user-id')
    
    return response
    
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 