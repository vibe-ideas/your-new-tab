import { useState, useEffect } from 'react';
import reactLogo from '@/assets/react.svg';
import wxtLogo from '/wxt.svg';
import './App.css';

function App() {
  const [bookmarksUrl, setBookmarksUrl] = useState('https://cdn.jsdelivr.net/gh/yeshan333/jsDelivrCDN@main/bookmarks.json');
  const [inputUrl, setInputUrl] = useState('');
  const [useDefaultBookmarks, setUseDefaultBookmarks] = useState(false);
  const [useDirectJson, setUseDirectJson] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [status, setStatus] = useState('');

  // Load bookmarks URL from localStorage on component mount
  useEffect(() => {
    const storedUrl = localStorage.getItem('bookmarksUrl');
    const storedUseDefault = localStorage.getItem('useDefaultBookmarks') === 'true';
    const storedUseDirectJson = localStorage.getItem('useDirectJson') === 'true';
    const storedJsonInput = localStorage.getItem('bookmarksJson');
    
    if (storedUseDefault) {
      setUseDefaultBookmarks(true);
      setBookmarksUrl('default');
      setInputUrl('');
      setUseDirectJson(false);
      setJsonInput('');
    } else if (storedUseDirectJson) {
      setUseDefaultBookmarks(false);
      setUseDirectJson(true);
      setInputUrl('');
      if (storedJsonInput) {
        setJsonInput(storedJsonInput);
      }
    } else if (storedUrl) {
      setBookmarksUrl(storedUrl);
      setInputUrl(storedUrl);
      setUseDirectJson(false);
      setJsonInput('');
    } else {
      setInputUrl(bookmarksUrl);
      setUseDirectJson(false);
      setJsonInput('');
    }
  }, []);

  const handleSave = () => {
    if (useDefaultBookmarks) {
      localStorage.setItem('useDefaultBookmarks', 'true');
      localStorage.setItem('useDirectJson', 'false');
      localStorage.setItem('bookmarksUrl', 'default');
      localStorage.removeItem('bookmarksJson');
      setBookmarksUrl('default');
      setStatus('已设置为使用内置书签');
    } else if (useDirectJson) {
      try {
        // Validate JSON input
        const parsed = JSON.parse(jsonInput);
        if (!Array.isArray(parsed)) {
          setStatus('JSON 格式错误: 书签数据应该是数组');
          setTimeout(() => setStatus(''), 3000);
          return;
        }
        
        localStorage.setItem('useDefaultBookmarks', 'false');
        localStorage.setItem('useDirectJson', 'true');
        localStorage.setItem('bookmarksJson', jsonInput);
        localStorage.removeItem('bookmarksUrl');
        setStatus('JSON 已保存');
      } catch (error) {
        setStatus('JSON 格式错误: ' + (error as Error).message);
        setTimeout(() => setStatus(''), 3000);
        return;
      }
    } else {
      localStorage.setItem('useDefaultBookmarks', 'false');
      localStorage.setItem('useDirectJson', 'false');
      localStorage.setItem('bookmarksUrl', inputUrl);
      localStorage.removeItem('bookmarksJson');
      setBookmarksUrl(inputUrl);
      setStatus('URL 已保存');
    }
    setTimeout(() => setStatus(''), 3000);
  };

  const handleReset = () => {
    const defaultUrl = 'https://cdn.jsdelivr.net/gh/yeshan333/jsDelivrCDN@main/bookmarks.json';
    localStorage.setItem('useDefaultBookmarks', 'false');
    localStorage.setItem('useDirectJson', 'false');
    localStorage.setItem('bookmarksUrl', defaultUrl);
    localStorage.removeItem('bookmarksJson');
    setBookmarksUrl(defaultUrl);
    setInputUrl(defaultUrl);
    setUseDefaultBookmarks(false);
    setUseDirectJson(false);
    setJsonInput('');
    setStatus('已重置为默认 URL');
    setTimeout(() => setStatus(''), 3000);
  };

  const handleTest = async () => {
    if (useDirectJson) {
      try {
        const parsed = JSON.parse(jsonInput);
        if (!Array.isArray(parsed)) {
          setStatus('JSON 格式错误: 书签数据应该是数组');
        } else {
          setStatus('JSON 格式正确');
        }
      } catch (error) {
        setStatus('JSON 格式错误: ' + (error as Error).message);
      }
    } else {
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
          <label style={{ display: 'block', marginBottom: '10px' }}>
            <input
              type="checkbox"
              checked={useDefaultBookmarks}
              onChange={(e) => {
                setUseDefaultBookmarks(e.target.checked);
                if (e.target.checked) {
                  setUseDirectJson(false);
                }
              }}
              style={{ marginRight: '8px' }}
            />
            使用内置书签
          </label>
          
          <label style={{ display: 'block', marginBottom: '10px' }}>
            <input
              type="checkbox"
              checked={useDirectJson}
              onChange={(e) => {
                setUseDirectJson(e.target.checked);
                if (e.target.checked) {
                  setUseDefaultBookmarks(false);
                }
              }}
              style={{ marginRight: '8px' }}
            />
            直接粘贴书签 JSON
          </label>
          
          {!useDefaultBookmarks && useDirectJson && (
            <>
              <label htmlFor="bookmarksJson" style={{ display: 'block', marginBottom: '5px' }}>
                书签 JSON:
              </label>
              <textarea
                id="bookmarksJson"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="粘贴完整的书签 JSON 数据"
                rows={10}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  marginBottom: '10px',
                  fontFamily: 'monospace',
                  fontSize: '12px'
                }}
              />
            </>
          )}
          
          {!useDefaultBookmarks && !useDirectJson && (
            <>
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
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={handleSave} style={{ flex: 1, minWidth: '80px' }}>
            保存
          </button>
          <button onClick={handleReset} style={{ flex: 1, minWidth: '80px' }}>
            重置
          </button>
          {(!useDefaultBookmarks || useDirectJson) && (
            <button onClick={handleTest} style={{ flex: 1, minWidth: '80px' }}>
              测试
            </button>
          )}
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
            backgroundColor: status.includes('错误') || status.includes('无法') ? '#f8d7da' : '#d4edda',
            color: status.includes('错误') || status.includes('无法') ? '#721c24' : '#155724',
            textAlign: 'center'
          }}>
            {status}
          </p>
        )}
        <p style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
          当前使用: <br />
          <code style={{ wordBreak: 'break-all' }}>
            {useDefaultBookmarks ? '内置书签' : useDirectJson ? '直接 JSON' : bookmarksUrl}
          </code>
        </p>
      </div>
      <p className="read-the-docs">
        {useDefaultBookmarks 
          ? '使用浏览器内置的快捷书签' 
          : useDirectJson 
            ? '使用直接粘贴的 JSON 数据' 
            : '配置书签 JSON 文件的 URL'}
      </p>
    </>
  );
}

export default App;
