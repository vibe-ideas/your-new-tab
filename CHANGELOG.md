# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## 0.1.0

### Added

- Windmill button in bottom right corner for manual background image switching
- Continuous rotation animation for windmill button during image loading
- Loading state indication when fetching new background images
- New tab page with real-time clock and date display
- Google search functionality
- Grid of customizable website shortcuts
- Background image rotation using Unsplash with Picsum fallback
- Daily caching of background images with localStorage
- Customizable bookmarks URL configuration via popup
- Fallback to default gradient background when images fail to load
- Responsive design for different screen sizes
- Icons support for bookmarks in both NewTab and Popup
- Support for direct JSON input in bookmarks functionality
- Customizable bookmarks with responsive design

### Changed

- Moved bookmarks URL configuration from newtab to popup interface
- Replaced Unsplash Source API with Unsplash and Picsum for more reliable image fetching
- Simplified image fetching logic with better error handling
- Enhanced background script messaging and added fallback image sources
- Cleaned up image loading logic and styles in new tab component
- Updated background image source to Unsplash
- Simplified background script and updated new tab images
- Adjusted shortcut icon styles in newtab

### Fixed

- Fixed Unsplash API 503 errors by implementing Picsum fallback
- Improved background image loading with preloading and error handling
- Enhanced fallback mechanisms for both bookmarks and background images
- Updated initial state for image loading in NewTab component
