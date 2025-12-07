import { ref, uploadBytes } from 'firebase/storage';
import { collection, getDocs } from 'firebase/firestore';
import { storage, firestore } from './firebase';

export async function uploadAndExtractText(file: File): Promise<string> {
  // 1. Upload to Storage in the labels folder
  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name}`;
  const storagePath = `labels/${fileName}`;
  const storageRef = ref(storage, storagePath);
  
  console.log('Uploading file:', fileName);
  console.log('Storage path:', storagePath);
  await uploadBytes(storageRef, file);
  console.log('File uploaded successfully');
  
  // 2. Poll for Cloud Vision Extension results
  // Extension creates document with random ID but stores file path in 'file' field
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '';
  const expectedFilePath = `gs://${storageBucket}/${storagePath}`;
  console.log('Looking for file path:', expectedFilePath);
  
  return new Promise((resolve, reject) => {
    const extractedTextCol = collection(firestore, 'extractedText');
    
    let resolved = false;
    let pollCount = 0;
    const maxPolls = 60; // Poll for 60 seconds (1 second intervals)
    
    const pollForDocument = async () => {
      if (resolved) return;
      
      pollCount++;
      console.log(`Poll attempt ${pollCount}/${maxPolls}`);
      
      try {
        // Query all documents in extractedText collection
        const snapshot = await getDocs(extractedTextCol);
        
        console.log(`Found ${snapshot.size} documents in extractedText collection`);
        
        // Find document where 'file' field matches our uploaded file
        let extractedText = '';
        let docFound = false;
        
        snapshot.forEach((doc) => {
          if (docFound) return;
          
          const data = doc.data();
          const docFilePath = data.file || '';
          
          // Check if this document's file path matches our upload
          if (docFilePath === expectedFilePath || docFilePath.endsWith(storagePath)) {
            console.log('Matching document found!', doc.id, data);
            docFound = true;
            
            // Extract text from the 'text' field
            extractedText = data.text || '';
            console.log('Extracted text length:', extractedText.length);
          }
        });
        
        if (docFound && extractedText.trim().length > 0 && !resolved) {
          resolved = true;
          console.log('✅ OCR successful! Returning text.');
          resolve(extractedText);
          return;
        } else if (docFound && extractedText.trim().length === 0 && !resolved) {
          // Document found but no text detected
          resolved = true;
          console.warn('⚠️ Document found but no text detected in image');
          reject(new Error('NO_TEXT_DETECTED'));
          return;
        }
        
        // Continue polling if not resolved and haven't exceeded max polls
        if (!resolved && pollCount < maxPolls) {
          setTimeout(pollForDocument, 1000); // Poll every second
        } else if (!resolved) {
          console.error('Timeout after 60 seconds. Document not found.');
          reject(new Error('OCR processing timeout. Document not found after 60 seconds.'));
        }
        
      } catch (error: any) {
        console.error('Error polling Firestore:', error);
        if (!resolved) {
          reject(new Error(`Firestore error: ${error.message}`));
        }
      }
    };
    
    // Start polling after 2 seconds (give extension time to start)
    setTimeout(pollForDocument, 2000);
  });
}

