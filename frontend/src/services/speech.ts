/**
 * Web Speech Recognition, Media Recording, and Synthesis utility
 */

export interface SpeechRecognitionWrapper {
  start: () => void;
  stop: () => void;
  isSupported: boolean;
}

export function createSpeechRecognizer(
  langLocale: string,
  onResult: (text: string) => void,
  onEnd: () => void,
  onError?: (err: any) => void
): SpeechRecognitionWrapper {
  if (typeof window === "undefined") {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = langLocale || "en-IN";

  let finalTranscriptAccumulator = "";

  recognition.onresult = (event: any) => {
    let interimTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscriptAccumulator += (finalTranscriptAccumulator ? " " : "") + event.results[i][0].transcript.trim();
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    const currentText = finalTranscriptAccumulator + (interimTranscript ? " " + interimTranscript : "");
    if (currentText.trim()) {
      onResult(currentText.trim());
    }
  };

  recognition.onend = () => {
    onEnd();
  };

  recognition.onerror = (err: any) => {
    if (onError) onError(err);
  };

  return {
    start: () => {
      try {
        finalTranscriptAccumulator = "";
        recognition.start();
      } catch (e) {
        console.warn("Recognition start warning:", e);
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch (e) {
        console.warn("Recognition stop warning:", e);
      }
    },
    isSupported: true,
  };
}

/**
 * High-Fidelity Audio Recorder for AI Gemini Multimodal Speech Processing
 */
export interface AudioRecorderHandle {
  stop: () => Promise<{ base64: string; mimeType: string; blob: Blob }>;
  cancel: () => void;
  getSnapshotBase64: () => Promise<{ base64: string; mimeType: string } | null>;
}

export async function startAudioRecording(): Promise<AudioRecorderHandle> {
  if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone access is not supported in this browser.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ 
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    } 
  });

  // Determine best supported mime type
  const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : MediaRecorder.isTypeSupported("audio/webm")
    ? "audio/webm"
    : MediaRecorder.isTypeSupported("audio/mp4")
    ? "audio/mp4"
    : "audio/ogg";

  const mediaRecorder = new MediaRecorder(stream, { mimeType });
  const audioChunks: Blob[] = [];

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      audioChunks.push(event.data);
    }
  };

  mediaRecorder.start(250); // Collect in 250ms chunks

  return {
    getSnapshotBase64: () => {
      return new Promise((resolve) => {
        try {
          if (mediaRecorder.state !== "recording") {
            return resolve(null);
          }
          mediaRecorder.requestData();

          // Wait a tick (60ms) for the browser to trigger ondataavailable
          setTimeout(() => {
            try {
              if (audioChunks.length === 0) return resolve(null);
              const audioBlob = new Blob(audioChunks, { type: mimeType });
              if (audioBlob.size < 500) return resolve(null);
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64 = reader.result as string;
                resolve({ base64, mimeType });
              };
              reader.onerror = () => resolve(null);
              reader.readAsDataURL(audioBlob);
            } catch {
              resolve(null);
            }
          }, 60);
        } catch {
          resolve(null);
        }
      });
    },
    stop: () => {
      return new Promise((resolve, reject) => {
        mediaRecorder.onstop = () => {
          try {
            const audioBlob = new Blob(audioChunks, { type: mimeType });
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = reader.result as string;
              // Stop all audio tracks
              stream.getTracks().forEach((track) => track.stop());
              resolve({ base64, mimeType, blob: audioBlob });
            };
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
          } catch (err) {
            reject(err);
          }
        };

        if (mediaRecorder.state !== "inactive") {
          mediaRecorder.stop();
        }
      });
    },
    cancel: () => {
      try {
        if (mediaRecorder.state !== "inactive") {
          mediaRecorder.stop();
        }
      } catch (e) {
        // ignore
      }
      stream.getTracks().forEach((track) => track.stop());
    },
  };
}

export function stopSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function speakText(
  text: string, 
  langLocale: string = "en-IN",
  onStart?: () => void,
  onEnd?: () => void
) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    if (onEnd) onEnd();
    return;
  }
  window.speechSynthesis.cancel(); // Stop any previous speech
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langLocale;
  utterance.rate = 0.95; // Slightly slower for clear clinical understanding

  if (onStart) utterance.onstart = onStart;
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

