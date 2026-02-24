function ChatWindow({ chat }) {
  return (
    <div className="chat-window">
      {chat.map((msg, index) => {
        const isYou = msg.startsWith("You:");

        return (
          <div
            key={index}
            className={`message ${isYou ? "you" : "friend"}`}
          >
            {msg}
          </div>
        );
      })}
    </div>
  );
}

export default ChatWindow;
