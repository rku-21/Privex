import { Toaster } from "react-hot-toast";
import { Home } from "./routePages/Home.jsx";
import  Login  from "./routePages/Login.jsx";
import { Profile } from "./routePages/Profile.jsx";
import  Settings from "./routePages/Settings.jsx";
import  Signup  from "./routePages/Signup.jsx";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore.js";
import { useEffect } from "react";
import { Search } from "./routePages/Searchpage/search.jsx";
import { RequestReceived } from "./routePages/RequestPage/requestReceived.jsx";
// import { useThemeStore } from "./store/useThemeStore.js";
import { Friends } from "./routePages/friendsPage/Friends.jsx";
import UnderConstruction from "./components/Construction/Construction.jsx";
const App = () => {

  const { authUser, checkAuth , isCheckingAuth} = useAuthStore()
  useEffect(() => {
    checkAuth();
  }, []);

if (isCheckingAuth && !authUser) {
    return (
      <div style={{display:"flex", justifyContent:"center" ,alignItems:"center", height:"100vh"}}>
      <div className="flex w-52 flex-col gap-4">
        <div className="skeleton h-32 w-full"></div>
        <div className="skeleton h-4 w-28"></div>
        <div className="skeleton h-4 w-full"></div>
        <div className="skeleton h-4 w-full"></div>
      </div>
      </div>

    )
  }

  return (
  

    
    <div>
       <Toaster position="top-center" reverseOrder={false} />
     
     
      

      <Routes>
        <Route path="/" element={authUser?<Home/>:<Navigate to="/login"/>}/>
        <Route path="/signup" element={!authUser?<Signup/>:<Navigate to="/"/>} />
        <Route path="/login" element={!authUser?<Login/>:<Navigate to="/"/>} />
        <Route path="/profile" element={authUser?<Profile/>: <Navigate to="/"/>}  />
        <Route path="/settings" element={authUser?<Settings/>:<Navigate to="/login"/>}/>
       
        <Route path="/search" element={<Search/>} />
        <Route path="/request-received" element={<RequestReceived/>}/>
        <Route path="/friends" element={<Friends/>} />
        <Route path="/construction" element={<UnderConstruction/>}/>


      </Routes>
    </div>
   
   

     


  )
}
export default App;
