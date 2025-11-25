/// <reference types="chrome" />
import { useState, useEffect } from 'react';
import './App.css';

interface Component {
  name: string;
  url: string;
}

function App() {
  const [components, setComponents] = useState<Component[]>([]);

  useEffect(() => {
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

  const handleDelete = (index: number) => {
    const updated = components.filter((_, i) => i !== index);
    setComponents(updated);
    chrome.storage.local.set({ components: updated });
  };

  const handleOpenCanvas = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('dashboard.html'),
      active: true
    });
  };

  return (
    <div style={{ padding: '10px', minWidth: '300px' }}>
      <button onClick={handleOpenCanvas} style={{ width: '100%', marginBottom: '10px' }}>
        Open Canvas
      </button>
      <button onClick={handleToggleCapture} style={{ width: '100%', marginBottom: '10px' }}>
        Start Capture
      </button>
      <div>
        {components.map((component: Component, index) => (
          <div key={index} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
            <h3>{component.name}</h3>
            <small>URL: {component.url}</small>
            <button onClick={() => handleDelete(index)} style={{ float: 'right' }}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;