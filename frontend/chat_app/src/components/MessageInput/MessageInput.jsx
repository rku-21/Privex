import React from 'react'
import {Image, Send, X} from "lucide-react"
import "./MessageInput.css";
import toast from 'react-hot-toast';

import { useRef, useState } from 'react';
import { useChatStore } from '../../store/useChatStore';

export const MessageInput = () => {
    const [text, settext]=useState("");
    const [ImagePreview, setImagePreview]=useState(null);
    const fileInputRef=useRef(null);
    const {sendMessages}=useChatStore();

     
    const handleImageChange=(e)=>{
        const file=e.target.files[0];
        if(!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }
        const reader =new FileReader();
        reader.onloadend=()=>{
            setImagePreview(reader.result);
        }
        reader.readAsDataURL(file);
    };
     
    const removeImage =()=>{
        setImagePreview(null);
        if(fileInputRef.current) fileInputRef.current="";

    }
    
    const handleSendMessage= async(e)=>{

      e.preventDefault();
      if(!text.trim() && !ImagePreview) return;
      try {

        await sendMessages({
            text:text.trim(),
            image:ImagePreview,
        });
        

        settext("");

        setImagePreview(null);
        if(fileInputRef.current) fileInputRef.current="";
      }catch(error){
        toast.error("Failed to send Message !")
      }

    }
    
  return (
    <div className="message-input-container">
    {ImagePreview && ( 
        <div className="image-preview-wrapper">
          <div className="image-preview">
            <img src={ImagePreview} alt="Preview" className="preview-img" />
            <button
              onClick={removeImage}
              className="remove-image-btn"
              type="button"
            >
              <i className="fa-regular fa-circle-xmark"></i>
            </button>
          </div>
        </div>
    )}   
      

      <form onSubmit={handleSendMessage} className="message-form">
        <div className="input-wrapper">
          <input
            type="text"
            className="message-input"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => settext(e.target.value)}
          />

          <input
            type="file"
            accept="image/*"
            className="file-input"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            className={`upload-btn ${ImagePreview ? "active" : ""}`}
            onClick={() => fileInputRef.current?.click()}
          >
           <i className="fa-solid fa-image"></i>
          </button>
        </div>

        <button
          type="submit"
          className="send-btn"
          disabled={!text.trim() && !ImagePreview}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
      
    )
}
    
  
