console.log("🚀 ComponentCanvas: Content Script V5 (RESET) Loaded");

let isCapturing = false;

// 1. Hover Handler (The Red Box)
function handleHover(event: MouseEvent) {
  if (!isCapturing) return;
  const target = event.target as HTMLElement;
  
  // Visuals
  target.style.setProperty('outline', '5px solid red', 'important');
  target.style.cursor = 'crosshair';
  
  // Debug
  console.log("🔍 Hover:", target.tagName);
  
  event.stopPropagation();
}

// 2. Exit Handler (Cleanup)
function handleExit(event: MouseEvent) {
  if (!isCapturing) return;
  const target = event.target as HTMLElement;
  target.style.outline = '';
}

// 3. Click Handler (The Save)
function handleClick(event: MouseEvent) {
  if (!isCapturing) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  const target = event.target as HTMLElement;
  
  // Green Flash
  target.style.setProperty('outline', '5px solid #00ff00', 'important');
  
  // Generate Data
  const name = `${target.tagName.toLowerCase()} from ${window.location.hostname}`;
  const selector = target.tagName.toLowerCase(); // Simplified for now
  
  const component = {
    id: crypto.randomUUID(),
    url: window.location.href,
    selector: selector,
    name: name,
    html_cache: target.outerHTML,
    last_updated: new Date().toISOString()
  };

  // Save
  chrome.storage.local.get(['components'], (result) => {
    const list = Array.isArray(result.components) ? result.components : [];
    list.push(component);
    chrome.storage.local.set({ components: list }, () => {
      // Clear green flash
      target.style.outline = '';
      target.style.cursor = '';
      
      alert(`✅ Saved: ${name}`);
      toggleCapture(false); // Turn off after save
    });
  });
}

// 4. Escape Key Handler
function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && isCapturing) {
    toggleCapture(false);
    alert("❌ Capture Cancelled");
  }
}

// Main Toggle Logic
function toggleCapture(forceState?: boolean) {
  isCapturing = forceState !== undefined ? forceState : !isCapturing;
  
  if (isCapturing) {
    console.log("🟢 Capture Mode: ON");
    document.addEventListener('mouseover', handleHover, true);
    document.addEventListener('mouseout', handleExit, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeydown, true);
  } else {
    console.log("🔴 Capture Mode: OFF");
    document.removeEventListener('mouseover', handleHover, true);
    document.removeEventListener('mouseout', handleExit, true);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('keydown', handleKeydown, true);
    
    // Force cleanup all visuals
    document.querySelectorAll('*').forEach(el => {
      (el as HTMLElement).style.outline = '';
      (el as HTMLElement).style.cursor = '';
    });
  }
}

// Message Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "TOGGLE_CAPTURE" || request.type === "TOGGLE_CAPTURE") {
    toggleCapture();
  }
});