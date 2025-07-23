import { readFile, writeFile, readdir } from 'fs/promises';
import { join, extname } from 'path';

const COMPONENTS_DIR = join(process.cwd(), 'components');

async function processFile(filePath: string) {
  try {
    let content = await readFile(filePath, 'utf-8');
    
    // Update import paths
    content = content.replace(
      /from ['"](\/?(?:components|lib|app|hooks|db|types|utils|styles|public|context|providers|schemas|services|stores|tests|theme|utils|views)\/[^'"]*)['"]/g,
      (match, p1) => {
        // Skip node_modules imports and absolute URLs
        if (p1.startsWith('node:') || p1.startsWith('http')) {
          return match;
        }
        
        // Remove leading slash if present
        const cleanPath = p1.startsWith('/') ? p1.slice(1) : p1;
        return `from '@/${cleanPath}'`;
      }
    );

    await writeFile(filePath, content, 'utf-8');
    console.log(`Updated imports in ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

async function processDirectory(directory: string) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(directory, entry.name);
      
      if (entry.isDirectory()) {
        await processDirectory(fullPath);
      } else if (['.tsx', '.ts', '.js', '.jsx'].includes(extname(entry.name).toLowerCase())) {
        await processFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${directory}:`, error);
  }
}

// Run the script
processDirectory(COMPONENTS_DIR)
  .then(() => console.log('Import updates complete!'))
  .catch(console.error);
