# Changelog

## [4.11.0] - 2026-07-24

### Added
- Combined "Download & Release Notes" action button in the update dialog.
- Header icons for UpdateDialog and ParserDebugDialog.

### Fixed
- Fixed automatic update modal popup on startup when a new release is available.
- Prevented blank window flash on application launch by holding window visibility until React UI is ready.
- Fixed unexpected focus rings on dialog opening and closing.

### Changed
- Streamlined UpdateDialog by removing release notes details and custom Markdown dependencies.
- Added NOTICE.md for third-party license compliance.

## [4.10.3] - 2026-07-23

### Changed
- Filtered `cookie_store` logs from logger output to reduce log noise.
- Updated documentation structure and feature descriptions in README files.

### CI/CD
- Added GitHub Actions workflows for CI and automated releases.
