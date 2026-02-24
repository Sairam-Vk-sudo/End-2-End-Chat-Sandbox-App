function MessageInput({ message, setMessage, sendMessage }) {
  return (
    <div className="message-input">
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a secure message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default MessageInput;
