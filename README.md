# 🌿 Nexus Habit Tracker - Client

A beautiful, modern habit tracking application built with React and TypeScript. Track your daily habits, visualize your progress, and build lasting positive routines with an elegant forest-themed interface.

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=flat-square&logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0-06B6D4?style=flat-square&logo=tailwindcss)

## ✨ Features

### 📋 Habit Management
- **Create & Customize Habits** - Define habits with custom titles, descriptions, categories, and color themes
- **Flexible Frequency** - Set habits as daily, weekdays only, weekends only, or every other day
- **Progress Tracking** - Mark completions with support for multiple completions per day
- **Drag & Drop Reordering** - Organize your habits in your preferred order
- **Notes & Annotations** - Add notes to individual habit completions

### 📊 Analytics & Insights
- **Visual Statistics** - Beautiful charts powered by Recharts to visualize your progress
- **Streak Tracking** - Monitor current and longest streaks for each habit
- **Completion Rates** - See your success rate over time
- **Weekly Summaries** - Get comprehensive weekly performance reports

### 🎮 Gamification
- **Achievement Badges** - Earn badges for reaching milestones
- **Progress Motivation** - Stay motivated with visual progress indicators

### 📓 Journal
- **Daily Journaling** - Record your thoughts and reflections
- **Mood Tracking** - Track your mood alongside your habits
- **AI Integration** - Powered by Google's Gemini AI for intelligent insights

### 🔐 User Features
- **User Profiles** - Create and manage your personal profile
- **Cloud Sync** - Sync your data across devices when logged in
- **Offline Support** - Works offline with local storage fallback
- **Dark/Light Mode** - Beautiful forest-themed UI with theme toggle

### 📧 Additional Features
- **Email Notifications** - Configure email reminders via EmailJS
- **PDF Export** - Export your habit data and summaries
- **Responsive Design** - Works seamlessly on desktop and mobile

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nexus-habit-tracker.git
   cd nexus-habit-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to see the app running.

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI Framework |
| **TypeScript** | Type Safety |
| **Vite** | Build Tool & Dev Server |
| **TailwindCSS** | Styling |
| **Recharts** | Data Visualization |
| **Lucide React** | Icons |
| **UUID** | Unique ID Generation |
| **Google GenAI** | AI-powered Features |
| **EmailJS** | Email Integration |
| **jsPDF** | PDF Generation |
| **html2canvas** | Screenshot Capture |
| **canvas-confetti** | Celebration Effects |

## 📁 Project Structure

```
nexus-habit-tracker/
├── components/
│   ├── Analytics.tsx      # Statistics and charts
│   ├── Auth.tsx           # Authentication component
│   ├── Dashboard.tsx      # Main dashboard view
│   ├── FlowSpace.tsx      # Focus/flow mode
│   ├── Gamification.tsx   # Achievements and badges
│   ├── HabitList.tsx      # Habit management
│   ├── Journal.tsx        # Daily journaling
│   ├── Layout.tsx         # App layout wrapper
│   ├── Profile.tsx        # User profile
│   ├── Settings.tsx       # App settings
│   └── WeeklySummary.tsx  # Weekly reports
├── services/
│   ├── geminiService.ts   # AI integration
│   └── storage.ts         # Data persistence
├── utils/                 # Utility functions
├── App.tsx                # Main application
├── index.tsx              # Entry point
├── types.ts               # TypeScript definitions
└── index.html             # HTML template
```

## 🎨 Theme Customization

Nexus features a beautiful forest-themed design with both light and dark modes:

- **Dark Mode**: Deep forest green background with subtle ambient animations
- **Light Mode**: Clean, bright interface with soft green accents

The theme automatically applies based on user preference and can be toggled in the settings.

## 📱 Screenshots

*Coming soon*

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



## 🙏 Acknowledgments

- [Lucide Icons](https://lucide.dev/) for beautiful icons
- [TailwindCSS](https://tailwindcss.com/) for utility-first styling
- [Recharts](https://recharts.org/) for data visualization
- [Google Fonts](https://fonts.google.com/) for Inter and Patrick Hand fonts

---

<p align="center">
  Made with 💚 for building better habits
</p>
