export default defineBackground(() => {
  console.log('Hello background!');

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'refreshBookmarks') {
      // Send message to all tabs to refresh bookmarks
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { action: 'refreshBookmarks' });
          }
        });
      });
    }
  });
});
