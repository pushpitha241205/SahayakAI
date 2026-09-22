// Voice recognition and Text-to-Speech support (English & Telugu)

const VoiceHandler = {
  recognition: null,
  isListening: false,
  selectedLanguage: "en-IN",

  init(onResultCallback, onStatusCallback) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported in this browser.");
      return false;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = this.selectedLanguage;

    this.recognition.onstart = () => {
      this.isListening = true;
      if (onStatusCallback) onStatusCallback("Listening... Speak now");
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      this.isListening = false;
      if (onResultCallback) onResultCallback(transcript);
      if (onStatusCallback) onStatusCallback("Speech recognized.");
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      console.error("Speech Recognition Error:", event.error);
      if (onStatusCallback) onStatusCallback(`Voice error: ${event.error}. Please type below.`);
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    return true;
  },

  setLanguage(langCode) {
    this.selectedLanguage = langCode;
    if (this.recognition) {
      this.recognition.lang = langCode;
    }
  },

  startListening() {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.lang = this.selectedLanguage;
        this.recognition.start();
      } catch (e) {
        console.warn("Could not start recognition:", e);
      }
    }
  },

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  },

  speak(text, lang = "en-IN") {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
};
