function ChatWindow({ chat }) {
  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-4">
      {chat.map((msg, index) => {
        const isYou = msg.startsWith("You:");

        return (
          <div
            key={index}
            className={`max-w-md px-5 py-3 rounded-2xl shadow-md
              ${isYou ? "bg-blue-600 ml-auto" : "bg-slate-800"}`}
          >
            {msg}
          </div>
        );
      })}
    </div>
  );
}

export default ChatWindow;