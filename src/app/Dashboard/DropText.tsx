import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import "./DropText.css";

interface DropTextProps {
  text: string;
  delay?: number; // Delay in ms before the animation starts
  soundUrl?: string; // Optional sound URL for thud effect
}

export const DropText: React.FC<DropTextProps> = ({ text, delay = 0, soundUrl }) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Start the animation after a delay
    const timer = setTimeout(() => setAnimate(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  // Play sound on animation complete
  useEffect(() => {
    if (animate && soundUrl) {
      const sound = new Audio(soundUrl);
      sound.play();
    }
  }, [animate, soundUrl]);

  return (
    <div className="drop-text-container">
      {/* Container shake on impact */}
      <motion.div
        className="thud-container"
        initial={{ x: 0, y: 0 }}
        animate={animate ? {
          x: [0, 0, -4, 4, -2, 2, -1, 0],
          y: [0, 0, -3, 3, -1.5, 1.5, -0.5, 0],
          transition: {
            duration: 0.4,
            delay: 0.35,
            ease: [0.4, 0, 0.2, 1],
          }
        } : {}}
      >
        {/* Animated Text with LOUD THUD - extreme squash */}
        <motion.span
          className="drop-text"
          initial={{ opacity: 0 }}
          animate={{
            opacity: animate ? [0, 1, 1, 1, 1, 1] : 0,
            y: animate ? [-700, 0, 10, 0, 3, 0] : -700,
            scaleY: animate ? [1.2, 0.55, 1.2, 1.05, 1.01, 1] : 1.2,
            scaleX: animate ? [0.9, 1.4, 0.88, 0.97, 1.005, 1] : 0.9,
            transition: {
              duration: 0.75,
              ease: [0.9, 0, 1, 0.5], // Faster fall, smoother recovery
              times: [0, 0.47, 0.60, 0.75, 0.88, 1]
            },
          }}
        >
          {text}
        </motion.span>
      </motion.div>

      {/* Impact flash on THUD */}
      {animate && (
        <motion.div
          className="impact-flash"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.9, 0],
            scale: [0.5, 1.8, 2.5],
            transition: {
              duration: 0.3,
              delay: 0.35,
              ease: [0.19, 1, 0.22, 1],
            },
          }}
        />
      )}

      {/* Smoke Puff - VIOLENT explosion on impact */}
      {animate && (
        <motion.div
          className="smoke"
          initial={{ opacity: 0, scale: 0.1 }}
          animate={{
            opacity: [0, 1, 0.6, 0],
            scale: [0.1, 5, 6.5, 7.5],
            filter: ["blur(2px)", "blur(25px)", "blur(35px)", "blur(45px)"],
            transition: {
              delay: 0.35,
              duration: 0.6,
              ease: [0.19, 1, 0.22, 1],
            },
          }}
        />
      )}
    </div>
  );
};
