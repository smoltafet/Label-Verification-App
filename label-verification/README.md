# TTB Label Verification System

A web application that simulates the Alcohol and Tobacco Tax and Trade Bureau (TTB) label approval process using AI-powered OCR and automated verification.

## Features

- **AI-Powered OCR**: Automatic text extraction from alcohol beverage labels using Google Cloud Vision API
- **Smart Verification**: Validates label content against TTB regulations including:
  - Brand name verification
  - Alcohol content (ABV) matching
  - Product type/class verification
  - Net contents validation
  - Government health warning statement compliance
  - Category-specific checks (sulfite declarations for wine, age statements for spirits)
- **Multi-Category Support**: Wine, Beer, and Distilled Spirits with dynamic form fields
- **Real-time Results**: Detailed pass/fail/warning status for each verification check
- **TTB-Themed UI**: Clean, professional interface styled after official TTB branding

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4
- **Backend**: Firebase (Storage, Firestore, Cloud Vision Extension)
- **OCR**: Google Cloud Vision AI via Firebase Extension
- **Deployment**: Vercel-ready

## Prerequisites

- Node.js 18+ 
- Firebase project with:
  - Cloud Storage enabled
  - Firestore database
  - Cloud Vision AI Extension installed

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd label-verification
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Firebase**
   
   Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

   Then edit `.env.local` with your Firebase credentials:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket_name
# ... etc
```

4. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Firebase Setup

### 1. Storage Security Rules
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

### 2. Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /extractedText/{document=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

### 3. Cloud Vision Extension Configuration
- **Extension**: `storage-extract-image-text`
- **Collection path**: `extractedText`
- **Storage paths to watch**: `labels`
- **Text extraction amount**: `basic`

## Project Structure

```
label-verification/
├── src/
│   ├── app/
│   │   ├── components/          # React components
│   │   │   ├── CategorySelector.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── ImageUpload.tsx
│   │   │   ├── StatusBanner.tsx
│   │   │   ├── VerificationForm.tsx
│   │   │   └── VerificationResultsPanel.tsx
│   │   ├── constants/
│   │   │   └── ttb-rules.ts    # TTB regulations and validation
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Main page
│   └── lib/
│       ├── firebase.ts         # Firebase initialization
│       ├── uploadService.ts    # Image upload & OCR polling
│       └── verificationLogic.ts # Label verification algorithms
├── public/
│   └── Logo.png               # TTB logo
├── .env.local                 # Firebase config (not in git)
├── .env.example               # Environment template
└── package.json
```

## Usage

1. **Select Product Category**: Choose Wine, Beer, or Distilled Spirits
2. **Fill Form**: Enter brand name, product type, ABV, net contents, and category-specific info
3. **Upload Label**: Drag & drop or select a clear image of the label
4. **Submit**: Click "Submit for Verification"
5. **Review Results**: See detailed pass/fail status for each requirement

## Verification Logic

The app checks:
- **Brand Name**: Fuzzy text matching with partial word support
- **ABV**: Regex extraction with ±0.5% tolerance
- **Product Type**: Keyword-based matching
- **Net Contents**: Volume pattern recognition (mL, oz, L)
- **Health Warning**: Presence of 5 required phrases (GOVERNMENT WARNING, SURGEON GENERAL, etc.)
- **Category-Specific**:
  - Wine: Sulfite declaration presence
  - Spirits: Age statement verification

## Build for Production

```bash
npm run build
npm start
```

## Deploy to Vercel

The app is pre-configured for Vercel deployment:

```bash
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

## License

MIT

## Acknowledgments

- TTB regulations and guidelines
- Firebase Cloud Vision AI Extension
- Next.js and React teams
