// Firestore operations for face recognition
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  doc,
  getDoc 
} from 'firebase/firestore';
import { db } from './firebase';
import { StoredIdentity } from '../types';

const COLLECTION_NAME = 'faces';

/**
 * Save face embedding to Firestore
 */
export async function saveFaceEmbedding(
  name: string,
  embedding: Float32Array
): Promise<string> {
  try {
    // Convert Float32Array to array for Firestore storage
    const embeddingArray = Array.from(embedding);
    
    console.log('Saving face embedding to Firestore:', {
      name,
      embeddingLength: embeddingArray.length,
    });
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      name,
      embedding: embeddingArray,
      createdAt: new Date(),
    });
    
    console.log('Face embedding saved successfully with ID:', docRef.id);
    
    return docRef.id;
  } catch (error: any) {
    console.error('Error saving face embedding:', error);
    
    // Check for permission errors
    if (error.code === 'permission-denied') {
      throw new Error(
        'Firebase permission denied. Please update Firestore security rules. See FIREBASE_SETUP.md for instructions.'
      );
    }
    
    throw new Error(`Failed to save face: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Get all stored faces
 */
export async function getAllFaces(): Promise<StoredIdentity[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME));
    const querySnapshot = await getDocs(q);
    
    console.log(`Loaded ${querySnapshot.docs.length} faces from Firestore`);
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        embedding: new Float32Array(data.embedding),
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });
  } catch (error: any) {
    console.error('Error loading faces:', error);
    
    // Check for permission errors
    if (error.code === 'permission-denied') {
      throw new Error(
        'Firebase permission denied. Please update Firestore security rules. See FIREBASE_SETUP.md for instructions.'
      );
    }
    
    throw new Error(`Failed to load faces: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Find face by name
 */
export async function findFaceByName(name: string): Promise<StoredIdentity | null> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('name', '==', name)
  );
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  const doc = querySnapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    embedding: new Float32Array(data.embedding),
    createdAt: data.createdAt?.toDate() || new Date(),
  };
}

/**
 * Get face by ID
 */
export async function getFaceById(id: string): Promise<StoredIdentity | null> {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    embedding: new Float32Array(data.embedding),
    createdAt: data.createdAt?.toDate() || new Date(),
  };
}

