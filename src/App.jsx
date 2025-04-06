import React, {useState} from "react";
import SpeechRecognition, {
    useSpeechRecognition,
} from "react-speech-recognition";
import {IoMdMic, IoMdMicOff, IoMdSearch} from "react-icons/io";
import {PiBroomDuotone} from "react-icons/pi";
import Groq from "groq-sdk";
import formatResponse from "./utils/formatResponse";

function App() {
    const [micState, setMicState] = useState(false);
    const [response, setResponse] = useState([]);
    const {transcript, resetTranscript, browserSupportsSpeechRecognition} =
        useSpeechRecognition();

    const handleListening = () => {
        setMicState((prev) => !prev);
        if (micState) {
            SpeechRecognition.stopListening();
            return;
        }
        if (SpeechRecognition.browserSupportsSpeechRecognition()) {
            SpeechRecognition.startListening({continuous: true});
        } else {
            console.log("Browser doesn't support speech recognition.");
        }
        console.log("Listening...");
    };

    if (!browserSupportsSpeechRecognition) {
        return <span>Browser doesn't support speech recognition.</span>;
    }

    const groq = new Groq({
        apiKey: "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",
        dangerouslyAllowBrowser: true,
    });

    const handleSearch = async () => {
        const userInput = transcript;
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
        speechSynthesis.speak(utterance);
        resetTranscript();
    };

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

            <div className="flex flex-row items-center w-full md:w-2/3 gap-2 fixed bottom-4">
                <div className="flex-grow bg-white shadow-md rounded-full px-4 py-2 flex items-center">
                    <p className="text-gray-600 truncate">
                        {transcript.length === 0
                            ? "Say something..."
                            : transcript}
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleListening}
                        className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
                    >
                        {micState ? (
                            <IoMdMicOff className="text-2xl text-red-500" />
                        ) : (
                            <IoMdMic className="text-2xl text-green-500" />
                        )}
                    </button>

                    <button
                        onClick={resetTranscript}
                        className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
                    >
                        <PiBroomDuotone className="text-2xl text-sky-600" />
                    </button>

                    <button
                        onClick={handleSearch}
                        className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
                    >
                        <IoMdSearch className="text-2xl text-orange-500" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;
