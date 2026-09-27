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
    try {
      console.log('[EmbeddingEngine] Initializing local ONNX model: Xenova/all-MiniLM-L6-v2 (384 dims)...');
      const { pipeline } = await import('@huggingface/transformers');
      pipelinePromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        dtype: 'fp32'
      });
      console.log('[EmbeddingEngine] Model pipeline ready.');
    } catch (err) {
      console.error('[EmbeddingEngine Error] Failed to load local embedding model:', err.message);
      pipelinePromise = null;
      throw err;
    }
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

  const vector = Array.from(output.data);
  console.log(`[EmbeddingEngine] Vector generated successfully | Dim: ${vector.length}`);
  return vector;
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
