# BubbleFlow Laundry Manager 🌊

A modern, AI-enhanced laundry order management system built for performance, transparency, and ease of use.

## 🚀 Setup Instructions

1. **Authentication**: This app uses Google Authentication. Ensure you are signed into your browser with a Google account.
2. **Environment**:
   - The app is pre-configured with Firebase (Firestore + Auth).
   - Gemini API is used for "AI Wash Advice" features.
3. **Running the App**:
   - The app starts automatically in the AI Studio environment.
   - If running locally:
     ```bash
     npm install
     npm run dev
     ```

## ✨ Features Implemented

- **Real-time Dashboard**: Track total revenue, order counts, and status distribution with interactive charts.
- **Order Lifecycle Management**: Create orders with dynamic bill calculation and update through 4 stages: `RECEIVED` → `PROCESSING` → `READY` → `DELIVERED`.
- **Intelligent Search**: Filter orders by customer name, phone number, or status.
- **AI Care Expert**: Integrated Gemini 2.0 to provide specialty wash care advice based on specific garment combinations.
- **Security First**: 
  - Mandatory Google Auth.
  - Hardened Firestore rules (Attribute-Based Access Control).
  - Multi-tenant isolation (users only see their own shop's orders).
- **Responsive Design**: Polished, mobile-first interface using Tailwind CSS and Lucide icons.

## 🤖 AI Usage Report

This project was built with a "Pro-AI" workflow, leveraging Gemini for both code generation and integrated application features.

- **Tools Used**: Gemini 2.0 (AI Studio), standard React/Firebase ecosystem.
- **Sample Prompts Used**:
  - *"Design a professional laundry management dashboard with a clean, airy blue/white theme."*
  - *"Implement a real-time Firestore sync for orders with sorting by date."*
  - *"Create a security specification for a multi-tenant laundry app to prevent PII leaks."*
- **AI Assistance**:
  - **Scaffolding**: AI rapidly generated the initial Firebase configuration and TypeScript types.
  - **Logic**: AI handled the complex logic for calculating totals and managing garment array states.
  - **Improvement**: AI helped refine the "Dirty Dozen" security payloads to ensure 100% rule coverage.
- **Correction/Fixes**:
  - **Rule Syntax**: AI initially suggested `.hasOnly()` on a Firestore List, which was corrected to use `affectedKeys()` on the map diff instead.
  - **HMR Handling**: Configured `DISABLE_HMR` to prevent preview flickering during rapid development turns.

## ⚖️ Tradeoffs & Future Improvements

- **Tradeoffs**:
  - Used in-memory state switching instead of a formal router (React Router) to maintain simplicity and speed.
  - Limited to Google Login for the prototype phase.
- **Next Steps**:
  - **Customer Portal**: Add a public tracking page where customers can enter their Order ID to see status without logging in.
  - **SMS Integration**: Auto-notify customers via Twilio when order status reaches `READY`.
  - **Printable Receipts**: Generate PDF invoices using `jsPDF`.

## 🛠️ Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, Motion.
- **Backend/DB**: Firebase Auth, Cloud Firestore.
- **AI**: Google Generative AI (Gemini 2.0).
- **Visualization**: Recharts.
