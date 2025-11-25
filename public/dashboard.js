// Load and display components from storage
chrome.storage.local.get(['components'], (result) => {
  const container = document.getElementById('components-container');
  const components = Array.isArray(result.components) ? result.components : [];
  
  console.log('📦 Loaded components:', components);
  
  if (components.length === 0) {
    // Empty state already shown by default
    return;
  }
  
  // Build grid
  container.innerHTML = '<div class="components-grid"></div>';
  const grid = container.querySelector('.components-grid');
  
  components.forEach((component, index) => {
    const card = document.createElement('div');
    card.className = 'component-card';
    card.innerHTML = `
      <h3>${component.name || 'Unnamed Component'}</h3>
      <small>${component.url || 'No URL'}</small>
      <div style="margin-top: 10px; padding: 10px; background: #f9f9f9; border-radius: 4px; max-height: 300px; overflow: auto;">
        ${component.html_cache || 'No HTML captured'}
      </div>
    `;
    grid.appendChild(card);
  });
});
