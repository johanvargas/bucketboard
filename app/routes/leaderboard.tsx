import type { Route } from "./+types/leaderboard";
import { useState, useEffect, useRef } from "react";
import store from "./store.js";
import { IP_ADDRESS, API_BASE_URL, WS_URL } from "./config";

interface Player {
  session_id: number;
  player: string;
  score: number;
  top_ten: number;
  place: number;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Leaderboard - B-Ball Showdown" },
    { name: "description", content: "Top 10 scores" },
  ];
}

export default function Leaderboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wes = useRef(null);
  let [message, setMessage] = useState("");

  const updateMessage = (message) => {
    setMessage(message);
  };

  useEffect(() => {
    // websocket send data to leaderboard
    wes.current = new WebSocket(`ws://${IP_ADDRESS}:5634`);

    wes.current.onopen = () => {
      // when receiving a message
      wes.current.onmessage = (data) => {
        updateMessage(data.data);
        fetchLeaderboard();
        console.log("INCOMING MESSAGE dam: ", data.data);

        //if (wes.current && wes.current.readyState === WebSocket.OPEN) {
        //  wes.current.send(String("Hallo, auf den Spitzesteller!"));
        //  wes.current.close();
        //}
      };
    };
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/players`);
      if (!response.ok) throw new Error("Failed to fetch players");
      const data = await response.json();

      // Sort by score (descending) and take top 10
      const sortedPlayers = data
        .sort((a: Player, b: Player) => b.score - a.score)
        .slice(0, 10);

      setPlayers(sortedPlayers);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load leaderboard",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleValtio = () => {
    store.test = "changed!";
  };

  return (
    <div className="h-screen bg-white dark:bg-black overflow-hidden flex flex-col">
      <div className="container mx-auto px-4 py-8 max-w-4xl flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="mb-6 text-center flex-shrink-0">
          <div className="flex items-center justify-center gap-4 mb-2">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-orange-500 via-orange-600 to-black dark:from-orange-400 dark:via-orange-500 dark:to-white bg-clip-text text-transparent">
              Leaderboard
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            All Time Top 10
          </p>
        </div>
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-black dark:text-white rounded-lg text-base font-medium flex-shrink-0">
            {error}
          </div>
        )}
        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
          Message from web socket server: {message ? message : "no message available"}
        </div>
        {/* Leaderboard */}
        {loading ? (
          <div className="leaderboard flex-1 flex items-center justify-center min-h-0">
            <p className="text-xl font-medium text-gray-600 dark:text-gray-400">
              Loading leaderboard...
            </p>
          </div>
        ) : players.length === 0 ? (
          <div className="leaderboard flex-1 flex items-center justify-center min-h-0 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800">
            <p className="text-xl font-medium text-gray-600 dark:text-gray-400">
              No players found. Add players to see the leaderboard!
            </p>
          </div>
        ) : (
          <div className="leaderboard flex-1 min-h-0 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 flex flex-col">
            <div className="flex flex-col h-full divide-y divide-gray-200 dark:divide-gray-800">
              {players.map((player, index) => (
                <div
                  key={player.session_id}
                  className={`flex-1 flex items-center p-4 ${
                    index === 0
                      ? "bg-orange-50 dark:bg-orange-950/20 border-l-4 border-l-orange-500"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                      <div
                        className={`text-2xl font-bold w-12 text-right ${
                          index === 0
                            ? "text-orange-600 dark:text-orange-400"
                            : index === 1
                              ? "text-gray-500 dark:text-gray-500"
                              : index === 2
                                ? "text-gray-500 dark:text-gray-500"
                                : "text-gray-400 dark:text-gray-600"
                        }`}
                      >
                        #{index + 1}
                      </div>
                      <h3 className="text-xl font-semibold text-black dark:text-white">
                        {player.player}
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {player.score}
                      </div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wide">
                        Points
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
