/**
 * Local Embedding Engine using @huggingface/transformers
 * Model: Xenova/all-MiniLM-L6-v2
 * Dimension: 384
 * Preprocessing: Mean Pooling & L2 Normalization
 * 
 * Runs 100% locally on CPU via ONNX Runtime without OpenAI API dependency.
 */

let pipelinePromise = null;

async function getExtractor() {
  if (!pipelinePromise) {
    const { pipeline } = await import('@huggingface/transformers');
    pipelinePromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      dtype: 'fp32'
    });
  }
  return pipelinePromise;
}

/**
 * Generates normalized 384-dimensional embedding for a single text string.
 * @param {string} text - Input text
 * @returns {Promise<number[]>} 384-dimensional normalized vector
 */
async function generateEmbedding(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Input text must be a non-empty string');
  }

  const extractor = await getExtractor();
  const output = await extractor(text.trim(), {
    pooling: 'mean',
    normalize: true
  });

  return Array.from(output.data);
}

/**
 * Generates embeddings for a batch of text strings.
 * @param {string[]} texts - Array of input texts
 * @returns {Promise<number[][]>} Array of 384-dimensional normalized vectors
 */
async function generateEmbeddingsBatch(texts) {
  const extractor = await getExtractor();
  const results = [];

  for (const text of texts) {
    const output = await extractor(text.trim(), {
      pooling: 'mean',
      normalize: true
    });
    results.push(Array.from(output.data));
  }

  return results;
}

module.exports = {
  getExtractor,
  generateEmbedding,
  generateEmbeddingsBatch,
  EMBEDDING_MODEL: 'Xenova/all-MiniLM-L6-v2',
  EMBEDDING_DIMENSION: 384
};
