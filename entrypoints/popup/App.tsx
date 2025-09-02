import { useState, useEffect } from 'react';
import reactLogo from '@/assets/react.svg';
import wxtLogo from '/wxt.svg';
import './App.css';

function App() {
  const [bookmarksUrl, setBookmarksUrl] = useState('https://cdn.jsdelivr.net/gh/yeshan333/jsDelivrCDN@main/bookmarks.json');
  const [inputUrl, setInputUrl] = useState('');
  const [status, setStatus] = useState('');

  // Load bookmarks URL from localStorage on component mount
  useEffect(() => {
    const storedUrl = localStorage.getItem('bookmarksUrl');
    if (storedUrl) {
      setBookmarksUrl(storedUrl);
      setInputUrl(storedUrl);
    } else {
      setInputUrl(bookmarksUrl);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('bookmarksUrl', inputUrl);
    setBookmarksUrl(inputUrl);
    setStatus('URL 已保存');
    setTimeout(() => setStatus(''), 3000);
  };

  const handleReset = () => {
    const defaultUrl = 'https://cdn.jsdelivr.net/gh/yeshan333/jsDelivrCDN@main/bookmarks.json';
    localStorage.setItem('bookmarksUrl', defaultUrl);
    setBookmarksUrl(defaultUrl);
    setInputUrl(defaultUrl);
    setStatus('已重置为默认 URL');
    setTimeout(() => setStatus(''), 3000);
  };

  const handleTest = async () => {
    try {
      const response = await fetch(inputUrl);
      if (response.ok) {
        setStatus('URL 可访问');
      } else {
        setStatus('URL 无法访问');
      }
    } catch (error) {
      setStatus('URL 无法访问');
    }
    setTimeout(() => setStatus(''), 3000);
  };

  return (
    <>
      <div>
        <a href="https://wxt.dev" target="_blank">
          <img src={wxtLogo} className="logo" alt="WXT logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>书签配置</h1>
      <div className="card">
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="bookmarksUrl" style={{ display: 'block', marginBottom: '5px' }}>
            书签 JSON URL:
          </label>
          <input
            id="bookmarksUrl"
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="输入书签 JSON 文件的 URL"
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              marginBottom: '10px'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={handleSave} style={{ flex: 1, minWidth: '80px' }}>
            保存
          </button>
          <button onClick={handleReset} style={{ flex: 1, minWidth: '80px' }}>
            重置
          </button>
          <button onClick={handleTest} style={{ flex: 1, minWidth: '80px' }}>
            测试
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button 
            onClick={() => {
              // Send message to background script to refresh bookmarks
              chrome.runtime.sendMessage({ action: 'refreshBookmarks' });
              setStatus('书签已刷新');
              setTimeout(() => setStatus(''), 3000);
            }} 
            style={{ flex: 1, minWidth: '80px' }}
          >
            刷新书签
          </button>
        </div>
        {status && (
          <p style={{ 
            marginTop: '10px', 
            padding: '8px', 
            borderRadius: '4px', 
            backgroundColor: status.includes('无法') ? '#f8d7da' : '#d4edda',
            color: status.includes('无法') ? '#721c24' : '#155724',
            textAlign: 'center'
          }}>
            {status}
          </p>
        )}
        <p style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
          当前使用的 URL: <br />
          <code style={{ wordBreak: 'break-all' }}>{bookmarksUrl}</code>
        </p>
      </div>
      <p className="read-the-docs">
        配置书签 JSON 文件的 URL
      </p>
    </>
  );
}

export default App;
