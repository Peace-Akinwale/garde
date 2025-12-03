# Phase 3 Setup Guide - Shopping Lists with Smart Links

## Step 1: Run Database Migration (2 minutes)

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your Garde project
3. Click **SQL Editor** in left sidebar
4. Copy ALL SQL from: `server/database/migration_phase3_shopping.sql`
5. Paste and Run in SQL Editor
6. Verify: You should see "Success" with info about tables created

**Done!** Shopping lists database is ready.

---

## What's New in Phase 3

### 1. Shopping Lists Feature
- Create multiple shopping lists
- Add recipes/guides to lists (automatically extracts ingredients)
- Manually add items to lists
- Check/uncheck items as you shop
- Delete items or entire lists
- Track progress with completion percentage

### 2. Smart Links to Regional Stores
Automatically generates store search links based on your region:

**Nigeria:**
- Jumia Food
- Konga

**USA:**
- Amazon Fresh
- Walmart
- Instacart

**UK:**
- Tesco
- Sainsbury's
- Asda

**China:**
- Taobao
- JD.com

**How it works:**
- Click store name → Opens search for all unchecked items
- No API needed - just smart URL generation
- Works instantly, no setup required

### 3. Export to Shopping List from Guide Cards
- Every recipe/guide card now has shopping cart icon
- Click icon → Select existing list or create new one
- Ingredients automatically added to list

### 4. Copy to Clipboard
- One-click copy of unchecked items
- Formatted as bullet list
- Paste anywhere (WhatsApp, Notes, etc.)

---

## User Flow Example

1. User processes recipe video → Guide created with ingredients
2. User clicks shopping cart icon on guide card
3. Modal appears: "Add to existing list" or "Create new list"
4. User selects "Weekly Groceries" list
5. All recipe ingredients added to that list
6. User navigates to Shopping Lists page
7. Opens "Weekly Groceries" → sees all items
8. Clicks store link (e.g., "Walmart")
9. Browser opens Walmart search with all items
10. User shops, checks off items as they add to cart

---

## Features You Can Try

### On Home Page (Guide Cards):
- Look for shopping cart icon on recipe cards
- Click it to add ingredients to shopping list
- Works for any guide with ingredients

### On Shopping Lists Page (/shopping):
- Create new empty list
- View all your lists with progress bars
- Click "View" to see list details
- Check/uncheck items
- Add manual items (e.g., "Paper towels")
- Click store links to shop
- Copy list to clipboard
- Delete lists

---

## Smart Links Technical Details

### Region Detection:
- Automatic based on browser timezone
- Africa/Lagos → Nigeria stores
- Europe/London → UK stores
- Asia/Shanghai → China stores
- Default → USA stores

### URL Generation:
Each store has specific search URL format:
```
Jumia: food.jumia.com.ng/search?q=ITEM
Walmart: walmart.com/search?q=ITEM&cat_id=976759
Tesco: tesco.com/groceries/en-GB/search?query=ITEM
```

### Future Enhancement (Not Implemented Yet):
- API integrations for direct cart creation
- Requires partnerships/approvals
- Recommended when you have 5,000+ users in one region
- Current approach (smart links) works great for now

---

## Cost Impact

**Database:**
- 2 new tables (shopping_lists, shopping_list_guides)
- Minimal storage (~1KB per list, ~50 bytes per item)
- 1,000 users × 5 lists × 20 items = ~100KB total

**No Additional Services:**
- Smart links use client-side URL generation
- No API calls to external stores
- Zero cost

**Still on FREE tier!** ✅

---

## File Structure

### Backend:
- `server/routes/shopping.js` - Shopping list API endpoints
- `server/database/migration_phase3_shopping.sql` - Database schema

### Frontend:
- `client/app/shopping/page.js` - Shopping lists UI
- `client/components/ShoppingListSelector.js` - Add to list modal
- `client/lib/smartLinks.js` - Store URL generation
- `client/lib/api.js` - Shopping API functions (updated)
- `client/components/GuideCard.js` - Shopping cart button (updated)

---

## Troubleshooting

**Shopping cart icon doesn't appear:**
- Only shows on guides with ingredients
- Check if guide has ingredients array

**Store links don't work:**
- Links are search URLs, not direct purchases
- User still needs to add items to cart manually on store site
- This is intentional (no API integration yet)

**Can't create shopping list:**
- Check database migration ran successfully
- Check browser console for errors
- Verify user is logged in

**Region detection wrong:**
- Currently uses timezone
- Can be enhanced with IP geolocation later
- Or add user setting to manually select region

---

## Next Steps

After Phase 3 deployment:
1. Test creating shopping lists
2. Try adding guides to lists
3. Click store links (they should open store searches)
4. Share with users!

Ready for Phase 4: Reminders & Push Notifications
