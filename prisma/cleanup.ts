import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanup() {
  console.log('🧹 Starting database cleanup...')

  try {
    // Delete in order to respect foreign key constraints
    
    // First, delete all dependent records
    await prisma.answer.deleteMany()
    console.log('✅ Deleted all answers')
    
    await prisma.quizAttempt.deleteMany()
    console.log('✅ Deleted all quiz attempts')
    
    await prisma.questionOption.deleteMany()
    console.log('✅ Deleted all question options')
    
    await prisma.question.deleteMany()
    console.log('✅ Deleted all questions')
    
    await prisma.quiz.deleteMany()
    console.log('✅ Deleted all quizzes')
    
    await prisma.assignmentSubmission.deleteMany()
    console.log('✅ Deleted all assignment submissions')
    
    await prisma.assignment.deleteMany()
    console.log('✅ Deleted all assignments')
    
    await prisma.note.deleteMany()
    console.log('✅ Deleted all notes')
    
    
    
    await prisma.enrollment.deleteMany()
    console.log('✅ Deleted all enrollments')
    
    await prisma.practiceQuestionAttempt.deleteMany()
    console.log('✅ Deleted all practice question attempts')
    
    await prisma.practiceQuestionOption.deleteMany()
    console.log('✅ Deleted all practice question options')
    
    await prisma.practiceQuestion.deleteMany()
    console.log('✅ Deleted all practice questions')
    
    await prisma.practiceFile.deleteMany()
    console.log('✅ Deleted all practice files')
    
    await prisma.calendarEvent.deleteMany()
    console.log('✅ Deleted all calendar events')
    
    await prisma.notification.deleteMany()
    console.log('✅ Deleted all notifications')
    
    await prisma.userSettings.deleteMany()
    console.log('✅ Deleted all user settings')
    
    await prisma.teacherProfile.deleteMany()
    console.log('✅ Deleted all teacher profiles')
    
    await prisma.class.deleteMany()
    console.log('✅ Deleted all classes')
    
    // Finally, delete all users
    await prisma.user.deleteMany()
    console.log('✅ Deleted all users')
    
    console.log('🎉 Database cleanup completed successfully!')
    console.log('📝 All dummy data has been removed from the database.')
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  }
}

cleanup()
  .catch((e) => {
    console.error('❌ Error during cleanup:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
