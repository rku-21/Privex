# Privex MERN Project
# 📱 Privex – Real-Time Chat App

A modern and secure chat application with realtime messaging, calling features, online/offline status, and a clean UI.


- `frontend/` - React + Vite app (see frontend/chat_app)
- `backend/` - Node.js + Express API

## 🚀 Features
- 🔥 Realtime private chat  
- 📞 Voice & Video Calling (WebRTC)  
- 🟢 Online / Offline indicators  
- 🖼️ Image sharing  
- 🔐 Secure authentication  
- 🎨 Customizable chat themes  
- 📨 Typing indicators  
- 🧩 Clean and modern UI

  ## 🔷 System Architecture
flowchart LR
    A[PRIVEX Client<br>(React • Chat UI • Socket.IO Client • WebRTC Engine)] 
        -->|REST API / Auth| B[Node.js Server<br>(Express APIs)]
    A <--> |Real-time Messaging / Signaling| C[Socket.IO Server]
    B -->|DB Read/Write| D[(MongoDB<br>Users • Messages • Calls)]
## 🔶 Real-Time Messaging Flow
sequenceDiagram
    participant UA as User A (Client)
    participant S as Node.js Server (Socket.IO)
    participant DB as MongoDB
    participant UB as User B (Client)

    UA->>S: (1) sendMessage(message)
    S->>DB: (2) Store message in Messages collection
    S->>UB: (3) Broadcast message to receiver
    UB->>UB: (4) Update chat UI instantly

## 🔸 WebRTC Calling Flow
sequenceDiagram
    participant A as WebRTC Peer A (User A)
    participant SOC as Socket.IO (Signaling)
    participant SRV as Node.js Server
    participant B as WebRTC Peer B (User B)

    A->>A: Create Offer (SDP)
    A->>SOC: Send Offer
    SOC->>SRV: Forward Offer
    SRV->>SOC: Forward to User B
    SOC->>B: Deliver Offer

    B->>B: Create Answer (SDP)
    B->>SOC: Send Answer
    SOC->>SRV: Forward Answer
    SRV->>SOC: Forward to User A
    SOC->>A: Deliver Answer

    A->>SOC: Send ICE Candidate
    SOC->>B: ICE Candidate
    B->>SOC: Send ICE Candidate
    SOC->>A: ICE Candidate

    A-->>B: Direct Audio/Video Stream (P2P)



