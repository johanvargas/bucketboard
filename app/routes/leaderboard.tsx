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
    }, 10000);
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
    <div className="bg-black flex flex-col">
      {/* Image Carousel - 1/3 of page */}
      {/*<div className="h-[33vh] object-cover">*/}
      <div className="object-cover relative h-100 -top-10">
        {logoImages.map((logo, index) => (
          <div
            key={logo.alt}
            className={`absolute flex items-center w-screen justify-center transition-opacity duration-900 ${
              index === currentSlide ? "opacity-100" : "opacity-1"
            }`}
          >
            <img src={logo.src} alt={logo.alt} className="w-270" />
          </div>
        ))}
      </div>

      <div className="container mx-auto flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center">
          <div className="w-full">
            {/*<h1 className="w-full font-display text-[6em] font-bold text-white tracking-wide uppercase text-center">*/}
            <h1 className="inline-block text-[8em] uppercase tracking-[4.7vw] font-black">
              <span className="align-top">Leaderboard</span>
            </h1>
          </div>
        </div>
        {/* Error Message */}
        {error && (
          <div className="bg-magenta-950 text-white rounded-lg text-sm font-medium flex-shrink-0">
            {error}
          </div>
        )}

        {/* Leaderboard */}
        {loading ? (
          <div className="leaderboard flex-1 flex">
            <p className="">Loading leaderboard...</p>
          </div>
        ) : players.length === 0 ? (
          <div className="leaderboard flex-1 flex bg-black">
            <p className="">
              No players found. Add players to see the leaderboard!
            </p>
          </div>
        ) : (
            <div className="grid grid-cols-2 font-black uppercase tracking-[0.6rem]">
              {/* LEFT COLUMN */}
              <div className="flex flex-col gap-6">
                {players
                  .slice(0, Math.ceil(players.length / 2))
                  .map((player, index) => (

                    <div key={player.session_id} className="flex-1 flex">
                      <div className="flex">
                        <div className="flex items-center">
                          {/* Magenta rank badge */}
                          <div className="rank font-display bg-magenta-500 text-[2.5em] text-white py-3 w-20 text-center">
                            {index + 1}
                          </div>
                          {/* White name container */}
                          <div className="bg-white flex-1 py-3 px-10 w-140">
                            <h3 className="font-display text-[2.5em] text-black ">
                              {player.player}
                            </h3>
                          </div>
                        </div>
                        {/* Score on black background */}
                        <div className="">
                          <div className="font-display text-[2.5em] text-white ml-10">
                            {player.score}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* RIGHT COLUMN */}
              <div className="flex flex-col gap-6">
                {players
                  .slice(Math.ceil(players.length / 2))
                  .map((player, index) => (
                    <div key={player.session_id} className="flex-1 flex">
                      <div className="flex">
                        <div className="flex items-center">
                          {/* Magenta rank badge */}
                          <div className="font-display bg-magenta-500 text-[2.5em] text-white py-3 w-20 text-center">
                            {Math.ceil(players.length / 2) + index + 1}
                          </div>
                          {/* White name container */}
                          <div className="bg-white flex-1 py-3 px-10 w-140">
                            <h3 className="font-display text-[2.5em] text-black">
                              {player.player}
                            </h3>
                          </div>
                        </div>
                        {/* Score on black background */}
                        <div className="text-[2.5em] text-white ml-9">
                          {player.score}
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
