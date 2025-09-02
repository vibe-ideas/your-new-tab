import React from 'react';
import { createRoot } from 'react-dom/client';
import './newtab.css';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  category?: string;
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
  const [isImageLoading, setIsImageLoading] = React.useState<boolean>(true); // Start with loading state

  // Default bookmarks as fallback
  const defaultBookmarks: Bookmark[] = [
    { id: '1', title: '有道翻译', url: '#' },
    { id: '2', title: '热门榜单', url: '#' },
    { id: '3', title: 'labuladong', url: '#' },
    { id: '4', title: '开发工具箱', url: '#' },
    { id: '5', title: '常用工具', url: '#' },
    { id: '6', title: 'stackoverflow', url: '#' },
    { id: '7', title: 'ShanSan', url: '#' },
    { id: '8', title: '牛客网', url: '#' },
    { id: '9', title: 'Discord', url: '#' },
    { id: '10', title: '通义', url: '#' },
    { id: '11', title: 'GitHub', url: '#' },
    { id: '12', title: '语雀', url: '#' },
    { id: '13', title: 'substack', url: '#' },
    { id: '14', title: 'telegram web', url: '#' },
    { id: '15', title: 'daily.dev', url: '#' },
    { id: '16', title: 'bestblogs', url: '#' },
    { id: '17', title: '通义听悟', url: '#' },
    { id: '18', title: 'MyNotion', url: '#' }
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
    const bookmarksUrl = storedUrl || 'https://cdn.jsdelivr.net/gh/yeshan333/jsDelivrCDN@main/bookmarks.json';
    
    const fetchBookmarks = async () => {
      try {
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
    const bookmarksUrl = storedUrl || 'https://cdn.jsdelivr.net/gh/yeshan333/jsDelivrCDN@main/bookmarks.json';
    
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

    chrome.runtime.onMessage.addListener(handleMessage);
    
    // Cleanup listener on component unmount
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
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

  // Fetch daily background image from picsum.photos
  React.useEffect(() => {
    const fetchBackgroundImage = async () => {
      try {
        // Check if we have a cached image from today
        const storedBackground = localStorage.getItem('backgroundImage');
        if (storedBackground) {
          const backgroundImageData: BackgroundImage = JSON.parse(storedBackground);
          const today = new Date().toDateString();
          const imageDate = new Date(backgroundImageData.timestamp).toDateString();
          
          // If we have today's image, use it
          if (today === imageDate) {
            // Use base64 data if available, otherwise use URL
            if (backgroundImageData.base64) {
              setBackgroundImage(backgroundImageData.base64);
            } else {
              setBackgroundImage(backgroundImageData.url);
            }
            return;
          }
        }
        
        // Use picsum.photos to get a random image in 2K resolution
        const imageUrl = `https://picsum.photos/2560/1440?random=${Date.now()}`;
        
        // Preload the image to ensure it's available
        const img = new Image();
        img.onload = async () => {
          // Convert image to base64
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const base64 = canvas.toDataURL('image/jpeg', 0.7);
            
            // Set background image to base64
            setBackgroundImage(base64);
            setIsImageLoading(false); // Set loading to false when image loads successfully
            
            // Store in localStorage with today's timestamp and base64 data
            const imageData: BackgroundImage = {
              url: imageUrl,
              base64: base64,
              timestamp: Date.now()
            };
            localStorage.setItem('backgroundImage', JSON.stringify(imageData));
          } else {
            // Fallback to URL if canvas conversion fails
            setBackgroundImage(imageUrl);
            setIsImageLoading(false); // Set loading to false when image loads successfully
            
            // Store in localStorage with today's timestamp
            const imageData: BackgroundImage = {
              url: imageUrl,
              timestamp: Date.now()
            };
            localStorage.setItem('backgroundImage', JSON.stringify(imageData));
          }
        };
        
        img.onerror = () => {
          // Fallback to default gradient if image fails to load
          setBackgroundImage('');
          setIsImageLoading(false); // Set loading to false even if image fails to load
        };
        
        img.src = imageUrl;
        setIsImageLoading(true); // Set loading to true when starting to fetch new image
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

  const containerClass = isImageLoading
    ? "newtab-container loading" 
    : backgroundImage 
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
        // Use picsum.photos to get a random image in 2K resolution
        const imageUrl = `https://picsum.photos/2560/1440?random=${Date.now()}`;
        
        // Preload the image to ensure it's available
        const img = new Image();
        img.onload = async () => {
          // Convert image to base64
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const base64 = canvas.toDataURL('image/jpeg', 0.7);
            
            // Set background image to base64
            setBackgroundImage(base64);
            setIsImageLoading(false); // Set loading to false when image loads successfully
            
            // Store in localStorage with current timestamp and base64 data
            const imageData: BackgroundImage = {
              url: imageUrl,
              base64: base64,
              timestamp: Date.now()
            };
            localStorage.setItem('backgroundImage', JSON.stringify(imageData));
          } else {
            // Fallback to URL if canvas conversion fails
            setBackgroundImage(imageUrl);
            setIsImageLoading(false); // Set loading to false when image loads successfully
            
            // Store in localStorage with current timestamp
            const imageData: BackgroundImage = {
              url: imageUrl,
              timestamp: Date.now()
            };
            localStorage.setItem('backgroundImage', JSON.stringify(imageData));
          }
          
          // Reset loading state
          setIsSwitchingImage(false);
        };
        
        img.onerror = () => {
          // Fallback to default gradient if image fails to load
          setBackgroundImage('');
          setIsImageLoading(false); // Set loading to false even if image fails to load
          // Reset loading state
          setIsSwitchingImage(false);
        };
        
        img.src = imageUrl;
        setIsImageLoading(true); // Set loading to true when starting to fetch new image
      } catch (error) {
        console.error('Failed to fetch background image:', error);
        // Fallback to default gradient if fetch fails
        setBackgroundImage('');
        setIsImageLoading(false);
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
                <div className="shortcut-icon">{bookmark.title}</div>
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
