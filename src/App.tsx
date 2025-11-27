/// <reference types="chrome" />
import { useState, useEffect } from 'react';
import './App.css';

interface Component {
  name: string;
  url: string;
  customLabel?: string; // User's custom label (optional)
}

function App() {
  const [components, setComponents] = useState<Component[]>([]);
  const [currentDomain, setCurrentDomain] = useState<string>('');

  useEffect(() => {
    // Get current tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        try {
          const url = new URL(tabs[0].url);
          setCurrentDomain(url.hostname);
        } catch (e) {
          console.error('Invalid URL:', e);
        }
      }
    });

    // Load components
    chrome.storage.local.get(['components'], (result) => {
      if (result.components) {
        setComponents(result.components as Component[]);
      }
    });
  }, []);

  const handleToggleCapture = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_CAPTURE' });
        window.close();
      }
    });
  };

  const handleDelete = (component: Component) => {
    // Find and remove the specific component from the full list
    const updated = components.filter((c) => !(c.url === component.url && c.name === component.name));
    setComponents(updated);
    chrome.storage.local.set({ components: updated });
  };

  const handleOpenCanvas = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('dashboard.html'),
      active: true
    });
  };

  // Filter components to only show those from current domain
  const filteredComponents = components.filter((component) => {
    try {
      const componentUrl = new URL(component.url);
      return componentUrl.hostname === currentDomain;
    } catch (e) {
      return false;
    }
  });

  return (
    <div style={{ padding: '10px', minWidth: '300px' }}>
      <button onClick={handleOpenCanvas} style={{ width: '100%', marginBottom: '10px' }}>
        Open Canvas
      </button>
      <button onClick={handleToggleCapture} style={{ width: '100%', marginBottom: '10px' }}>
        Start Capture
      </button>
      {currentDomain && (
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
          Showing components from: {currentDomain}
        </div>
      )}
      <div>
        {filteredComponents.map((component: Component, index) => (
          <div key={index} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
            <h3>{component.customLabel || component.name}</h3>
            <small>URL: {component.url}</small>
            <button onClick={() => handleDelete(component)} style={{ float: 'right' }}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;