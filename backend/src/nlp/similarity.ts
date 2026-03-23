export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must be of same length");
  }

  let dot = 0;      // dot product
  let magA = 0;     // magnitude of A
  let magB = 0;     // magnitude of B
  
  for (let i = 0; i < a.length; i++) {
    const x = a[i]!;
    const y = b[i]!;

    dot += x * y;
    magA += x * x;
    magB += y * y;
  }
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  if (magA === 0 || magB === 0) return 0;

  return dot / (magA * magB);
}
