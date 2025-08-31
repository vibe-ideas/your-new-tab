import React from 'react';
import { createRoot } from 'react-dom/client';
import './newtab.css';

const NewTab: React.FC = () => {
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery.trim())}`;
      window.open(searchUrl, '_blank');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
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

  return (
    <div className="newtab-container">
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
            onKeyPress={handleKeyPress}
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
        <div className="shortcuts-row">
          <div className="shortcut-item">
            <div className="shortcut-icon">有道翻译</div>
            <div className="shortcut-label">有道翻译</div>
          </div>
          <div className="shortcut-item">
            <div className="shortcut-icon">热门榜单</div>
            <div className="shortcut-label">热门榜单</div>
          </div>
          <div className="shortcut-item">
            <div className="shortcut-icon">labuladong</div>
            <div className="shortcut-label">labuladong...</div>
          </div>
          <div className="shortcut-item">
            <div className="shortcut-icon">开发工具箱</div>
            <div className="shortcut-label">开发工具箱</div>
          </div>
          <div className="shortcut-item">
            <div className="shortcut-icon">常用工具</div>
            <div className="shortcut-label">常用工具</div>
          </div>
          <div className="shortcut-item">
            <div className="shortcut-icon">stackoverflow</div>
            <div className="shortcut-label">stackoverflow</div>
          </div>
        </div>
        
        <div className="shortcuts-row">
          <div className="shortcut-item">
            <div className="shortcut-icon">ShanSan</div>
            <div className="shortcut-label">ShanSan</div>
          </div>
          <div className="shortcut-item">
            <div className="shortcut-icon">牛客网</div>
            <div className="shortcut-label">牛客网</div>
          </div>
          <div className="shortcut-item">
            <div className="shortcut-icon">Discord</div>
            <div className="shortcut-label">Discord</div>
          </div>
          <div className="shortcut-item">
            <div className="shortcut-icon">通义</div>
            <div className="shortcut-label">通义</div>
          </div>
          <div className="shortcut-item">
            <div className="shortcut-icon">GitHub</div>
            <div className="shortcut-label">GitHub</div>
          </div>
          <div className="shortcut-item">
            <div className="shortcut-icon">语雀</div>
            <div className="shortcut-label">语雀</div>
          </div>
        </div>
        
        <div className="shortcuts-row">
          <div className="shortcut-item">
            <div className="shortcut-icon">substack</div>
            <div className="shortcut-label">substack</div>
          </div>
          <div className="shortcut-item">
            <div className="shortcut-icon">telegram web</div>
            <div className="shortcut-label">telegram web</div>
          </div>
          <div className="shortcut-item">
            <div className="shortcut-icon">daily.dev</div>
            <div className="shortcut-label">daily.dev</div>
          </div>
          <div className="shortcut-item">
            <div className="shortcut-icon">bestblogs</div>
            <div className="shortcut-label">bestblogs</div>
          </div>
          <div className="shortcut-item">
            <div className="shortcut-icon">通义听悟</div>
            <div className="shortcut-label">通义听悟</div>
          </div>
          <div className="shortcut-item">
            <div className="shortcut-icon">MyNotion</div>
            <div className="shortcut-label">MyNotion</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<NewTab />);
}
