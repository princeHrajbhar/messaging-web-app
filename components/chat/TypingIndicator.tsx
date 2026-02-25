"use client";

interface Props {
  users: any[];
}

export function TypingIndicator({ users }: Props) {
  if (!users || users.length === 0) return null;

  const names = users.map((u) => u.name?.split(" ")[0]).join(", ");
  const label = users.length === 1 ? `${names} is typing` : `${names} are typing`;

  return (
    <div className="flex items-end gap-2 mb-1">
      <img
        src={users[0]?.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${users[0]?.name}`}
        alt={users[0]?.name}
        className="w-7 h-7 rounded-full object-cover flex-shrink-0"
      />
      <div className="flex flex-col items-start">
        <span className="text-xs text-gray-400 ml-1 mb-0.5">{label}</span>
        <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full inline-block" style={{ animation: "bounceDots 1.4s infinite ease-in-out both", animationDelay: "0s" }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full inline-block" style={{ animation: "bounceDots 1.4s infinite ease-in-out both", animationDelay: "0.2s" }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full inline-block" style={{ animation: "bounceDots 1.4s infinite ease-in-out both", animationDelay: "0.4s" }} />
        </div>
      </div>
      <style>{`
        @keyframes bounceDots {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
