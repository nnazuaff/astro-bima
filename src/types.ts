export type WorldId = 'hutan-neon' | 'kristal-es' | 'gurun-vulkanik' | 'markas-zorgax';

export type GameScreen = 
  | 'MAIN_MENU'
  | 'WORLD_MAP'
  | 'PLAYING'
  | 'PAUSED'
  | 'LEVEL_CLEAR'
  | 'GAME_OVER'
  | 'VICTORY';

export type PowerUpType = 'none' | 'serum_giga' | 'jetpack' | 'energy_glove';

export interface TemporaryBuff {
  type: 'shield' | 'speed';
  timeLeft: number; // in seconds
  maxTime: number;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: 'left' | 'right';
  isGrounded: boolean;
  isCrouching: boolean;
  powerUp: PowerUpType;
  tempBuffs: TemporaryBuff[];
  lives: number;
  stardust: number;
  score: number;
  coyoteTimer: number;
  jumpBufferTimer: number;
  jumpHeld: boolean;
  jetpackFuel: number; // For glide/hover
  isGliding: boolean;
  canDoubleJump: boolean;
  invulnerableTimer: number;
  shootCooldown: number;
  state: 'idle' | 'run' | 'jump' | 'fall' | 'hit' | 'crouch';
}

export type EnemyType = 
  | 'botlet'
  | 'spikon'
  | 'layangbot'
  | 'iceslider'
  | 'geyserbug'
  | 'drona_boss'
  | 'zorgax_boss';

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: 'left' | 'right';
  patrolStartX: number;
  patrolRange: number;
  startY: number;
  health: number;
  maxHealth: number;
  isInvulnerable?: number;
  phase?: number;
  timer: number;
  shootTimer?: number;
  isDefeated?: boolean;
  defeatTimer?: number;
}

export type BlockType = 
  | 'solid'
  | 'breakable'
  | 'bouncy_mushroom'
  | 'ice'
  | 'crumbling'
  | 'geyser'
  | 'laser_hazard'
  | 'crystal_altar';

export interface PlatformBlock {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: BlockType;
  theme?: WorldId;
  crumbleTimer?: number;
  isCrumbled?: boolean;
  active?: boolean;
  cycleTimer?: number;
}

export type ItemType = 
  | 'stardust'
  | 'powerup_giga'
  | 'powerup_jetpack'
  | 'powerup_glove'
  | 'buff_shield'
  | 'buff_speed'
  | 'heart';

export interface CollectibleItem {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
  bounceOffset?: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  fromPlayer: boolean;
  color: string;
  damage: number;
  lifespan: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  gravity?: number;
}

export interface Checkpoint {
  x: number;
  y: number;
  activated: boolean;
}

export interface LevelConfig {
  id: string;
  worldId: WorldId;
  name: string;
  subtitle: string;
  timeLimit: number; // in seconds
  playerStart: { x: number; y: number };
  goal: { x: number; y: number };
  checkpoints: { x: number; y: number }[];
  gravityModifier?: number; // e.g. 0.65 for Markas Zorgax low gravity
  blocks: PlatformBlock[];
  items: CollectibleItem[];
  enemies: Enemy[];
  kodiTip?: string;
  isBossLevel?: boolean;
}

export interface WorldConfig {
  id: WorldId;
  name: string;
  planetName: string;
  description: string;
  themeColor: string;
  accentColor: string;
  skyColors: [string, string];
  levels: LevelConfig[];
}

export interface InputKeys {
  left: boolean;
  right: boolean;
  jump: boolean;
  down: boolean;
  action: boolean;
}

export interface CompletedLevelData {
  stars: number;
  highScore: number;
}

export interface UserProgress {
  unlockedWorld: number; // 1 to 4
  unlockedLevelId: string; // e.g. '1-1'
  completedLevels: Record<string, CompletedLevelData>;
  crystalsCollected: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
}

