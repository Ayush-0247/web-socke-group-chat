import { useEffect, useRef, useState } from "react";
import { connectWS } from "./ws";

export default function App() {
  const timer = useRef(null);
  const socket = useRef(null);
  const [userName, setUserName] = useState("");
  const [showNamePopup, setShowNamePopup] = useState(true);
  const [inputName, setInputName] = useState("");
  const [typers, setTypers] = useState([]);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    socket.current = connectWS();

    socket.current.on("connect", () => {
      socket.current.on("roomNotice", (userName) => {
        console.log(`${userName} joined to group!`);
      });

      socket.current.on("chatMessage", (msg) => {
        console.log("msg", msg);
        setMessages((prev) => [...prev, msg]);
      });

      socket.current.on("typing", (userName) => {
        setTypers((prev) => {
          const isExist = prev.find((typer) => typer === userName);
          if (!isExist) {
            return [...prev, userName];
          }
          return prev;
        });
      });

      socket.current.on("stopTyping", (userName) => {
        setTypers((prev) => prev.filter((typer) => typer !== userName));
      });
    });

    return () => {
      socket.current.off("roomNotice");
      socket.current.off("chatMessage");
      socket.current.off("typing");
      socket.current.off("stopTyping");
    };
  }, []);

  useEffect(() => {
    if (text) {
      socket.current.emit("typing", userName);
      clearTimeout(timer.current);
    }

    timer.current = setTimeout(() => {
      socket.current.emit("stopTyping", userName);
    }, 1000);

    return () => {
      clearTimeout(timer.current);
    };
  }, [text, userName]);

  // FORMAT TIMESTAMP TO HH:MM FOR MESSAGES
  function formatTime(ts) {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  // SUBMIT NAME TO GET STARTED, OPEN CHAT WINDOW WITH INITIAL MESSAGE
  function handleNameSubmit(e) {
    e.preventDefault();
    const name = inputName.trim();
    if (!name) return;

    socket.current.emit("joinRoom", name);
    setUserName(name);
    setShowNamePopup(false);
  }

  // SEND MESSAGE FUNCTION
  function sendMessage() {
    const t = text.trim();
    if (!t) return;

    // USER MESSAGE
    const msg = {
      id: Date.now(),
      sender: userName,
      text: t,
      ts: Date.now(),
    };
    setMessages((m) => [...m, msg]);

    // emit
    socket.current.emit("chatMessage", msg);

    setText("");
  }

  // HANDLE ENTER KEY TO SEND MESSAGE
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 p-4 font-inter">
      {/* ENTER YOUR NAME TO START CHATTING */}
      {showNamePopup && (
        <div className="bg-pink-500 p-8 m-8 border-2 border-black rounded-2xl">
          <form onSubmit={handleNameSubmit}>
            <input
              type="text"
              placeholder="Enter your name to enter the chat"
              value={inputName}
              onChange={(e) => {
                setInputName(e.target.value);
              }}
            />
            <button type="submit" className="bg-green-500 p-2 m-2 rounded-lg">
              Enter
            </button>
          </form>
        </div>
      )}

      {/* CHAT WINDOW */}
      {!showNamePopup && (
        <div className="w-full max-w-2xl h-[90vh] bg-white rounded-xl shadow-md flex flex-col overflow-hidden">
          {/* CHAT HEADER */}
          <div className="bg-gray-300 p-4 m-4 border-2 border-black rounded-2xl">
            welcome to realtime group chat
            {typers.length ? (
              <p className="bg-pink-200 p-2 m-2 text-pink-950">
                {typers.join(", ")} is typing...
              </p>
            ) : (
              <p></p>
            )}
            <p>signed in as {userName}</p>
          </div>

          {/* CHAT MESSAGE LIST */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-100 flex flex-col">
            {messages.map((m) => {
              const mine = m.sender === userName;
              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[78%] p-3 my-2 rounded-[18px] text-sm leading-5 shadow-sm ${
                      mine
                        ? "bg-[#DCF8C6] text-[#303030] rounded-br-2xl"
                        : "bg-white text-[#303030] rounded-bl-2xl"
                    }`}
                  >
                    <div className="break-words whitespace-pre-wrap">
                      {m.text}
                    </div>
                    <div className="flex justify-between items-center mt-1 gap-16">
                      <div className="text-[11px] font-bold">{m.sender}</div>
                      <div className="text-[11px] text-gray-500 text-right">
                        {formatTime(m.ts)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CHAT TEXTAREA */}
          <div className="px-4 py-3 border-t border-gray-200 bg-white">
            <div className="flex items-center justify-between gap-4 border border-gray-200 rounded-full">
              <textarea
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="w-full resize-none px-4 py-4 text-sm outline-none"
              />
              <button
                onClick={sendMessage}
                className="bg-green-500 text-white px-4 py-2 mr-2 rounded-full text-sm font-medium cursor-pointer"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
