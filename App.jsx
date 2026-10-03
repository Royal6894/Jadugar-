import React, { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";
import { useAdsgram } from "./useAdsgram.js";

const BLOCK_ID = import.meta.env.VITE_ADSGRAM_BLOCK_ID;

export default function App() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watching, setWatching] = useState(false);
  const [message, setMessage] = useState("");

  const loadMe = useCallback(async () => {
    const data = await api("/api/me");
    setMe(data);
    return data;
  }, []);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor("#10251b");
      tg.setBackgroundColor("#07120d");
    }

    loadMe()
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, [loadMe]);

  const onReward = useCallback(async () => {
    setMessage("Ad complete. Reward is being confirmed...");
    setWatching(false);

    // AdsGram's server callback can arrive shortly after the client callback.
    // Poll the balance a few times instead of awarding locally.
    for (let i = 0; i < 6; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      try {
        const latest = await loadMe();
        setMe(latest);

        if (latest.user.balance !== me?.user.balance) {
          setMessage(`+${latest.reward.amount} LEAF added!`);
          return;
        }
      } catch {}
    }

    setMessage("Ad finished. If the reward does not appear, check AdsGram callback/configuration.");
  }, [loadMe, me?.user.balance]);

  const onAdError = useCallback((error) => {
    setWatching(false);
    setMessage(error?.description || "Ad could not be shown.");
  }, []);

  const showAd = useAdsgram({
    blockId: BLOCK_ID,
    onReward,
    onError: onAdError
  });

  async function handleWatch() {
    if (watching) return;

    setWatching(true);
    setMessage("");

    try {
      await showAd();
    } catch {
      setWatching(false);
    }
  }

  if (loading) {
    return <main className="app"><div className="card">Loading…</div></main>;
  }

  const user = me?.user;

  return (
    <main className="app">
      <section className="hero">
        <div className="leaf">🌿</div>
        <div>
          <p className="eyebrow">LEAF REWARDS</p>
          <h1>{user?.balance ?? "0"} LEAF</h1>
          <p className="muted">
            {user?.firstName ? `Hi, ${user.firstName}` : "Welcome"}
          </p>
        </div>
      </section>

      <section className="card reward-card">
        <div>
          <span className="tag">REWARDED AD</span>
          <h2>Watch an ad</h2>
          <p>Complete the rewarded ad and receive LEAF.</p>
        </div>

        <button
          className="watch-button"
          onClick={handleWatch}
          disabled={watching || !BLOCK_ID}
        >
          {watching ? "WATCHING…" : `WATCH +${me?.reward.amount ?? 100}`}
        </button>

        {!BLOCK_ID && (
          <p className="warning">Set VITE_ADSGRAM_BLOCK_ID in client/.env first.</p>
        )}

        {message && <p className="status">{message}</p>}
      </section>

      <section className="grid">
        <div className="small-card">
          <span>👥</span>
          <strong>Friends</strong>
          <small>Coming next</small>
        </div>
        <div className="small-card">
          <span>🎁</span>
          <strong>Tasks</strong>
          <small>Coming next</small>
        </div>
      </section>

      <p className="footer">
        Rewards are credited by the server after the AdsGram reward callback.
      </p>
    </main>
  );
}
