function UserList({ users, socketId, onSelect }) {
  return (
    <div>
      {Object.keys(users)
        .filter((id) => id !== socketId)
        .map((id) => (
          <div key={id} style={{ marginBottom: "10px" }}>
            <button
              style={{
                width: "100%",
                padding: "8px",
                backgroundColor: "#334155",
                color: "white",
                border: "none",
                borderRadius: "6px",
              }}
              onClick={() => onSelect(id)}
            >
              User {id.slice(0, 5)}...
            </button>
          </div>
        ))}
    </div>
  );
}

export default UserList;
