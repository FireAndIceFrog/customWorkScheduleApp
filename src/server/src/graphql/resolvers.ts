import sqlite3 from 'sqlite3';
import config from '../config';

// Initialize SQLite database
const db = new sqlite3.Database(config.databasePath);

// Initialize database table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Helper function to promisify database operations
const dbGet = (query: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (query: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbRun = (query: string, params: any[] = []): Promise<sqlite3.RunResult> => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

interface Item {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export const resolvers = {
  Query: {
    items: async (): Promise<Item[]> => {
      try {
        const items = await dbAll('SELECT * FROM items ORDER BY createdAt DESC');
        return items;
      } catch (error) {
        throw new Error(`Failed to fetch items: ${error}`);
      }
    },

    item: async (_: any, { id }: { id: string }): Promise<Item | null> => {
      try {
        const item = await dbGet('SELECT * FROM items WHERE id = ?', [id]);
        return item || null;
      } catch (error) {
        throw new Error(`Failed to fetch item: ${error}`);
      }
    },
  },

  Mutation: {
    createItem: async (_: any, { name }: { name: string }): Promise<Item> => {
      try {
        const result = await dbRun(
          'INSERT INTO items (name) VALUES (?)',
          [name]
        );
        
        const newItem = await dbGet(
          'SELECT * FROM items WHERE id = ?',
          [result.lastID]
        );
        
        return newItem;
      } catch (error) {
        throw new Error(`Failed to create item: ${error}`);
      }
    },

    updateItem: async (_: any, { id, name }: { id: string; name: string }): Promise<Item> => {
      try {
        await dbRun(
          'UPDATE items SET name = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
          [name, id]
        );
        
        const updatedItem = await dbGet(
          'SELECT * FROM items WHERE id = ?',
          [id]
        );
        
        if (!updatedItem) {
          throw new Error('Item not found');
        }
        
        return updatedItem;
      } catch (error) {
        throw new Error(`Failed to update item: ${error}`);
      }
    },

    deleteItem: async (_: any, { id }: { id: string }): Promise<Item> => {
      try {
        const itemToDelete = await dbGet(
          'SELECT * FROM items WHERE id = ?',
          [id]
        );
        
        if (!itemToDelete) {
          throw new Error('Item not found');
        }
        
        await dbRun('DELETE FROM items WHERE id = ?', [id]);
        
        return itemToDelete;
      } catch (error) {
        throw new Error(`Failed to delete item: ${error}`);
      }
    },

    updateDatabase: async (): Promise<string> => {
      try {
        // This mutation can be used to perform database updates/migrations
        // For now, it just returns a success message
        return 'Database updated successfully';
      } catch (error) {
        throw new Error(`Failed to update database: ${error}`);
      }
    },
  },
};
