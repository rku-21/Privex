import { config } from "dotenv";
import { connectDB } from "../lib/db.js";
import User from "../models/user.model.js";

config();
const seedUsers=[
  {
    "email": "ritesh90@outlook.com",
    "fullname": "Ritesh",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": "",
    "friends": [],
    "friendRequests": {
      "sent": [],
      "receiveds": []
    },
    "createdAt": "2025-08-24T05:02:17.239610Z",
    "updatedAt": "2025-08-24T05:02:17.239615Z",
    "__v": 0
  },
  {
    "email": "ravi27@example.com",
    "fullname": "Ravi",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": "",
    "friends": [],
    "friendRequests": {
      "sent": [],
      "receiveds": []
    },
    "createdAt": "2025-08-24T05:02:17.239622Z",
    "updatedAt": "2025-08-24T05:02:17.239624Z",
    "__v": 0
  },
  {
    "email": "rahul92@example.com",
    "fullname": "Rahul",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": "",
    "friends": [],
    "friendRequests": {
      "sent": [],
      "receiveds": []
    },
    "createdAt": "2025-08-24T05:02:17.239630Z",
    "updatedAt": "2025-08-24T05:02:17.239632Z",
    "__v": 0
  },
  {
    "email": "raj73@outlook.com",
    "fullname": "Raj",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": "",
    "friends": [],
    "friendRequests": {
      "sent": [],
      "receiveds": []
    },
    "createdAt": "2025-08-24T05:02:17.239637Z",
    "updatedAt": "2025-08-24T05:02:17.239639Z",
    "__v": 0
  },
  {
    "email": "rohan21@gmail.com",
    "fullname": "Rohan",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": "",
    "friends": [],
    "friendRequests": {
      "sent": [],
      "receiveds": []
    },
    "createdAt": "2025-08-24T05:02:17.239644Z",
    "updatedAt": "2025-08-24T05:02:17.239646Z",
    "__v": 0
  },
  {
    "email": "ritika74@yahoo.com",
    "fullname": "Ritika",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": "",
    "friends": [],
    "friendRequests": {
      "sent": [],
      "receiveds": []
    },
    "createdAt": "2025-08-24T05:02:17.239653Z",
    "updatedAt": "2025-08-24T05:02:17.239655Z",
    "__v": 0
  },
  {
    "email": "rani45@outlook.com",
    "fullname": "Rani",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": "",
    "friends": [],
    "friendRequests": {
      "sent": [],
      "receiveds": []
    },
    "createdAt": "2025-08-24T05:02:17.239660Z",
    "updatedAt": "2025-08-24T05:02:17.239663Z",
    "__v": 0
  },
  {
    "email": "ravindra91@outlook.com",
    "fullname": "Ravindra",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": "",
    "friends": [],
    "friendRequests": {
      "sent": [],
      "receiveds": []
    },
    "createdAt": "2025-08-24T05:02:17.239674Z",
    "updatedAt": "2025-08-24T05:02:17.239676Z",
    "__v": 0
  },
  {
    "email": "rajesh54@yahoo.com",
    "fullname": "Rajesh",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": "",
    "friends": [],
    "friendRequests": {
      "sent": [],
      "receiveds": []
    },
    "createdAt": "2025-08-24T05:02:17.239682Z",
    "updatedAt": "2025-08-24T05:02:17.239685Z",
    "__v": 0
  },
  {
    "email": "rakesh95@example.com",
    "fullname": "Rakesh",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": "",
    "friends": [],
    "friendRequests": {
      "sent": [],
      "receiveds": []
    },
    "createdAt": "2025-08-24T05:02:17.239691Z",
    "updatedAt": "2025-08-24T05:02:17.239693Z",
    "__v": 0
  },
  {
    "email": "reena63@outlook.com",
    "fullname": "Reena",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": "",
    "friends": [],
    "friendRequests": {
      "sent": [],
      "receiveds": []
    },
    "createdAt": "2025-08-24T05:02:17.239696Z",
    "updatedAt": "2025-08-24T05:02:17.239697Z",
    "__v": 0
  },
  {
    "email": "rachit43@outlook.com",
    "fullname": "Rachit",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": "",
    "friends": [],
    "friendRequests": {
      "sent": [],
      "receiveds": []
    },
    "createdAt": "2025-08-24T05:02:17.239700Z",
    "updatedAt": "2025-08-24T05:02:17.239701Z",
    "__v": 0
  },
  {
    "email": "rupal25@yahoo.com",
    "fullname": "Rupal",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": "",
    "friends": [],
    "friendRequests": {
      "sent": [],
      "receiveds": []
    },
    "createdAt": "2025-08-24T05:02:17.239704Z",
    "updatedAt": "2025-08-24T05:02:17.239705Z",
    "__v": 0
  },
  {
    "email": "rajni60@outlook.com",
    "fullname": "Rajni",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": "",
    "friends": [],
    "friendRequests": {
      "sent": [],
      "receiveds": []
    },
    "createdAt": "2025-08-24T05:02:17.239708Z",
    "updatedAt": "2025-08-24T05:02:17.239709Z",
    "__v": 0
  },
  {
    "email": "ramesh82@example.com",
    "fullname": "Ramesh",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": "",
    "friends": [],
    "friendRequests": {
      "sent": [],
      "receiveds": []
    },
    "createdAt": "2025-08-24T05:02:17.239712Z",
    "updatedAt": "2025-08-24T05:02:17.239713Z",
    "__v": 0
  },
  {
    "email": "kevin61@yahoo.com",
    "fullname": "Kevin",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": "",
    "friends": [],
    "friendRequests": {
      "sent": [],
      "receiveds": []
    },
    "createdAt": "2025-08-24T05:02:17.239716Z",
    "updatedAt": "2025-08-24T05:02:17.239717Z",
    "__v": 0
  },
  {
    "email": "angelica89@gmail.com",
    "fullname": "Angelica",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": "",
    "friends": [],
    "friendRequests": {
      "sent": [],
      "receiveds": []
    },
    "createdAt": "2025-08-24T05:02:17.239720Z",
    "updatedAt": "2025-08-24T05:02:17.239721Z",
    "__v": 0
  },
  {
    "email": "sophia76@gmail.com",
    "fullname": "Sophia",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": "",
    "friends": [],
    "friendRequests": {
      "sent": [],
      "receiveds": []
    },
    "createdAt": "2025-08-24T05:02:17.239724Z",
    "updatedAt": "2025-08-24T05:02:17.239725Z",
    "__v": 0
  },
  {
    "email": "john62@outlook.com",
    "fullname": "John",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": "",
    "friends": [],
    "friendRequests": {
      "sent": [],
      "receiveds": []
    },
    "createdAt": "2025-08-24T05:02:17.239729Z",
    "updatedAt": "2025-08-24T05:02:17.239730Z",
    "__v": 0
  },
  {
    "email": "emily37@gmail.com",
    "fullname": "Emily",
    "password": "$2b$10$e0cf94a6976b4e1e9ec1cbdefb5cdb41203c23c808dcd6dfb15c47f",
    "profilePicture": "",
    "friends": [],
    "friendRequests": {
      "sent": [],
      "receiveds": []
    },
    "createdAt": "2025-08-24T05:02:17.239733Z",
    "updatedAt": "2025-08-24T05:02:17.239734Z",
    "__v": 0
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