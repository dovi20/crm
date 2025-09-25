# מערכת ניהול מלאי והזמנות

מערכת ניהול מלאי מתקדמת בנויה על Next.js עם תמיכה במחסנים מרובים, ניהול לקוחות ומסמכי עסק.

## תכונות עיקריות

- 🏪 **ניהול מלאי** - מחסנים מרובים, העברות, יבוא/יצוא JSON
- 👥 **ניהול לקוחות** - רישום, עריכה, מעקב יתרות  
- 📄 **מסמכי עסק** - חשבוניות, הזמנות, קבלות
- 🔐 **מערכת כניסה** - הגנה על הגישה למערכת
- 🎨 **עיצוב RTL** - תמיכה מלאה בעברית
- 📱 **Responsive** - עובד מושלם במובייל ובמחשב

## טכנולוגיות

- **Next.js 15** - React framework מתקדם
- **Material-UI** - ספריית עיצוב מודרנית
- **TypeScript** - פיתוח בטוח יותר
- **localStorage** - אחסון מקומי לנתונים
- **Rivhit API** - אינטגרציה עם מערכת החשבונות

## התקנה מקומית

```bash
# שכפול הפרויקט
git clone https://github.com/YOUR_USERNAME/inventory-management.git
cd inventory-management

# התקנת תלויות
npm install

# העתקת קובץ environment
cp .env.example .env.local

# הרצה במצב פיתוח
npm run dev
```

האפליקציה תהיה זמינה ב: http://localhost:3000

### פרטי כניסה ברירת מחדל:
- **שם משתמש:** admin
- **סיסמה:** 123456

## פריסה לפרודקשן

### דרישות שרת
- **Node.js** 18+ 
- **Nginx** עם SSL
- **PM2** לניהול processes
- **Ubuntu/Linux** server

### הכנה לפריסה

```bash
# בניית הפרויקט
npm run build

# בדיקה מקומית
npm start
```

### התקנה בשרת

```bash
# התחברות לשרת
ssh username@your-server.com

# הכנת סביבה
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs nginx
sudo npm install -g pm2

# יצירת תיקיית פרויקט
sudo mkdir -p /var/www/crm
sudo chown -R $USER:$USER /var/www/crm

# שכפול מגיטהאב
cd /var/www/crm
git clone https://github.com/YOUR_USERNAME/inventory-management.git .

# התקנה והרצה
npm ci --production
cp .env.example .env.local
# עריכת .env.local עם הנתונים האמיתיים
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### הגדרת Nginx

יצירת קובץ: `/etc/nginx/sites-available/crm.pamonim.online`

```nginx
server {
    listen 443 ssl http2;
    server_name crm.pamonim.online;
    
    # SSL certificates
    ssl_certificate /path/to/your/certificate.crt;
    ssl_private_key /path/to/your/private.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name crm.pamonim.online;
    return 301 https://$server_name$request_uri;
}
```

```bash
# הפעלת האתר
sudo ln -s /etc/nginx/sites-available/crm.pamonim.online /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## עדכונים

```bash
# בשרת
cd /var/www/crm
git pull origin main
npm ci --production
npm run build
pm2 restart inventory-crm
```

או שימוש בסקריפט האוטומטי:
```bash
./deploy.sh
```

## הגדרות Environment

יצירת קובץ `.env.local`:

```env
NODE_ENV=production
NEXT_RIVHIT_API_TOKEN=your_rivhit_api_token
NEXT_RIVHIT_USE_MOCK=false
```

## מבנה הפרויקט

```
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (app)/          # Protected routes
│   │   ├── login/          # Login page
│   │   └── api/            # API routes
│   ├── components/         # React components
│   ├── lib/               # Utilities
│   ├── state/             # State management
│   └── theme/             # Material-UI theme
├── public/                # Static files
└── ecosystem.config.js    # PM2 configuration
```

## פיתוח

### הוספת תכונות חדשות
1. צור branch חדש: `git checkout -b feature/new-feature`
2. בצע שינויים ובדיקות
3. push ל-GitHub: `git push origin feature/new-feature`
4. יצור Pull Request

### סגנון קוד
- שימוש ב-TypeScript בלבד
- עקיבה אחר ESLint rules
- RTL support חובה
- Responsive design

## תמיכה טכנית

לשאלות ותמיכה:
- צור Issue בגיטהאב
- בדוק את הלוגים: `pm2 logs inventory-crm`
- בדוק סטטוס: `pm2 status`

## רישיון

MIT License - ראה קובץ LICENSE לפרטים נוספים.
