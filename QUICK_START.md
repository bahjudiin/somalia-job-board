# Somalia Job Board - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Extract & Install
```bash
# Extract the ZIP file
unzip somalia-job-board.zip
cd somalia-job-board

# Install dependencies
pnpm install
# or: npm install
```

### Step 2: Start Development Server
```bash
pnpm dev
```
Open http://localhost:3000 in your browser

### Step 3: View the Website
- **Hero Section:** Search bar with job statistics
- **Filters:** Type, Source, Sort options
- **Job Listings:** 30 jobs from 10+ sources
- **Visualizations:** Charts showing market trends
- **Footer:** Links to job sources

---

## 📁 Project Structure Quick Reference

```
client/src/
├── pages/Home.tsx          ← Main job board page (edit here!)
├── index.css               ← Design colors & fonts
└── components/ui/          ← Pre-built UI components
```

---

## 🎨 Customization Guide

### Change Colors
Edit `client/src/index.css`:
```css
:root {
  --primary: #1a3a52;        /* Change this */
  --accent: #d4a574;         /* Or this */
  --background: #faf8f3;     /* Or this */
}
```

### Add/Edit Jobs
Edit `client/src/pages/Home.tsx`, find `jobListings` array:
```typescript
const jobListings = [
  {
    id: 31,
    title: "Your Job Title",
    company: "Company Name",
    location: "Mogadishu, Somalia",
    type: "NGO",  // or Freelance, Remote, Private, Government
    date_posted: "2 days ago",
    deadline: "July 31, 2026",
    description: "Job description here",
    url: "https://link-to-job.com",
    source: "Your Source",
    engagement: 50
  },
  // ... more jobs
];
```

### Change Website Title
Edit `client/index.html`:
```html
<title>Your New Title</title>
```

### Change Logo
Replace the logo URL in `client/src/pages/Home.tsx`:
```typescript
<img src="YOUR_NEW_LOGO_URL" alt="Logo" className="w-10 h-10" />
```

---

## 🔧 Build & Deploy

### Build for Production
```bash
pnpm build
```
Output: `dist/` folder

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

---

## 📊 Key Files Explained

| File | Purpose |
|------|---------|
| `client/src/pages/Home.tsx` | Main page with all job data & UI |
| `client/src/index.css` | Colors, fonts, design system |
| `client/index.html` | HTML template |
| `package.json` | Dependencies & scripts |
| `vite.config.ts` | Build configuration |
| `tailwind.config.ts` | Tailwind CSS config |

---

## 💡 Common Tasks

### Add a New Job Source
1. Add jobs to the `jobListings` array in `Home.tsx`
2. Update the `source` field to your source name
3. The filter will automatically include it!

### Change Filter Options
Edit the `SelectContent` in `Home.tsx`:
```typescript
<SelectItem value="new-type">New Type</SelectItem>
```

### Modify Chart Data
Find `jobsByType`, `engagementTrend`, or `jobCategoryStats` and update values.

### Add New Page
1. Create `client/src/pages/NewPage.tsx`
2. Add route in `client/src/App.tsx`:
```typescript
<Route path="/new-page" component={NewPage} />
```

---

## 🐛 Troubleshooting

### Port 3000 Already in Use
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
pnpm dev -- --port 3001
```

### Dependencies Not Installing
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Build Errors
```bash
# Check TypeScript errors
pnpm check

# Format code
pnpm format
```

---

## 📱 Testing Responsive Design

### Chrome DevTools
1. Press `F12` to open DevTools
2. Click device toggle (top-left)
3. Select device (iPhone, iPad, etc.)

### Test Breakpoints
- **Mobile:** 320px - 640px
- **Tablet:** 640px - 1024px
- **Desktop:** 1024px+

---

## 🎯 Next Steps

1. **Customize colors** to match your brand
2. **Add your job data** to the listings
3. **Test on mobile** using DevTools
4. **Deploy** to your hosting platform
5. **Share** with your audience!

---

## 📚 Learn More

- **React:** https://react.dev
- **Tailwind:** https://tailwindcss.com
- **Vite:** https://vitejs.dev
- **TypeScript:** https://www.typescriptlang.org

---

## 🆘 Need Help?

Check the full documentation:
- `BUILD_INSTRUCTIONS.md` - Complete setup guide
- `API_DOCUMENTATION.md` - All data sources & APIs
- `DESIGN_PHILOSOPHY.md` - Design decisions

---

**Happy Building! 🚀**
