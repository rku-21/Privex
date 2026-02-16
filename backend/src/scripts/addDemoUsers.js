// import { config } from "dotenv";
// import { connectDB } from "../lib/db.js";
// import User from "../models/user.model.js";
// import bcrypt from "bcryptjs";

// config();

// const addDemoUsers = async () => {
//   try {
//     console.log('Connecting to database...');
//     await connectDB();
    
//     // Hash passwords
//     const salt = await bcrypt.genSalt(10);
//     const password1Hash = await bcrypt.hash("Privex@Demo1", salt);
//     const password2Hash = await bcrypt.hash("Privex@Demo2", salt);
    
//     const demoUsers = [
//       {
//         email: "demo.user@privex.app",
//         fullname: "DemoUser01",
//         password: password1Hash,
//         profilePicture: "",
//         about: "Demo user account Feel free to explore Privex!"
//       },
//       {
//         email: "demo.friend@privex.app",
//         fullname: "DemoUser02",
//         password: password2Hash,
//         profilePicture: "",
//         about: "Demo friend account - Ready to chat!"
//       }
//     ];
    
//     console.log('👥 Adding demo users...');
    
//     for (const userData of demoUsers) {
//       // Check if user already exists
//       const existingUser = await User.findOne({ email: userData.email });
      
//       if (existingUser) {
//         console.log(`⚠️  User ${userData.email} already exists, skipping...`);
//       } else {
//         await User.create(userData);
//         console.log(`✅ Created demo user: ${userData.email} (${userData.fullname})`);
//       }
//     }
    
//     console.log('🎉 Demo users setup complete!');
//     console.log('\n📝 Demo Credentials:');
//     console.log('User 1:');
//     console.log('  Email: demo.user@privex.app');
//     console.log('  Password: Privex@Demo1');
//     console.log('  Full Name: DemoUser01');
//     console.log('\nUser 2:');
//     console.log('  Email: demo.friend@privex.app');
//     console.log('  Password: Privex@Demo2');
//     console.log('  Full Name: DemoUser02');
    
//     process.exit(0);
//   } catch (error) {
//     console.error('❌ Error adding demo users:', error.message);
//     process.exit(1);
//   }
// };

// // Call the function
// addDemoUsers();
