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
  // Search providers state
  interface SearchProvider {
    id: string;
    name: string;
    urlTemplate?: string; // e.g. 'https://metaso.cn/?q={query}'
    baseUrl?: string; // legacy support
    capability?: 'stable' | 'experimental' | 'manual';
    enabled?: boolean;
    autoSubmit?: boolean;
    useProxy?: boolean;
    iconSvg?: string;
  }

  const defaultProviders: SearchProvider[] = [
    {
      id: 'google',
      name: 'Google',
      urlTemplate: 'https://www.google.com/search?q={query}&udm=50',
      capability: 'stable',
      enabled: true,
      autoSubmit: true,
      useProxy: false
      , iconSvg: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g1" x1="0%" x2="100%"><stop offset="0%" stop-color="#4285F4"/><stop offset="50%" stop-color="#34A853"/><stop offset="75%" stop-color="#FBBC05"/><stop offset="100%" stop-color="#EA4335"/></linearGradient></defs><circle cx="24" cy="24" r="22" fill="url(#g1)"/><text x="24" y="30" font-size="20" font-family="Arial, Helvetica, sans-serif" font-weight="700" text-anchor="middle" fill="#fff">G</text></svg>`
    },
    {
      id: 'metaso',
      name: 'Metaso',
      urlTemplate: 'https://metaso.cn/?q={query}',
      capability: 'stable',
      enabled: true,
      autoSubmit: true,
      useProxy: false
      , iconSvg: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="22" fill="#6f42c1"/><text x="24" y="31" font-size="18" font-family="Arial, Helvetica, sans-serif" font-weight="700" text-anchor="middle" fill="#fff">M</text></svg>`
    }
  ];

  const [providers, setProviders] = React.useState<SearchProvider[]>(() => {
    try {
      const raw = localStorage.getItem('searchProviders');
      if (raw) return JSON.parse(raw) as SearchProvider[];
    } catch (e) {
      console.warn('Failed to parse searchProviders from localStorage', e);
    }
    return defaultProviders;
  });

  const [selectedProviderId, setSelectedProviderId] = React.useState<string>(() => {
    try {
      return localStorage.getItem('lastSearchProvider') || localStorage.getItem('defaultSearchProvider') || 'google';
    } catch (e) {
      return 'google';
    }
  });

  const [showProviderMenu, setShowProviderMenu] = React.useState<boolean>(false);
  const providerIconRef = React.useRef<HTMLDivElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  // Close provider menu when clicking outside
  React.useEffect(() => {
    if (!showProviderMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        providerIconRef.current && !providerIconRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setShowProviderMenu(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowProviderMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showProviderMenu]);

  const handleProviderSelect = (providerId: string) => {
    setSelectedProviderId(providerId);
    setShowProviderMenu(false);
    try {
      localStorage.setItem('lastSearchProvider', providerId);
    } catch (e) {
      // ignore
    }
  };

  // Default bookmarks as fallback - using example-bookmarks-with-icons.json data
  const defaultBookmarks: Bookmark[] = [
    {
      id: '1',
      title: 'ShanSan',
      url: 'https://shansan.top/',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
    },
    {
      id: '2',
      title: 'vscode-blog',
      url: 'https://code.visualstudio.com/blogs',
      icon: '<svg t="1756912815338" class="icon" viewBox="0 0 1027 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="10955" width="200" height="200"><path d="M769.853003 0v879.449982L1.953432 765.394768l767.899571 258.573725 255.994093-106.489604V122.365176l0.082706-0.039384-0.082706-0.165411v-15.6629l-255.994093-106.493543z" fill="#007ACC" p-id="10956"></path><path d="M501.126159 149.827435L265.926663 382.32127 124.31467 275.678069l-58.358777 19.494935 144.065599 142.411483-144.065599 142.403606 58.358777 19.494934 141.604116-106.651077h0.007877l235.187681 232.48202 140.867641-59.851419V209.678854l-140.859765-59.851419z m-0.007877 165.88811v243.706376l-161.811897-121.853188 161.811897-121.853188z" fill="#007ACC" p-id="10957"></path></svg>'
    },
    {
      id: '3',
      title: 'Telegram',
      url: 'https://web.telegram.org/a/',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 64 64"><path d="M32,10c12.15,0,22,9.85,22,22s-9.85,22-22,22s-22-9.85-22-22S19.85,10,32,10z M39.589,40.968c0.404-1.241,2.301-13.615,2.534-16.054c0.071-0.738-0.163-1.229-0.619-1.449c-0.553-0.265-1.371-0.133-2.322,0.21c-1.303,0.47-17.958,7.541-18.92,7.951c-0.912,0.388-1.775,0.81-1.775,1.423c0,0.431,0.256,0.673,0.96,0.924c0.732,0.261,2.577,0.82,3.668,1.121c1.05,0.29,2.243,0.038,2.913-0.378c0.709-0.441,8.901-5.921,9.488-6.402c0.587-0.48,1.056,0.135,0.576,0.616c-0.48,0.48-6.102,5.937-6.844,6.693c-0.901,0.917-0.262,1.868,0.343,2.249c0.689,0.435,5.649,3.761,6.396,4.295c0.747,0.534,1.504,0.776,2.198,0.776C38.879,42.942,39.244,42.028,39.589,40.968z"></path></svg>'
    },
    {
      id: '4',
      title: 'daily.dev',
      url: 'https://app.daily.dev/',
      icon: '<svg t="1756912723086" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9967" width="200" height="200"><path d="M512 512m-512 0a512 512 0 1 0 1024 0 512 512 0 1 0-1024 0Z" fill="#8CA8E6" p-id="9968"></path><path d="M350.464 325.412571c14.628571 0 26.441143-9.947429 26.441143-22.125714V241.517714c0-12.178286-11.812571-22.089143-26.441143-22.089143-14.628571 0-26.404571 9.874286-26.404571 22.089143v61.769143c0 12.178286 11.849143 22.125714 26.404571 22.125714z m162.121143 0c14.628571 0 26.404571-9.947429 26.404571-22.125714V241.517714c0-12.178286-11.849143-22.089143-26.404571-22.089143-14.628571 0-26.441143 9.874286-26.441143 22.089143v61.769143c0 12.178286 11.812571 22.125714 26.441143 22.125714z m207.250286-49.115428c5.010286 6.765714 7.936 14.701714 7.936 23.222857 0 24.502857-23.771429 44.397714-53.138286 44.397714s-53.138286-19.858286-53.138286-44.397714c0-8.521143 2.925714-16.457143 7.936-23.222857v-32.182857h-71.68v32.182857c5.010286 6.765714 7.936 14.701714 7.936 23.222857 0 24.502857-23.771429 44.397714-53.101714 44.397714-29.366857 0-53.174857-19.858286-53.174857-44.397714 0-8.521143 2.925714-16.457143 7.936-23.222857v-32.182857h-71.68v32.182857c4.973714 6.765714 7.936 14.701714 7.936 23.222857 0 24.502857-23.808 44.397714-53.174857 44.397714-29.330286 0-53.065143-19.894857-53.065143-44.397714 0-8.521143 2.925714-16.457143 7.899428-23.222857v-32.182857H292.571429a36.571429 36.571429 0 0 0-36.571429 36.571428V768a36.571429 36.571429 0 0 0 36.937143 36.571429l438.857143-4.498286a36.571429 36.571429 0 0 0 36.205714-36.571429V280.649143a36.571429 36.571429 0 0 0-36.571429-36.571429h-11.593142v32.219429zM341.321143 652.178286c0-14.08 11.410286-25.453714 25.490286-25.453715h290.377142a25.453714 25.453714 0 0 1 0 50.907429h-290.377142a25.453714 25.453714 0 0 1-25.453715-25.453714z m0-101.814857c0-14.08 11.410286-25.490286 25.490286-25.490286h290.377142a25.453714 25.453714 0 1 1 0 50.907429h-290.377142a25.453714 25.453714 0 0 1-25.453715-25.453714z m0-101.778286c0-14.08 11.410286-25.490286 25.490286-25.490285h290.377142a25.453714 25.453714 0 1 1 0 50.907428h-290.377142a25.453714 25.453714 0 0 1-25.453715-25.453714zM365.811429 447.634286h290.377142a25.453714 25.453714 0 1 1 0 50.907428h-290.377142a25.453714 25.453714 0 0 1 0-50.907428z" fill="#FFFFFF" p-id="9969"></path></svg>'
    },
    {
      id: '5',
      title: 'GitHub',
      url: 'https://github.com',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>'
    },
    {
      id: '6',
      title: 'Stack Overflow',
      url: 'https://stackoverflow.com',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 48 48"><path fill="#607D8B" d="M9 28H12V42H9z"></path><path fill="#607D8B" d="M9 39H35V42H9z"></path><path fill="#607D8B" d="M32 28H35V42H32zM15 34H29V37H15z"></path><path fill="#A68A6E" d="M14.88 29H28.880000000000003V32H14.88z" transform="rotate(6.142 21.88 30.5)"></path><path fill="#EF6C00" d="M29.452 11.646H43.451V14.647H29.452z" transform="rotate(81.234 36.453 13.148)"></path><path fill="#FF9800" d="M23.576 13.578H37.574V16.579H23.576z" transform="rotate(60.79 30.576 15.079)"></path><path fill="#D38B28" d="M18.395 18.275H32.393V21.276H18.395z" transform="rotate(34.765 25.396 19.777)"></path><path fill="#C09553" d="M15.977 23.499H29.976V26.5H15.977z" transform="rotate(19.785 22.978 25.003)"></path></svg>'
    }
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
      } else if (message.action === 'refreshSearchConfig') {
        // Reload providers from localStorage
        try {
          const raw = localStorage.getItem('searchProviders');
          if (raw) {
            const parsed = JSON.parse(raw) as SearchProvider[];
            setProviders(parsed);
          }
          const last = localStorage.getItem('lastSearchProvider');
          if (last) setSelectedProviderId(last);
        } catch (e) {
          console.warn('Failed to reload searchProviders from localStorage', e);
        }
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

    const handleSearch = async () => {
    if (searchQuery.trim()) {
      const provider = providers.find(p => p.id === selectedProviderId) || providers[0];
    const buildSearchUrl = (p: any, q: string) => {
      const query = encodeURIComponent(q.trim());
      if (p.urlTemplate) {
        return p.urlTemplate.replace('{query}', query);
      }
      if (p.baseUrl) {
        return `${p.baseUrl}?q=${query}`;
      }
        // Fallback to Google search
        return `https://www.google.com/search?q=${query}&udm=50`;
    };

      const url = buildSearchUrl(provider, searchQuery);

      // Remember last used provider
      try {
        localStorage.setItem('lastSearchProvider', provider.id);
      } catch (e) {
        // ignore
      }

      // If provider is manual, open provider home and copy query to clipboard
      if (provider.capability === 'manual') {
        // Open provider homepage if available
        if (provider.baseUrl) {
          window.open(provider.baseUrl, '_blank');
        } else if (provider.urlTemplate) {
          const homepage = provider.urlTemplate.split('?')[0];
          window.open(homepage, '_blank');
        }

        try {
          navigator.clipboard.writeText(searchQuery.trim()).catch(() => {});
          alert('已复制查询内容到剪贴板，请在目标站点粘贴并搜索');
        } catch (e) {
          // ignore clipboard failures
        }
        return;
      }

      // If provider requests proxy, fetch HTML via background and render
      if (provider.useProxy) {
        try {
          const resp: any = await sendMessage({ action: 'fetchSearchProxy', url });
          if (resp && resp.success && resp.data) {
            // open a new window and write the returned HTML
            const w = window.open();
            if (w && w.document) {
              w.document.open();
              w.document.write(resp.data);
              w.document.close();
            } else {
              // fallback: open direct URL
              window.open(url, '_blank');
            }
          } else {
            // fallback to direct open
            window.open(url, '_blank');
          }
        } catch (e) {
          console.error('Proxy fetch failed, falling back to direct open', e);
          window.open(url, '_blank');
        }

        return;
      }

      window.open(url, '_blank');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
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
          <div
            ref={providerIconRef}
            className="search-provider-icon"
            role="button"
            aria-haspopup="listbox"
            aria-expanded={showProviderMenu}
            aria-label="切换搜索提供商"
            tabIndex={0}
            onClick={() => setShowProviderMenu(prev => !prev)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowProviderMenu(prev => !prev);
              }
            }}
          >
            {(() => {
              const p = providers.find(x => x.id === selectedProviderId) || providers[0];
              if (p && p.iconSvg) return <span dangerouslySetInnerHTML={{ __html: p.iconSvg }} />;
              return <div className="google-logo">G</div>;
            })()}
          </div>
          <select
            className="search-provider-select"
            value={selectedProviderId}
            onChange={(e) => {
              const v = e.target.value;
              setSelectedProviderId(v);
              try { localStorage.setItem('lastSearchProvider', v); } catch (err) {}
            }}
            aria-hidden="true"
            tabIndex={-1}
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }}
          >
            {providers.filter(p => p.enabled !== false).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {showProviderMenu && (
            <div ref={popoverRef} className="provider-popover" role="listbox">
              {providers.filter(p => p.enabled !== false).map((p) => (
                <div
                  key={p.id}
                  className={`provider-popover-item${p.id === selectedProviderId ? ' active' : ''}`}
                  role="option"
                  aria-selected={p.id === selectedProviderId}
                  onClick={() => handleProviderSelect(p.id)}
                >
                  {p.iconSvg && <span className="provider-option-icon" dangerouslySetInnerHTML={{ __html: p.iconSvg }} />}
                  <span className="provider-option-name">{p.name}</span>
                </div>
              ))}
            </div>
          )}
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
