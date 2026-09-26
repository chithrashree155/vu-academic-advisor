const { runIngestion } = require('../src/lib/ingestion/ingest');

async function main() {
  try {
    await runIngestion();
  } catch (err) {
    console.error('Ingestion failed:', err);
    process.exit(1);
  }
}

main();
