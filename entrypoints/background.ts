export default defineBackground(() => {
  console.log('Background script loaded!');

  // Use browser.runtime for Firefox compatibility, fallback to chrome.runtime
  const runtime = (typeof browser !== 'undefined' && browser.runtime) ? browser.runtime : chrome.runtime;
  
  if (!runtime) {
    console.error('Browser runtime API not available');
    return;
  }

  // Listen for messages from popup
  runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log('Background script received message:', message);
    
    if (message.action === 'refreshBookmarks') {
      console.log('Handling refreshBookmarks action');
      // Send message to all tabs to refresh bookmarks
      const tabsAPI = (typeof browser !== 'undefined' && browser.tabs) ? browser.tabs : chrome.tabs;
      tabsAPI.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            tabsAPI.sendMessage(tab.id, { action: 'refreshBookmarks' });
          }
        });
      });
      return false; // Synchronous response
    } else if (message.action === 'fetchBackgroundImage') {
      console.log('Handling fetchBackgroundImage action with URL:', message.url);
      // Handle background image fetching in the background script to avoid CORS issues
      // Try primary URL first, then fallback URLs
      const urls = [message.url];
      if (message.fallbackUrls && Array.isArray(message.fallbackUrls)) {
        urls.push(...message.fallbackUrls);
      }
      
      // Define the fetch function inline to avoid scope issues
      async function fetchBackgroundImageWithFallback(urls: string[]): Promise<string> {
        for (let i = 0; i < urls.length; i++) {
          const url = urls[i];
          console.log(`Attempting to fetch background image from URL (${i+1}/${urls.length}):`, url);
          
          try {
            console.log('Starting to fetch background image from URL:', url);
            
            // Try to fetch the image
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
            
            console.log('Making fetch request with timeout...');
            const response = await fetch(url, { 
              signal: controller.signal,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });
            clearTimeout(timeoutId);
            
            console.log('Received response from fetch, status:', response.status, 'statusText:', response.statusText);
            
            // Log response headers for debugging
            console.log('Response headers:');
            response.headers.forEach((value, key) => {
              console.log(`${key}: ${value}`);
            });
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            console.log('Content-Type:', contentType);
            
            if (!contentType || !contentType.includes('image')) {
              throw new Error(`Expected image content, but received: ${contentType}`);
            }
            
            const blob = await response.blob();
            console.log('Successfully fetched blob, size:', blob.size, 'type:', blob.type);
            
            if (blob.size === 0) {
              throw new Error('Received empty blob from server');
            }
            
            console.log('Converting blob to base64');
            const result = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                console.log('Successfully converted blob to base64, length:', (reader.result as string).length);
                resolve(reader.result as string);
              };
              reader.onerror = (error) => {
                console.error('Error reading blob as base64:', error);
                reject(new Error(`Failed to read blob as base64: ${error}`));
              };
              reader.readAsDataURL(blob);
            });
            
            // If we successfully fetched an image, return it
            return result;
          } catch (error: any) {
            console.error(`Error fetching background image from ${url}:`, error);
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            
            if (error.name === 'AbortError') {
              console.error('Fetch request timed out after 15 seconds');
            }
            
            // Try to get more details about network errors
            if (error instanceof TypeError && error.message.includes('fetch')) {
              console.error('This appears to be a network connectivity issue or CORS restriction');
            }
            
            // If this is the last URL, throw the error
            if (i === urls.length - 1) {
              throw new Error(`Failed to fetch image from all sources. Last error: ${error.message}`);
            }
            
            // Otherwise, continue to the next fallback URL
            console.log('Trying next fallback URL...');
          }
        }
        
        // This should never be reached, but just in case
        throw new Error('Failed to fetch background image from any source');
      }
      
      fetchBackgroundImageWithFallback(urls)
        .then(imageData => {
          console.log('Successfully fetched background image, sending response');
          try {
            console.log('About to send success response to content script');
            sendResponse({ success: true, data: imageData });
            console.log('Successfully sent success response to content script');
          } catch (error) {
            console.warn('Could not send response to content script (likely content script was unloaded):', error);
          }
        })
        .catch(error => {
          console.error('Failed to fetch background image in background script:', error);
          try {
            console.log('About to send error response to content script');
            sendResponse({ success: false, error: error.message });
            console.log('Successfully sent error response to content script');
          } catch (sendError) {
            console.warn('Could not send error response to content script (likely content script was unloaded):', sendError);
          }
        });
      // Return true to indicate we'll send a response asynchronously
      console.log('Returning true to indicate async response');
      return true;
    } else {
      console.log('Unrecognized message action:', message.action);
    }
    // Return false for unrecognized messages
    return false;
  });
});