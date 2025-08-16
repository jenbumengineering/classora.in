import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminEmail = 'admin@example.com'
  const adminPassword = 'admin123'
  
  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12)
    
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
        avatar: null,
        bio: 'System Administrator'
      }
    })
    
    console.log('✅ Admin user created:', adminUser.email)
  } else {
    console.log('ℹ️ Admin user already exists:', existingAdmin.email)
  }

  // Create some sample data for testing
  console.log('📚 Creating sample data...')

  // Create a sample professor
  const professor = await prisma.user.upsert({
    where: { email: 'professor@example.com' },
    update: {},
    create: {
      email: 'professor@example.com',
      name: 'Dr. John Smith',
      password: await bcrypt.hash('password123', 12),
      role: 'PROFESSOR',
      avatar: null,
      bio: 'Computer Science Professor',
      teacherProfile: {
        create: {
          university: 'Example University',
          department: 'Computer Science',
          qualifications: 'PhD in Computer Science',
          experience: '10+ years of teaching experience'
        }
      }
    }
  })

  // Create a sample student
  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      name: 'Jane Doe',
      password: await bcrypt.hash('password123', 12),
      role: 'STUDENT',
      avatar: null,
      bio: 'Computer Science Student',
      studentProfile: {
        create: {
          university: 'Example University',
          department: 'Computer Science',
          semester: '3rd Semester',
          class: 'B.Tech CSE'
        }
      }
    }
  })

  // Create a sample class
  const sampleClass = await prisma.class.upsert({
    where: { code: 'CS101' },
    update: {},
    create: {
      name: 'Introduction to Computer Science',
      description: 'A comprehensive introduction to computer science fundamentals',
      code: 'CS101',
      professorId: professor.id
    }
  })

  // Enroll student in the class
  await prisma.enrollment.upsert({
    where: {
      studentId_classId: {
        studentId: student.id,
        classId: sampleClass.id
      }
    },
    update: {},
    create: {
      studentId: student.id,
      classId: sampleClass.id,
      enrolledAt: new Date()
    }
  })

  // Create sample assignments
  const assignment1 = await prisma.assignment.create({
    data: {
      title: 'Programming Assignment 1',
      description: 'Write a simple calculator program in Python',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      classId: sampleClass.id,
      professorId: professor.id,
      status: 'PUBLISHED'
    }
  })

  const assignment2 = await prisma.assignment.create({
    data: {
      title: 'Data Structures Project',
      description: 'Implement a binary search tree with insertion and deletion operations',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      classId: sampleClass.id,
      professorId: professor.id,
      status: 'PUBLISHED'
    }
  })

  // Create sample quizzes
  const quiz1 = await prisma.quiz.create({
    data: {
      title: 'Basic Programming Quiz',
      description: 'Test your knowledge of programming fundamentals',
      timeLimit: 30, // 30 minutes
      type: 'MULTIPLE_CHOICE',
      classId: sampleClass.id,
      professorId: professor.id,
      status: 'PUBLISHED'
    }
  })

  // Create sample notes
  const note1 = await prisma.note.create({
    data: {
      title: 'Introduction to Algorithms',
      content: 'This note covers the basics of algorithm analysis and design.',
      classId: sampleClass.id,
      professorId: professor.id,
      status: 'PUBLISHED'
    }
  })

  // Create sample contact messages
  const contactMessage1 = await prisma.contactMessage.create({
    data: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      subject: 'General Inquiry',
      message: 'I would like to know more about your platform and its features.',
      read: false
    }
  })

  const contactMessage2 = await prisma.contactMessage.create({
    data: {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      subject: 'Technical Support',
      message: 'I am having trouble accessing my assignments. Can you help me?',
      read: true
    }
  })

  console.log('✅ Sample data created successfully!')
  console.log('📊 Created:')
  console.log(`   - 1 Admin user (${adminEmail})`)
  console.log(`   - 1 Professor (${professor.email})`)
  console.log(`   - 1 Student (${student.email})`)
  console.log(`   - 1 Class (${sampleClass.name})`)
  console.log(`   - 2 Assignments`)
  console.log(`   - 1 Quiz`)
  console.log(`   - 1 Note`)
  console.log(`   - 2 Contact messages`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
