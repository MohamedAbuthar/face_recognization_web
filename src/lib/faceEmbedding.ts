/**
 * Face Embedding Generator
 * Creates unique face embeddings from facial landmarks for accurate recognition
 */

import { FaceLandmarks } from './mediapipeClient';

/**
 * Generate a unique face embedding from facial landmarks
 * Uses geometric features and distances between key facial points
 */
export function generateFaceEmbedding(
  landmarks: FaceLandmarks,
  imageData: ImageData
): Float32Array {
  const points = landmarks.points;
  
  if (points.length < 468) {
    throw new Error('Insufficient landmarks for embedding generation');
  }

  // Create a 512-dimensional embedding
  const embedding = new Float32Array(512);
  let idx = 0;

  // 1. Key facial point coordinates (normalized)
  const keyPoints = [
    // Face outline
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323,
    // Left eye
    33, 160, 158, 133, 153, 144,
    // Right eye  
    362, 385, 387, 263, 373, 380,
    // Nose
    1, 2, 98, 327, 168,
    // Mouth
    61, 291, 0, 17, 269,
    // Eyebrows
    70, 63, 105, 66, 107, 336, 296, 334, 293, 300,
  ];

  // Store normalized coordinates
  for (const pointIdx of keyPoints) {
    if (pointIdx < points.length) {
      embedding[idx++] = points[pointIdx].x;
      embedding[idx++] = points[pointIdx].y;
      if (points[pointIdx].z !== undefined) {
        embedding[idx++] = points[pointIdx].z || 0;
      }
    }
  }

  // 2. Distances between key facial features
  const distances = [
    // Eye distances
    [33, 133], [362, 263], // Eye widths
    [33, 362], // Inter-eye distance
    
    // Nose to eyes
    [1, 33], [1, 362],
    
    // Mouth width and height
    [61, 291], [0, 17],
    
    // Face width and height
    [234, 454], [10, 152],
    
    // Eyebrow distances
    [70, 300], [63, 293],
    
    // Nose to mouth
    [1, 0], [2, 17],
    
    // Eye to mouth
    [33, 61], [362, 291],
  ];

  for (const [p1, p2] of distances) {
    if (p1 < points.length && p2 < points.length) {
      const dx = points[p1].x - points[p2].x;
      const dy = points[p1].y - points[p2].y;
      const dz = (points[p1].z || 0) - (points[p2].z || 0);
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      embedding[idx++] = dist;
    }
  }

  // 3. Angles between facial features
  const angles = [
    // Eye angles
    [33, 133, 362], [362, 263, 33],
    
    // Nose angles
    [1, 2, 98], [1, 2, 327],
    
    // Mouth angles
    [61, 0, 291], [61, 17, 291],
    
    // Face profile angles
    [10, 1, 152], [234, 1, 454],
  ];

  for (const [p1, p2, p3] of angles) {
    if (p1 < points.length && p2 < points.length && p3 < points.length) {
      const angle = calculateAngle(points[p1], points[p2], points[p3]);
      embedding[idx++] = angle;
    }
  }

  // 4. Ratios of facial features (scale-invariant)
  const ratios = [
    // Eye width to face width
    [[33, 133], [234, 454]],
    [[362, 263], [234, 454]],
    
    // Nose height to face height
    [[1, 2], [10, 152]],
    
    // Mouth width to face width
    [[61, 291], [234, 454]],
    
    // Eye separation to face width
    [[33, 362], [234, 454]],
  ];

  for (const [[p1, p2], [p3, p4]] of ratios) {
    if (p1 < points.length && p2 < points.length && 
        p3 < points.length && p4 < points.length) {
      const dist1 = distance(points[p1], points[p2]);
      const dist2 = distance(points[p3], points[p4]);
      const ratio = dist2 > 0 ? dist1 / dist2 : 0;
      embedding[idx++] = ratio;
    }
  }

  // 5. Texture features from face region
  const textureFeatures = extractTextureFeatures(imageData, points);
  for (let i = 0; i < textureFeatures.length && idx < 512; i++) {
    embedding[idx++] = textureFeatures[i];
  }

  // Fill remaining with zeros if needed
  while (idx < 512) {
    embedding[idx++] = 0;
  }

  // Normalize the embedding (L2 normalization)
  const norm = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0)
  );
  
  if (norm > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= norm;
    }
  }

  return embedding;
}

