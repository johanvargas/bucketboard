import type { Route } from "./+types/home";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { IP_ADDRESS, API_BASE_URL } from "./config";

interface Player {
  session_id: number;
  player: string;
  score: number;
  top_ten: boolean;
  place: number;
}

// doing anything?
export function meta({}: Route.MetaArgs) {
  return [
    {
      title: "Bucketboard",
    },
    {
      name: "description",
      content: "Manage basketball player scores and rankings",
    },
  ];
}

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    player: "",
    score: "",
    top_ten: () => false,
    place: 13,
  });
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const wes = useRef(null);

  const updateMessage = (message) => {
    let messageStr = message;
    if (message instanceof Blob) {
      message.text().then((text) => setMessage(text));
      return;
    }
    if (typeof message === "object") {
      messageStr = JSON.stringify(message);
    }
    setMessage(String(messageStr));
  };

  /* useEffects */
  useEffect(() => {
    // websocket send data to leaderboard
    wes.current = new WebSocket(`ws://${IP_ADDRESS}:5634`);
    wes.current.onopen = () => {
      // when receiving a message
      wes.current.onmessage = (data) => {
        updateMessage(data.data);
        console.log("INCOMING MESSAGE: ", data.data);
      };
    };

    // query db for players list
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/players`);
      if (!response.ok) throw new Error("Failed to fetch players");
      const data = await response.json();
      // Convert top_ten from number (0/1) to boolean
      const convertedData = data.map((player: any) => ({
        ...player,
        top_ten: Boolean(player.top_ten),
      }));
      setPlayers(convertedData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load players");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        player: formData.player,
        score: parseInt(formData.score),
        //top_ten: formData.top_ten ? 1 : 0,
        top_ten: 0,
        //place: formData.place ?  formData.place : 10,
        place: 10,
      };

      if (editingPlayer) {
        // Update existing player
        const response = await fetch(
          `${API_BASE_URL}/players/${editingPlayer.session_id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        if (!response.ok) throw new Error("Failed to update player");
      } else {
        // Create new player
        const response = await fetch(`${API_BASE_URL}/players`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Failed to create player");
      }

      setShowForm(false);
      setEditingPlayer(null);
      setFormData({ player: "", score: "", top_ten: false, place: 13 });
      fetchPlayers();

      wes.current.send(String("Leaderboard Updated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save player");
    }
  };

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      player: player.player,
      score: player.score.toString(),
      top_ten: false,
      place: player.place,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this player entry?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/players/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete player");
      fetchPlayers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete player");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPlayer(null);
    setFormData({ player: "", score: "", top_ten: false, place: 13 });
  };

  // uses vite hmr, was its own ws/wss server running
  //const handleWS = () => {
  //  if (import.meta.hot) {
  //    import.meta.hot.send("my-custom-event", {
  //      message: "Hello from the browser!",
  //    });
  //  }
  //};

  async function handleFetch() {
    //const response = await fetch("http://127.0.0.1:5634");
    //if (!response.ok) {
    //  throw new Error(`Response status: ${response.status}`);
    //};
    wes.current.send(String("Leaderboard Updated!"));
    console.log("web socket message sent");
  }

  // functionality dialogue, websocket communication
  function InfoDialogue({ message }) {
    const [info, setInfo] = useState("fuck ice");

    useEffect(() => {
      setInfo(message);
      setTimeout(() => {
        setInfo("");
      }, 3000);
    }, []);

    //if (message) {
    //  setInterval(() => {
    //    setInfo(message);
    //  }, 3000);
    //}
    return (
      <>
        {info && (
          <div className="serial-msg fixed top-6 left-6 z-50">
            <div className="flex items-center gap-3 px-5 py-3 bg-blue-600 rounded-lg shadow-xl">
              <p className="text-white text-[1rem] font-medium tracking-wide">
                {info}
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  const rankMap = new Map(
    [...players]
      .sort((a, b) => b.score - a.score)
      .map((player, index) => [player.session_id, index + 1])
  );

  const filteredPlayers = players.filter((player) =>
    player.player.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const systemFont =
    'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

  return (
    <div className="min-h-screen bg-black" style={{ fontFamily: systemFont }}>
      <div className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-6">
        <InfoDialogue message={message} />
        <br />
        {/* Header */}
        <div className="mb-8 md:mb-10 text-center pt-4">
          <h1 className="text-[2.5rem] md:text-[3rem] lg:text-[3.5rem] font-bold tracking-tight text-white mb-2">
            Bucket<span className="text-magenta-500">board</span>
          </h1>
          <p className="text-[1rem] md:text-[1.125rem] text-gray-500 tracking-wide font-light">
            Manage scores and rankings
          </p>
          <div className="mx-auto mt-4 mb-6 md:mb-8 w-24 h-[2px] bg-gradient-to-r from-transparent via-magenta-500 to-transparent" />
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap justify-center items-stretch sm:items-center gap-3 md:gap-4">
            <button
              onClick={handleFetch}
              className="font-display w-full sm:w-auto min-w-[200px] px-6 py-4 md:py-[18px] bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white text-[1.0625rem] md:text-[1.1875rem] rounded-xl transition-all duration-300 ease-in-out shadow-md hover:shadow-lg active:shadow-md border border-gray-700 select-none touch-manipulation"
            >
              Refresh Leaderboard
            </button>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="font-display w-full sm:w-auto min-w-[200px] px-6 py-4 md:py-[18px] bg-magenta-600 hover:bg-magenta-500 active:bg-magenta-400 text-white text-[1.0625rem] md:text-[1.1875rem] rounded-xl transition-all duration-300 ease-in-out shadow-md hover:shadow-lg active:shadow-md select-none touch-manipulation"
              >
                + Add New Player
              </button>
            )}
            <Link
              to="/leaderboard"
              className="font-display w-full sm:w-auto min-w-[200px] inline-block px-6 py-4 md:py-[18px] bg-magenta-500 hover:bg-magenta-400 active:bg-magenta-300 text-white text-[1.0625rem] md:text-[1.1875rem] rounded-xl transition-all duration-300 ease-in-out shadow-md hover:shadow-lg active:shadow-md text-center select-none touch-manipulation"
            >
              View Leaderboard →
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-magenta-950 border border-magenta-600 text-white rounded-lg text-[1.06875rem] font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="action-window fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={handleCancel}
            />
            {/* Modal Content */}
            <div className="relative w-full max-w-xl mx-4 md:mx-auto bg-gray-950 rounded-2xl border border-gray-800 p-6 md:p-8 shadow-2xl shadow-magenta-500/10 animate-in fade-in zoom-in-95 duration-200">
              {/* Close Button */}
              <button
                type="button"
                onClick={handleCancel}
                className="absolute top-4 right-4 p-3 md:p-2 text-gray-500 hover:text-white hover:bg-gray-800 active:bg-gray-700 rounded-lg transition-colors duration-200 touch-manipulation"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <h2 className="font-display text-[2rem] text-white mb-6">
                {editingPlayer ? "Edit Player" : "Add New Player"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[1.1875rem]  text-white mb-2">
                    Player Name
                  </label>
                  <input
                    type="text"
                    value={formData.player}
                    onChange={(e) =>
                      setFormData({ ...formData, player: e.target.value })
                    }
                    required
                    autoFocus
                    className="w-full px-4 py-3.5 md:py-3 text-[1rem] md:text-[1.06875rem] border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-magenta-500 focus:border-magenta-500 bg-gray-900 text-white"
                    placeholder="Enter player name"
                  />
                </div>

                <div>
                  <label className="block text-[1.1875rem]  text-white mb-2">
                    Shots Made
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={formData.score}
                    onChange={(e) =>
                      setFormData({ ...formData, score: e.target.value })
                    }
                    required
                    className="font-display w-full px-4 py-3.5 md:py-3 text-[1rem] md:text-[1.06875rem] border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-magenta-500 focus:border-magenta-500 bg-gray-900 text-white"
                  />
                </div>

                <div className="flex gap-3 md:gap-4 pt-4">
                  <button
                    type="submit"
                    className="font-display flex-1 px-6 md:px-8 py-4 bg-magenta-500 hover:bg-magenta-400 active:bg-magenta-300 text-white text-[1.0625rem] md:text-[1.1875rem] rounded-xl transition-colors duration-200 select-none touch-manipulation"
                  >
                    {editingPlayer ? "Update Player" : "Add Player"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="font-display flex-1 px-6 md:px-8 py-4 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white text-[1.0625rem] md:text-[1.1875rem] rounded-xl transition-colors duration-200 select-none touch-manipulation"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SEARCHBAR */}
        <div className="mb-6 md:mb-8">
          <div className="search-form flex items-center gap-4 p-4 md:p-5 bg-gray-900/50 rounded-xl border border-gray-800 hover:border-gray-700 transition-all duration-200">
            <input
              type="text"
              value={searchTerm}
              name="name"
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter player name..."
              className="flex-1 px-4 py-3 md:py-2.5 text-[1rem] bg-black text-white border border-gray-700 rounded-xl focus:outline-none focus:border-magenta-500 transition-colors duration-200 placeholder-gray-500"
            />
          </div>
        </div>
        {/* Players List */}
        {loading ? (
          <div className="text-center">
            <p className="text-[1em] font-bold text-gray-400">
              Loading players...
            </p>
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-12 bg-black rounded-xl border-2 border-gray-800">
            <p className="text-[1rem] font-bold text-gray-400">
              No players found! Time to show them you got GAME!
            </p>
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="text-center py-12 bg-black rounded-xl border-2 border-gray-800">
            <p className="text-[1rem] font-bold text-yellow-400">
              No players found matching "{searchTerm}"
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {filteredPlayers.map((player) => (
              <div
                key={player.session_id}
                className="bg-black rounded-xl border-2 border-gray-800 p-4 md:p-5 lg:p-6 hover:border-magenta-500 transition-all duration-300 ease-in-out active:scale-[0.98] shadow-md hover:shadow-lg active:shadow-md touch-manipulation"
              >
                <div className="flex flex-col gap-2 md:gap-3">
                  <div className="flex flex-col justify-center py-3 px-4 bg-gradient-to-br from-gray-900/80 to-gray-900/40 rounded-lg border border-gray-700/50">
                    <span className="text-[0.75rem] uppercase tracking-wider text-gray-500 mb-1">
                      Player
                    </span>
                    <h3 className="text-[1.125rem] md:text-[1.25rem] font-bold text-white">
                      {player.player}
                    </h3>
                  </div>
                  <div className="flex justify-between gap-2">
                    <div className="flex-1 flex flex-col items-center justify-center py-3 px-2 bg-gray-900/60 rounded-lg border border-gray-800/50">
                      <span className="text-[0.75rem] uppercase tracking-wider text-gray-500 mb-1">
                        Score
                      </span>
                      <span className="font-display text-[1.25rem] md:text-[1.5rem] font-semibold text-magenta-400">
                        {player.score}
                      </span>
                    </div>
                    <div className={`flex-1 flex flex-col items-center justify-center py-3 px-2 rounded-lg border ${(rankMap.get(player.session_id) ?? 99) <= 10 ? "bg-magenta-500/10 border-magenta-500/30 shadow-[0_0_12px_rgba(236,72,153,0.15)]" : "bg-gray-900/60 border-gray-800/50"}`}>
                      <span className={`text-[0.75rem] uppercase tracking-wider mb-1 ${(rankMap.get(player.session_id) ?? 99) <= 10 ? "text-magenta-300" : "text-gray-500"}`}>
                        {(rankMap.get(player.session_id) ?? 99) <= 10 ? "Top 10" : "Place"}
                      </span>
                      <span className={`font-display text-[1.25rem] md:text-[1.5rem] font-semibold ${(rankMap.get(player.session_id) ?? 99) <= 10 ? "text-magenta-400" : "text-white"}`}>
                        #{rankMap.get(player.session_id)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-4 md:mt-5">
                  <button
                    onClick={() => handleEdit(player)}
                    className="font-display flex-1 px-4 py-3.5 md:py-3 bg-magenta-500 hover:bg-magenta-400 active:bg-magenta-300 text-white text-[1.0625rem] md:text-[1.06875rem] rounded-xl transition-all duration-300 ease-in-out active:scale-[0.98] shadow-sm hover:shadow-md active:shadow-sm select-none touch-manipulation"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(player.session_id)}
                    className="font-display flex-1 px-4 py-3.5 md:py-3 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white text-[1.0625rem] md:text-[1.06875rem] rounded-xl transition-all duration-300 ease-in-out active:scale-[0.98] shadow-sm hover:shadow-md active:shadow-sm select-none touch-manipulation"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
