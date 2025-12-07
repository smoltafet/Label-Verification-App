# TTB Label Verification System

A full-stack web application that simulates the Alcohol and Tobacco Tax and Trade Bureau (TTB) label approval process. The system allows users to submit alcohol beverage labels along with product information, then uses Google OCR and automated verification to ensure the label matches the submitted data and complies with TTB regulations.

## 🌟 Features

### **Authentication & User Management**
- 👤 User profiles with persistent data storage
- 🔒 Protected routes for authenticated users only
- 🚪 Session management with automatic redirects

### **Label Verification**
- 📝 Multi-step product information form with dynamic fields based on product category
- 📸 Image upload with drag-and-drop support
- 🤖 Automated OCR text extraction using Google Cloud Vision AI
- ✅ Intelligent verification against TTB labeling requirements
- 🎯 Real-time verification results with detailed discrepancy reports
- 📊 Verification scoring system (0-100%)

### **Product Categories Supported**
- 🍷 **Wine** - with sulfite declaration requirements
- 🍺 **Beer** - with ingredient listing
- 🥃 **Distilled Spirits** - with age statement and distiller information

### **Past Submissions Management**
- 📋 View all previous label submissions
- 🔍 Search and filter by brand name, product type, or status
- 👁️ Detailed verification results modal with color-coded discrepancies
- 📄 PDF report generation and download
- 🔄 Auto-refresh functionality

### **Lisa AI Assistant**
- 💬 AI-powered chatbot integrated with OpenAI Assistants API
- 📚 Helps with TTB labeling rules and requirements
- 🧠 Persistent conversation history per user
- ⚡ Real-time responses with typing indicators
- 🎨 Beautiful slide-out panel interface

### **Onboarding & Help**
- 🎠 Interactive onboarding carousel for first-time users
- 📖 "How It Works" guide accessible anytime
- 🖼️ Step-by-step visual instructions with smooth transitions

### **Modern UI/UX**
- 🎨 Stripe-inspired clean, minimal design
- 🏛️ Government aesthetic with professional styling
- 📱 Fully responsive across all devices
- 🌊 Smooth animations with Framer Motion
- 🎯 Custom dropdown components with animated selection
- 🗂️ Collapsible sidebar navigation
- 🔔 Real-time status banners for user feedback

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **UI Components:** Custom-built with shadcn/ui patterns

### **Backend & Services**
- **Authentication:** Firebase Authentication (Email/Password)
- **Database:** Cloud Firestore (NoSQL)
- **File Storage:** Firebase Storage
- **OCR:** Google Cloud Vision AI (via Firebase Extension)
- **AI Assistant:** OpenAI Assistants API
- **PDF Generation:** jsPDF

### **Development Tools**
- **Build Tool:** Turbopack (Next.js)
- **Linting:** ESLint with Next.js config
- **Package Manager:** npm

## 📁 Project Structure

```
label-verification/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── constants/
│   │   │   └── ttb-rules.ts         # TTB verification rules
│   │   ├── dashboard/
│   │   │   └── page.tsx             # New submission form
│   │   ├── login/
│   │   │   └── page.tsx             # Login page
│   │   ├── signup/
│   │   │   └── page.tsx             # Registration page
│   │   ├── profile/
│   │   │   └── page.tsx             # User profile settings
│   │   ├── submissions/
│   │   │   └── page.tsx             # Past submissions history
│   │   ├── layout.tsx               # Root layout with auth provider
│   │   ├── page.tsx                 # Root redirect to login
│   │   └── globals.css              # Global styles
│   ├── components/
│   │   ├── forms/
│   │   │   └── ImageUpload.tsx      # Image upload component
│   │   ├── layout/
│   │   │   ├── AppSidebar.tsx       # Sidebar navigation
│   │   │   └── Header.tsx           # Page header
│   │   ├── shared/
│   │   │   ├── OnboardingCarousel.tsx  # Tutorial carousel
│   │   │   └── StatusBanner.tsx     # Status messages
│   │   └── ui/
│   │       ├── fluid-dropdown.tsx   # Animated category selector
│   │       └── sidebar.tsx          # Sidebar primitives
│   ├── features/
│   │   ├── auth/
│   │   │   ├── AuthContext.tsx      # Auth state management
│   │   │   └── ProtectedRoute.tsx   # Route protection
│   │   └── verification/
│   │       ├── LisaAssistant.tsx    # AI chatbot
│   │       ├── VerificationForm.tsx # Main submission form
│   │       └── VerificationResultsPanel.tsx
│   └── services/
│       ├── firebase.ts              # Firebase initialization
│       ├── openaiService.ts         # OpenAI API integration
│       ├── uploadService.ts         # Image upload & OCR
│       └── verificationLogic.ts     # Label verification rules
├── public/
│   ├── Logo.png                     # TTB logo
│   ├── lisa.png                     # AI assistant avatar
│   └── step[1-4].png               # Onboarding tutorial images
├── .env.local                       # Environment variables
├── next.config.ts                   # Next.js configuration
├── tailwind.config.ts               # Tailwind CSS config
├── tsconfig.json                    # TypeScript config
└── package.json                     # Dependencies
```

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ and npm
- Firebase project with:
  - Authentication enabled (Email/Password provider)
  - Firestore database
  - Firebase Storage
  - Cloud Vision AI Extension installed
