"use client";

import { useCallback, useEffect, useState } from 'react';

export const useVoice = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setIsReady(true);
        }
      }
    };

    checkVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = checkVoices;
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);
  
  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isReady) {
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => voice.name.includes('Female') && voice.lang.startsWith('en'));
      const defaultVoice = voices.find(voice => voice.lang.startsWith('en'));

      utterance.voice = femaleVoice || defaultVoice || null;
      utterance.lang = 'en-US';
      utterance.pitch = 1.2;
      utterance.rate = 1;

      window.speechSynthesis.cancel(); // Cancel any previous speech
      window.speechSynthesis.speak(utterance);
    }
  }, [isReady]);

  return { speak, isReady };
};
