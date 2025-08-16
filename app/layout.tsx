import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { SettingsProvider } from '@/components/providers/SettingsProvider'
import { UserSettingsProvider } from '@/components/providers/UserSettingsProvider'
import { NotificationProvider } from '@/components/providers/NotificationProvider'
import { AdminDataProvider } from '@/components/providers/AdminDataProvider'
import { MaintenanceMode } from '@/components/MaintenanceMode'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Classora.in - Educational Platform',
  description: 'A comprehensive educational platform for professors and students with notes, quizzes, and assignments.',
  keywords: ['education', 'learning', 'quizzes', 'assignments', 'practice'],
  authors: [{ name: 'Classora.in Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#3b82f6' },
    ],
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SettingsProvider>
            <UserSettingsProvider>
              <NotificationProvider>
                <AdminDataProvider>
                  {children}
                  <MaintenanceMode />
                  <Toaster 
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: '#363636',
                        color: '#fff',
                      },
                      success: {
                        duration: 3000,
                        iconTheme: {
                          primary: '#22c55e',
                          secondary: '#fff',
                        },
                      },
                      error: {
                        duration: 5000,
                        iconTheme: {
                          primary: '#ef4444',
                          secondary: '#fff',
                        },
                      },
                    }}
                  />
                </AdminDataProvider>
              </NotificationProvider>
            </UserSettingsProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  )
} 