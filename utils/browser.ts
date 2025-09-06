/**
 * Browser compatibility utility
 * Provides consistent API access across Chrome and Firefox
 */

// Type definitions for browser compatibility
declare global {
  interface Window {
    browser: typeof chrome | undefined;
  }
}

/**
 * Get the runtime API (browser.runtime for Firefox, chrome.runtime for Chrome)
 */
export function getRuntime() {
  if (typeof browser !== 'undefined' && browser.runtime) {
    return browser.runtime;
  }
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    return chrome.runtime;
  }
  throw new Error('Browser runtime API not available');
}

/**
 * Get the tabs API (browser.tabs for Firefox, chrome.tabs for Chrome)
 */
export function getTabs() {
  if (typeof browser !== 'undefined' && browser.tabs) {
    return browser.tabs;
  }
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    return chrome.tabs;
  }
  throw new Error('Browser tabs API not available');
}

/**
 * Get the storage API (browser.storage for Firefox, chrome.storage for Chrome)
 */
export function getStorage() {
  if (typeof browser !== 'undefined' && browser.storage) {
    return browser.storage;
  }
  if (typeof chrome !== 'undefined' && chrome.storage) {
    return chrome.storage;
  }
  throw new Error('Browser storage API not available');
}

/**
 * Send a message to the background script with proper error handling
 */
export async function sendMessage(message: any): Promise<any> {
  try {
    const runtime = getRuntime();
    
    // Firefox uses a different message passing API
    if (typeof browser !== 'undefined') {
      return await runtime.sendMessage(message);
    } else {
      // Chrome-style callback-based API
      return new Promise((resolve, reject) => {
        runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
    }
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
}

/**
 * Check if the current browser is Firefox
 */
export function isFirefox(): boolean {
  return typeof browser !== 'undefined' && browser.runtime !== undefined;
}

/**
 * Check if the current browser is Chrome/Chromium
 */
export function isChrome(): boolean {
  return typeof chrome !== 'undefined' && chrome.runtime !== undefined && !isFirefox();
}