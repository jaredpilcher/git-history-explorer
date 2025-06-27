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

## Performance Optimization Roadmap

### Current Performance Status
- Application is optimized for small to medium repositories
- Mobile-responsive design with smooth animations
- Consolidated component architecture for maintainability

### Future Enhancements for Large Repositories
1. **Commit History Pagination**: Implement pagination for repositories with >100 commits
2. **File Tree Virtualization**: Add `react-window` or `react-virtualized` for large file trees
3. **Lazy Loading**: Load commit details and file diffs on-demand
4. **Caching Strategy**: Implement browser caching for repository data
5. **Search and Filtering**: Add search functionality for commits and files

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
- June 27, 2025. Code consolidation and simplification based on user feedback:
  - Removed duplicate GitExplorer component, consolidated to AnimatedGitExplorer
  - Eliminated data transformation in home.tsx, now uses GitAnalysisResponse directly
  - Updated all components to use unified types from shared/schema.ts
  - Removed obsolete files (git-explorer.tsx, git-types.ts)
  - Fixed Framer Motion animation warnings for better performance
  - Centralized state management in home.tsx for cleaner architecture
- June 27, 2025. Comprehensive improvements based on code review feedback:
  - Replaced mock data with real repository analysis
  - Added generateFileTreeHistory, generateArchitectureNotes, and generateArchitectureDiagrams functions
  - Implemented actual file content extraction from Git repositories
  - Enhanced error handling with specific error messages for different failure scenarios
  - Added performance optimizations for large repositories (>50 commits)
  - Implemented commit pagination to limit display to first 50 commits for performance
  - Added visual warning indicators for large repositories
  - Improved TypeScript type safety across backend Git operations
  - Enhanced network error handling with timeout and connectivity checks
  - Fixed Framer Motion backgroundColor animation warnings
- June 27, 2025. Additional improvements based on comprehensive code review:
  - Enhanced error handling with specific user-friendly error messages for authentication, timeout, and network issues
  - Improved accessibility with proper ARIA labels, keyboard navigation focus states, and screen reader support
  - Added semantic HTML elements and proper form labeling for better accessibility
  - Optimized Git operations with shallow clones (--depth=50) and single-branch fetching for better performance
  - Fixed Framer Motion animation warnings by moving backgroundColor to animate property instead of style
  - Added performance monitoring indicators for large repositories with user-friendly warnings
  - Improved error categorization with specific handling for rate limiting, repository access, and network connectivity
  - Enhanced form validation with proper disabled states and user feedback
- June 27, 2025. Major enhancement implementing comprehensive feedback improvements:
  - **Enhanced Diff Visualization**: Integrated 'diff' library for proper line-by-line diffing with smooth fading animations
  - **Changed Files Filter**: Added toggle button in file tree to show only changed files for better focus
  - **Real-time File Content**: Implemented `/api/file-content` endpoint to fetch actual file contents between commits
  - **Interactive File Selection**: Dynamic content loading when users select different files in the tree
  - **Improved Animation System**: Enhanced progress-based fading for added/removed/modified lines
  - **Better UX Patterns**: Hover effects, loading states, and smooth transitions throughout the interface
  - **Performance Optimizations**: Smart file filtering and efficient content loading for large repositories
- June 27, 2025. Advanced UI/UX improvements for better navigation and commit visualization:
  - **Dynamic File Tree Updates**: File tree now refreshes as slider moves, showing only files changed in each specific commit
  - **Viewport Jump Prevention**: Added scroll position tracking to prevent page jumping during slider navigation
  - **File Gray-out System**: Selected files appear grayed when not changed in current commit but remain visible for continuity
  - **Reversed Commit Order**: Changed commit display from newest-first to oldest-first (earliest to latest) for better chronological flow
  - **Default 5 Commits**: Reduced default commit analysis to last 5 commits for faster loading and better focus
  - **Improved From/To Logic**: Updated commit selectors and slider to work with chronological order (earliest → latest)

## User Preferences

Preferred communication style: Simple, everyday language.