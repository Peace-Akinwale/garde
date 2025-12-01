# App Icons for PWA

You need to create two icon files for the Progressive Web App to work properly:

## Required Icons

1. **icon-192x192.png** (192x192 pixels)
2. **icon-512x512.png** (512x512 pixels)

## How to Create Icons

### Option 1: Use an Online Tool
1. Go to https://favicon.io/favicon-generator/
2. Design your icon (e.g., "HTK" letters or a chef hat emoji)
3. Download and extract
4. Rename the 192x192 and 512x512 files
5. Place them in this `public` folder

### Option 2: Use Canva (Free)
1. Go to https://www.canva.com/
2. Create custom size: 512x512 pixels
3. Design your app icon:
   - Background color: #0ea5e9 (light blue)
   - Text: "HTK" in white, bold font
   - Or use a cooking pot/book emoji
4. Download as PNG
5. Create two versions:
   - Save one as 512x512 (icon-512x512.png)
   - Resize to 192x192 (icon-192x192.png)
6. Place both in this folder

### Option 3: Simple Text Icon
1. Create a 512x512 image with:
   - Blue background (#0ea5e9)
   - White text "HTK" or cooking emoji
2. Use any image editor (Paint, GIMP, Photoshop)
3. Save as PNG
4. Resize for 192x192 version

## Design Suggestions

**Simple & Professional:**
- Blue gradient background
- White "HTK" letters (bold, sans-serif)
- Optional: Small chef hat or book icon

**Emoji Style:**
- 👨‍🍳 Chef emoji on blue background
- 📖 Book emoji
- 🍳 Cooking emoji
- 📝 Notepad emoji

**Colors:**
- Primary: #0ea5e9 (light blue)
- Secondary: #0284c7 (darker blue)
- Text: #ffffff (white)

## Current Status

⚠️ **Icons are currently missing!**

The app will work without them, but you'll see:
- Broken image icons in the browser
- Default icon when installed to home screen

For the best user experience, create the icons before deploying or sharing the app.

## Quick Temporary Solution

Until you create proper icons, you can:
1. Download any 512x512 PNG image
2. Rename it to `icon-512x512.png`
3. Resize a copy to 192x192 and rename to `icon-192x192.png`
4. Place both in this folder

The app will work, just won't look as professional.