- OpenAI API key and Assistant ID

### **Installation**

1. **Clone the repository:**
```bash
git clone <repository-url>
cd label-verification
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# OpenAI Configuration
NEXT_PUBLIC_OPENAI_API_KEY=sk-...
NEXT_PUBLIC_OPENAI_ASSISTANT_ID=asst_...
```

4. **Configure Firebase:**

   a. **Install Cloud Vision AI Extension:**
   - Go to Firebase Console → Extensions
   - Install "Extract Text from Images with Cloud Vision API"
   - Set image path to: `labels`
   - Set output collection to: `extractedText`

   b. **Set up Firestore Security Rules:**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Public read for OCR results
       match /extractedText/{document=**} {
         allow read: if true;
       }
       
       // User-specific data
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
         
         // Nested submissions
         match /submissions/{submissionId} {
           allow read, write: if request.auth != null && request.auth.uid == userId;
         }
         
         // Nested AI conversations
         match /conversations/{conversationId} {
           allow read, write: if request.auth != null && request.auth.uid == userId;
         }
       }
     }
   }
   ```

   c. **Set up Storage Security Rules:**
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /labels/{fileName} {
         allow read, write: if true;
       }
     }
   }
   ```

5. **Run the development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

### **For First-Time Users:**
1. **Sign Up** - Create an account with first name, last name, username, and password
2. **Tutorial** - View the automatic onboarding carousel
3. **Dashboard** - You'll be redirected to the new submission form

### **Submitting a Label:**
1. Select your product category (Wine, Beer, or Distilled Spirits)
2. Fill out all required product information fields
3. Upload a clear photo of your label
4. Click "Submit for Verification"
5. Wait for AI-powered verification (typically 10-30 seconds)
6. Review detailed results with pass/fail indicators

### **Viewing Past Submissions:**
1. Click "Past Submissions" in the sidebar
2. Search or filter submissions by status, brand, or product type
3. Click the eye icon to view detailed verification results
4. Click the download icon to get a PDF report

### **Using Lisa AI Assistant:**
1. Click the Lisa button (bottom-right corner)
2. Ask questions about TTB labeling requirements
3. Get help understanding verification results
4. Conversation history is automatically saved

## 🔍 How Verification Works

1. **Image Upload** → Stored in Firebase Storage
2. **OCR Processing** → Cloud Vision AI extracts text from the image
3. **Data Comparison** → Compares extracted text with submitted form data
4. **Rule Checking** → Validates against TTB regulations:
   - Brand name match
   - Product type verification
   - Alcohol content accuracy
   - Net contents validation
   - Health warning presence and correctness
   - Category-specific requirements (sulfites, ingredients, etc.)
5. **Scoring** → Generates a 0-100% verification score
6. **Results** → Provides detailed pass/fail/warning messages for each field

## 🎨 Design Philosophy

- **Stripe-inspired UI:** Clean, minimal, and professional
- **Government aesthetic:** Trust-building design with official TTB branding
- **Mobile-first:** Responsive design that works on all devices
- **Accessibility:** Keyboard navigation, ARIA labels, and screen reader support
- **Performance:** Optimized images, lazy loading, and efficient data fetching

## 🔐 Security Features

- Firebase Authentication for secure user management
- Protected API routes and client-side route guards
- Environment variables for sensitive credentials
- Firestore security rules for data isolation
- User-specific data storage (submissions, conversations)

## 📦 Dependencies

### Core
- `next` - React framework
- `react` & `react-dom` - UI library
- `typescript` - Type safety

### Firebase
- `firebase` - Backend services

### UI & Animations
- `tailwindcss` - Utility-first CSS
- `framer-motion` - Animations
- `lucide-react` - Icons
- `clsx` & `tailwind-merge` - Class name utilities

### AI & Services
- `openai` - AI assistant integration
- `jspdf` - PDF generation

## 🚧 Future Enhancements

- [ ] Email notifications for submission status changes
- [ ] Admin dashboard for TTB agents
- [ ] Batch label processing
- [ ] Historical compliance tracking
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Integration with TTB's COLAs system

## 📄 License

This is a demonstration project for educational purposes.

## 🤝 Contributing

This is a private project. For questions or suggestions, please contact the development team.

## 📞 Support

For help with the application:
- Use the Lisa AI Assistant (in-app)
- Check TTB official guidelines at [ttb.gov](https://www.ttb.gov)
- Contact your system administrator

---

**Built with ❤️ for the Alcohol and Tobacco Tax and Trade Bureau**
