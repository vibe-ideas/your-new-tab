import React from 'react';
import { createRoot } from 'react-dom/client';
import './newtab.css';
import { getRuntime, sendMessage } from '../../utils/browser';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  category?: string;
  icon?: string; // SVG icon as XML string or URL
}

interface BackgroundImage {
  url: string;
  base64?: string;
  timestamp: number;
}

const NewTab: React.FC = () => {
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [searchQuery, setSearchQuery] = React.useState('');
  const [bookmarks, setBookmarks] = React.useState<Bookmark[]>([]);
  const [backgroundImage, setBackgroundImage] = React.useState<string>('');
  const [isSwitchingImage, setIsSwitchingImage] = React.useState<boolean>(false);
  const [isImageLoading, setIsImageLoading] = React.useState<boolean>(false); // Start with false to show default background initially

  // Default bookmarks as fallback
  const defaultBookmarks: Bookmark[] = [
    { id: '1', title: '有道翻译', url: '#', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20l9-9-9-9-9 9 9 9z"/></svg>' },
    { id: '2', title: '热门榜单', url: '#', icon: 'https://cdn.jsdelivr.net/gh/yeshan333/jsDelivrCDN@main/icons/trending.svg' },
    { id: '3', title: 'labuladong', url: '#', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h20v18H2V3z"/><path d="M9 13v-2h6v2M9 17v-2h6v2M9 9V7h6v2"/></svg>' },
    { id: '4', title: '开发工具箱', url: '#', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>' },
    { id: '5', title: '常用工具', url: '#', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>' },
    { id: '6', title: 'stackoverflow', url: '#', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M4 12h16M8 8l4-4 4 4M8 16l4 4 4-4"/></svg>' },
    { id: '7', title: 'ShanSan', url: '#', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
    { id: '8', title: '牛客网', url: '#', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>' },
    { id: '9', title: 'Discord', url: '#', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 9a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v6a5 5 0 0 0 5 5h4a5 5 0 0 0 5-5V9z"/><circle cx="15" cy="10" r="1"/><circle cx="9" cy="10" r="1"/></svg>' },
    { id: '10', title: '通义', url: '#', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>' },
    { id: '11', title: 'GitHub', url: '#', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>' },
    { id: '12', title: '语雀', url: '#', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12H4M12 4v16"/></svg>' },
    { id: '13', title: 'substack', url: '#', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M3 9h18M9 21V9"/></svg>' },
    { id: '14', title: 'telegram web', url: '#', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 3L3 10.53v.92L21 21l-4.37-9.16L21 3z"/></svg>' },
    { id: '15', title: 'daily.dev', url: '#', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>' },
    { id: '16', title: 'bestblogs', url: '#', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' },
    { id: '17', title: '通义听悟', url: '#', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v4"/><path d="M8 23h8"/></svg>' },
    { id: '18', title: 'MyNotion', url: '#', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>' }
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load bookmarks URL from localStorage on component mount
  React.useEffect(() => {
    const storedUrl = localStorage.getItem('bookmarksUrl');
    const useDefaultBookmarks = localStorage.getItem('useDefaultBookmarks') === 'true';
    const useDirectJson = localStorage.getItem('useDirectJson') === 'true';
    const bookmarksUrl = storedUrl || 'https://cdn.jsdelivr.net/gh/yeshan333/jsDelivrCDN@main/bookmarks.json';
    
    const fetchBookmarks = async () => {
      try {
        // Check if we should use default bookmarks
        if (useDefaultBookmarks) {
          setBookmarks(defaultBookmarks);
          return;
        }
        
        // Check if we should use direct JSON
        if (useDirectJson) {
          const storedJson = localStorage.getItem('bookmarksJson');
          if (storedJson) {
            try {
              const data: Bookmark[] = JSON.parse(storedJson);
              setBookmarks(data);
              
              // Store in localStorage with today's timestamp
              const bookmarksStorage = {
                bookmarks: data,
                timestamp: Date.now()
              };
              localStorage.setItem('bookmarksData', JSON.stringify(bookmarksStorage));
              return;
            } catch (error) {
              console.error('Failed to parse direct JSON bookmarks:', error);
            }
          }
        }
        
        // Check if we have cached bookmarks from today
        const storedBookmarks = localStorage.getItem('bookmarksData');
        if (storedBookmarks) {
          const bookmarksData = JSON.parse(storedBookmarks);
          const today = new Date().toDateString();
          const bookmarksDate = new Date(bookmarksData.timestamp).toDateString();
          
          // If we have today's bookmarks, use them
          if (today === bookmarksDate) {
            setBookmarks(bookmarksData.bookmarks);
            return;
          }
        }
        
        // Fetch new bookmarks from remote URL
        const response = await fetch(bookmarksUrl);
        if (response.ok) {
          const data: Bookmark[] = await response.json();
          setBookmarks(data);
          
          // Store in localStorage with today's timestamp
          const bookmarksStorage = {
            bookmarks: data,
            timestamp: Date.now()
          };
          localStorage.setItem('bookmarksData', JSON.stringify(bookmarksStorage));
        } else {
          // Fallback to default bookmarks if remote fetch fails
          setBookmarks(defaultBookmarks);
        }
      } catch (error) {
        // Fallback to default bookmarks if there's an error
        console.error('Failed to fetch bookmarks:', error);
        setBookmarks(defaultBookmarks);
      }
    };

    fetchBookmarks();
  }, []);
  
  // Function to manually refresh bookmarks
  const refreshBookmarks = async () => {
    const storedUrl = localStorage.getItem('bookmarksUrl');
    const useDefaultBookmarks = localStorage.getItem('useDefaultBookmarks') === 'true';
    const useDirectJson = localStorage.getItem('useDirectJson') === 'true';
    const bookmarksUrl = storedUrl || 'https://cdn.jsdelivr.net/gh/yeshan333/jsDelivrCDN@main/bookmarks.json';
    
    // If using default bookmarks, just set them directly
    if (useDefaultBookmarks) {
      setBookmarks(defaultBookmarks);
      return;
    }
    
    // If using direct JSON, use the stored JSON
    if (useDirectJson) {
      const storedJson = localStorage.getItem('bookmarksJson');
      if (storedJson) {
        try {
          const data: Bookmark[] = JSON.parse(storedJson);
          setBookmarks(data);
          
          // Store in localStorage with current timestamp
          const bookmarksStorage = {
            bookmarks: data,
            timestamp: Date.now()
          };
          localStorage.setItem('bookmarksData', JSON.stringify(bookmarksStorage));
          return;
        } catch (error) {
          console.error('Failed to parse direct JSON bookmarks:', error);
        }
      }
    }
    
    try {
      const response = await fetch(bookmarksUrl);
      if (response.ok) {
        const data: Bookmark[] = await response.json();
        setBookmarks(data);
        
        // Store in localStorage with current timestamp
        const bookmarksStorage = {
          bookmarks: data,
          timestamp: Date.now()
        };
        localStorage.setItem('bookmarksData', JSON.stringify(bookmarksStorage));
      } else {
        // Fallback to default bookmarks if remote fetch fails
        setBookmarks(defaultBookmarks);
      }
    } catch (error) {
      // Fallback to default bookmarks if there's an error
      console.error('Failed to refresh bookmarks:', error);
      setBookmarks(defaultBookmarks);
    }
  };

  // Listen for messages from background script
  React.useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.action === 'refreshBookmarks') {
        refreshBookmarks();
      }
    };

    try {
      const runtime = getRuntime();
      runtime.onMessage.addListener(handleMessage);
      
      // Cleanup listener on component unmount
      return () => {
        runtime.onMessage.removeListener(handleMessage);
      };
    } catch (error) {
      console.error('Failed to set up message listener:', error);
      return () => {}; // Return empty cleanup function
    }
  }, []);
  
  // Set up daily refresh of bookmarks
  React.useEffect(() => {
    // Check if we need to refresh bookmarks (daily)
    const checkAndRefreshBookmarks = () => {
      const storedBookmarks = localStorage.getItem('bookmarksData');
      if (storedBookmarks) {
        const bookmarksData = JSON.parse(storedBookmarks);
        const lastRefresh = new Date(bookmarksData.timestamp);
        const now = new Date();
        const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        // If more than 24 hours have passed since last refresh
        if (now.getTime() - lastRefresh.getTime() > oneDay) {
          refreshBookmarks();
        }
      } else {
        // If no bookmarks data exists, fetch it
        refreshBookmarks();
      }
    };
    
    // Check on component mount
    checkAndRefreshBookmarks();
    
    // Set up daily check
    const interval = setInterval(checkAndRefreshBookmarks, 24 * 60 * 60 * 1000); // 24 hours
    
    return () => clearInterval(interval);
  }, []);

  // Fetch daily background image from Unsplash
  React.useEffect(() => {
    const fetchBackgroundImage = async () => {
      try {
        // Check if we have a cached image
        const storedBackground = localStorage.getItem('backgroundImage');
        if (storedBackground) {
          const backgroundImageData: BackgroundImage = JSON.parse(storedBackground);
          // Use base64 data if available, otherwise use URL
          if (backgroundImageData.base64) {
            setBackgroundImage(backgroundImageData.base64);
            return;
          } else if (backgroundImageData.url) {
            setBackgroundImage(backgroundImageData.url);
            return;
          }
        }
        
        // If no stored image, set loading state and fetch a new image
        setIsImageLoading(true);
        
        // Use Unsplash to get a random image in 2K resolution
        // Fallback to Picsum if Unsplash fails
        const imageUrl = `https://source.unsplash.com/2560x1440/?nature,landscape&t=${Date.now()}`;
        const fallbackUrls = [
          `https://picsum.photos/2560/1440?random&t=${Date.now()}`,
          `https://fastly.picsum.photos/id/${Math.floor(Math.random() * 1000)}/2560/1440.jpg`
        ];
        
        // Fetch image through background script to avoid CORS issues
        try {
          // Create a promise that rejects after 10 seconds
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Background script response timeout')), 10000);
          });
          
          // Fetch image through background script
          console.log('Sending fetchBackgroundImage message to background script with URL:', imageUrl);
          // Use the browser utility for better compatibility
          const fetchPromise = sendMessage({ 
            action: 'fetchBackgroundImage', 
            url: imageUrl,
            fallbackUrls: fallbackUrls
          });
          console.log('Message sent, waiting for response...');
          
          // Race between fetch and timeout
          const response: any = await Promise.race([fetchPromise, timeoutPromise]);
          
          if (response && response.success) {
            const base64Image = response.data;
            
            // Set background image to base64 data
            setBackgroundImage(base64Image);
            setIsImageLoading(false); // Set loading to false when image loads successfully
            
            // Store in localStorage with today's timestamp and base64 data
            const imageData: BackgroundImage = {
              url: imageUrl,
              base64: base64Image,
              timestamp: Date.now()
            };
            localStorage.setItem('backgroundImage', JSON.stringify(imageData));
          } else {
            console.error('Failed to fetch background image through background script:', response);
            // Fallback to default gradient if image fails to load
            setBackgroundImage('');
            setIsImageLoading(false);
          }
        } catch (error) {
          console.error('Failed to fetch background image through background script:', error);
          // Fallback to default gradient if fetch fails
          setBackgroundImage('');
          setIsImageLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch background image:', error);
        // Fallback to default gradient if fetch fails
        setBackgroundImage('');
        setIsImageLoading(false);
      }
    };

    fetchBackgroundImage();
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery.trim())}`;
      window.open(searchUrl, '_blank');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleBookmarkClick = (url: string) => {
    if (url && url !== '#') {
      window.open(url, '_blank');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekday = weekdays[date.getDay()];
    
    return `${year}年${month}月${day}日 ${weekday}`;
  };

  // Group bookmarks into rows of 6
  const groupBookmarksIntoRows = (bookmarks: Bookmark[]) => {
    const rows = [];
    for (let i = 0; i < bookmarks.length; i += 6) {
      rows.push(bookmarks.slice(i, i + 6));
    }
    return rows;
  };

  const bookmarkRows = groupBookmarksIntoRows(bookmarks);

  const containerClass = backgroundImage 
    ? "newtab-container with-background" 
    : "newtab-container";

  const backgroundStyle = backgroundImage 
    ? { 
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    : {};

  const switchImage = () => {
    // Set loading state
    setIsSwitchingImage(true);
    
    // Clear the current cached image to force fetching a new one
    localStorage.removeItem('backgroundImage');
    
    // Fetch a new image
    const fetchNewImage = async () => {
      try {
        // Use Unsplash to get a random image in 2K resolution
        // Fallback to Picsum if Unsplash fails
        const imageUrl = `https://source.unsplash.com/2560x1440/?nature,landscape&t=${Date.now()}`;
        const fallbackUrls = [
          `https://picsum.photos/2560/1440?random&t=${Date.now()}`,
          `https://fastly.picsum.photos/id/${Math.floor(Math.random() * 1000)}/2560/1440.jpg`
        ];
        
        // Fetch image through background script to avoid CORS issues
        try {
          // Create a promise that rejects after 10 seconds
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Background script response timeout')), 10000);
          });
          
          // Fetch image through background script
          console.log('Sending fetchBackgroundImage message to background script with URL:', imageUrl);
          // Use the browser utility for better compatibility
          const fetchPromise = sendMessage({ 
            action: 'fetchBackgroundImage', 
            url: imageUrl,
            fallbackUrls: fallbackUrls
          });
          console.log('Message sent, waiting for response...');
          
          // Race between fetch and timeout
          const response: any = await Promise.race([fetchPromise, timeoutPromise]);
          
          if (response && response.success) {
            const base64Image = response.data;
            
            // Set background image to base64 data (switch happens here after preload)
            setBackgroundImage(base64Image);
            
            // Store in localStorage with current timestamp and base64 data
            const imageData: BackgroundImage = {
              url: imageUrl,
              base64: base64Image,
              timestamp: Date.now()
            };
            localStorage.setItem('backgroundImage', JSON.stringify(imageData));
            
            // Reset loading state
            setIsSwitchingImage(false);
          } else {
            console.error('Failed to fetch background image through background script:', response);
            // Fallback to default gradient if image fails to load
            setBackgroundImage('');
            // Reset loading state
            setIsSwitchingImage(false);
          }
        } catch (error) {
          console.error('Failed to fetch background image through background script:', error);
          // Fallback to default gradient if fetch fails
          setBackgroundImage('');
          // Reset loading state
          setIsSwitchingImage(false);
        }
      } catch (error) {
        console.error('Failed to fetch background image:', error);
        // Fallback to default gradient if fetch fails
        setBackgroundImage('');
        // Reset loading state
        setIsSwitchingImage(false);
      }
    };

    fetchNewImage();
  };

  return (
    <div className={containerClass} style={backgroundStyle}>
      <div className="time-display">
        <div className="time">{formatTime(currentTime)}</div>
        <div className="date">{formatDate(currentTime)}</div>
      </div>
      
      <div className="search-container">
        <div className="search-box">
          <div className="google-logo">G</div>
          <input 
            type="text" 
            placeholder="输入并搜索..."
            className="search-input"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          <button className="search-button" onClick={handleSearch}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 21L16.514 16.506M19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="shortcuts-grid">
        {bookmarkRows.map((row, rowIndex) => (
          <div key={rowIndex} className="shortcuts-row">
            {row.map((bookmark) => (
              <div 
                key={bookmark.id} 
                className="shortcut-item"
                onClick={() => handleBookmarkClick(bookmark.url)}
              >
                <div className="shortcut-icon">
                  {bookmark.icon ? (
                    bookmark.icon.startsWith('<svg') ? (
                      // Render SVG XML directly
                      <div dangerouslySetInnerHTML={{ __html: bookmark.icon }} />
                    ) : (
                      // Render icon as URL
                      <img src={bookmark.icon} alt={bookmark.title} />
                    )
                  ) : (
                    // Fallback to first letter of title
                    bookmark.title.charAt(0)
                  )}
                </div>
                <div className="shortcut-label">{bookmark.title}</div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Windmill button for switching images */}
      <button 
        className={`windmill-button ${isSwitchingImage ? 'loading' : ''}`} 
        onClick={switchImage}
        disabled={isSwitchingImage}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
};

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<NewTab />);
}
