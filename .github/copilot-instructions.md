You are an expert in TypeScript, Angular, NestJS, and this fullstack Nx monorepo. You write maintainable, performant code following the project's specific architectural patterns.

## Nx Monorepo Architecture

This is a fullstack monorepo with strict separation:
- **Frontend**: Angular 21+ with signals, standalone components, and zoneless change detection
- **Backend**: NestJS with Prisma ORM and domain-specific service layers
- **Database**: PostgreSQL with Prisma schema and code generation

### Path Aliases (Critical)
Always use these import aliases from `tsconfig.base.json`:
- `@fe/*` - Frontend libraries (auth, layout, pages, services, stores, tokens, user)
- `@fe/shared/*` - Shared components and utilities (`@fe/shared/components`, `@fe/shared/utilities`, `@fe/material`)
- `@be/*` - Backend data access layers (posts, users)
- `@db/*` - Database types and Prisma client (`@db/prisma`, `@db/prisma-client`)
- App-specific: `@fe/app/data` for application configuration

### Project Structure
```
apps/
├── frontend/dev-app/          # Main Angular application
└── backend/nest-app/          # NestJS API server

libs/
├── frontend/
│   ├── core/                  # Core Angular functionality
│   │   ├── auth/              # Authentication service & components
│   │   ├── layout/            # Layout components with sidenav/header
│   │   ├── pages/             # Static pages (home, 404)
│   │   ├── services/          # Core business services
│   │   ├── stores/            # @ngrx/signals state management
│   │   └── tokens/            # Dependency injection tokens
│   ├── domains/user/          # User domain features
│   └── shared/                # Reusable UI components & utilities
│       ├── components/        # Dashboard, loading, messages, image-uploader
│       ├── material/          # Angular Material exports
│       ├── pipes/             # Shared pipes
│       └── utils/             # Utility functions & services
├── backend/data-access/       # NestJS domain services (posts, users)
└── db/                        # Prisma schema & generated types
```

## Angular Patterns (Project-Specific)

### Component Architecture (Critical Rules)
- **Standalone components only**: Never use NgModules, `standalone` is default (don't specify)
- **Signal-based**: Use `signal()`, `computed()`, `effect()` for all state
- **Modern APIs**: `inject()` over constructor injection, `input()`/`output()` over decorators
- **Control Flow**: Use `@if`, `@for`, `@switch` instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- **Zoneless**: Project uses `provideZonelessChangeDetection()`, optimize for this

### Dependency Injection Tokens
Configuration via injection tokens (critical pattern):
```typescript
// In app.config.ts - provide tokens
import { MENU_ITEMS_TOKEN, ENVIRONMENT_TOKEN, DICTIONARIES_TOKEN } from '@fe/tokens';
{ provide: MENU_ITEMS_TOKEN, useValue: APP_MENU_ITEMS }

// In components - inject tokens  
menuItems = inject(MENU_ITEMS_TOKEN);
environment = inject(ENVIRONMENT_TOKEN);
```

### Routing Architecture  
Lazy loading with feature-based routing:
```typescript
// Main app routes (apps/frontend/dev-app/src/app/app.routes.ts)
{ path: '', loadChildren: () => import('@fe/layout').then(m => m.layoutRoutes) }

// Layout routes with children (libs/frontend/core/layout/src/lib/lib.routes.ts)
{
  path: '', component: Layout,
  children: [
    { path: 'pages', loadChildren: () => import('@fe/pages').then(m => m.pagesRoutes) },
    { path: 'users', loadChildren: () => import('@fe/user').then(m => m.userRoutes) },
  ]
}
```

### Signal Store Pattern (@ngrx/signals)
Central state management with features:
```typescript
// libs/frontend/core/stores/src/lib/app-store/app.store.ts
export const AppStore = signalStore(
  { providedIn: 'root' },
  withState(initialAppSlice),
  withProps(() => ({ 
    _authService: inject(AuthService),
    _dictionaries: inject(DICTIONARIES_TOKEN) 
  })),
  withComputed((store) => ({ 
    user: computed(() => store._authService.user()) 
  })),
  withAppAuthFeatures(), // Custom features for modular functionality
);
```

## Database & Backend

### Prisma Integration
- Schema: `libs/db/prisma/schema.prisma`
- Generated client: `libs/db/generated/prisma/`
- Import types: `import { User, Post } from '@db/prisma'`
- Migrations in `libs/db/migrations/`

### NestJS Structure  
- Data access layers in `libs/backend/data-access/{posts,users}`
- Each depends on `@db/prisma-client` library
- API prefix: `/api` (set in `main.ts`)
- Services extend pattern: `constructor(private prisma: PrismaClientService)`
- Use Prisma types: `Prisma.UserWhereUniqueInput`, `Prisma.UserCreateInput`

## Development Workflows

### Key Commands
```bash
# Start development servers
pnpm run start-dev-app          # Angular frontend  
pnpm run start-nest-app         # NestJS backend
pnpm run start:frontend:dev     # Frontend with proxy

# Database operations
pnpm run start:prisma           # Generate + migrate
pnpm exec prisma generate       # Generate client only
pnpm exec prisma migrate dev    # Run migrations

# Nx operations  
nx serve dev-app                # Angular dev server
nx serve nest-app               # NestJS dev server
nx build <project>              # Build specific project
nx test <project>               # Run tests
nx graph                        # Visualize dependencies
```

### Configuration Files
- Environment setup: `scripts/setenv.ts` (run via `configangular`)
- Proxy config: `proxy.config.json` for API routing (`/api` → `http://localhost:3001`)
- Custom Nx plugins configured for TypeScript, Webpack, ESLint, Jest, Playwright:3001

### Angular Configuration
- Uses zoneless change detection (`provideZonelessChangeDetection()`)
- Internationalization with @ngx-translate
- Material Design components with `@angular/material`
- Configuration via injection tokens in `app.config.ts`

Use `nx show project <name>` to see available targets for any project.
