'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Shield, Mail, Calendar, Users, Lock, Eye } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your privacy is important to us. Learn how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Last updated: January 2025
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-6 h-6 mr-2" />
                About Classora.in
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Classora.in is operated by <strong>Jenbum Engineering Pvt. Ltd.</strong>, a company committed to providing 
                secure and reliable educational technology solutions.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Company Details:</h3>
                <p className="text-gray-600">
                  <strong>Jenbum Engineering Pvt. Ltd.</strong><br />
                  Bordumsa, Changlang District<br />
                  Arunachal Pradesh - 792056<br />
                  Email: <a href="mailto:help@classora.in" className="text-blue-600 hover:text-blue-800">help@classora.in</a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-6 h-6 mr-2" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Personal Information</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Name, email address, and contact information</li>
                  <li>Educational institution and academic details</li>
                  <li>Profile information and preferences</li>
                  <li>Account credentials and security information</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Usage Information</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Platform usage patterns and interactions</li>
                  <li>Course enrollments and academic progress</li>
                  <li>Assignment submissions and quiz attempts</li>
                  <li>Communication and collaboration activities</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Technical Information</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Device information and browser details</li>
                  <li>IP addresses and location data</li>
                  <li>Cookies and session information</li>
                  <li>System logs and error reports</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-6 h-6 mr-2" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Platform Services</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Account creation and management</li>
                    <li>Course enrollment and access</li>
                    <li>Assignment and quiz administration</li>
                    <li>Progress tracking and analytics</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Communication</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Important announcements and updates</li>
                    <li>Support and customer service</li>
                    <li>Educational notifications</li>
                    <li>Platform improvements feedback</li>
                  </ul>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Security and Compliance</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Fraud prevention and security monitoring</li>
                  <li>Legal compliance and regulatory requirements</li>
                  <li>Platform maintenance and optimization</li>
                  <li>Research and development improvements</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Protection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="w-6 h-6 mr-2" />
                Data Protection and Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Security Measures</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>End-to-end encryption for sensitive data</li>
                  <li>Secure data centers with physical security</li>
                  <li>Regular security audits and penetration testing</li>
                  <li>Access controls and authentication systems</li>
                  <li>Data backup and disaster recovery procedures</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Data Retention</h3>
                <p className="text-gray-600">
                  We retain your personal information for as long as necessary to provide our services, 
                  comply with legal obligations, resolve disputes, and enforce our agreements. 
                  Account data is typically retained for the duration of your account plus a reasonable 
                  period for backup and recovery purposes.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Data Sharing</h3>
                <p className="text-gray-600">
                  We do not sell, trade, or rent your personal information to third parties. 
                  We may share information with trusted service providers who assist us in 
                  operating our platform, conducting business, or servicing users, so long as 
                  those parties agree to keep this information confidential.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle>Your Privacy Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Access and Control</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Access your personal information</li>
                    <li>Update and correct your data</li>
                    <li>Delete your account and data</li>
                    <li>Export your data</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Communication Preferences</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Manage notification settings</li>
                    <li>Opt-out of marketing communications</li>
                    <li>Control data sharing preferences</li>
                    <li>Set privacy and visibility options</li>
                  </ul>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800">
                  <strong>To exercise your privacy rights:</strong> Contact us at{' '}
                  <a href="mailto:help@classora.in" className="underline">help@classora.in</a> 
                  with your request. We will respond within 30 days.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cookies and Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Cookies and Tracking Technologies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                We use cookies and similar tracking technologies to enhance your experience, 
                analyze platform usage, and provide personalized content. You can control 
                cookie settings through your browser preferences.
              </p>
              <div>
                <h3 className="font-semibold mb-2">Types of Cookies We Use</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>Essential Cookies:</strong> Required for platform functionality</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand usage patterns</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings and choices</li>
                  <li><strong>Security Cookies:</strong> Protect against fraud and abuse</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Classora.in is designed for educational use and may be used by students under 18. 
                We collect and process student information in compliance with applicable laws and 
                educational privacy regulations. Parental consent may be required for students under 13.
              </p>
            </CardContent>
          </Card>

          {/* International Users */}
          <Card>
            <CardHeader>
              <CardTitle>International Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                If you are accessing Classora.in from outside India, please note that your information 
                may be transferred to, stored, and processed in India where our servers are located. 
                By using our platform, you consent to the transfer of your information to India.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                We may update this Privacy Policy from time to time. We will notify you of any changes 
                by posting the new Privacy Policy on this page and updating the "Last updated" date. 
                We encourage you to review this Privacy Policy periodically for any changes.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                If you have any questions about this Privacy Policy or our data practices, 
                please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">
                  <strong>Email:</strong> <a href="mailto:help@classora.in" className="text-blue-600 hover:text-blue-800">help@classora.in</a><br />
                  <strong>Address:</strong> Jenbum Engineering Pvt. Ltd., Bordumsa, Changlang District, Arunachal Pradesh - 792056
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/contact">
                Contact Support
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/help">
                Help Center
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
