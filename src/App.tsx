import { useState } from "react";
import type { PlayerState } from "./engine/types";
import { GameEngine } from "./engine/engine";
import { saveGame, loadGame, hasSave, clearSave } from "./game/storage";
import MainMenu from "./components/MainMenu";
import CharacterCreation from "./components/CharacterCreation";
import GameScreen from "./components/GameScreen";
import EndScreen from "./components/EndScreen";

type Screen = "menu" | "create" | "game";

export default function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  const startNew = () => setScreen("create");

  const onCreated = (p: PlayerState) => {
    const eng = new GameEngine(p);
    setEngine(eng);
    saveGame(eng);
    setScreen("game");
  };

  const onContinue = () => {
    const eng = loadGame();
    if (eng) { setEngine(eng); setScreen("game"); }
  };

  const onChange = () => {
    if (engine) saveGame(engine);
    refresh();
  };

  const toMenu = () => { setScreen("menu"); refresh(); };

  if (screen === "menu") {
    return (
      <div className="app">
        <MainMenu hasSave={hasSave()} onNew={startNew} onContinue={onContinue} />
      </div>
    );
  }

  if (screen === "create") {
    return (
      <div className="app">
        <CharacterCreation onDone={onCreated} onBack={toMenu} />
      </div>
    );
  }

  // game
  if (!engine) { setScreen("menu"); return null; }

  if (engine.phase === "ending") {
    return (
      <div className="app">
        <EndScreen engine={engine} onMenu={() => { clearSave(); setEngine(null); toMenu(); }} />
      </div>
    );
  }

  return (
    <GameScreen
      engine={engine}
      onChange={onChange}
      onSave={() => { saveGame(engine); refresh(); }}
      onMenu={toMenu}
    />
  );
}
