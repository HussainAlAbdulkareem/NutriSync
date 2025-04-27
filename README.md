# 📚 NutriSync – Smart Nutrition Tracker Web App

Welcome to **NutriSync**, a full-stack nutrition tracking platform designed to help users create, explore, and manage recipes while tracking calories. This README provides clear instructions to **install, run, and test** the project locally.

---

## 🔧 Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Flask (Python)
- **Database**: PostgreSQL (via Supabase)

---

## 🚀 Installation & Setup Guide

### 1. **Clone the Repository**

```bash
git clone https://github.com/mahirazabin/NutriSync.git
cd nutrisync
```

### 2. **Set Up the Backend**

#### ⚙️ Create Virtual Environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

#### 🔐 Configure Environment

Create a `.env` file inside `/backend/`:

```bash
# .env
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
SECRET_KEY=your-secret
```

#### ▶️ Run Flask Server

```bash
flask run
```

---

### 3. **Set Up the Frontend**

```bash
cd ../frontend
npm install
npm run dev
```

- Frontend will start on: `http://localhost:3000`
- Backend runs at: `http://localhost:5000`

---

## 🧪 How to Use the Web App

### 1. **Login as:**

- `Admin` – manage users, analytics
- `Moderator` – approve/assign recipes, manage ingredients/categories
- `Member` – create recipes, track calories

### 2. **Key Functionalities**

- ✅ Member Registration & Login
- 🍲 Add/View Recipes with Tags & Ingredients
- 📊 Calorie Tracker and Charts
- 🧑‍💼 Role-based Dashboards (Admin / Moderator / Member)
- 🗂️ CRUD for Ingredients & Categories
- ❤️ Like Recipes, ➕ Track Calories

