import { db } from '../server/db.js';
import { users } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  const email = 'eng.saidahmed88@gmail.com';
  
  // Check if user exists
  const existingUsers = await db.select().from(users);
  console.log('All users:', JSON.stringify(existingUsers, null, 2));
  
  // Find user by email or name containing Said
  const targetUser = existingUsers.find(u => 
    u.email === email || 
    (u.name && u.name.toLowerCase().includes('said'))
  );
  
  if (targetUser) {
    console.log('Found user:', targetUser);
    // Update to admin
    await db.update(users)
      .set({ role: 'admin' })
      .where(eq(users.id, targetUser.id));
    console.log('Updated user to admin role');
  } else {
    console.log('User not found. They need to log in first to create an account.');
  }
  
  process.exit(0);
}

main().catch(console.error);
