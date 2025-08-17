import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user with specified credentials
  const adminEmail = 'jenbumengineering@gmail.com'
  const adminPassword = 'Unbreakable@7001'
  
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

  console.log('✅ Database seeding completed!')
  console.log('📊 Created:')
  console.log(`   - 1 Admin user (${adminEmail})`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
