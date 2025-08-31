import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function UnderConstruction() {
    const Navigate=useNavigate();

    const Gohome=()=>{
        Navigate("/");
    }
  return (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-white">

     
      <motion.h1
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1 }}
        className="text-5xl font-bold mb-6"
      >
        Privex
      </motion.h1>

      {/* Typing dots animation */}
      <div className="flex space-x-2 mb-4">
        <span className="w-3 h-3 bg-white rounded-full animate-bounce"></span>
        <span className="w-3 h-3 bg-white rounded-full animate-bounce delay-200"></span>
        <span className="w-3 h-3 bg-white rounded-full animate-bounce delay-400"></span>
      </div>

      <motion.p
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="text-lg text-center max-w-md"
      >
        We’re still building your private chat experience. <br />
        Please wait, something amazing is on the way 🚀
      </motion.p>

     
      <div className="w-64 h-2 bg-white/30 rounded-full mt-6 overflow-hidden">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 5, repeat: Infinity }}
          className="h-full bg-white"
        ></motion.div>
      </div>
     <div style={{width:"5rem", marginTop:"8px" }}>
  <button
    onClick={Gohome}
    className=" py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 hover:from-purple-700 hover:to-blue-700 focus:outline-none"
  >
    Back
  </button>
</div>

     
    </div>
  );
}
