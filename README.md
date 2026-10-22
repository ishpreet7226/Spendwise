# Spendwise 💸

> **Money is better shared.**

Spendwise is a modern, responsive, and delightful expense-sharing web application built to help friends, roommates, families, travel groups, and colleagues track shared expenses, split bills, and understand who owes whom without awkwardness.

---

## ✨ Features

### 1. 📊 Real-Time Dashboard
- **Net Balances**: Instant clarity on whether you are owed money or owe others.
- **You Owe & Owed to You**: High-contrast, warm color cards displaying pending totals.
- **Active Groups**: Quick preview of your trips, housemates, and office squads with live group-specific balances.
- **Direct Debt Settle**: Quick one-click settlement actions directly from your dashboard.
- **Recent Activity Feed**: Real-time audit trail of added expenses and recorded payments.

### 2. 👥 Groups & Circles
- **Create & Manage Groups**: Customize groups with custom emojis, warm color palettes, and descriptions.
- **Group Detail View**:
  - Filterable expense history.
  - Simplified debt resolution matrix ("Priya pays Arjun ₹4,500").
  - Member balances with breakdown of individual net positions.
  - Member management (add new members on the fly).

### 3. 🧾 Flexible Bill Splitting
- **Multiple Splitting Modes**:
  - **Equal Split**: Even split with automatic rounding-remainder balance management.
  - **Exact Amounts (₹)**: Custom amounts with live validation against the total.
  - **Percentages (%)**: Proportion-based splitting with live 100% check.
  - **Shares**: Ratio-based splitting (e.g. 1 share vs 2 shares).
- **Categorization**: Food & Drinks, Transport, Stay, Fun, Utilities, Shopping, Health, and Other.
- **Expense Details & Management**: View breakdown, edit expenses, or delete them with confirmation.

### 4. 🤝 Simplified Settlements & "Who Owes Whom"
- **Greedy Debt Minimization Algorithm**: Computes the minimum number of direct peer-to-peer transfers needed to settle all debts.
- **One-Click Payments**: Pre-fills payer, receiver, and amount.
- **Settlement History**: Complete log of recorded payments with notes (UPI, GPay, Cash).

### 5. 📈 Spending Analytics
- **Category Donut Chart**: Visual distribution of where your group's money goes.
- **Monthly Spending Trend**: Bar charts tracking expenditure over time using Recharts.
- **Group Comparison**: Compare spending across different friend circles and trips.
- **Key Metrics**: Total group spending, your personal share, and average bill size.

### 6. 🕒 Activity Feed
- Comprehensive chronological stream of all actions: expenses added, edited, deleted, settlements logged, and groups created.
- Filter by activity type and group.

### 7. ⚙️ Preferences & Demo Data Management
- User profile editing with custom avatar colors.
- Default currency preference (`INR ₹`, `USD $`, `EUR €`, `GBP £`).
- One-click **Reset Demo Data** button to restore sample dataset anytime.

---

## 🎨 Design Direction — Community & Warmth

Spendwise is crafted to feel social, friendly, and approachable rather than like a cold corporate fintech portal:

- **Coral (`#E9785B`)**: Brand identity and primary actions.
- **Leaf Green (`#43875A`)**: Positive balances and settled payments.
- **Warm Cream (`#FFF8EF`)**: Application background.
- **Forest Ink (`#28372F`)**: Primary text.
- **Sunshine Yellow (`#E9B94E`)**: Awaiting confirmation, warnings, and accents.
- **Sky Blue (`#6CA6C9`)**: Informational highlights and trips.
- **Soft Coral (`#FCE6E0`)**: Balances the user owes.
- **Soft Green (`#E1F1E4`)**: Balances owed to the user.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server & Client Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Lucide Icons
- **UI Components**: Radix UI primitives / shadcn-compatible accessible components
- **Charts**: Recharts
- **Forms & State**: Local storage persistence with pub/sub reactivity for instant cross-component updates

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The application automatically redirects to the dashboard.

### 3. Build for Production
```bash
npm run build
npm start
```
