# DS Milo Admin - Frontend

React frontend application for the DS Milo Admin Panel. A modern dashboard for managing training plans, translations, user management, and analytics.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure your .env file with backend API URL
# VITE_API_URL=http://localhost:3000/api

# Start development server
npm run dev
```

Application will be available at `http://localhost:5173`

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Backend API URL
VITE_API_URL=http://localhost:3000/api

# For production, use your deployed backend URL:
# VITE_API_URL=https://your-backend-domain.com/api
```

## 🛠️ Technology Stack

- **React 18** - UI library
- **React Router** - Client-side routing
- **Vite** - Build tool and development server
- **TailwindCSS** - Utility-first CSS framework
- **Axios** - HTTP client for API calls
- **Recharts** - Data visualization library
- **Marked** - Markdown parser

## 👥 User Roles & Features

### Admin
- Full access to all features
- User management
- Analytics dashboard
- Training plans management
- Translation management

### Data Visualizer
- Access to analytics and data visualization
- Performance metrics and charts

### Training Expert
- Manage and view training plans
- Athlete selection and weekly analysis

### Translator Master
- Review and approve translation proposals
- Bulk translation downloads
- GitHub integration management

### Translator
- Create and submit translation proposals
- Screen and key management

## 🏗️ Development

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The `dist/` folder will contain the production-ready files.

### Deploy to Static Hosting

The built application can be deployed to any static hosting service:

- **Netlify**: Connect to GitHub and auto-deploy on push
- **Vercel**: Zero-config deployment for React apps
- **Render**: Simple static site hosting
- **GitHub Pages**: Free hosting for public repositories

### Important Configuration

Make sure to configure your hosting service to:
1. Serve `index.html` for all routes (SPA routing)
2. Set the correct environment variable for `VITE_API_URL`

### Example Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

## 🔗 Backend Repository

The backend API for this frontend is available at: [DS_Milo_Admin_Backend](../DS_Milo_Admin_Backend)

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 📄 License

MIT License