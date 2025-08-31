# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

- Windmill button in bottom right corner for manual background image switching
- Continuous rotation animation for windmill button during image loading
- Loading state indication when fetching new background images
- New tab page with real-time clock and date display
- Google search functionality
- Grid of customizable website shortcuts
- Background image rotation using picsum.photos
- Daily caching of background images with localStorage
- Customizable bookmarks URL configuration via popup
- Fallback to default gradient background when images fail to load
- Responsive design for different screen sizes

### Changed

- Moved bookmarks URL configuration from newtab to popup interface
- Replaced Unsplash Source API with picsum.photos for more reliable image fetching
- Simplified image fetching logic with better error handling

### Fixed

- Fixed Unsplash API 503 errors by switching to picsum.photos
- Improved background image loading with preloading and error handling
- Enhanced fallback mechanisms for both bookmarks and background images
