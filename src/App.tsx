/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameScreen, UserProgress, InputKeys, WorldId } from './types';
import { WORLDS, getLevelConfig, getWorldForLevel } from './game/levels';
import { initLevelState, updatePhysics, snapCameraToPlayer, GameState } from './game/physics';
import { renderGame } from './game/renderer';
import { soundManager } from './game/audio';
import { HUD } from './components/HUD';
import { TouchControls } from './components/TouchControls';
import { DialogKodi } from './components/DialogKodi';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { LevelClearModal } from './components/LevelClearModal';
import { VictoryModal } from './components/VictoryModal';
import { WorldMap } from './components/WorldMap';
import { MainMenu } from './components/MainMenu';

const STORAGE_KEY = 'astro_bima_saved_progress';

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('MAIN_MENU');
  const [currentLevelId, setCurrentLevelId] = useState<string>('1-1');
  const [kodiDismissed, setKodiDismissed] = useState<boolean>(false);

  // Persistence progress
  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return {
      unlockedWorld: 1,
      unlockedLevelId: '1-1',
      completedLevels: {},
      crystalsCollected: 0,
      soundEnabled: true,
      musicEnabled: true
    };
  });

  const saveProgress = (newProg: UserProgress) => {
    setProgress(newProg);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProg));
    } catch {
      // Ignore storage error
    }
  };

  // Canvas & Game Loop Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const inputRef = useRef<InputKeys>({
    left: false,
    right: false,
    jump: false,
    down: false,
    action: false
  });
  const [inputState, setInputState] = useState<InputKeys>({ ...inputRef.current });
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Current level details
  const levelConfig = getLevelConfig(currentLevelId) || WORLDS[0].levels[0];
  const worldConfig = getWorldForLevel(currentLevelId) || WORLDS[0];

  // Helper to start or load a level
  const loadLevel = useCallback((lvlId: string, keepLivesAndScore: boolean = false) => {
    const cfg = getLevelConfig(lvlId);
    if (!cfg) return;

    soundManager.resume();
    setCurrentLevelId(lvlId);
    setKodiDismissed(false);

    let lives = 3;
    let stardust = 0;
    let score = 0;

    if (keepLivesAndScore && gameStateRef.current) {
      lives = Math.max(1, gameStateRef.current.player.lives);
      stardust = gameStateRef.current.player.stardust;
      score = gameStateRef.current.player.score;
    }

    const initialW = window.innerWidth || 800;
    const initialH = window.innerHeight || 600;
    gameStateRef.current = initLevelState(cfg, lives, stardust, score, initialW, initialH);
    setScreen('PLAYING');

    // Play appropriate music
    if (cfg.isBossLevel) {
      soundManager.playMusic('boss');
    } else {
      soundManager.playMusic(cfg.worldId);
    }
  }, []);

  // Keyboard input listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      soundManager.resume();

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        inputRef.current.left = true;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        inputRef.current.right = true;
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        inputRef.current.down = true;
      } else if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        inputRef.current.jump = true;
      } else if (e.code === 'KeyX' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        inputRef.current.action = true;
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        if (screen === 'PLAYING') {
          setScreen('PAUSED');
        } else if (screen === 'PAUSED') {
          setScreen('PLAYING');
        }
      }
      setInputState({ ...inputRef.current });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        inputRef.current.left = false;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        inputRef.current.right = false;
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        inputRef.current.down = false;
      } else if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        inputRef.current.jump = false;
      } else if (e.code === 'KeyX' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        inputRef.current.action = false;
      }
      setInputState({ ...inputRef.current });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [screen]);

  // Touch input updater
  const handleSetInputKey = (key: keyof InputKeys, active: boolean) => {
    soundManager.resume();
    inputRef.current[key] = active;
    setInputState({ ...inputRef.current });
  };

  // Sound toggles
  const toggleSound = () => {
    const next = !progress.soundEnabled;
    soundManager.setSoundEnabled(next);
    saveProgress({ ...progress, soundEnabled: next });
  };

  const toggleMusic = () => {
    const next = !progress.musicEnabled;
    soundManager.setMusicEnabled(next);
    saveProgress({ ...progress, musicEnabled: next });
  };

  // Main Game Loop
  useEffect(() => {
    if (screen !== 'PLAYING') {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    lastTimeRef.current = performance.now();

    const loop = (currentTime: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Keep internal canvas resolution strictly synced with viewport
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const dt = Math.min(0.1, (currentTime - lastTimeRef.current) / 1000);
      lastTimeRef.current = currentTime;

      const state = gameStateRef.current;
      if (state && !state.isGameOver && !state.isLevelCleared) {
        const gravityModifier = levelConfig.gravityModifier || 1.0;
        const { levelCleared, playerDied } = updatePhysics(
          state,
          inputRef.current,
          gravityModifier,
          dt,
          canvas.width,
          canvas.height
        );

        if (levelCleared) {
          // Check if this was the final boss of World 4
          if (currentLevelId === '4-5') {
            const newCrystals = Math.min(4, progress.crystalsCollected + 1);
            saveProgress({
              ...progress,
              crystalsCollected: newCrystals,
              completedLevels: {
                ...progress.completedLevels,
                [currentLevelId]: { stars: 3, highScore: state.player.score }
              }
            });
            setScreen('VICTORY');
            return;
          }

          // Level Cleared
          const stars = state.player.score > 3500 ? 3 : state.player.score > 1800 ? 2 : 1;
          const isBoss = levelConfig.isBossLevel;
          const newCrystals = isBoss ? Math.min(4, progress.crystalsCollected + 1) : progress.crystalsCollected;

          saveProgress({
            ...progress,
            crystalsCollected: newCrystals,
            completedLevels: {
              ...progress.completedLevels,
              [currentLevelId]: {
                stars: Math.max(stars, progress.completedLevels[currentLevelId]?.stars || 0),
                highScore: Math.max(state.player.score, progress.completedLevels[currentLevelId]?.highScore || 0)
              }
            }
          });
          setScreen('LEVEL_CLEAR');
          return;
        }

        if (playerDied) {
          // Respawn at active checkpoint or start
          if (state.activeCheckpoint) {
            state.player.x = state.activeCheckpoint.x;
            state.player.y = state.activeCheckpoint.y - 20;
          } else {
            state.player.x = levelConfig.playerStart.x;
            state.player.y = levelConfig.playerStart.y;
          }
          state.player.vx = 0;
          state.player.vy = 0;
          state.player.invulnerableTimer = 2.0;
          state.player.powerUp = 'none';

          // Snap camera directly to respawn position
          snapCameraToPlayer(state, canvas.width, canvas.height);
        }

        if (state.isGameOver) {
          setScreen('GAME_OVER');
          return;
        }
      }

      // Render
      if (state) {
        renderGame(ctx, state, levelConfig.worldId, canvas.width, canvas.height, currentTime / 1000);
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [screen, currentLevelId, levelConfig, progress]);

  // Adjust canvas resolution dynamically
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (gameStateRef.current) {
        gameStateRef.current.viewportWidth = canvas.width;
        gameStateRef.current.viewportHeight = canvas.height;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [screen]);

  // Screen Music transitions
  useEffect(() => {
    if (screen === 'MAIN_MENU' || screen === 'WORLD_MAP') {
      soundManager.playMusic('world-map');
    }
  }, [screen]);

  // Calculate next level ID
  const getNextLevelId = () => {
    let foundCurrent = false;
    for (const w of WORLDS) {
      for (const l of w.levels) {
        if (foundCurrent) return l.id;
        if (l.id === currentLevelId) foundCurrent = true;
      }
    }
    return null;
  };

  const nextLevelId = getNextLevelId();

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-['Fredoka',sans-serif] select-none">
      {/* 1. Main Menu Screen */}
      {screen === 'MAIN_MENU' && (
        <MainMenu
          progress={progress}
          onStartGame={() => loadLevel(progress.unlockedLevelId || '1-1')}
          onOpenMap={() => setScreen('WORLD_MAP')}
          soundEnabled={progress.soundEnabled}
          musicEnabled={progress.musicEnabled}
          onToggleSound={toggleSound}
          onToggleMusic={toggleMusic}
        />
      )}

      {/* 2. World Map Screen */}
      {screen === 'WORLD_MAP' && (
        <WorldMap
          progress={progress}
          onSelectLevel={(lvlId) => loadLevel(lvlId)}
          onBackToMenu={() => setScreen('MAIN_MENU')}
          soundEnabled={progress.soundEnabled}
          musicEnabled={progress.musicEnabled}
          onToggleSound={toggleSound}
          onToggleMusic={toggleMusic}
        />
      )}

      {/* 3. Game Canvas (Playing / Paused / In-Game Modals) */}
      {(screen === 'PLAYING' || screen === 'PAUSED' || screen === 'LEVEL_CLEAR' || screen === 'GAME_OVER') && (
        <div className="relative w-full h-full">
          {/* Main 2D Render Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full block bg-slate-950"
          />

          {/* HUD Overlay */}
          {gameStateRef.current && (
            <HUD
              player={gameStateRef.current.player}
              timeLeft={gameStateRef.current.timeLeft}
              levelName={levelConfig.name}
              worldName={worldConfig.name}
              themeColor={worldConfig.themeColor}
              soundEnabled={progress.soundEnabled}
              musicEnabled={progress.musicEnabled}
              onToggleSound={toggleSound}
              onToggleMusic={toggleMusic}
              onPause={() => setScreen('PAUSED')}
            />
          )}

          {/* KODI Floating Guide Dialogue */}
          {!kodiDismissed && levelConfig.kodiTip && screen === 'PLAYING' && (
            <DialogKodi
              tip={levelConfig.kodiTip}
              onDismiss={() => setKodiDismissed(true)}
            />
          )}

          {/* Touch Virtual Gamepad for Mobile & Tablets */}
          {gameStateRef.current && screen === 'PLAYING' && (
            <TouchControls
              player={gameStateRef.current.player}
              input={inputState}
              onSetInputKey={handleSetInputKey}
            />
          )}

          {/* Pause Modal */}
          {screen === 'PAUSED' && (
            <PauseModal
              onResume={() => setScreen('PLAYING')}
              onRestart={() => loadLevel(currentLevelId)}
              onWorldMap={() => setScreen('WORLD_MAP')}
              soundEnabled={progress.soundEnabled}
              musicEnabled={progress.musicEnabled}
              onToggleSound={toggleSound}
              onToggleMusic={toggleMusic}
            />
          )}

          {/* Game Over Modal */}
          {screen === 'GAME_OVER' && gameStateRef.current && (
            <GameOverModal
              score={gameStateRef.current.player.score}
              onRetry={() => loadLevel(currentLevelId)}
              onWorldMap={() => setScreen('WORLD_MAP')}
            />
          )}

          {/* Level Clear Modal */}
          {screen === 'LEVEL_CLEAR' && gameStateRef.current && (
            <LevelClearModal
              levelName={levelConfig.name}
              worldName={worldConfig.name}
              score={gameStateRef.current.player.score}
              stardust={gameStateRef.current.player.stardust}
              timeLeft={gameStateRef.current.timeLeft}
              hasNextLevel={!!nextLevelId}
              onNextLevel={() => nextLevelId && loadLevel(nextLevelId, true)}
              onReplay={() => loadLevel(currentLevelId)}
              onWorldMap={() => setScreen('WORLD_MAP')}
            />
          )}
        </div>
      )}

      {/* 4. Victory Modal */}
      {screen === 'VICTORY' && gameStateRef.current && (
        <VictoryModal
          totalScore={gameStateRef.current.player.score}
          onPlayAgain={() => loadLevel('1-1')}
          onWorldMap={() => setScreen('WORLD_MAP')}
        />
      )}
    </div>
  );
}

