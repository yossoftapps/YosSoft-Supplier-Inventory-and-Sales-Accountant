# Content Security Policy Update

## Issue Resolved

The previous Content Security Policy was blocking the loading of Google Fonts, which are used in the application for better Arabic text rendering. The error message was:

```
Refused to load the stylesheet 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap' because it violates the following Content Security Policy directive: "style-src 'self' 'unsafe-inline'".
```

## Solution Implemented

Updated the Content Security Policy in both `index.html` and `electron.js` to allow loading of external stylesheets and fonts from Google Fonts:

### Updated Policy Directives

1. **style-src**: Added `https://fonts.googleapis.com` to allow loading stylesheets from Google Fonts
2. **font-src**: Added `https://fonts.gstatic.com` to allow loading font files from Google Fonts

### Updated CSP String

```
default-src 'self'; 
script-src 'self' 'unsafe-inline'; 
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
img-src 'self' data:; 
font-src 'self' data: https://fonts.gstatic.com; 
connect-src 'self'; 
media-src 'self'; 
object-src 'none'; 
child-src 'self'; 
frame-src 'self';
```

## Security Considerations

While allowing external resources reduces security slightly compared to a strict 'self' policy, this approach:
1. Maintains security by only allowing specific trusted domains
2. Preserves the application's intended visual design
3. Follows best practices for Electron applications that need external resources
4. Is still much more secure than allowing all external resources ('*')

## Alternative Approach

As an alternative, the fonts could be downloaded and served locally to maintain a strict 'self' policy, but this would increase the application size and complexity. The current solution provides a good balance between security and functionality.