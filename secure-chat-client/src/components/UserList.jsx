function UserList({ users, socketId, selectedUser, onSelect }) {
  return (
    <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold">🔐 SecureChat</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {Object.keys(users)
          .filter((id) => id !== socketId)
          .map((id) => (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={`w-full text-left px-4 py-3 rounded-xl transition
                ${
                  selectedUser === id
                    ? "bg-blue-600"
                    : "bg-slate-800 hover:bg-slate-700"
                }`}
            >
              {users[id].username}
            </button>
          ))}
      </div>
    </div>
  );
}

export default UserList;