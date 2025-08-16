'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ChevronDown, ChevronUp, BookOpen, Users, FileText, Calendar, Settings, Shield, Bell, Mail } from 'lucide-react'
import Link from 'next/link'

interface DocSection {
  title: string
  icon: React.ReactNode
  content: string
  subsections?: { title: string; content: string }[]
}

const documentation: DocSection[] = [
  {
    title: "Getting Started",
    icon: <BookOpen className="w-5 h-5" />,
    content: "Learn the basics of using Classora.in and set up your account.",
    subsections: [
      {
        title: "Account Creation",
        content: "Create your account by visiting the registration page. Choose between Student and Professor roles. Provide your name, email, and create a secure password. Verify your email to activate your account."
      },
      {
        title: "Profile Setup",
        content: "Complete your profile by adding additional information like your institution, department, and profile picture. This helps other users identify you and improves your experience on the platform."
      },
      {
        title: "Dashboard Overview",
        content: "The dashboard is your central hub for all activities. Students see their enrolled classes, upcoming assignments, and progress statistics. Professors see their created classes, student enrollments, and teaching statistics."
      }
    ]
  },
  {
    title: "For Students",
    icon: <Users className="w-5 h-5" />,
    content: "Complete guide for students to make the most of Classora.in.",
    subsections: [
      {
        title: "Enrolling in Classes",
        content: "Browse available classes on the Classes page. Click on a class to view details including description, professor information, and class statistics. Click 'Enroll in Class' to join and access all materials."
      },
      {
        title: "Accessing Course Materials",
        content: "Once enrolled, access notes, assignments, and quizzes from your dashboard. Materials are organized by class and include rich text content, downloadable files, and interactive elements."
      },
      {
        title: "Submitting Assignments",
        content: "Navigate to the assignment in your class. Read the instructions carefully, upload your submission file, and add any required comments. Submit before the deadline to avoid late penalties."
      },
      {
        title: "Taking Quizzes",
        content: "Find quizzes in your class dashboard. Read instructions and time limits before starting. Answer all questions within the time limit. Review your answers before submitting."
      },
      {
        title: "Tracking Progress",
        content: "Monitor your performance through the dashboard. View completed assignments, quiz scores, and overall progress. Use analytics to identify areas for improvement."
      }
    ]
  },
  {
    title: "For Professors",
    icon: <Users className="w-5 h-5" />,
    content: "Comprehensive guide for professors to manage their classes effectively.",
    subsections: [
      {
        title: "Creating Classes",
        content: "Create a new class from your dashboard. Provide a class name, code, description, and select appropriate settings. The class code helps students find and enroll in your class."
      },
      {
        title: "Managing Students",
        content: "View enrolled students, track their progress, and manage enrollments. Send notifications to students and monitor their activity and performance."
      },
      {
        title: "Creating Notes",
        content: "Use the rich text editor to create comprehensive notes. Include text, images, links, and formatted content. Organize notes with clear titles and descriptions."
      },
      {
        title: "Creating Assignments",
        content: "Set up assignments with clear instructions, due dates, and file upload requirements. Specify grading criteria and provide detailed guidelines for students."
      },
      {
        title: "Creating Quizzes",
        content: "Design quizzes with multiple question types including multiple choice, true/false, and essay questions. Set time limits and configure scoring options."
      },
      {
        title: "Grading and Feedback",
        content: "Review student submissions and provide grades and feedback. Use the grading interface to efficiently assess assignments and quiz attempts."
      }
    ]
  },
  {
    title: "Features & Tools",
    icon: <Settings className="w-5 h-5" />,
    content: "Explore all the features and tools available on Classora.in.",
    subsections: [
      {
        title: "Rich Text Editor",
        content: "Create formatted content with our rich text editor. Include headings, lists, links, images, and custom formatting to make your content engaging and readable."
      },
      {
        title: "File Management",
        content: "Upload and manage files including documents, images, and multimedia content. Organize files by class and share them with students easily."
      },
      {
        title: "Notifications",
        content: "Stay updated with real-time notifications for new assignments, quiz results, and important announcements. Configure notification preferences in your settings."
      },
      {
        title: "Calendar Integration",
        content: "View upcoming deadlines, class schedules, and important dates in the integrated calendar. Export events to your personal calendar applications."
      },
      {
        title: "Progress Analytics",
        content: "Track performance with detailed analytics and reports. View trends, identify strengths and weaknesses, and make data-driven decisions."
      }
    ]
  },
  {
    title: "Privacy & Security",
    icon: <Shield className="w-5 h-5" />,
    content: "Learn about our privacy policies and security measures.",
    subsections: [
      {
        title: "Data Protection",
        content: "We implement industry-standard security measures to protect your personal information and academic data. All data is encrypted and stored securely."
      },
      {
        title: "Privacy Settings",
        content: "Control your privacy through account settings. Choose what information is visible to other users and manage your data sharing preferences."
      },
      {
        title: "Account Security",
        content: "Use strong passwords and enable two-factor authentication for enhanced security. Regularly review your account activity and report any suspicious behavior."
      }
    ]
  }
]

export default function DocumentationPage() {
  const [openSections, setOpenSections] = useState<number[]>([])

  const toggleSection = (index: number) => {
    setOpenSections(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Documentation</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comprehensive guides and tutorials to help you master Classora.in
          </p>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Getting Started</h3>
              <p className="text-gray-600 text-sm">New user guide</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Student Guide</h3>
              <p className="text-gray-600 text-sm">Complete student manual</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <FileText className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Professor Guide</h3>
              <p className="text-gray-600 text-sm">Teaching tools guide</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Shield className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Security</h3>
              <p className="text-gray-600 text-sm">Privacy & security info</p>
            </CardContent>
          </Card>
        </div>

        {/* Documentation Sections */}
        <div className="space-y-6">
          {documentation.map((section, index) => (
            <Card key={index}>
              <CardHeader>
                <button
                  onClick={() => toggleSection(index)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-blue-600">
                      {section.icon}
                    </div>
                    <div>
                      <CardTitle>{section.title}</CardTitle>
                      <CardDescription>{section.content}</CardDescription>
                    </div>
                  </div>
                  {openSections.includes(index) ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </CardHeader>
              {openSections.includes(index) && (
                <CardContent>
                  <div className="space-y-6">
                    {section.subsections?.map((subsection, subIndex) => (
                      <div key={subIndex} className="border-l-4 border-blue-200 pl-4">
                        <h4 className="font-semibold text-gray-900 mb-2">{subsection.title}</h4>
                        <p className="text-gray-600">{subsection.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Additional Resources */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Additional Resources</CardTitle>
            <CardDescription>
              Find more help and support resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Bell className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Help Center</h3>
                <p className="text-gray-600 mb-4">Find answers to common questions</p>
                <Button variant="outline" asChild>
                  <Link href="/help">Visit Help Center</Link>
                </Button>
              </div>
              <div className="text-center">
                <Mail className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Contact Support</h3>
                <p className="text-gray-600 mb-4">Get personalized assistance</p>
                <Button variant="outline" asChild>
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>
              <div className="text-center">
                <Calendar className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Updates</h3>
                <p className="text-gray-600 mb-4">Stay updated with new features</p>
                <Button variant="outline" asChild>
                  <a href="mailto:help@classora.in">Subscribe to Updates</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
