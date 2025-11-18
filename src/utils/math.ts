// Math utilities for face recognition

/**
 * Compute cosine similarity between two embedding vectors
 * @param vec1 First embedding vector
 * @param vec2 Second embedding vector
 * @returns Cosine similarity score (0-1, where 1 is identical)
 */
export function cosineSimilarity(
  vec1: Float32Array | number[],
  vec2: Float32Array | number[]
): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

/**
 * Compute cosine distance (1 - similarity)
 * @param vec1 First embedding vector
 * @param vec2 Second embedding vector
 * @returns Cosine distance (0-1, where 0 is identical)
 */
export function cosineDistance(
  vec1: Float32Array | number[],
  vec2: Float32Array | number[]
): number {
  return 1 - cosineSimilarity(vec1, vec2);
}

/**
 * Normalize a vector to unit length
 * @param vec Input vector
 * @returns Normalized vector
 */
export function normalizeVector(vec: Float32Array): Float32Array {
  const norm = Math.sqrt(
    Array.from(vec).reduce((sum, val) => sum + val * val, 0)
  );
  if (norm === 0) {
    return new Float32Array(vec.length);
  }
  return new Float32Array(vec.map((val) => val / norm));
}

