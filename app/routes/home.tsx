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
      title: "B-Ball Showdown",
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

      wes.current.send(String("Seite Aktualisiert!"));
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
  const handleWS = () => {
    if (import.meta.hot) {
      import.meta.hot.send("my-custom-event", {
        message: "Hello from the browser!",
      });
    }
  };

  async function handleFetch() {
    //const response = await fetch("http://127.0.0.1:5634");
    //if (!response.ok) {
    //  throw new Error(`Response status: ${response.status}`);
    //};
    wes.current.send(String("Seite Aktualisiert!"));
    console.log("web socket message sent");
  }

  // functionality dialogue, websocket communication
  function InfoDialogue({ message }) {
    const [info, setInfo] = useState("my eyes");

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
        <p>{info}</p>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <InfoDialogue  message={message}/>
        <br />
        <br />
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-[5.7rem] font-extrabold mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-orange-500 via-orange-600 to-black dark:from-orange-400 dark:via-orange-500 dark:to-white bg-clip-text text-transparent">
              B-Ball
            </span>{" "}
            <span className="bg-gradient-to-r from-black via-orange-600 to-orange-500 dark:from-white dark:via-orange-400 dark:to-orange-500 bg-clip-text text-transparent">
              Showdown
            </span>
          </h1>
          <p className="text-[1.425rem] text-gray-600 dark:text-gray-400 font-medium mb-6">
            Manage scores and rankings
          </p>
          {/* Action Buttons */}
          <div className="flex justify-around items-center">
            <button
              onClick={handleFetch}
              className="min-w-[220px] px-[35.2px] py-[17.6px] bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-[1.1875rem] font-bold rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg active:shadow-md"
            >
              Refresh Leaderboard
            </button>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="min-w-[220px] px-[35.2px] py-[17.6px] bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white text-[1.1875rem] font-bold rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg active:shadow-md"
              >
                + Add New Player
              </button>
            )}
            <Link
              to="/leaderboard"
              className="min-w-[220px] inline-block px-[35.2px] py-[17.6px] bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white text-[1.1875rem] font-bold rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg active:shadow-md text-center"
            >
              View Leaderboard →
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-900 border border-gray-400 dark:border-gray-700 text-black dark:text-white rounded-lg text-[1.06875rem] font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="mb-8 bg-white dark:bg-black rounded-xl border-2 border-gray-200 dark:border-gray-800 p-8 hover:border-orange-500 dark:hover:border-orange-500 transition-colors duration-200">
            <h2 className="text-[2.1375rem] font-bold text-black dark:text-white mb-6">
              {editingPlayer ? "Edit Player" : "Add New Player"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[1.1875rem] font-bold text-black dark:text-white mb-2">
                  Player Name
                </label>
                <input
                  type="text"
                  value={formData.player}
                  onChange={(e) =>
                    setFormData({ ...formData, player: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 text-[1.06875rem] border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:text-white"
                  placeholder="Enter player name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[1.1875rem] font-bold text-black dark:text-white mb-2">
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
                    className="w-full px-4 py-3 text-[1.06875rem] border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-8 py-4 bg-black hover:bg-orange-600 dark:bg-white dark:hover:bg-orange-500 text-white dark:text-black text-[1.1875rem] font-bold rounded-lg transition-colors duration-200"
                >
                  {editingPlayer ? "Update Player" : "Add Player"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-8 py-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-black dark:text-white text-[1.1875rem] font-bold rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Players List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-[1.425rem] font-bold text-gray-600 dark:text-gray-400">
              Loading players...
            </p>
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-black rounded-xl border-2 border-gray-200 dark:border-gray-800">
            <p className="text-[1.425rem] font-bold text-gray-600 dark:text-gray-400">
              No players found. Show them you got GAME!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {players.map((player) => (
              <div
                key={player.session_id}
                className="bg-white dark:bg-black rounded-xl border-2 border-gray-200 dark:border-gray-800 p-6 hover:border-orange-400 dark:hover:border-orange-400 transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg active:shadow-md"
              >
                <div className="mb-4">
                  <h3 className="text-[1.78125rem] font-bold text-black dark:text-white mb-2">
                    {player.player}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[1.06875rem] font-semibold text-gray-600 dark:text-gray-400">
                        Score:
                      </span>
                      <span className="text-[1.425rem] font-bold text-orange-500 dark:text-orange-400">
                        {player.score}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[1.06875rem] font-semibold text-gray-600 dark:text-gray-400">
                        Place:
                      </span>
                      <span className="text-[1.425rem] font-bold text-black dark:text-white">
                        #{player.place}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[1.06875rem] font-semibold text-gray-600 dark:text-gray-400">
                        Top Ten:
                      </span>
                      <span
                        className={`text-[1.1875rem] font-bold ${player.top_ten ? "text-orange-500 dark:text-orange-400" : "text-gray-400 dark:text-gray-600"}`}
                      >
                        {player.place <= 10 ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleEdit(player)}
                    className="flex-1 px-4 py-3 bg-black hover:bg-orange-500 dark:bg-white dark:hover:bg-orange-400 text-white dark:text-black text-[1.06875rem] font-bold rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md active:shadow-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(player.session_id)}
                    className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-black dark:text-white text-[1.06875rem] font-bold rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md active:shadow-sm"
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
