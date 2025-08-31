import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('🔍 Checking database...\n')

    // Check total counts
    const userCount = await prisma.user.count()
    const classCount = await prisma.class.count()
    const noteCount = await prisma.note.count()
    const quizCount = await prisma.quiz.count()
    const assignmentCount = await prisma.assignment.count()

    console.log('📊 Database Statistics:')
    console.log(`Users: ${userCount}`)
    console.log(`Classes: ${classCount}`)
    console.log(`Notes: ${noteCount}`)
    console.log(`Quizzes: ${quizCount}`)
    console.log(`Assignments: ${assignmentCount}\n`)

    // Check recent users
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    console.log('👥 Recent Users:')
    recentUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - ${user.role}`)
    })

    // Check recent classes
    const recentClasses = await prisma.class.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true
      }
    })

    console.log('\n📚 Recent Classes:')
    recentClasses.forEach(cls => {
      console.log(`- ${cls.name}: ${cls.description?.substring(0, 50)}...`)
    })

    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    console.log('\n✅ Database connection successful!')

  } catch (error) {
    console.error('❌ Database check failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the check
checkDatabase()

