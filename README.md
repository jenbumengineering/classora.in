# Classora.in - Educational Platform

A comprehensive educational platform built for professors and students, featuring rich content creation, interactive quizzes, and comprehensive progress tracking.

## 🚀 Features

### For Professors
- **Class Management**: Create and manage classes with students
- **Content Creation**: Create notes, assignments, and quizzes
- **Student Management**: Invite and manage students
- **Analytics**: Track student progress and performance
- **Calendar Integration**: Schedule events and deadlines

### For Students
- **Course Access**: Browse and enroll in classes
- **Interactive Learning**: Take quizzes and submit assignments
- **Progress Tracking**: Monitor your learning progress
- **Practice Mode**: Practice with interactive questions
- **Calendar**: View upcoming deadlines and events

### System Features
- **Maintenance Mode**: Admin-controlled site maintenance
- **Dynamic Settings**: Configurable site branding and settings
- **Email Notifications**: Automated email system
- **File Upload**: Support for various file types
- **Responsive Design**: Works on all devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (development), PostgreSQL (production ready)
- **Authentication**: Custom JWT-based authentication
- **Email**: Nodemailer with SMTP support
- **File Upload**: Next.js file upload with validation
- **UI Components**: Custom components with Lucide React icons

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/jenbumengineering/classora.in.git
cd classora.in
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Database Setup
```bash
npx prisma migrate dev
npx prisma db seed
```

### 5. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 👥 Demo Accounts

After running the database seed, you can use the following demo accounts:

### Admin Account
- **Email**: `admin@example.com`
<<<<<<< HEAD
- **Password**: `admin123`
=======
- **Password**: `admin@123456`
>>>>>>> f2cc0cb77ef24e145b952fbb1a02c96461a7e60a
- **Access**: Full system administration

### Professor Account
- **Email**: `professor@example.com`
- **Password**: `password123`
- **Access**: Create classes, content, manage students

### Student Account
- **Email**: `student@example.com`
- **Password**: `password123`
- **Access**: Browse classes, take quizzes, submit assignments

> **Note**: For production deployment, make sure to change these default credentials and use strong passwords.

## 🏗️ Project Structure

```
classora.in/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── admin/             # Admin panel
│   └── maintenance/       # Maintenance page
├── components/            # React components
│   ├── ui/               # UI components
│   ├── dashboard/        # Dashboard components
│   └── providers/        # Context providers
├── lib/                  # Utility functions
├── prisma/               # Database schema and migrations
└── public/               # Static assets
```

## 🔧 Configuration

### System Settings
Access the admin panel at `/admin` to configure:
- Site name and description
- Maintenance mode
- Email settings
- File upload limits
- Company address and contact information

### Email Configuration
Configure SMTP settings in the admin panel:
- Host: `mail.classora.in`
- Port: `587`
- From Email: `support@classora.in`

## 📝 API Documentation

### Authentication
All API routes require authentication via `x-user-id` header.

### Key Endpoints
- `GET /api/admin/settings` - Get system settings (admin only)
- `PUT /api/admin/settings` - Update system settings (admin only)
- `GET /api/settings/public` - Get public settings
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables
4. Deploy

### Other Platforms
The application is compatible with any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email `support@classora.in` or create an issue in the GitHub repository.

## 🔄 Updates

Stay updated with the latest features and improvements by:
- Watching the repository
- Following the release notes
- Checking the changelog

---

Built with ❤️ by the Classora.in Team 
