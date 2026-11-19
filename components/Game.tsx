"use client";

import { useEffect, useState } from "react";
import { getWinner, type Cell } from "@/lib/winner";

type Score = { X: number; O: number; draws: number };
const STORAGE_KEY = "ttt-score";
const COLORS = ["#ff7a59", "#3ddc97", "#ffd166", "#6ec1ff", "#c792ff"];
// Deterministic spread so render stays pure.
const CONFETTI = Array.from({ length: 36 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: ((i * 53) % 40) / 100,
  duration: 1.6 + ((i * 29) % 15) / 10,
  drift: ((i * 61) % 120) - 60,
  color: COLORS[i % COLORS.length],
}));

const EMPTY: Cell[] = Array(9).fill(null);

const ICON = { X: "🦊", O: "🐼" } as const;
const NAME = { X: "Fox", O: "Panda" } as const;

export default function Game() {
  const [board, setBoard] = useState<Cell[]>(EMPTY);
  const [xTurn, setXTurn] = useState(true);
  const [score, setScore] = useState<Score>({ X: 0, O: 0, draws: 0 });
  const [loaded, setLoaded] = useState(false);

  /* Hydrate from localStorage after mount (avoids SSR mismatch). */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setScore(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(score));
    } catch {}
  }, [score, loaded]);

  const win = getWinner(board);
  const draw = !win && board.every(Boolean);
  const turn = xTurn ? "X" : "O";

  function play(i: number) {
    if (board[i] || win || draw) return;
    const next = board.slice();
    next[i] = turn;
    setBoard(next);
    setXTurn(!xTurn);
    const w = getWinner(next);
    if (w) setScore((s) => ({ ...s, [w.mark]: s[w.mark] + 1 }));
    else if (next.every(Boolean)) setScore((s) => ({ ...s, draws: s.draws + 1 }));
  }

  function newGame() {
    setBoard(EMPTY);
    setXTurn(true);
  }

  function restart() {
    newGame();
    setScore({ X: 0, O: 0, draws: 0 });
  }

  const status = win
    ? `${ICON[win.mark]} ${NAME[win.mark]} wins!`
    : draw
      ? "It's a draw!"
      : `${ICON[turn]} ${NAME[turn]}'s turn`;

  return (
    <section className="game" aria-label="Tic-Tac-Toe">
      <h1 className="game__title">Tic-Tac-Toe</h1>

      <ul className="score" aria-label="Scoreboard">
        <li className="score__item">
          <span className="score__label">{ICON.X} {NAME.X}</span>
          <span className="score__value">{score.X}</span>
        </li>
        <li className="score__item">
          <span className="score__label">Draws</span>
          <span className="score__value">{score.draws}</span>
        </li>
        <li className="score__item">
          <span className="score__label">{ICON.O} {NAME.O}</span>
          <span className="score__value">{score.O}</span>
        </li>
      </ul>

      <p className={`game__status${win ? " game__status--win" : ""}`} role="status" aria-live="polite">{status}</p>

      {win && (
        <div className="confetti" aria-hidden="true">
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              className="confetti__piece"
              style={{
                left: `${c.left}%`,
                background: c.color,
                animationDelay: `${c.delay}s`,
                animationDuration: `${c.duration}s`,
                "--drift": `${c.drift}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      <div className="board" role="group" aria-label="Game board">
        {board.map((cell, i) => {
          const winning = win?.line.includes(i);
          const label = `Row ${Math.floor(i / 3) + 1}, column ${(i % 3) + 1}, ${cell ? NAME[cell] : "empty"}`;
          return (
            <button
              key={i}
              type="button"
              className={`board__cell${winning ? " board__cell--win" : ""}${cell ? " board__cell--filled" : ""}`}
              aria-label={label}
              onClick={() => play(i)}
            >
              {cell && <span className="board__mark" aria-hidden="true">{ICON[cell]}</span>}
            </button>
          );
        })}
      </div>

      <div className="game__actions">
        <button type="button" className="game__reset" onClick={newGame}>New Game</button>
        <button type="button" className="game__reset game__reset--secondary" onClick={restart}>Restart</button>
      </div>
    </section>
  );
}
