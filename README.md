# 🏠 Bismi PG Management App

**Developed by ASVEN Technology**

A complete PG/Hostel Management Application for **BISMI MEN'S PLAZA**.

## Features

### 1. 📊 Dashboard
- Total beds, occupied, vacant overview
- Monthly income & expense tracking
- Occupancy rate
- Quick action buttons

### 2. 👥 Customer Management
- Add/Edit/Delete tenants
- Phone, Aadhaar, emergency contacts
- Room & bed allocation
- Check-in/Check-out management
- WhatsApp messaging
- Payment history per customer

### 3. 🛏️ Room Management
- 8 rooms pre-configured (2/3/4/5 sharing)
- 24 total beds
- Occupancy tracking
- Room status (Available/Full/Maintenance)

### 4. 💰 Payment Management
- Record individual payments
- Auto-generate monthly rent for all tenants
- Mark payments as Paid/Pending
- WhatsApp payment reminders
- Payment method tracking (Cash/UPI/GPay/PhonePe)

### 5. ⚡ Electricity Management
- Monthly meter readings
- Auto-calculate units consumed
- Per-unit rate configuration
- Total bill calculation

### 6. 📊 Expense Management
- Category-wise expenses
- Category summary view
- Daily expense tracking
- Vendor management

## Tech Stack

- **Frontend:** React.js (PWA - installable on mobile)
- **Backend:** Node.js + Express.js
- **Database:** SQLite (via better-sqlite3)
- **PWA:** Service Worker for offline support

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation

```bash
# 1. Install backend dependencies
cd bismi-pg-app/backend
npm install

# 2. Install frontend dependencies
cd ../frontend
npm install

# 3. Start the backend server
cd ../backend
npm start

# 4. In a new terminal, start the frontend
cd bismi-pg-app/frontend
npm start
```

### Running

- **Backend:** http://localhost:3001
- **Frontend:** http://localhost:3000

### Production Build

```bash
# Build frontend
cd frontend
npm run build

# Start server (serves both backend + frontend)
cd ../backend
npm start
```

Then open http://localhost:3001 on your phone browser and "Add to Home Screen" to install as PWA.

## Room Configuration (BISMI MEN'S PLAZA)

| Room | Sharing Type | Total Beds |
|------|-------------|------------|
| Room 1-4 | 2 Sharing | 8 beds |
| Room 5 | 3 Sharing | 3 beds |
| Room 6-7 | 4 Sharing | 8 beds |
| Room 8 | 5 Sharing | 5 beds |
| **Total** | **8 Rooms** | **24 beds** |

## WhatsApp Integration

The app generates WhatsApp links for:
- Payment reminders
- Rent due notifications
- Custom messages to tenants

---

**© 2026 ASVEN Technology**
