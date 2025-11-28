# Changelog

All notable changes to the TUM Community Platform (Unigram) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Health check endpoint at `/api/health` for monitoring application status
- Security headers configuration in `next.config.js` (CSP, HSTS, X-Frame-Options, etc.)
- CORS policy configuration for API routes
- Comprehensive environment variable documentation in `.env.example`
- Environment variable validation utility in `lib/config/env-validation.ts`
- Production readiness features for deployment

### Changed
- Updated `next.config.js` with security headers and CORS policies
- Enhanced `.env.example` with detailed documentation for all environment variables

### Fixed
- N/A

### Security
- Added Content Security Policy (CSP) headers
- Added Strict Transport Security (HSTS) headers
- Added X-Frame-Options to prevent clickjacking
- Added X-Content-Type-Options to prevent MIME sniffing
- Configured CORS policies for API routes

### Deprecated
- N/A

### Removed
- N/A

---

## [0.1.0] - YYYY-MM-DD

### Added
- Initial release of TUM Community Platform
- User authentication and profile management
- Forum system with subforums, posts, and comments
- Channel-based messaging system
- Event management with QR code generation
- Calendar integration with event filtering
- Wiki/knowledge base powered by Hygraph CMS
- Real-time features using Supabase subscriptions
- Row Level Security (RLS) policies for data protection
- Comprehensive database schema with 15 tables
- Full-text search capabilities
- Responsive UI built with Next.js 14 and Tailwind CSS

### Security
- Row Level Security (RLS) enabled on all database tables
- Email verification required for new accounts
- Secure session management with automatic token refresh
- Protected routes with authentication middleware

---

## How to Use This Changelog

### For Developers

When making changes to the codebase:

1. **Add your changes to the [Unreleased] section** under the appropriate category:
   - **Added**: New features
   - **Changed**: Changes to existing functionality
   - **Fixed**: Bug fixes
   - **Security**: Security improvements or fixes
   - **Deprecated**: Features that will be removed in future versions
   - **Removed**: Features that have been removed

2. **Use clear, concise descriptions** that explain what changed and why

3. **Include relevant issue/PR numbers** if applicable:
   ```markdown
   - Fixed authentication redirect loop (#123)
   ```

4. **When releasing a new version**:
   - Move items from [Unreleased] to a new version section
   - Update the version number following [Semantic Versioning](https://semver.org/)
   - Add the release date in YYYY-MM-DD format

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version (X.0.0): Incompatible API changes
- **MINOR** version (0.X.0): New functionality in a backward-compatible manner
- **PATCH** version (0.0.X): Backward-compatible bug fixes

### Example Entry

```markdown
## [1.2.3] - 2024-01-15

### Added
- User profile customization with avatar upload (#45)
- Email notifications for new messages (#47)

### Changed
- Improved forum post loading performance by 50% (#48)
- Updated UI design for event cards (#49)

### Fixed
- Fixed calendar export not including all events (#50)
- Resolved authentication redirect loop on mobile (#51)

### Security
- Updated dependencies to patch security vulnerabilities
- Added rate limiting to API endpoints (#52)
```

---

## Release Process

### 1. Prepare Release

1. Review all changes in [Unreleased] section
2. Ensure all changes are documented
3. Update version number in `package.json`
4. Move [Unreleased] items to new version section
5. Add release date

### 2. Create Release

1. Commit changelog updates:
   ```bash
   git add CHANGELOG.md package.json
   git commit -m "chore: release v1.2.3"
   ```

2. Create git tag:
   ```bash
   git tag -a v1.2.3 -m "Release v1.2.3"
   git push origin v1.2.3
   ```

3. Deploy to production (see [DEPLOYMENT.md](docs/DEPLOYMENT.md))

### 3. Post-Release

1. Create GitHub release with changelog excerpt
2. Notify team of new release
3. Monitor for issues
4. Update documentation if needed

---

## Links

- [Repository](https://github.com/your-org/unigram)
- [Documentation](./docs/)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Contributing Guide](./docs/CONTRIBUTING.md)
- [Issue Tracker](https://github.com/your-org/unigram/issues)

---

## Notes

- This changelog is maintained manually by the development team
- All notable changes should be documented here
- Breaking changes should be clearly marked and explained
- Security fixes should be prioritized and clearly documented
