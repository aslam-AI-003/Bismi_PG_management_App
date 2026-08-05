# 🏠 Bismi PG Management App v3.0

**Full-stack PG/Hostel Management Application**  
Developed by **ASVEN Technology**

---

## 🚀 Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 18 (Vercel) |
| Backend | Node.js + Express (Render) |
| Database | Supabase PostgreSQL |
| Storage | Supabase Storage |
| Auth | Custom (Admin + Tenant login) |

---

## 📋 Features

### Admin Panel
- 🏠 **Dashboard** - Overview with occupancy, income, expenses
- 👥 **Tenants** - Add/manage tenants with ID proof upload
- 🛏️ **Rooms** - Room & bed management
- 💰 **Payments** - Record payments, generate monthly rent
- ⚡ **Electricity** - Reading tracking & billing
- 📤 **Expenses** - Track all expenses by category
- 🎫 **Issues** - Manage tenant complaints
- 📊 **Reports** - Monthly financial reports
- 📱 **WhatsApp** - Send payment reminders

### Tenant Portal
- 👤 Profile view with room/bed details
- 💰 Payment history & pending bills
- 💳 UPI direct payment link
- 🎫 Raise & track issues
- 📥 Download payment receipts

---

## 🛠️ Setup Instructions

### 1. Supabase Database Setup

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open your project → **SQL Editor**
3. Run `backend/supabase-schema.sql` (creates tables, indexes, RLS, storage)
4. Run `backend/supabase-functions.sql` (creates RPC functions)

### 2. Backend Setup (Local)

```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase credentials
npm install
npm start
```

### 3. Frontend Setup (Local)

```bash
cd frontend
npm install
# Set API URL (create .env.local)
echo "REACT_APP_API_URL=http://localhost:3001" > .env.local
npm start
```

---

## 🌐 Deployment

### Backend → Render.com

1. Create new **Web Service** on [Render](https://render.com)
2. Connect GitHub repo
3. Set:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. Add Environment Variables:
   - `SUPABASE_URL` = `https://dzaprkycqmpiggthvsms.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = your service role key
   - `NODE_ENV` = `production`
   - `FRONTEND_URL` = your Vercel frontend URL

### Frontend → Vercel

1. Connect GitHub repo on [Vercel](https://vercel.com)
2. Set:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
3. Add Environment Variable:
   - `REACT_APP_API_URL` = your Render backend URL (e.g., `https://bismi-pg-backend.onrender.com`)

---

## 🔑 Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | bismi2024 |
| Tenant | (tenant name) | (phone number) |

---

## 📁 Project Structure

```
bismi-pg-app/
├── backend/
│   ├── server.js          # Express API server
│   ├── database.js        # Supabase client
│   ├── package.json       # Dependencies
│   ├── supabase-schema.sql    # Database schema
│   ├── supabase-functions.sql # RPC functions
│   ├── render.yaml        # Render config
│   └── .env.example       # Environment template
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   ├── logo.png
│   │   ├── manifest.json
│   │   └── sw.js
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── styles.css
│   │   └── components/
│   │       ├── Dashboard.js
│   │       ├── Customers.js
│   │       ├── Rooms.js
│   │       ├── Payments.js
│   │       ├── Electricity.js
│   │       ├── Expenses.js
│   │       ├── Issues.js
│   │       ├── Reports.js
│   │       ├── Login.js
│   │       ├── TenantDashboard.js
│   │       └── TenantProfile.js
│   └── package.json
├── vercel.json
└── README.md
```

---

## 🔒 Security Features

- ✅ Helmet.js security headers
- ✅ CORS origin restrictions
- ✅ Rate limiting (200 req/15min API, 10 req/15min auth)
- ✅ File upload validation (5MB max, image/PDF only)
- ✅ Supabase Row Level Security (RLS)
- ✅ Service role key for backend-only access
- ✅ Production error masking

---

## 📞 Support

Developed by **ASVEN Technology**  
GitHub: [github.com/aslam-AI-003/Bismi_PG_management_App](https://github.com/aslam-AI-003/Bismi_PG_management_App)
