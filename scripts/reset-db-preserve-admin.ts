import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetDatabasePreserveAdmin() {
  try {
    console.log('🔄 Starting database reset while preserving admin user...\n')

    // First, let's identify the admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, name: true }
    })

    if (!adminUser) {
      console.log('❌ No admin user found. Creating one...')
      // Create admin user if none exists
      const newAdmin = await prisma.user.create({
        data: {
          email: 'jenbumengineering@gmail.com',
          name: 'Admin User',
          password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK2.', // password: admin123
          role: 'ADMIN'
        }
      })
      console.log(`✅ Created admin user: ${newAdmin.name} (${newAdmin.email})`)
    } else {
      console.log(`✅ Found admin user: ${adminUser.name} (${adminUser.email})`)
    }

    console.log('\n🗑️  Deleting all data except admin user...')

    // Delete data in the correct order to respect foreign key constraints
    // Start with dependent tables first

    // Delete practice-related data
    await prisma.practiceQuestionAttempt.deleteMany()
    console.log('✅ Deleted practice question attempts')

    await prisma.practiceQuestion.deleteMany()
    console.log('✅ Deleted practice questions')

    await prisma.practiceFile.deleteMany()
    console.log('✅ Deleted practice files')

    // Delete quiz-related data
    await prisma.quizAttempt.deleteMany()
    console.log('✅ Deleted quiz attempts')

    await prisma.quiz.deleteMany()
    console.log('✅ Deleted quizzes')

    // Delete assignment-related data
    await prisma.assignmentSubmission.deleteMany()
    console.log('✅ Deleted assignment submissions')

    await prisma.studentAssignmentView.deleteMany()
    console.log('✅ Deleted student assignment views')

    await prisma.assignment.deleteMany()
    console.log('✅ Deleted assignments')

    // Delete note-related data
    await prisma.studentNoteView.deleteMany()
    console.log('✅ Deleted student note views')

    await prisma.note.deleteMany()
    console.log('✅ Deleted notes')

    // Delete quiz views
    await prisma.studentQuizView.deleteMany()
    console.log('✅ Deleted student quiz views')

    // Delete calendar events
    await prisma.calendarEvent.deleteMany()
    console.log('✅ Deleted calendar events')

    // Delete notifications
    await prisma.notification.deleteMany()
    console.log('✅ Deleted notifications')

    // Delete invitations
    await prisma.invitation.deleteMany()
    console.log('✅ Deleted invitations')

    // Delete enrollments
    await prisma.enrollment.deleteMany()
    console.log('✅ Deleted enrollments')

    // Delete classes
    await prisma.class.deleteMany()
    console.log('✅ Deleted classes')

    // Delete profiles
    await prisma.teacherProfile.deleteMany()
    console.log('✅ Deleted teacher profiles')

    await prisma.studentProfile.deleteMany()
    console.log('✅ Deleted student profiles')

    // Delete user settings
    await prisma.userSettings.deleteMany()
    console.log('✅ Deleted user settings')

    // Delete contact messages
    await prisma.contactMessage.deleteMany()
    console.log('✅ Deleted contact messages')

    // Delete system settings
    await prisma.systemSettings.deleteMany()
    console.log('✅ Deleted system settings')

    // Delete backups
    await prisma.backup.deleteMany()
    console.log('✅ Deleted backups')

    // Delete all users except admin
    const usersToDelete = await prisma.user.findMany({
      where: { role: { not: 'ADMIN' } },
      select: { id: true, name: true, email: true }
    })

    if (usersToDelete.length > 0) {
      await prisma.user.deleteMany({
        where: { role: { not: 'ADMIN' } }
      })
      console.log(`✅ Deleted ${usersToDelete.length} non-admin users:`)
      usersToDelete.forEach(user => {
        console.log(`   - ${user.name} (${user.email})`)
      })
    } else {
      console.log('✅ No non-admin users to delete')
    }

    // Verify admin user still exists
    const remainingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (remainingAdmin) {
      console.log(`\n✅ Database reset complete!`)
      console.log(`👤 Admin user preserved: ${remainingAdmin.name} (${remainingAdmin.email})`)
      
      // Show final counts
      const finalCounts = await prisma.$transaction([
        prisma.user.count(),
        prisma.class.count(),
        prisma.note.count(),
        prisma.quiz.count(),
        prisma.assignment.count()
      ])

      console.log('\n📊 Final Database State:')
      console.log(`Users: ${finalCounts[0]}`)
      console.log(`Classes: ${finalCounts[1]}`)
      console.log(`Notes: ${finalCounts[2]}`)
      console.log(`Quizzes: ${finalCounts[3]}`)
      console.log(`Assignments: ${finalCounts[4]}`)
    } else {
      console.log('❌ Error: Admin user was accidentally deleted!')
    }

  } catch (error) {
    console.error('❌ Database reset failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the reset
resetDatabasePreserveAdmin()