/**
 * Calculate angle between three points
 */
function calculateAngle(
  p1: { x: number; y: number; z?: number },
  p2: { x: number; y: number; z?: number },
  p3: { x: number; y: number; z?: number }
): number {
  const v1x = p1.x - p2.x;
  const v1y = p1.y - p2.y;
  const v2x = p3.x - p2.x;
  const v2y = p3.y - p2.y;

  const dot = v1x * v2x + v1y * v2y;
  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);

  if (mag1 === 0 || mag2 === 0) return 0;

  const cosAngle = dot / (mag1 * mag2);
  return Math.acos(Math.max(-1, Math.min(1, cosAngle)));
}

/**
 * Calculate Euclidean distance between two points
 */
function distance(
  p1: { x: number; y: number; z?: number },
  p2: { x: number; y: number; z?: number }
): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Extract texture features from face region
 */
function extractTextureFeatures(
  imageData: ImageData,
  points: Array<{ x: number; y: number; z?: number }>
): Float32Array {
  const features = new Float32Array(64);
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  // Define regions of interest
  const regions = [
    // Left eye region
    [33, 160, 158, 133, 153, 144],
    // Right eye region
    [362, 385, 387, 263, 373, 380],
    // Nose region
    [1, 2, 98, 327, 168, 6],
    // Mouth region
    [61, 291, 0, 17, 269, 405],
  ];

  let featureIdx = 0;

  for (const region of regions) {
    // Calculate bounding box for region
    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    
    for (const pointIdx of region) {
      if (pointIdx < points.length) {
        const p = points[pointIdx];
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
    }

    // Convert to pixel coordinates
    const x1 = Math.floor(minX * width);
    const y1 = Math.floor(minY * height);
    const x2 = Math.ceil(maxX * width);
    const y2 = Math.ceil(maxY * height);

    // Extract color statistics
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    let rVar = 0, gVar = 0, bVar = 0;

    // First pass: calculate means
    for (let y = y1; y < y2 && y < height; y++) {
      for (let x = x1; x < x2 && x < width; x++) {
        const idx = (y * width + x) * 4;
        rSum += data[idx];
        gSum += data[idx + 1];
        bSum += data[idx + 2];
        count++;
      }
    }

    if (count > 0) {
      const rMean = rSum / count;
      const gMean = gSum / count;
      const bMean = bSum / count;

      // Second pass: calculate variance
      for (let y = y1; y < y2 && y < height; y++) {
        for (let x = x1; x < x2 && x < width; x++) {
          const idx = (y * width + x) * 4;
          rVar += Math.pow(data[idx] - rMean, 2);
          gVar += Math.pow(data[idx + 1] - gMean, 2);
          bVar += Math.pow(data[idx + 2] - bMean, 2);
        }
      }

      // Store normalized features
      if (featureIdx < 64) {
        features[featureIdx++] = rMean / 255;
        features[featureIdx++] = gMean / 255;
        features[featureIdx++] = bMean / 255;
        features[featureIdx++] = Math.sqrt(rVar / count) / 255;
      }
    }
  }

  return features;
}

/**
 * Compare two face embeddings
 * Returns similarity score between 0 and 1
 */
export function compareFaceEmbeddings(
  embedding1: Float32Array,
  embedding2: Float32Array
): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same length');
  }

  // Cosine similarity
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }

  // Return similarity (0 to 1)
  return dotProduct / (norm1 * norm2);
}

/**
 * Check if face embedding matches any stored embedding
 * Returns match info or null if no match
 */
export interface FaceMatch {
  name: string;
  similarity: number;
  id: string;
}

