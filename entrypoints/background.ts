export default defineBackground(() => {
  // Use browser.runtime for Firefox compatibility, fallback to chrome.runtime
  const runtime = (typeof browser !== 'undefined' && browser.runtime) ? browser.runtime : chrome.runtime;
  
  if (!runtime) {
    console.error('Browser runtime API not available');
    return;
  }

  // Listen for messages from popup
  runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === 'fetchBackgroundImage') {
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
          
          try {
            // Try to fetch the image
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
            
            const response = await fetch(url, { 
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            
            if (!contentType || !contentType.includes('image')) {
              throw new Error(`Expected image content, but received: ${contentType}`);
            }
            
            const blob = await response.blob();
            
            if (blob.size === 0) {
              throw new Error('Received empty blob from server');
            }
            
            const result = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
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
          try {
            sendResponse({ success: true, data: imageData });
          } catch (error) {
            console.warn('Could not send response to content script (likely content script was unloaded):', error);
          }
        })
        .catch(error => {
          console.error('Failed to fetch background image in background script:', error);
          try {
            sendResponse({ success: false, error: error.message });
          } catch (sendError) {
            console.warn('Could not send error response to content script (likely content script was unloaded):', sendError);
          }
        });
      // Return true to indicate we'll send a response asynchronously
      return true;
    }

    // Return false for unrecognized messages
    return false;
  });
});
