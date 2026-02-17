# Mini Client Task Dashboard

A modern, responsive task management dashboard built with Next.js, Tailwind CSS, and Supabase. This application allows users to manage tasks with role-based access control, filtering, and real-time updates.

## 🚀 Features

- **Task Management**: Create, read, update, and delete (CRUD) tasks.
- **Role-Based Access**:
  - **Admins**: Can create and delete tasks.
  - **Staff/Users**: Can view and update task statuses.
- **Task Filtering**: Filter tasks by status (All, Pending, In Progress, Completed).
- **Real-time Updates**: Powered by Supabase for instant data synchronization.
- **Responsive Design**: Fully responsive UI built with Tailwind CSS v4.
- **Authentication**: Secure user authentication via Supabase Auth.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend/Database**: [Supabase](https://supabase.com/) (PostgreSQL & Auth)
- **Icons**: Heroicons (via SVG)

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Supabase account and project

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd client-dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup:**
   Create a `.env.local` file in the root of the `client-dashboard` directory and add your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   > **Note:** Ensure you have the necessary database tables (`tasks`, `profiles`) set up in your Supabase project.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   Visit [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

- `/src/app`: App Router pages and layouts.
- `/src/components`: Reusable UI components (TaskCard, CreateTaskModal, etc.).
- `/src/lib`: Utility functions and Supabase client configuration.
- `/public`: Static assets.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
