import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script to clean up old schema fields from user.seed.js
 * Removes: friends, friendRequests, createdAt, updatedAt, __v
 */

const seedFilePath = path.join(__dirname, 'user.seed.js');

console.log('🔧 Cleaning up user.seed.js...\n');

try {
  // Read the file
  let content = fs.readFileSync(seedFilePath, 'utf8');
  
  // Count occurrences before
  const friendsCountBefore = (content.match(/"friends":/g) || []).length;
  const friendRequestsCountBefore = (content.match(/"friendRequests":/g) || []).length;
  
  console.log(`📊 Before cleanup:`);
  console.log(`   - "friends" fields: ${friendsCountBefore}`);
  console.log(`   - "friendRequests" fields: ${friendRequestsCountBefore}\n`);
  
  // Remove old fields with their values
  // Remove friends array field
  content = content.replace(/,?\s*"friends":\s*\[[^\]]*\]/g, '');
  
  // Remove friendRequests object field
  content = content.replace(/,?\s*"friendRequests":\s*\{[^}]*\}/g, '');
  
  // Remove timestamps
  content = content.replace(/,?\s*"createdAt":\s*"[^"]*"/g, '');
  content = content.replace(/,?\s*"updatedAt":\s*"[^"]*"/g, '');
  
  // Remove version key
  content = content.replace(/,?\s*"__v":\s*\d+/g, '');
  
  // Clean up any double commas or trailing commas before closing braces
  content = content.replace(/,\s*,/g, ',');
  content = content.replace(/,(\s*[\}\]])/g, '$1');
  
  // Write back to file
  fs.writeFileSync(seedFilePath, content, 'utf8');
  
  // Count occurrences after
  const friendsCountAfter = (content.match(/"friends":/g) || []).length;
  const friendRequestsCountAfter = (content.match(/"friendRequests":/g) || []).length;
  
  console.log(`✅ After cleanup:`);
  console.log(`   - "friends" fields: ${friendsCountAfter}`);
  console.log(`   - "friendRequests" fields: ${friendRequestsCountAfter}\n`);
  
  console.log(`🎉 user.seed.js cleaned successfully!`);
  console.log(`📁 File: ${seedFilePath}\n`);
  
} catch (error) {
  console.error('❌ Error cleaning seed file:', error.message);
  process.exit(1);
}
