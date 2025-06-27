# Git Change Explorer - replit.md

## Overview

This is an Animated Git Change Explorer application that visualizes code evolution and repository changes through interactive animations and detailed commit analysis. The application allows users to input a Git repository URL and explore the commit history with visual file tree changes, commit statistics, and animated transitions between commits.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **UI Components**: Comprehensive set of Radix UI primitives through shadcn/ui
- **State Management**: React hooks with TanStack Query for server state
- **Animations**: Framer Motion for smooth transitions and interactive animations
- **Routing**: Wouter for lightweight client-side routing
- **Theme**: Dark/light mode support with system preference detection

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Git Operations**: simple-git library for repository cloning and analysis
- **Database**: Drizzle ORM with PostgreSQL (Neon Database)
- **Session Management**: PostgreSQL session store with connect-pg-simple
- **Build Process**: esbuild for production bundling
- **Development**: tsx for TypeScript execution in development

## Key Components

### Database Schema
- **Repositories Table**: Stores repository metadata (id, url, name, last_analyzed)
- **Commits Table**: Stores commit information (id, repository_id, hash, message, author, date, files_changed)
- **Type Safety**: Drizzle-zod for runtime schema validation

### API Endpoints
- **POST /api/analyze**: Analyzes a Git repository, clones it temporarily, extracts commit history, and returns structured data
- **Storage Layer**: Abstracted storage interface supporting both memory and database implementations

### Frontend Pages
- **Home Page**: Repository URL input form with analysis results display
- **Git Explorer**: Interactive commit timeline with file tree visualization
- **Theme Management**: System-aware dark/light mode toggle

### UI Components
- **File Tree Visualization**: Expandable tree structure showing repository files with change indicators
- **Commit Timeline**: Interactive timeline with play/pause controls for animated commit progression
- **Statistics Dashboard**: Visual representation of repository metrics and change statistics
- **Responsive Design**: Mobile-first approach with adaptive layouts

## Data Flow

1. User enters repository URL on the home page
2. Frontend sends POST request to `/api/analyze` endpoint
3. Backend clones repository to temporary directory
4. Git log analysis extracts commit history and file changes
5. Repository and commit data stored in PostgreSQL database
6. Structured response returned with commits, file tree, and statistics
7. Frontend displays interactive explorer with animation controls
8. User can navigate through commits with visual file tree updates

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **simple-git**: Git repository operations and analysis
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management and caching
- **framer-motion**: Animation library for smooth transitions

### UI Dependencies
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe component variants
- **embla-carousel-react**: Touch-friendly carousel component

### Development Tools
- **typescript**: Static type checking
- **vite**: Development server and build tool
- **esbuild**: Production bundling for backend
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Development Environment
- **Replit Configuration**: Integrated PostgreSQL 16, Node.js 20, and web modules
- **Development Server**: Runs on port 5000 with hot module replacement
- **Database**: Drizzle migrations with push strategy for schema updates

### Production Build
- **Frontend**: Vite builds static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Deployment Target**: Autoscale deployment with npm build and start scripts
- **Environment Variables**: DATABASE_URL required for PostgreSQL connection

### File Structure
```
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route components
│   │   ├── lib/          # Utilities and configuration
│   │   └── hooks/        # Custom React hooks
├── server/               # Backend Express application
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Data persistence layer
│   └── vite.ts           # Development server integration
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema and validation
└── migrations/           # Database migration files
```

## Changelog

Changelog:
- June 27, 2025. Initial setup
- June 27, 2025. Enhanced mobile responsiveness with:
  - Mobile-first sidebar with slide-out drawer navigation
  - Responsive typography and spacing across all screen sizes
  - Touch-friendly button sizes and interactions
  - Optimized file tree display for mobile devices
  - Improved header layout with responsive repository name display
  - Mobile-optimized form inputs and buttons
  - Enhanced viewport meta tags for better mobile experience

## User Preferences

Preferred communication style: Simple, everyday language.