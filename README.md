# University Attendance Management System

A comprehensive attendance management system built with Next.js, TypeScript, and Supabase for universities with multiple campuses and departments.

## Features

### 🏛️ Multi-Campus Support
- Manage multiple university campuses
- GPS-based geofencing for attendance verification
- Campus-specific location validation

### 👥 Role-Based Access Control
- **SuperAdmin**: Full system access across all campuses
- **Dean/Department Admin**: Department-specific management
- **Lecturer**: Mobile app access for attendance taking

### 📊 Core Functionality
- Student and lecturer management
- Course and batch management
- Class scheduling and session management
- Real-time attendance tracking
- Comprehensive reporting and analytics
- Excel import for bulk student data

### 🎨 Modern UI/UX
- Clean, responsive admin interface
- Built with shadcn/ui components
- Tailwind CSS for styling
- Dark/light mode support

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Quick Setup (Windows)

1. **Run the setup script**
   ```powershell
   .\setup-project.ps1
   ```

2. **Follow the on-screen instructions**

### Manual Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd attendance-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up shadcn/ui components**
   ```bash
   npx shadcn-ui@latest init --yes
   npx shadcn-ui@latest add button input label card table dialog dropdown-menu select toast tabs checkbox avatar separator form badge alert sheet calendar popover command
   ```

4. **Set up Supabase**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Go to your project dashboard
   - Navigate to the SQL Editor
   - Copy and run the database schema from `src/lib/supabase.ts` (the `databaseSchema` constant)

5. **Configure environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   JWT_SECRET=your_jwt_secret_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Initial Setup

1. **Create your first campus**
   - Login as SuperAdmin (admin@university.edu / admin123)
   - Go to Campuses and add your university campus with GPS coordinates

2. **Create departments**
   - Go to Departments and add academic departments
   - Assign each department to a campus

3. **Create batches**
   - Go to Batches and create academic year groups
   - Assign batches to departments

4. **Add lecturers**
   - Go to Lecturers and add faculty members
   - Assign lecturers to departments

5. **Add students**
   - Go to Students and add student records
   - Or use the Excel upload feature for bulk import

6. **Create courses**
   - Go to Courses and create academic courses
   - Assign courses to lecturers and batches

7. **Schedule classes**
   - Go to Schedules to create class sessions
   - Set up class timings and locations

## Database Schema

The system uses the following main entities:

- **Users**: System users with role-based access
- **Campuses**: University campus locations with GPS coordinates
- **Departments**: Academic departments within campuses
- **Students**: Student records with registration numbers
- **Lecturers**: Faculty members assigned to departments
- **Courses**: Academic courses with assigned lecturers
- **Batches**: Academic year groups
- **Class Sessions**: Scheduled class meetings
- **Attendance**: Student attendance records with GPS verification

## User Roles & Permissions

### SuperAdmin
- Manage all campuses and departments
- Create/edit all users, students, courses
- View system-wide reports and analytics
- Access to all features

### Dean/Department Admin
- Manage department-specific data
- Create/edit students and lecturers in their department
- View department attendance reports
- Cannot access other departments

### Lecturer
- View assigned courses and schedules
- Take attendance for assigned classes
- Mobile app access (Flutter - coming soon)
- GPS verification required for attendance

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Campuses
- `GET /api/campuses` - List all campuses
- `POST /api/campuses` - Create new campus

### Departments
- `GET /api/departments` - List all departments
- `POST /api/departments` - Create new department

### Students
- `GET /api/students` - List students (filtered by role)
- `POST /api/students` - Create new student
- `POST /api/students/upload` - Bulk upload via Excel

### Courses
- `GET /api/courses` - List courses
- `POST /api/courses` - Create new course

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Submit attendance (with GPS verification)

## Mobile App (Coming Soon)

The lecturer mobile app will be built with Flutter and will include:
- Lecturer login and authentication
- Today's class schedule
- GPS-based attendance taking
- Student list for each class
- Offline support for poor connectivity

## Development

### Project Structure
```
src/
├── app/                 # Next.js app router pages
│   ├── api/            # API routes
│   ├── dashboard/      # Dashboard page
│   ├── campuses/       # Campus management
│   ├── departments/    # Department management
│   └── login/          # Authentication
├── components/         # Reusable UI components
│   ├── ui/            # shadcn/ui components
│   └── layout/        # Layout components
└── lib/               # Utilities and configurations
    ├── auth.ts        # Authentication utilities
    ├── supabase.ts    # Database configuration
    └── types.ts       # TypeScript type definitions
```

### Adding New Features

1. Create API routes in `src/app/api/`
2. Add TypeScript types in `lib/types.ts`
3. Create UI components in `src/components/`
4. Add pages in `src/app/`
5. Update navigation in `components/layout/sidebar.tsx`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository or contact the development team.
