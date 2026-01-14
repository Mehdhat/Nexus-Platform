# Nexus Platform

Nexus Platform is a modern, role-based web app built to demonstrate an entrepreneur–investor ecosystem. It includes dashboards for both roles, discovery and filtering, messaging, meetings/calendar, documents, deals, video calling, and a **mock Payments wallet**—plus a guided product walkthrough (“Take Tour”) for demo purposes.

## Features

### Role-Based Experience
- Entrepreneur and Investor roles
- Role-protected routes and role-specific dashboards
- Role-appropriate navigation and pages

### Discovery & Filtering
- Discover Startups (Investor)
- Find Investors (Entrepreneur)
- Responsive filter/search UI for clean browsing on desktop and mobile

### Payments (Mock)
- Wallet balance + transaction history
- Deposit / Withdraw / Transfer simulation
- Deal funding simulation (demo flow)
- Data persisted in `localStorage`

### Security UX (Demo)
- Password strength meter during registration
- 2-step login with OTP mock verification

### Collaboration Tools
- Messaging module
- Calendar scheduling (responsive FullCalendar)
- Documents module
- Deals module
- Video Call module (UI/demo)

### Guided Tour (Demo)
- React Joyride based walkthrough
- Highlights key navigation/features
- Desktop “Take Tour” button (mobile menu option removed)

## Tech Stack
- React + TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide Icons
- FullCalendar
- React Joyride

## Getting Started

### Prerequisites
- Node.js (recommended: latest LTS)

### Install
```bash
npm install
