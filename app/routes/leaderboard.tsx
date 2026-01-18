import type { Route } from "./+types/leaderboard";
import { useState, useEffect, useRef } from "react";
import store from "./store.js";
import { IP_ADDRESS, API_BASE_URL, WS_URL } from "./config";

// Import logo images
import WNBAMielle from "../assets/logos/WNBA Mielle.png";
import WNBAOLAY from "../assets/logos/WNBA OLAY.png";
import WNBASecret from "../assets/logos/WNBA Secret.png";
import WNBATampax from "../assets/logos/WNBA Tampax.png";
import WNBAVenus from "../assets/logos/WNBA Venus.png";

const logoImages = [
  { src: WNBAMielle, alt: "WNBA Mielle" },
  { src: WNBAOLAY, alt: "WNBA OLAY" },
  { src: WNBASecret, alt: "WNBA Secret" },
  { src: WNBATampax, alt: "WNBA Tampax" },
  { src: WNBAVenus, alt: "WNBA Venus" },
];

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
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % logoImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="h-screen bg-black flex flex-col text-[130%]">
      {/* Image Carousel - 1/3 of page */}
      <div className="h-[33vh] w-full relative overflow-hidden flex-shrink-0">
        {logoImages.map((logo, index) => (
          <div
            key={logo.alt}
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={logo.src}
              alt={logo.alt}
              className="max-h-full max-w-full object-contain p-4"
            />
          </div>
        ))}
      </div>

      <div className="container mx-auto px-4 py-4 max-w-5xl flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="mb-1 text-center flex-shrink-0 w-full">
          <div className="w-full mb-2">
            <h1 className="w-full font-display text-[4.32rem] font-bold text-white tracking-wide uppercase text-center">
              Leaderboard
            </h1>
          </div>
        </div>
        {/* Error Message */}
        {error && (
          <div className="mb-2 p-2 bg-magenta-950 text-white rounded-lg text-sm font-medium flex-shrink-0">
            {error}
          </div>
        )}

        {/* Leaderboard */}
        {loading ? (
          <div className="leaderboard flex-1 flex items-center justify-center min-h-0">
            <p className="text-xl font-medium text-gray-400">
              Loading leaderboard...
            </p>
          </div>
        ) : players.length === 0 ? (
          <div className="leaderboard flex-1 flex items-center justify-center min-h-0 bg-black rounded-lg border border-gray-800">
            <p className="text-xl font-medium text-gray-400">
              No players found. Add players to see the leaderboard!
            </p>
          </div>
        ) : (
          <div className="leaderboard flex-1 min-h-0 bg-black">
            <div className="grid grid-cols-2 gap-8 h-full">
              {/* Left column */}
              <div className="flex flex-col">
                {players.slice(0, Math.ceil(players.length / 2)).map((player, index) => (
                  <div
                    key={player.session_id}
                    className="flex-1 flex items-center"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-0">
                        {/* Magenta rank badge */}
                        <div className="font-display bg-magenta-500 text-white text-xl w-10 h-full flex items-center justify-center py-3 px-2">
                          {index + 1}
                        </div>
                        {/* White name container */}
                        <div className="bg-white flex-1 py-3 px-4 w-90">
                          <h3 className="font-display text-xl text-black uppercase tracking-wide">
                            {player.player}
                          </h3>
                        </div>
                      </div>
                      {/* Score on black background */}
                      <div className="text-right">
                        <div className="font-display text-2xl text-white pl-1">
                          {player.score}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Right column */}
              <div className="flex flex-col">
                {players.slice(Math.ceil(players.length / 2)).map((player, index) => (
                  <div
                    key={player.session_id}
                    className="flex-1 flex items-center"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-0 w-100">
                        {/* Magenta rank badge */}
                        <div className="font-display bg-magenta-500 text-white text-xl w-10 h-full flex items-center justify-center py-3 px-2">
                          {Math.ceil(players.length / 2) + index + 1}
                        </div>
                        {/* White name container */}
                        <div className="bg-white flex-1 py-3 px-4">
                          <h3 className="font-display text-xl text-black uppercase tracking-wide">
                            {player.player}
                          </h3>
                        </div>
                      </div>
                      {/* Score on black background */}
                      <div className="text-right">
                        <div className="font-display text-2xl text-white pl-2">
                          {player.score}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
