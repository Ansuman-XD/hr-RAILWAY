import { pool } from './src/config/db';
import fs from 'fs';
import path from 'path';

async function migratePhotos() {
  const client = await pool.connect();
  try {
    const dir = path.join(process.cwd(), 'uploads', 'photos');
    fs.mkdirSync(dir, { recursive: true });

    const { rows } = await client.query("SELECT id, photo FROM employees WHERE photo IS NOT NULL AND photo LIKE 'data:image%'");
    
    console.log(`Found ${rows.length} photos to migrate.`);
    let count = 0;

    for (const row of rows) {
      const { id, photo } = row;
      const matches = photo.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      
      if (matches && matches.length === 3) {
        const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        const base64Data = matches[2];
        const filename = `${id}-${Date.now()}.${ext}`;
        const filepath = path.join(dir, filename);
        
        fs.writeFileSync(filepath, base64Data, 'base64');
        const photoUrl = `/uploads/photos/${filename}`;
        
        await client.query("UPDATE employees SET photo = $1 WHERE id = $2", [photoUrl, id]);
        count++;
      }
    }
    
    console.log(`Successfully migrated ${count} photos.`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    client.release();
    pool.end();
  }
}

migratePhotos();