export function findBestMatch(
  queryEmbedding: Float32Array,
  storedEmbeddings: Array<{ id: string; name: string; embedding: Float32Array }>,
  threshold: number = 0.85 // VERY STRICT: 85% similarity required (iPhone-level accuracy)
): FaceMatch | null {
  let bestMatch: FaceMatch | null = null;
  let highestSimilarity = 0;
  let secondHighestSimilarity = 0;

  console.log(`\n🔍 Face Matching - Threshold: ${threshold} (${(threshold * 100).toFixed(0)}%)`);
  console.log(`📊 Comparing with ${storedEmbeddings.length} stored faces...\n`);

  const matches: Array<{ name: string; similarity: number; id: string }> = [];

  for (const stored of storedEmbeddings) {
    const similarity = compareFaceEmbeddings(queryEmbedding, stored.embedding);
    matches.push({ name: stored.name, similarity, id: stored.id });
    
    const matchStatus = similarity >= threshold ? '✅ MATCH' : '❌ NO MATCH';
    console.log(`   ${stored.name}: ${(similarity * 100).toFixed(1)}% ${matchStatus}`);
    
    // Track highest and second highest
    if (similarity > highestSimilarity) {
      secondHighestSimilarity = highestSimilarity;
      highestSimilarity = similarity;
      bestMatch = {
        id: stored.id,
        name: stored.name,
        similarity: similarity,
      };
    } else if (similarity > secondHighestSimilarity) {
      secondHighestSimilarity = similarity;
    }
  }

  // CRITICAL: Check if there's a clear winner
  // Use DYNAMIC gap requirement based on similarity score
  const similarityGap = highestSimilarity - secondHighestSimilarity;
  
  // Dynamic gap: Higher similarity = smaller gap needed (they're more distinct at high scores)
  // Lower similarity = larger gap needed (more ambiguous at low scores)
  let minGap: number;
  if (highestSimilarity >= 0.95) {
    minGap = 0.008; // 0.8% gap for very high similarity (95%+)
  } else if (highestSimilarity >= 0.90) {
    minGap = 0.015; // 1.5% gap for high similarity (90-95%)
  } else if (highestSimilarity >= 0.85) {
    minGap = 0.03; // 3% gap for threshold similarity (85-90%)
  } else {
    minGap = 0.05; // 5% gap for low similarity (below 85%)
  }

  console.log(`\n📊 Similarity Gap Analysis:`);
  console.log(`   Highest: ${(highestSimilarity * 100).toFixed(1)}%`);
  console.log(`   Second: ${(secondHighestSimilarity * 100).toFixed(1)}%`);
  console.log(`   Gap: ${(similarityGap * 100).toFixed(1)}% (required: ${(minGap * 100).toFixed(1)}% for this score)`);

  if (bestMatch && highestSimilarity >= threshold && similarityGap >= minGap) {
    console.log(`\n✅ CLEAR Winner: ${bestMatch.name} (${(bestMatch.similarity * 100).toFixed(1)}%)`);
    console.log(`   ✓ Above threshold (${(threshold * 100).toFixed(0)}%)`);
    console.log(`   ✓ Clear gap from next best (${(similarityGap * 100).toFixed(1)}% > ${(minGap * 100).toFixed(1)}%)\n`);
    return bestMatch;
  } else if (bestMatch && highestSimilarity >= threshold && similarityGap < minGap) {
    console.log(`\n⚠️  AMBIGUOUS MATCH - Too similar to multiple faces!`);
    console.log(`   Best: ${bestMatch.name} (${(highestSimilarity * 100).toFixed(1)}%)`);
    console.log(`   Gap too small: ${(similarityGap * 100).toFixed(1)}% < ${(minGap * 100).toFixed(1)}%`);
    console.log(`   💡 Tip: Try better lighting or re-register users separately\n`);
    return null; // Reject ambiguous matches
  } else {
    console.log(`\n❌ No match found`);
    console.log(`   Reason: Highest similarity ${(highestSimilarity * 100).toFixed(1)}% < threshold ${(threshold * 100).toFixed(0)}%\n`);
    return null;
  }
}

