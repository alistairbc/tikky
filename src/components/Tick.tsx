import React from 'react';
import { motion, AnimatePresence } from "motion/react";

export function Tick({ checked, onChange, color = "#10b981", size = 17 }: { checked: boolean, onChange: () => void, color?: string, size?: number }) {
  return (
    <motion.button 
      whileTap={{ scale: 0.8 }}
      onClick={onChange} 
      style={{ width:size, height:size, borderRadius:Math.floor(size*.3), border: checked ? "none" : "1.5px solid #475569", background: checked ? color : "transparent", cursor:"pointer", flexShrink:0, padding:0, display:"flex", alignItems:"center", justifyContent:"center", transition:"background .15s, border .15s" }}
    >
      <AnimatePresence>
        {checked && (
          <motion.svg 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            width={size*.58} height={size*.47} viewBox="0 0 10 8" fill="none"
          >
            <path d="M1 3.5L3.8 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
