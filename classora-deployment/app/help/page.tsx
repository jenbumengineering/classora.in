'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ChevronDown, ChevronUp, Mail, MessageCircle, BookOpen, Users } from 'lucide-react'
import Link from 'next/link'

interface FAQ {
  question: string
  answer: string
}

const faqs: FAQ[] = [
  {
    question: "How do I create an account?",
    answer: "To create an account, click on the 'Register' button on the homepage. Fill in your details including name, email, password, and select your role (Student or Professor). Verify your email to complete the registration process."
  },
  {
    question: "How do I enroll in a class?",
    answer: "Browse available classes on the Classes page. Click on a class to view its details, then click the 'Enroll in Class' button. You'll be automatically enrolled and can access all class materials."
  },
  {
    question: "How do I submit an assignment?",
    answer: "Navigate to the assignment in your class. Click on the assignment title to view details, then click 'Submit Assignment'. Upload your file and add any required comments before submitting."
  },
  {
    question: "How do I take a quiz?",
    answer: "Go to the Quizzes section in your dashboard. Find the quiz you want to take and click 'Take Quiz'. Read the instructions carefully and answer all questions within the time limit."
  },
  {
    question: "How do I create notes for my students?",
    answer: "As a professor, go to the Notes section in your dashboard. Click 'Create Note', select the class, add your content using the rich text editor, and publish it for your students to view."
  },
  {
    question: "How do I track my progress?",
    answer: "Students can view their progress in the Dashboard. This includes completed assignments, quiz scores, and overall performance metrics for each enrolled class."
  },
  {
    question: "What if I forget my password?",
    answer: "Click on the 'Forgot Password' link on the login page. Enter your email address and follow the instructions sent to your email to reset your password."
  },
  {
    question: "How do I contact support?",
    answer: "You can contact our support team by emailing help@classora.in or using the contact form on our Contact Us page. We typically respond within 24 hours."
  }
]

export default function HelpPage() {
  const [openFaqs, setOpenFaqs] = useState<number[]>([])

  const toggleFaq = (index: number) => {
    setOpenFaqs(prev => 
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions and get the support you need to make the most of Classora.in
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Mail className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Email Support</h3>
              <p className="text-gray-600 mb-4">Get help via email</p>
              <a href="mailto:help@classora.in" className="text-blue-600 hover:text-blue-800 font-medium">
                help@classora.in
              </a>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <MessageCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Contact Us</h3>
              <p className="text-gray-600 mb-4">Send us a message</p>
              <Link href="/contact" className="text-green-600 hover:text-green-800 font-medium">
                Contact Form
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <BookOpen className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Documentation</h3>
              <p className="text-gray-600 mb-4">Detailed guides</p>
              <Link href="/docs" className="text-purple-600 hover:text-purple-800 font-medium">
                View Docs
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-6 h-6 mr-2" />
              Getting Started
            </CardTitle>
            <CardDescription>
              New to Classora.in? Follow these steps to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Create Account</h3>
                <p className="text-gray-600 text-sm">Sign up with your email and choose your role</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">Browse Classes</h3>
                <p className="text-gray-600 text-sm">Find and enroll in classes that interest you</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Access Materials</h3>
                <p className="text-gray-600 text-sm">View notes, assignments, and quizzes</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <h3 className="font-semibold mb-2">Track Progress</h3>
                <p className="text-gray-600 text-sm">Monitor your performance and achievements</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>
              Find answers to the most common questions about using Classora.in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-900">{faq.question}</span>
                    {openFaqs.includes(index) ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  {openFaqs.includes(index) && (
                    <div className="px-6 pb-4">
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Still Need Help */}
        <Card className="mt-12">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Still Need Help?</h2>
            <p className="text-gray-600 mb-6">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/contact">
                  Contact Support
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <a href="mailto:help@classora.in">
                  Email Us
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
