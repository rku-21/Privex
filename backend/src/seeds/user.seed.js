import { config } from "dotenv";
import { connectDB } from "../lib/db.js";
import User from "../models/user.model.js";

config();
const seedUsers=[
  {
    "email": "ritesh90@outlook.com",
    "fullname": "Ritesh",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": ""
  },
  {
    "email": "ravi27@example.com",
    "fullname": "Ravi",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": ""
  },
  {
    "email": "rahul92@example.com",
    "fullname": "Rahul",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": ""
  },
  {
    "email": "raj73@outlook.com",
    "fullname": "Raj",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": ""
  },
  {
    "email": "rohan21@gmail.com",
    "fullname": "Rohan",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": ""
  },
  {
    "email": "ritika74@yahoo.com",
    "fullname": "Ritika",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": ""
  },
  {
    "email": "rani45@outlook.com",
    "fullname": "Rani",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": ""
  }
  },
  {
    "email": "ravindra91@outlook.com",
    "fullname": "Ravindra",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": ""
  },
  {
    "email": "rajesh54@yahoo.com",
    "fullname": "Rajesh",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": ""
  },
  {
    "email": "rakesh95@example.com",
    "fullname": "Rakesh",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": ""
  },
  {
    "email": "reena63@outlook.com",
    "fullname": "Reena",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": ""
  },
  {
    "email": "rachit43@outlook.com",
    "fullname": "Rachit",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": ""
  },
  {
    "email": "rupal25@yahoo.com",
    "fullname": "Rupal",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": ""
  },
  {
    "email": "rajni60@outlook.com",
    "fullname": "Rajni",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": ""
  },
  {
    "email": "ramesh82@example.com",
    "fullname": "Ramesh",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": ""
  },
  {
    "email": "kevin61@yahoo.com",
    "fullname": "Kevin",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": ""
  },
  {
    "email": "angelica89@gmail.com",
    "fullname": "Angelica",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": ""
  },
  {
    "email": "sophia76@gmail.com",
    "fullname": "Sophia",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": ""
  },
  {
    "email": "john62@outlook.com",
    "fullname": "John",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": ""
  },
  {
    "email": "emily37@gmail.com",
    "fullname": "Emily",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": ""
  }
]




const seedDatabase = async () => {
  try {
    await connectDB();

    await User.insertMany(seedUsers);

  } catch (error) {

  }
};

// Call the function
seedDatabase();