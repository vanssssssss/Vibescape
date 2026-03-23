import { ConvNextImageProcessor, pipeline } from "@xenova/transformers";

let extractor: any = null;

async function getExtractor() {
  if (!extractor) {
    extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
  }
  if(!extractor)
    console.log("extractor not loaded");
  
  return extractor;
}

//text → tokens → vectors → average → single vector
export async function getEmbedding(text: string): Promise<number[]> {
  const model = await getExtractor();
  const output = await model(text);

  const data = output.data as Float32Array;
  const [batch, numTokens, dim] = output.dims;

  const mean = new Array(dim).fill(0);

  for (let t = 0; t < numTokens; t++) {
    for (let d = 0; d < dim; d++) {
      const index = t * dim + d; // skip batch (since batch=1)
      mean[d] += data[index];
    }
  }

  for (let d = 0; d < dim; d++) {
    mean[d] /= numTokens;
  }
  let norm = 0;
  for (let i = 0; i < dim; i++) {
    norm += mean[i] * mean[i];
  }
  norm = Math.sqrt(norm);

  for (let i = 0; i < dim; i++) {
    mean[i] /= norm;
  }

  return mean;
}

