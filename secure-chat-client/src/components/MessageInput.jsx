function MessageInput({ message, setMessage, sendMessage }) {
  return (
    <div className="p-6 border-t border-slate-800 bg-slate-900 flex gap-4">
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a secure message..."
        className="flex-1 px-5 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <button
        onClick={sendMessage}
        className="px-6 py-3 bg-blue-600 rounded-xl hover:bg-blue-700 transition"
      >
        Send
      </button>
    </div>
  );
}

export default MessageInput;