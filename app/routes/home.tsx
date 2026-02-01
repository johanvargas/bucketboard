import type { Route } from "./+types/home";
import { useState, useEffect, useRef } from "react";
import { Link, useFetcher } from "react-router";
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
  const wes = useRef(null);
  const queryTray = useRef([]);

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

  let fetcher = useFetcher();

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

      wes.current.send(String("Leaderboard Updated!"));
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

  function Search() {
    const [name, setName] = useState("");

    function handleSearchTerm(char: string) {
      return setName(char);
    }

    return (
      <div className="mb-8">
        <fetcher.Form className="search-form flex items-center gap-4 p-5 bg-gray-900/50 rounded-xl border border-gray-800 hover:border-gray-700 transition-all duration-200">
          <input
            type="text"
            value={name}
            name="name"
            onChange={(e) => handleSearchTerm(e.target.value)}
            placeholder="Enter player name..."
            className="flex-1 px-4 py-2.5 bg-black text-white border border-gray-700 rounded-lg focus:outline-none focus:border-magenta-500 transition-colors duration-200 placeholder-gray-500"
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-magenta-500 hover:bg-magenta-400 text-white rounded-lg transition-all duration-200 hover:shadow-lg"
          >
            Search
          </button>
        </fetcher.Form>
      </div>
    );
  }

  const systemFont =
    'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

  return (
    <div className="min-h-screen bg-black" style={{ fontFamily: systemFont }}>
      <div className="container mx-auto">
        <InfoDialogue message={message} />
        <br />
        {/* Header */}
        <div className="mb-5 text-center">
          <h2 className="text-[2em] text-gray-400 font-sans-serif mb-6">
            Manage scores and rankings
          </h2>
          {/* Action Buttons */}
          <div className="flex justify-around items-center">
            <button
              onClick={handleFetch}
              className="font-display min-w-[220px] px-[35.2px] py-[17.6px] bg-gray-800 hover:bg-gray-700 text-white text-[1.1875rem] rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg active:shadow-md border border-gray-700"
            >
              Refresh Leaderboard
            </button>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="font-display min-w-[220px] px-[35.2px] py-[17.6px] bg-magenta-600 hover:bg-magenta-500 text-white text-[1.1875rem] rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg active:shadow-md"
              >
                + Add New Player
              </button>
            )}
            <Link
              to="/leaderboard"
              className="font-display min-w-[220px] inline-block px-[35.2px] py-[17.6px] bg-magenta-500 hover:bg-magenta-400 text-white text-[1.1875rem] rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg active:shadow-md text-center"
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
            <div className="relative w-full max-w-xl mx-4 bg-gray-950 rounded-2xl border border-gray-800 p-8 shadow-2xl shadow-magenta-500/10 animate-in fade-in zoom-in-95 duration-200">
              {/* Close Button */}
              <button
                type="button"
                onClick={handleCancel}
                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200"
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
                  <label className="block text-[1.1875rem] font-serif text-white mb-2">
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
                    className="font-serif w-full px-4 py-3 text-[1.06875rem] border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-magenta-500 focus:border-magenta-500 bg-gray-900 text-white"
                    placeholder="Enter player name"
                  />
                </div>

                <div>
                  <label className="block text-[1.1875rem] font-serif text-white mb-2">
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
                    className="font-display w-full px-4 py-3 text-[1.06875rem] border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-magenta-500 focus:border-magenta-500 bg-gray-900 text-white"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="font-display flex-1 px-8 py-4 bg-magenta-500 hover:bg-magenta-400 text-white text-[1.1875rem] rounded-lg transition-colors duration-200"
                  >
                    {editingPlayer ? "Update Player" : "Add Player"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="font-display flex-1 px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white text-[1.1875rem] rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SEARCHBAR */}
        <Search />
        <div className="h-10 text-white">
          {queryTray.current.length != 0
            ? queryTray.current.filter((match) => (
                <>
                  <p>we have a match</p>
                </>
              ))
            : "no matches at the moment"}
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-5">
            {players.map((player) => (
              <div
                key={player.session_id}
                className="bg-black rounded-xl border-2 border-gray-800 p-6 hover:border-magenta-500 transition-all duration-300 ease-in-out transform hover:scale-[1em] active:scale-[0.98] shadow-md hover:shadow-lg active:shadow-md"
              >
                <div className="grid grid-cols-4 gap-3">
                  <div className="flex flex-col justify-center py-3 px-4 bg-gradient-to-br from-gray-900/80 to-gray-900/40 rounded-lg border border-gray-700/50">
                    <span className="text-[0.75rem] uppercase tracking-wider text-gray-500 mb-1">
                      Player
                    </span>
                    <h3 className="text-[1.25rem] font-bold text-white truncate">
                      {player.player}
                    </h3>
                  </div>
                  <div className="flex flex-col items-center justify-center py-3 px-2 bg-gray-900/60 rounded-lg border border-gray-800/50">
                    <span className="text-[0.75rem] uppercase tracking-wider text-gray-500 mb-1">
                      Score
                    </span>
                    <span className="font-display text-[1.5rem] font-semibold text-magenta-400">
                      {player.score}
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center py-3 px-2 bg-gray-900/60 rounded-lg border border-gray-800/50">
                    <span className="text-[0.75rem] uppercase tracking-wider text-gray-500 mb-1">
                      Place
                    </span>
                    <span className="font-display text-[1.5rem] font-semibold text-white">
                      #{player.place}
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center py-3 px-2 bg-gray-900/60 rounded-lg border border-gray-800/50">
                    <span className="text-[0.75rem] uppercase tracking-wider text-gray-500 mb-1">
                      Top Ten
                    </span>
                    <span
                      className={`font-display text-[1.5rem] font-semibold ${player.place <= 10 ? "text-magenta-400" : "text-gray-600"}`}
                    >
                      {player.place <= 10 ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleEdit(player)}
                    className="font-display flex-1 px-4 py-3 bg-magenta-500 hover:bg-magenta-400 text-white text-[1.06875rem] rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md active:shadow-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(player.session_id)}
                    className="font-display flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white text-[1.06875rem] rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md active:shadow-sm"
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
