import { useState, useEffect } from 'react';
import reactLogo from '@/assets/react.svg';
import wxtLogo from '/wxt.svg';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/ext-language_tools';
import { i18n, t } from '@/utils/i18n';
import './App.css';

// 默认内置书签数据 - 来自 example-bookmarks-with-icons.json
const DEFAULT_BOOKMARKS = [
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

function App() {
  const [bookmarksUrl, setBookmarksUrl] = useState('https://cdn.jsdelivr.net/gh/yeshan333/jsDelivrCDN@main/bookmarks.json');
  const [inputUrl, setInputUrl] = useState('');
  const [useDefaultBookmarks, setUseDefaultBookmarks] = useState(false);
  const [useDirectJson, setUseDirectJson] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [status, setStatus] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState(i18n.getLanguage());

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
      setStatus(t('usingDefaultBookmarks'));
    } else if (useDirectJson) {
      try {
        // Validate JSON input
        const parsed = JSON.parse(jsonInput);
        if (!Array.isArray(parsed)) {
          setStatus(t('jsonShouldBeArray'));
          setTimeout(() => setStatus(''), 3000);
          return;
        }
        
        localStorage.setItem('useDefaultBookmarks', 'false');
        localStorage.setItem('useDirectJson', 'true');
        localStorage.setItem('bookmarksJson', jsonInput);
        localStorage.removeItem('bookmarksUrl');
        setStatus(t('saved'));
      } catch (error) {
        setStatus(t('jsonInvalid') + ': ' + (error as Error).message);
        setTimeout(() => setStatus(''), 3000);
        return;
      }
    } else {
      localStorage.setItem('useDefaultBookmarks', 'false');
      localStorage.setItem('useDirectJson', 'false');
      localStorage.setItem('bookmarksUrl', inputUrl);
      localStorage.removeItem('bookmarksJson');
      setBookmarksUrl(inputUrl);
      setStatus(t('saved'));
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
    setStatus(t('resetToDefault'));
    setTimeout(() => setStatus(''), 3000);
  };

  const handleTest = async () => {
    if (useDirectJson) {
      try {
        const parsed = JSON.parse(jsonInput);
        if (!Array.isArray(parsed)) {
          setStatus(t('jsonShouldBeArray'));
        } else {
          setStatus(t('jsonValid'));
        }
      } catch (error) {
        setStatus(t('jsonInvalid') + ': ' + (error as Error).message);
      }
    } else {
      try {
        const response = await fetch(inputUrl);
        if (response.ok) {
          setStatus(t('urlAccessible'));
        } else {
          setStatus(t('urlNotAccessible'));
        }
      } catch (error) {
        setStatus(t('urlNotAccessible'));
      }
    }
    setTimeout(() => setStatus(''), 3000);
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonInput(formatted);
      setStatus(t('formatted'));
    } catch (error) {
      setStatus(t('formatFailed') + ': ' + (error as Error).message);
    }
    setTimeout(() => setStatus(''), 3000);
  };

  const handleMinifyJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const minified = JSON.stringify(parsed);
      setJsonInput(minified);
      setStatus(t('minified'));
    } catch (error) {
      setStatus(t('minifyFailed') + ': ' + (error as Error).message);
    }
    setTimeout(() => setStatus(''), 3000);
  };

  const handleLanguageChange = (language: 'zh-CN' | 'en') => {
    i18n.setLanguage(language);
    setCurrentLanguage(language);
    // 强制重新渲染
    setStatus(t('saved'));
    setTimeout(() => setStatus(''), 1000);
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
      <h1 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>{t('title')}</h1>
      
      {/* 语言切换器 */}
      <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button
          onClick={() => handleLanguageChange('zh-CN')}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            border: currentLanguage === 'zh-CN' ? '2px solid #646cff' : '1px solid #444',
            backgroundColor: currentLanguage === 'zh-CN' ? '#646cff' : 'transparent',
            color: currentLanguage === 'zh-CN' ? 'white' : 'inherit',
            borderRadius: '4px',
            cursor: 'pointer',
            minWidth: 'auto'
          }}
        >
          中文
        </button>
        <button
          onClick={() => handleLanguageChange('en')}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            border: currentLanguage === 'en' ? '2px solid #646cff' : '1px solid #444',
            backgroundColor: currentLanguage === 'en' ? '#646cff' : 'transparent',
            color: currentLanguage === 'en' ? 'white' : 'inherit',
            borderRadius: '4px',
            cursor: 'pointer',
            minWidth: 'auto'
          }}
        >
          English
        </button>
      </div>
      
      <div className="card">
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={useDefaultBookmarks}
              onChange={(e) => {
                setUseDefaultBookmarks(e.target.checked);
                if (e.target.checked) {
                  setUseDirectJson(false);
                }
              }}
              style={{ marginRight: '10px', transform: 'scale(1.1)' }}
            />
            <span>{t('useDefaultBookmarks')}</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={useDirectJson}
              onChange={(e) => {
                setUseDirectJson(e.target.checked);
                if (e.target.checked) {
                  setUseDefaultBookmarks(false);
                }
              }}
              style={{ marginRight: '10px', transform: 'scale(1.1)' }}
            />
            <span>{t('useDirectJson')}</span>
          </label>
          
          {!useDefaultBookmarks && useDirectJson && (
            <>
              <div style={{ marginBottom: '8px' }}>
                <label htmlFor="bookmarksJson" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  {t('bookmarksJson')}
                </label>
              </div>
              <div className="json-editor-container">
                <AceEditor
                  mode="json"
                  theme="monokai"
                  value={jsonInput}
                  onChange={(value) => setJsonInput(value)}
                  placeholder={t('jsonInputPlaceholder')}
                  name="bookmarksJson"
                  editorProps={{ $blockScrolling: true }}
                  setOptions={{
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: true,
                    showLineNumbers: true,
                    tabSize: 2,
                    useSoftTabs: true,
                    wrap: true
                  }}
                  style={{
                    width: '100%',
                    minHeight: '400px',
                    fontSize: '13px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <button 
                  onClick={handleFormatJson} 
                  style={{ flex: 1, minWidth: '80px', fontSize: '13px', padding: '8px 12px' }}
                  type="button"
                >
                  {t('format')}
                </button>
                <button 
                  onClick={handleMinifyJson} 
                  style={{ flex: 1, minWidth: '80px', fontSize: '13px', padding: '8px 12px' }}
                  type="button"
                >
                  {t('minify')}
                </button>
              </div>
            </>
          )}
          
          {!useDefaultBookmarks && !useDirectJson && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="bookmarksUrl" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  {t('bookmarksUrl')}
                </label>
                <input
                  id="bookmarksUrl"
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder={t('urlInputPlaceholder')}
                  className="input-field"
                />
              </div>
              <div className="config-info">
                {t('urlInputTip')}
              </div>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
          <button onClick={handleSave} style={{ flex: 1, minWidth: '80px', padding: '10px' }}>
            {t('save')}
          </button>
          <button onClick={handleReset} style={{ flex: 1, minWidth: '80px', padding: '10px' }}>
            {t('reset')}
          </button>
          {(!useDefaultBookmarks || useDirectJson) && (
            <button onClick={handleTest} style={{ flex: 1, minWidth: '80px', padding: '10px' }}>
              {t('test')}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button 
            onClick={() => {
              // Send message to background script to refresh bookmarks
              chrome.runtime.sendMessage({ action: 'refreshBookmarks' });
              setStatus(t('bookmarksRefreshed'));
              setTimeout(() => setStatus(''), 3000);
            }} 
            style={{ flex: 1, minWidth: '80px', padding: '10px' }}
          >
            {t('refreshBookmarks')}
          </button>
        </div>
        {status && (
          <div className={`status-message ${status.includes('错误') || status.includes('无法') ? 'error' : 'success'}`}>
            {status}
          </div>
        )}
        <div className="config-info">
          <div className="label">{t('currentConfig')}</div>
          <code>
            {useDefaultBookmarks ? t('builtInBookmarks') : useDirectJson ? t('directJsonLabel') : t('urlLabel') + bookmarksUrl}
          </code>
        </div>
      </div>
      <p className="read-the-docs">
        {useDefaultBookmarks 
          ? t('defaultBookmarksDescription') 
          : useDirectJson 
            ? t('directJsonDescription') 
            : t('urlBookmarksDescription')}
      </p>
    </>
  );
}

export default App;
