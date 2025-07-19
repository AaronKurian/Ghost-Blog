// Enhanced metadata fetcher that attempts to get real website data
export const fetchMetadata = async (url) => {
  console.log('🔍 fetchMetadata called with URL:', url);
  console.log('🔍 URL type:', typeof url);
  
  try {
    const domain = new URL(url).hostname;
    console.log('🔍 Extracted domain:', domain);
    
    // First, try to fetch real metadata using a CORS proxy or other methods
    try {
      // Method 1: Try using allorigins.win as a CORS proxy
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      
      if (response.ok) {
        const data = await response.json();
        const htmlContent = data.contents;
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        let title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                   doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
                   doc.querySelector('title')?.textContent ||
                   `Content from ${domain}`;
        
        let description = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                         doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content') ||
                         doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
                         `Visit ${domain} for more information`;
        
        let image = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                   doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
                   `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
        
        title = title.trim().substring(0, 100);
        description = description.trim().substring(0, 200);

        return {
          title,
          description,
          image,
          favicon: `https://www.google.com/s2/favicons?sz=16&domain=${domain}`,
          site: domain,
          url: url,
        };
      }
    } catch (proxyError) {
      console.log('Proxy method failed, falling back to alternative approach');
    }
    
    // Method 2: Try using a different CORS proxy
    try {
      const altProxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
      const response = await fetch(altProxyUrl, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      
      if (response.ok) {
        const htmlContent = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        let title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                   doc.querySelector('title')?.textContent ||
                   `Content from ${domain}`;
        
        let description = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                         doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
                         `Visit ${domain} for more information`;
        
        let image = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                   `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
        
        title = title.trim().substring(0, 100);
        description = description.trim().substring(0, 200);
        
        return {
          title,
          description,
          image,
          favicon: `https://www.google.com/s2/favicons?sz=16&domain=${domain}`,
          site: domain,
          url: url,
        };
      }
    } catch (altProxyError) {
      console.log('Alternative proxy failed, using enhanced fallback');
    }
    
    // Method 3: Enhanced fallback with better domain-specific handling
    console.log('🔍 Using enhanced fallback');
    const enhancedMetadata = getEnhancedFallbackMetadata(url, domain);
    console.log('🔍 Enhanced fallback result:', enhancedMetadata);
    return enhancedMetadata;
    
  } catch (error) {
    console.error('🔍 Error fetching metadata:', error);
    const domain = new URL(url).hostname;
    const fallbackResult = {
      title: `Link from ${domain}`,
      description: 'Click to visit this link',
      image: `https://www.google.com/s2/favicons?sz=64&domain=${domain}`,
      favicon: `https://www.google.com/s2/favicons?sz=16&domain=${domain}`,
      site: domain,
      url: url,
    };
    console.log('🔍 Final fallback result:', fallbackResult);
    return fallbackResult;
  }
};

// Enhanced fallback that provides better metadata for known domains
const getEnhancedFallbackMetadata = (url, domain) => {
  const domainMappings = {
    'github.com': {
      title: 'GitHub Repository',
      description: 'Explore code, issues, and pull requests on GitHub'
    },
    'stackoverflow.com': {
      title: 'Stack Overflow Question',
      description: 'Programming Q&A and developer community'
    },
    'medium.com': {
      title: 'Medium Article',
      description: 'Read stories and ideas from writers and experts'
    },
    'dev.to': {
      title: 'DEV Community Post',
      description: 'The constructive and inclusive social network for software developers'
    },
    'youtube.com': {
      title: 'YouTube Video',
      description: 'Watch videos on YouTube'
    },
    'twitter.com': {
      title: 'Twitter Post',
      description: 'See what\'s happening on Twitter'
    },
    'x.com': {
      title: 'X (Twitter) Post',
      description: 'See what\'s happening on X'
    },
    'linkedin.com': {
      title: 'LinkedIn Post',
      description: 'Professional networking and career content'
    },
    'reddit.com': {
      title: 'Reddit Post',
      description: 'Dive into anything on Reddit'
    },
    'wikipedia.org': {
      title: 'Wikipedia Article',
      description: 'Free encyclopedia that anyone can edit'
    }
  };
  
  const mapping = domainMappings[domain] || {
    title: `${domain}`,
    description: `Visit ${domain} for more information`
  };
  
  // Try to extract more specific info from URL path
  try {
    const urlPath = new URL(url).pathname;
    if (urlPath && urlPath !== '/') {
      const pathParts = urlPath.split('/').filter(part => part.length > 0);
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        const cleanTitle = lastPart
          .replace(/-/g, ' ')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        
        if (cleanTitle.length > 3) {
          mapping.title = `${cleanTitle} - ${mapping.title}`;
        }
      }
    }
  } catch (e) {
  }
  
  return {
    title: mapping.title,
    description: mapping.description,
    image: `https://www.google.com/s2/favicons?sz=64&domain=${domain}`,
    favicon: `https://www.google.com/s2/favicons?sz=16&domain=${domain}`,
    site: domain,
    url: url,
  };
};
