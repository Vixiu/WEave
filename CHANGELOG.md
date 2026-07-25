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

<details><summary>Detailed Changelog</summary>

### Added
- feat(updater): Improve update dialog, auto-check flow and focus handling ([edc286c](https://github.com/psyattack/WEave/commit/edc286c))

### Changed
- chore(release): bump version to 4.11.0 ([3ec8041](https://github.com/psyattack/WEave/commit/3ec8041))
- style(pagination): Improve spacing around page slash separator ([1ca2259](https://github.com/psyattack/WEave/commit/1ca2259))
- style(ui): Remove focus outline from selects and tooltip from hotkeys ([2fb28dd](https://github.com/psyattack/WEave/commit/2fb28dd))
- refactor(dialogs): Update Legal and Info dialogs and add NOTICE.md ([73607bc](https://github.com/psyattack/WEave/commit/73607bc))
- chore: remove knip from repository ([1189551](https://github.com/psyattack/WEave/commit/1189551))

### Fixed
- fix(window): Prevent blank window flash on app startup ([406ff22](https://github.com/psyattack/WEave/commit/406ff22))

</details>

## [4.10.3] - 2026-07-23

### Changed
- Filtered `cookie_store` logs from logger output to reduce log noise.
- Updated documentation structure and feature descriptions in README files.

### CI/CD
- Added GitHub Actions workflows for CI and automated releases.

<details><summary>Detailed Changelog</summary>

### Changed
- chore(release): bump version to 4.10.3 ([78219c8](https://github.com/psyattack/WEave/commit/78219c8))
- ci(release): skip version header in generated release body ([eac2d0a](https://github.com/psyattack/WEave/commit/eac2d0a))
- chore(release): bump version to 4.10.2 ([bfa471d](https://github.com/psyattack/WEave/commit/bfa471d))
- ci: add GitHub Actions workflows for CI and release ([ed6ce39](https://github.com/psyattack/WEave/commit/ed6ce39))
- docs(readme): Update features description and formatting ([9b68fb1](https://github.com/psyattack/WEave/commit/9b68fb1))
- chore: Update documentation structure and filter cookie store logs ([dde6819](https://github.com/psyattack/WEave/commit/dde6819))

</details>
