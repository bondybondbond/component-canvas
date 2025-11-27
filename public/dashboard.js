// Fix relative URLs to absolute based on component origin
function fixRelativeUrls(container, sourceUrl) {
  try {
    const url = new URL(sourceUrl);
    const origin = url.origin; // e.g., "https://www.bbc.co.uk"
    
    // Fix all anchor tags
    container.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      
      if (href.startsWith('/')) {
        // Absolute path: /deals/123 → https://hotukdeals.com/deals/123
        link.href = origin + href;
      } else if (href.startsWith('./') || href.startsWith('../')) {
        // Relative path: ./deals/123 → resolve relative to source path
        const basePath = url.pathname.substring(0, url.pathname.lastIndexOf('/'));
        link.href = origin + basePath + '/' + href.replace(/^\.\//, '');
      }
      // If already absolute (https://) or hash (#), leave as-is
      
      // Ensure links open in new tab
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });
  } catch (err) {
    console.error('Failed to fix URLs for:', sourceUrl, err);
  }
}

// Remove all cursor styles from captured HTML, then mark links
function removeCursorStyles(container) {
  // Get all elements including the container itself
  const allElements = [container, ...container.querySelectorAll('*')];
  
  allElements.forEach(el => {
    // Remove any inline cursor style
    if (el.style.cursor) {
      el.style.cursor = '';
    }
    
    // If style attribute is now empty, remove it
    if (el.style.length === 0 && el.hasAttribute('style')) {
      el.removeAttribute('style');
    }
  });
  
  // Add a class to all links so CSS can target them
  container.querySelectorAll('a[href]').forEach(link => {
    link.classList.add('canvas-link');
  });
}

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
    // Format timestamp with both absolute and relative time
    let timestampText = 'Never refreshed';
    if (component.last_refresh) {
      const lastUpdate = new Date(component.last_refresh);
      const now = new Date();
      const diffMs = now - lastUpdate;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      // Format absolute time: "27 Nov 2025, 21:30"
      const day = lastUpdate.getDate();
      const month = lastUpdate.toLocaleString('en-GB', { month: 'short' });
      const year = lastUpdate.getFullYear();
      const hours = lastUpdate.getHours().toString().padStart(2, '0');
      const minutes = lastUpdate.getMinutes().toString().padStart(2, '0');
      const absoluteTime = `${day} ${month} ${year}, ${hours}:${minutes}`;
      
      // Format relative time
      let relativeTime = '';
      if (diffMins < 1) {
        relativeTime = 'just now';
      } else if (diffMins === 1) {
        relativeTime = '1 minute ago';
      } else if (diffMins < 60) {
        relativeTime = `${diffMins} minutes ago`;
      } else if (diffHours === 1) {
        relativeTime = '1 hour ago';
      } else if (diffHours < 24) {
        relativeTime = `${diffHours} hours ago`;
      } else if (diffDays === 1) {
        relativeTime = '1 day ago';
      } else if (diffDays < 7) {
        relativeTime = `${diffDays} days ago`;
      } else {
        relativeTime = 'over a week ago';
      }
      
      timestampText = `${absoluteTime} (${relativeTime})`;
    }
    
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
        <h3 class="editable-title" style="margin: 0; cursor: pointer; padding: 2px 4px; border-radius: 4px;" title="Click to edit">${component.customLabel || component.name || 'Unnamed Component'}</h3>
        <button class="delete-btn" style="padding: 6px 12px; background: #ff4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Delete</button>
      </div>
      <small>${component.url || 'No URL'}</small>
      <div style="font-size: 11px; color: #666; margin-top: 4px;">
        Last updated: ${timestampText}
      </div>
      <div class="component-content" style="margin-top: 10px; padding: 10px; background: #f9f9f9; border-radius: 4px; max-height: 300px; overflow: auto;">
        ${component.html_cache || 'No HTML captured'}
      </div>
    `;
    
    // ✨ FIX RELATIVE URLs TO ABSOLUTE
    const contentDiv = card.querySelector('.component-content');
    if (contentDiv && component.url) {
      fixRelativeUrls(contentDiv, component.url);
      // ✨ FORCE REMOVE ALL CURSOR STYLES
      removeCursorStyles(contentDiv);
    }
    
    // ✨ ADD DELETE FUNCTIONALITY
    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
      if (confirm(`Delete "${component.customLabel || component.name}"? This cannot be undone.`)) {
        // Remove this component from the array
        const updated = components.filter((c, i) => i !== index);
        // Save back to storage
        chrome.storage.local.set({ components: updated }, () => {
          // Remove card from DOM
          card.remove();
          // Show empty state if no components left
          if (updated.length === 0) {
            container.innerHTML = `
              <div class="empty-state">
                <h2>No components yet</h2>
                <p>Use the extension popup to capture components from any website</p>
              </div>
            `;
          }
        });
      }
    });
    
    // ✨ ADD EDITABLE TITLE FUNCTIONALITY
    const titleElement = card.querySelector('.editable-title');
    titleElement.addEventListener('click', () => {
      // Highlight on hover to show it's editable
      titleElement.style.background = '#f0f0f0';
      
      const currentLabel = component.customLabel || component.name || 'Unnamed Component';
      const input = document.createElement('input');
      input.type = 'text';
      input.value = currentLabel;
      input.style.cssText = 'width: 100%; font-size: inherit; font-weight: inherit; padding: 2px 4px; border: 2px solid #007bff; border-radius: 4px;';
      
      // Replace title with input
      titleElement.replaceWith(input);
      input.focus();
      input.select();
      
      const saveLabel = () => {
        const newLabel = input.value.trim();
        
        // Restore title element
        input.replaceWith(titleElement);
        titleElement.style.background = '';
        
        if (newLabel && newLabel !== currentLabel) {
          // Update component in array
          component.customLabel = newLabel;
          titleElement.textContent = newLabel;
          
          // Save to storage
          chrome.storage.local.set({ components }, () => {
            console.log(`✅ Updated label for "${component.name}" to "${newLabel}"`);
          });
        }
      };
      
      // Save on Enter key
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          saveLabel();
        }
      });
      
      // Save on blur (click away)
      input.addEventListener('blur', saveLabel);
    });
    
    // Add hover effect to show it's clickable
    titleElement.addEventListener('mouseenter', () => {
      titleElement.style.background = '#f0f0f0';
    });
    titleElement.addEventListener('mouseleave', () => {
      titleElement.style.background = '';
    });
    
    grid.appendChild(card);
  });
});

// ==========================================
// REFRESH FUNCTIONALITY
// ==========================================

/**
 * Extract a "fingerprint" from HTML to verify we're refreshing the correct element
 * Looks for headings or strong text that identifies the component
 */
function extractFingerprint(html) {
  if (!html) return null;
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Look for headings first (h1-h6)
  const heading = doc.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading && heading.textContent.trim()) {
    return heading.textContent.trim().substring(0, 50);
  }
  
  // Fall back to first strong/bold text
  const strong = doc.querySelector('strong, b');
  if (strong && strong.textContent.trim()) {
    return strong.textContent.trim().substring(0, 50);
  }
  
  // Last resort: first text content over 10 chars
  const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const text = walker.currentNode.textContent.trim();
    if (text.length > 10) {
      return text.substring(0, 50);
    }
  }
  
  return null;
}

/**
 * Tab-based refresh for JS-heavy sites
 * Opens a background tab, waits for JS to load, extracts content
 */
async function tabBasedRefresh(url, selector) {
  try {
    // Open background tab (not active)
    const tab = await chrome.tabs.create({ url, active: false });
    
    // Wait for page + JS to load (5 seconds for complex sites like HotUKDeals)
    await new Promise(r => setTimeout(r, 5000));
    
    // Extract the component using scripting API
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [selector],
      func: (sel) => {
        const el = document.querySelector(sel);
        return el ? el.outerHTML : null;
      }
    });
    
    // Close the tab
    await chrome.tabs.remove(tab.id);
    
    const html = results[0]?.result;
    
    if (html) {
      return html;
    }
    
    return null;
    
  } catch (error) {
    console.error(`❌ Tab-based refresh failed:`, error);
    return null;
  }
}

async function refreshComponent(component) {
  try {
    
    // Fetch fresh HTML from the source URL
    const response = await fetch(component.url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const fullHtml = await response.text();
    
    // Try to extract the component using the selector
    const parser = new DOMParser();
    const doc = parser.parseFromString(fullHtml, 'text/html');
    
    let extractedHtml = null;
    
    // Only try to extract if we have a specific selector
    // Generic selectors like "div" or "section" will match wrong elements
    if (component.selector && !['div', 'section', 'article', 'main', 'aside', 'header', 'footer', 'nav'].includes(component.selector.toLowerCase())) {
      const element = doc.querySelector(component.selector);
      if (element) {
        extractedHtml = element.outerHTML;
        
        // Check if we got a skeleton/loading placeholder instead of real content
        const isSkeletonContent = extractedHtml.includes('class="skeleton') || 
                                   extractedHtml.includes('skeleton-color') ||
                                   extractedHtml.includes('loading-placeholder') ||
                                   (extractedHtml.match(/skeleton/gi) || []).length > 2;
        
        if (isSkeletonContent) {
          
          // Try tab-based refresh as fallback
          const tabHtml = await tabBasedRefresh(component.url, component.selector);
          
          if (tabHtml) {
            // Verify we got the right element by checking fingerprint
            const originalFingerprint = extractFingerprint(component.html_cache);
            
            if (originalFingerprint && !tabHtml.toLowerCase().includes(originalFingerprint.toLowerCase())) {
              return {
                success: false,
                error: 'Tab refresh returned different element',
                keepOriginal: true
              };
            }
            
            // Tab refresh worked and verified!
            return {
              success: true,
              html_cache: tabHtml,
              last_refresh: new Date().toISOString(),
              status: 'active'
            };
          }
          
          // Tab refresh also failed - keep original
          return {
            success: false,
            error: 'Page returned skeleton content (JS not loaded)',
            keepOriginal: true
          };
        }
      } else {
        // Selector not found in fetched HTML - might need JS to run
        
        const tabHtml = await tabBasedRefresh(component.url, component.selector);
        
        if (tabHtml) {
          // Verify with fingerprint
          const originalFingerprint = extractFingerprint(component.html_cache);
          
          if (originalFingerprint && !tabHtml.toLowerCase().includes(originalFingerprint.toLowerCase())) {
            return {
              success: false,
              error: 'Tab refresh returned different element',
              keepOriginal: true
            };
          }
          return {
            success: true,
            html_cache: tabHtml,
            last_refresh: new Date().toISOString(),
            status: 'active'
          };
        }
      }
    } else {
      // Generic selector - skip extraction
    }
    
    // If extraction failed, DON'T use the full page - keep original HTML
    if (!extractedHtml) {
      return {
        success: false,
        error: 'Cannot extract component - selector too generic or not found',
        keepOriginal: true
      };
    }
    
    return {
      success: true,
      html_cache: extractedHtml,
      last_refresh: new Date().toISOString(),
      status: 'active'
    };
    
  } catch (error) {
    console.error(`❌ Failed to refresh ${component.name}:`, error);
    return {
      success: false,
      error: error.message,
      status: 'error'
    };
  }
}

async function refreshAll() {
  const btn = document.getElementById('refresh-all-btn');
  
  // Show loading state
  btn.disabled = true;
  btn.textContent = '⏳ Refreshing...';
  btn.style.background = '#6c757d';
  
  try {
    // Get current components
    const result = await new Promise(resolve => {
      chrome.storage.local.get(['components'], resolve);
    });
    
    const components = result.components || [];
    
    if (components.length === 0) {
      btn.textContent = '✅ No components to refresh';
      setTimeout(() => {
        btn.textContent = '🔄 Refresh All';
        btn.style.background = '#007bff';
        btn.disabled = false;
      }, 2000);
      return;
    }
    
    // Refresh all components
    const refreshPromises = components.map(comp => refreshComponent(comp));
    const results = await Promise.all(refreshPromises);
    
    // Update components with new data
    const updatedComponents = components.map((comp, index) => {
      const result = results[index];
      if (result.success) {
        // Successfully refreshed - update HTML AND timestamp
        return {
          ...comp,
          html_cache: result.html_cache,
          last_refresh: result.last_refresh,
          status: result.status
        };
      } else if (result.keepOriginal) {
        // Failed to extract but keep original HTML - DON'T update timestamp
        return {
          ...comp,
          // Keep original last_refresh timestamp
          status: 'active' // Still active, just couldn't refresh
        };
      } else {
        // Real error (CORS, network, etc) - DON'T update timestamp
        return {
          ...comp,
          status: 'error'
          // Keep original last_refresh timestamp
        };
      }
    });
    
    // Count results
    const successCount = results.filter(r => r.success).length;
    const keptOriginalCount = results.filter(r => r.keepOriginal).length;
    const failCount = results.filter(r => !r.success && !r.keepOriginal).length;
    
    // Save updated components
    await new Promise(resolve => {
      chrome.storage.local.set({ components: updatedComponents }, resolve);
    });
    
    // Build detailed summary for popup
    let summary = `📊 Refresh Summary:\n\n`;
    summary += `✅ Successfully refreshed: ${successCount}\n`;
    summary += `⚠️ Kept original (generic selector): ${keptOriginalCount}\n`;
    summary += `❌ Failed (CORS/Network): ${failCount}\n\n`;
    
    // Add details for each component
    summary += `Details:\n`;
    components.forEach((comp, index) => {
      const result = results[index];
      if (result.success) {
        summary += `✅ ${comp.name}\n`;
      } else if (result.keepOriginal) {
        summary += `⚠️ ${comp.name} - kept original\n`;
      } else {
        summary += `❌ ${comp.name} - ${result.error}\n`;
      }
    });
    
    // Build table data for console
    const tableData = components.map((comp, index) => {
      const result = results[index];
      return {
        Component: comp.name,
        Status: result.success ? '✅ Refreshed' : result.keepOriginal ? '⚠️ Kept Original' : '❌ Failed',
        Reason: result.success ? 'Success' : result.error || 'Generic selector'
      };
    });
    
    // Log summary to console
    console.log('📊 Refresh Summary:');
    console.table(tableData);
    
    // Show success state with more detail
    if (successCount === results.length) {
      btn.textContent = `✅ All refreshed (${successCount})`;
      btn.style.background = '#28a745';
    } else if (successCount > 0) {
      btn.textContent = `⚠️ ${successCount} refreshed, ${keptOriginalCount + failCount} kept`;
      btn.style.background = '#ffc107';
    } else {
      btn.textContent = `⚠️ All kept original`;
      btn.style.background = '#ffc107';
    }
    
    // Use confirm() instead of alert - requires user interaction before proceeding
    const shouldReload = confirm(summary + '\n\nReload page to see updates?');
    
    if (shouldReload) {
      location.reload();
    } else {
      // Reset button if user cancels
      setTimeout(() => {
        btn.textContent = '🔄 Refresh All';
        btn.style.background = '#007bff';
        btn.disabled = false;
      }, 2000);
    }
    
  } catch (error) {
    console.error('❌ Refresh failed:', error);
    btn.textContent = '❌ Refresh failed';
    btn.style.background = '#dc3545';
    
    // Reset after 2 seconds
    setTimeout(() => {
      btn.textContent = '🔄 Refresh All';
      btn.style.background = '#007bff';
      btn.disabled = false;
    }, 2000);
  }
}

// Attach refresh handler when page loads
document.addEventListener('DOMContentLoaded', () => {
  const refreshBtn = document.getElementById('refresh-all-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshAll);
  }
});
