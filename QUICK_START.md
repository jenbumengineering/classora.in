# 🚀 Quick Start Guide - Classora.in

## ⚡ Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Database
```bash
# Generate Prisma client
npm run db:generate

# Create database and tables
npm run db:push

# Seed with demo data
npm run db:seed
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Open Application
Visit [http://localhost:3000](http://localhost:3000)

## 🎯 Demo Login Credentials

### Professor Accounts
- **Email:** `prof.smith@classora.in` | **Password:** `professor123`
- **Email:** `prof.johnson@classora.in` | **Password:** `professor123`
- **Email:** `prof.williams@classora.in` | **Password:** `professor123`

### Student Accounts
- **Email:** `alice.student@classora.in` | **Password:** `student123`
- **Email:** `bob.student@classora.in` | **Password:** `student123`
- **Email:** `carol.student@classora.in` | **Password:** `student123`
- **Email:** `david.student@classora.in` | **Password:** `student123`

## 📚 What's Included

### Sample Data
- **4 Courses:** CS101, CS201, CS301, MATH101
- **3 Professors:** Computer Science, Software Engineering, Mathematics
- **4 Students:** Various majors and progress levels
- **3 Notes:** Programming, Data Structures, HTML
- **3 Quizzes:** Multiple choice, multiple selection, short answer
- **2 Assignments:** Programming and data structures projects
- **Progress Data:** Quiz attempts and performance metrics

### Features to Test
- ✅ User authentication and role-based access
- ✅ Course management and enrollment
- ✅ Rich text notes with code snippets
- ✅ Interactive quizzes (MCQ, MSQ, Short Answer)
- ✅ Assignment creation and submission
- ✅ Progress tracking and analytics
- ✅ Responsive dashboard design

## 🔧 Troubleshooting

### Database Issues
```bash
# Reset database
npm run db:reset
npm run db:seed
```

### Build Issues
```bash
# Clean and rebuild
rm -rf .next
npm run build
```

### Port Issues
If port 3000 is busy, the server will automatically use the next available port.

## 📖 Full Documentation
See [README.md](./README.md) and [DEMO_CREDENTIALS.md](./DEMO_CREDENTIALS.md) for detailed information.

---

**Happy Learning! 🎓**
