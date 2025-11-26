console.log("🚀 ComponentCanvas: Content Script V5 (RESET) Loaded");

let isCapturing = false;


// Generate a specific CSS selector for an element
function generateSelector(element: HTMLElement): string {
  // Priority 1: ID (most specific)
  if (element.id) {
    return `#${element.id}`;
  }
  
  // Priority 2: Build tag + classes + data attributes
  let selector = element.tagName.toLowerCase();
  
  // Add classes (max 3 to avoid overly specific selectors)
  if (element.classList.length > 0) {
    const classes = Array.from(element.classList)
      .filter(c => !c.includes('hover') && !c.includes('active')) // Skip state classes
      .slice(0, 3);
    if (classes.length > 0) {
      selector += '.' + classes.join('.');
    }
  }
  
  // Add key data attributes (very useful for modern sites like BBC)
  const usefulAttrs = ['data-testid', 'data-component', 'data-section', 'data-module', 'data-type', 'role'];
  for (const attr of usefulAttrs) {
    if (element.hasAttribute(attr)) {
      const value = element.getAttribute(attr);
      selector += `[${attr}="${value}"]`;
      break; // One data attr is usually enough
    }
  }
  
  // If still just a bare tag (no classes, no attrs), try parent context
  if (selector === element.tagName.toLowerCase()) {
    const parent = element.parentElement;
    if (parent && parent.tagName !== 'BODY' && parent.tagName !== 'HTML') {
      // Add simple parent context
      const parentTag = parent.tagName.toLowerCase();
      if (parent.classList.length > 0) {
        const parentClass = parent.classList[0];
        selector = `${parentTag}.${parentClass} > ${selector}`;
      }
    }
  }
  
  console.log('🎯 Generated selector:', selector);
  return selector;
}

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
// Sanitize captured HTML - remove capture artifacts
function sanitizeHTML(element: HTMLElement): string {
  // Clone the element to avoid modifying the original
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Remove all capture-related inline styles from clone and descendants
  const allElements = [clone, ...Array.from(clone.querySelectorAll('*'))];
  
  allElements.forEach(el => {
    if (el instanceof HTMLElement) {
      // Remove cursor styles
      el.style.removeProperty('cursor');
      
      // Remove outline styles (our capture indicators)
      el.style.removeProperty('outline');
      
      // Clean up empty style attributes
      if (el.style.length === 0) {
        el.removeAttribute('style');
      }
    }
  });
  
  return clone.outerHTML;
}

function handleClick(event: MouseEvent) {
  if (!isCapturing) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  const target = event.target as HTMLElement;
  
  // Green Flash
  target.style.setProperty('outline', '5px solid #00ff00', 'important');
  
  // Generate smart label using Option 1 strategy
  let name = '';
  
  // Strategy 1: Check if element itself is a heading
  if (/^H[1-6]$/i.test(target.tagName)) {
    const text = target.textContent?.trim();
    if (text) {
      name = text.length > 50 ? text.substring(0, 50) + '...' : text;
    }
  }
  
  // Strategy 2: Look for first heading inside element
  if (!name) {
    const heading = target.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading?.textContent?.trim()) {
      const text = heading.textContent.trim();
      name = text.length > 50 ? text.substring(0, 50) + '...' : text;
    }
  }
  
  // Strategy 3: Get first meaningful text (skip empty/whitespace-only nodes)
  if (!name) {
    // Try to get first text node with actual content
    const walker = document.createTreeWalker(
      target,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const text = node.textContent?.trim();
          return text && text.length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
      }
    );
    
    const firstTextNode = walker.nextNode();
    if (firstTextNode?.textContent?.trim()) {
      const text = firstTextNode.textContent.trim();
      name = text.length > 50 ? text.substring(0, 50) + '...' : text;
    }
  }
  
  // Strategy 4: Fallback to generic label
  if (!name) {
    name = `Component from ${window.location.hostname}`;
  }
  
  const selector = generateSelector(target); // Smart selector for refresh
  
  // ✨ SANITIZE HTML BEFORE STORING
  const cleanedHTML = sanitizeHTML(target);
  
  const component = {
    id: crypto.randomUUID(),
    url: window.location.href,
    selector: selector,
    name: name,
    html_cache: cleanedHTML,
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