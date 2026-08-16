import { getDb, getAllUsers, updateUserRole } from '../server/db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const email = 'eng.saidahmed88@gmail.com';
  
  // Get all users
  const allUsers = await getAllUsers();
  console.log('All users:', JSON.stringify(allUsers, null, 2));
  
  // Find user by email or name containing Said
  const targetUser = allUsers.find(u => 
    u.email === email || 
    (u.name && u.name.toLowerCase().includes('said'))
  );
  
  if (targetUser) {
    console.log('Found user:', targetUser);
    // Update to admin
    await updateUserRole(targetUser.id, 'admin');
    console.log('Updated user to admin role');
    
    // Verify the update
    const updatedUsers = await getAllUsers();
    const updated = updatedUsers.find(u => u.id === targetUser.id);
    console.log('Verified user:', updated);
  } else {
    console.log('User not found with email:', email);
    console.log('The user needs to log in first to create an account, then we can update their role.');
  }
  
  process.exit(0);
}

main().catch(console.error);
