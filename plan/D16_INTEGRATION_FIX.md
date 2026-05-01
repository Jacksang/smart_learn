# Frontend Integration Fix — All Pages Working

## Root Causes Found

1. **API response format inconsistency**: Some endpoints return `{success:true, data:{...}}`, others return plain `{projects:[...]}` — the interceptor only unwraps `success`-wrapped responses
2. **Store response mapping bugs**: Profile store stores `{user:{...}, subscription:{...}}` but pages access `profile.display_name` directly
3. **Missing error handling**: Failed API calls crash Vue rendering on some pages

## Fix Plan (spawn sub-agent)

### Fix 1: apiClient unwrap ALL responses uniformly
Simplify: always unwrap `response.data` — remove conditional success-check

### Fix 2: Fix profileStore data mapping
After interceptor fix, profileStore should extract the user object correctly

### Fix 3: Add data ready guards to all pages
Every page should show content even before API calls complete

### Fix 4: Test all 6 pages in browser console via build
