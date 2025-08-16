# 🎯 Demo Credentials for Classora.in

Welcome to Classora.in! Use these demo credentials to explore the educational platform.

## 👨‍💼 **Admin Account**

### System Administrator
- **Email:** `jenbumengineering@gmail.com`
- **Password:** `M@inong5567`
- **Role:** ADMIN
- **Access:** Full system administration, user management, system settings, backups

## 👨‍🏫 **Professor Accounts**

### Dr. Sarah Smith (Computer Science)
- **Email:** `prof.smith@classora.in`
- **Password:** `professor123`
- **Specialization:** Data Structures and Algorithms
- **Courses:** CS101, CS201

### Prof. Michael Johnson (Software Engineering)
- **Email:** `prof.johnson@classora.in`
- **Password:** `professor123`
- **Specialization:** Web Development
- **Courses:** CS301

### Dr. Emily Williams (Mathematics)
- **Email:** `prof.williams@classora.in`
- **Password:** `professor123`
- **Specialization:** Calculus and Linear Algebra
- **Courses:** MATH101

## 👨‍🎓 **Student Accounts**

### Alice Chen (Computer Science Major)
- **Email:** `alice.student@classora.in`
- **Password:** `student123`
- **Enrolled Courses:** CS101, CS201
- **Progress:** Has completed quizzes and read notes

### Bob Rodriguez (Software Engineering Student)
- **Email:** `bob.student@classora.in`
- **Password:** `student123`
- **Enrolled Courses:** CS101, CS301
- **Progress:** New student, no activity yet

### Carol Thompson (Mathematics Major)
- **Email:** `carol.student@classora.in`
- **Password:** `student123`
- **Enrolled Courses:** CS101, MATH101
- **Progress:** New student, no activity yet

### David Kim (Computer Science Student)
- **Email:** `david.student@classora.in`
- **Password:** `student123`
- **Enrolled Courses:** CS101, CS201
- **Progress:** New student, no activity yet

## 📚 **Sample Data Overview**

### Courses Available
1. **CS101 - Introduction to Computer Science**
   - Professor: Dr. Sarah Smith
   - Students: Alice, Bob, Carol, David
   - Content: Programming fundamentals, variables, functions

2. **CS201 - Data Structures and Algorithms**
   - Professor: Dr. Sarah Smith
   - Students: Alice, David
   - Content: Arrays, linked lists, algorithms

3. **CS301 - Web Development Fundamentals**
   - Professor: Prof. Michael Johnson
   - Students: Bob
   - Content: HTML, CSS, JavaScript

4. **MATH101 - Calculus I**
   - Professor: Dr. Emily Williams
   - Students: Carol
   - Content: Differential and integral calculus

### Sample Content

#### 📖 Notes
- **Introduction to Programming** (CS101)
- **Arrays and Linked Lists** (CS201)
- **HTML Basics** (CS301)

#### 🧪 Quizzes
- **Programming Fundamentals Quiz** (CS101) - Multiple Choice
- **Data Structures Quiz** (CS201) - Multiple Selection
- **Programming Quiz: Basic Concepts** (CS201) - Multiple Choice

#### 📋 Assignments
- **Programming Assignment 1: Calculator** (CS101)
- **Data Structures Project: Linked List Implementation** (CS201)

## 🚀 **Getting Started**

### 1. Set up the Database
```bash
# Generate Prisma client
npm run db:generate

# Run migrations (if you have a database set up)
npm run db:migrate

# Seed the database with demo data
npm run db:seed
```

### 2. Start the Development Server
```bash
npm run dev
```

### 3. Access the Application
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Login with Demo Credentials
Choose any of the professor or student accounts above to explore different features.

## 🎯 **What You Can Explore**

### As a Professor:
- Create and manage courses
- Write rich content notes with code snippets and math formulas
- Create interactive quizzes (MCQ, MSQ, Short Answer)
- Upload assignments and track submissions
- View student progress and analytics
- Manage course enrollments

### As a Student:
- Browse enrolled courses
- Read course notes and materials
- Take quizzes and practice questions
- Submit assignments
- Track your progress and performance
- View upcoming deadlines

## 🔧 **Features to Test**

### Rich Text Editor
- Create notes with formatted text
- Add code snippets with syntax highlighting
- Include mathematical formulas using LaTeX
- Embed images and videos

### Quiz System
- Multiple choice questions
- Multiple selection questions
- Practice questions with multiple formats
- Timer functionality
- Automatic grading

### File Management
- Upload assignment files
- Download course materials
- Image optimization

### Progress Tracking
- Quiz performance analytics
- Course completion tracking
- Assignment submission history

## 📝 **Notes**

- All demo data is reset when you run the seed script
- Passwords are hashed using bcrypt
- Sample images use Unsplash URLs
- The practice questions cover various programming concepts
- All timestamps are set relative to the current date

## 🆘 **Troubleshooting**

If you encounter any issues:

1. **Database Connection**: Make sure your PostgreSQL database is running
2. **Environment Variables**: Check that your `.env.local` file is properly configured
3. **Dependencies**: Run `npm install` to ensure all packages are installed
4. **Build Issues**: Run `npm run build` to check for compilation errors

---

**Happy Learning! 🎓**
