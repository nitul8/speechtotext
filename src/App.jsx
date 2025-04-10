import React, {useState, useEffect, useRef} from "react";
import SpeechRecognition, {
    useSpeechRecognition,
} from "react-speech-recognition";
import {PiBroomDuotone} from "react-icons/pi";
import Groq from "groq-sdk";
import formatResponse from "./utils/formatResponse";

function App() {
    const [response, setResponse] = useState([]);
    const {transcript, resetTranscript, browserSupportsSpeechRecognition} =
        useSpeechRecognition();
    const timeoutRef = useRef(null);
    const AUTO_SUBMIT_DELAY = 2000;
    const groq = new Groq({
        apiKey: "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",
        dangerouslyAllowBrowser: true,
    });
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        if (!browserSupportsSpeechRecognition) {
            alert("Browser doesn't support speech recognition.");
            return;
        }

        SpeechRecognition.startListening({continuous: true});

        navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100,
            },
        });

        window.speechSynthesis.onvoiceschanged = () => {};
    }, [browserSupportsSpeechRecognition]);

    useEffect(() => {
        if (transcript.length === 0) return;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            handleSearch();
        }, AUTO_SUBMIT_DELAY);

        return () => clearTimeout(timeoutRef.current);
    }, [transcript]);

    useEffect(() => {
        if (transcript.length === 0 || isSpeaking) return;

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            handleSearch();
        }, AUTO_SUBMIT_DELAY);

        return () => clearTimeout(timeoutRef.current);
    }, [transcript, isSpeaking]);

    const handleSearch = async () => {
        const userInput = transcript.trim();
        if (!userInput) return;

        setResponse((prev) => [...prev, {sender: "user", message: userInput}]);

        const res = await groq.chat.completions.create({
            messages: [{role: "user", content: userInput}],
            model: "llama3-70b-8192",
        });

        const reply = res.choices[0].message.content;
        const formattedReply = formatResponse(reply);

        setResponse((prev) => [
            ...prev,
            {sender: "ai", message: formattedReply},
        ]);

        const utterance = new SpeechSynthesisUtterance(reply);
        utterance.rate = 0.85;

        const voices = window.speechSynthesis.getVoices();
        const hindiVoice = voices.find(
            (voice) =>
                voice.lang.toLowerCase().includes("hi") ||
                voice.name.toLowerCase().includes("hindi")
        );
        const banglaVoice = voices.find(
            (voice) =>
                voice.lang.toLowerCase().includes("bn") ||
                voice.name.toLowerCase().includes("bengali")
        );

        if (hindiVoice) {
            utterance.voice = hindiVoice;
        } else if (banglaVoice) {
            utterance.voice = banglaVoice;
        }

        utterance.onstart = () => {
            setIsSpeaking(true);
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            resetTranscript();
        };

        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
    };

    if (!browserSupportsSpeechRecognition) {
        return <span>Browser doesn't support speech recognition.</span>;
    }

    return (
        <div className="flex flex-col items-center justify-start h-screen p-4 no-scrollbar">
            <h1 className="text-3xl md:text-5xl font-bold text-center mb-4">
                Voice Chatbot
            </h1>

            <div className="w-full md:w-2/3 h-fit overflow-y-auto p-4 mb-14">
                {response.map((entry, index) => (
                    <div
                        key={index}
                        className={`my-2 p-3 rounded-xl max-w-[75%] ${
                            entry.sender === "user"
                                ? "bg-blue-100 ml-auto text-right"
                                : "bg-green-100 mr-auto text-left"
                        }`}
                    >
                        {entry.message}
                    </div>
                ))}
            </div>

            <div className="flex flex-row items-center w-full md:w-2/3 gap-2 fixed bottom-4 justify-center">
                <div className="bg-white shadow-md rounded-full px-4 py-2 flex items-center w-full max-w-[80%] overflow-hidden">
                    <p className="text-gray-600 truncate">
                        {transcript.length === 0
                            ? "Say something..."
                            : transcript}
                    </p>
                </div>

                <button
                    onClick={resetTranscript}
                    className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
                >
                    <PiBroomDuotone className="text-2xl text-sky-600" />
                </button>
            </div>
        </div>
    );
}

export default App;
