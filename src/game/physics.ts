import { PlayerState, PlatformBlock, Enemy, CollectibleItem, Projectile, Particle, Checkpoint, LevelConfig, PowerUpType } from '../types';
import { soundManager } from './audio';

export interface GameState {
  player: PlayerState;
  blocks: PlatformBlock[];
  items: CollectibleItem[];
  enemies: Enemy[];
  projectiles: Projectile[];
  particles: Particle[];
  checkpoints: Checkpoint[];
  activeCheckpoint: Checkpoint | null;
  cameraX: number;
  cameraY: number;
  viewportWidth?: number;
  viewportHeight?: number;
  levelWidth: number;
  levelHeight: number;
  timeLeft: number;
  isLevelCleared: boolean;
  isGameOver: boolean;
  screenShake: number;
  goal: { x: number; y: number };
  isBossLevel?: boolean;
  bossDefeatTimer?: number;
  bossDefeatedName?: string;
}

export function getCameraTarget(
  player: PlayerState,
  levelWidth: number,
  levelHeight: number,
  viewportWidth: number = 800,
  viewportHeight: number = 600
): { x: number; y: number } {
  // Center character on screen horizontally, with a slight forward lookahead based on facing
  const lookaheadX = player.facing === 'right' ? 50 : -50;
  const playerCenterX = player.x + player.width / 2;
  const desiredCamX = playerCenterX - viewportWidth / 2 + lookaheadX;

  // Clamp horizontal camera so it doesn't reveal outside level bounds
  const maxCamX = Math.max(0, levelWidth - viewportWidth);
  const camX = Math.max(0, Math.min(maxCamX, desiredCamX));

  // Vertical framing: keep player around 55% from the top
  const playerCenterY = player.y + player.height / 2;
  let camY = 0;
  if (viewportHeight >= levelHeight) {
    // If window is taller than the level, center the entire level vertically
    camY = -(viewportHeight - levelHeight) / 2;
  } else {
    // Follow vertically, clamped within level boundaries
    const desiredCamY = playerCenterY - viewportHeight * 0.55;
    const maxCamY = Math.max(0, levelHeight - viewportHeight);
    camY = Math.max(0, Math.min(maxCamY, desiredCamY));
  }

  return { x: camX, y: camY };
}

export function snapCameraToPlayer(
  state: GameState,
  viewportWidth: number = 800,
  viewportHeight: number = 600
) {
  const target = getCameraTarget(state.player, state.levelWidth, state.levelHeight, viewportWidth, viewportHeight);
  state.cameraX = target.x;
  state.cameraY = target.y;
}

export function initLevelState(
  config: LevelConfig,
  currentLives: number,
  currentStardust: number,
  currentScore: number,
  viewportWidth: number = 800,
  viewportHeight: number = 600
): GameState {
  const isBoss = !!config.isBossLevel;
  const rightWall = config.blocks.find(b => b.id.includes('wall_r'));
  const levelWidth = isBoss && rightWall ? rightWall.x + rightWall.width : Math.max(2800, config.goal.x + 300);
  const levelHeight = 600;

  const player: PlayerState = {
    x: config.playerStart.x,
    y: config.playerStart.y,
    vx: 0,
    vy: 0,
    width: 32,
    height: 44,
    facing: 'right',
    isGrounded: false,
    isCrouching: false,
    powerUp: 'none',
    tempBuffs: [],
    lives: currentLives,
    stardust: currentStardust,
    score: currentScore,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    jumpHeld: false,
    jetpackFuel: 100,
    isGliding: false,
    canDoubleJump: true,
    invulnerableTimer: 0,
    shootCooldown: 0,
    state: 'idle',
    walkCycle: 0,
    squashStretch: 1.0,
    tiltAngle: 0,
    blinkTimer: 2.5,
    eyeBlinking: false
  };

  const blocks: PlatformBlock[] = config.blocks.map(b => ({
    ...b,
    crumbleTimer: 0,
    isCrumbled: false,
    cycleTimer: Math.random() * 2
  }));

  const items: CollectibleItem[] = config.items.map(i => ({
    ...i,
    collected: false,
    bounceOffset: Math.random() * Math.PI * 2
  }));

  const enemies: Enemy[] = config.enemies.map(e => ({
    ...e,
    timer: 0,
    shootTimer: 0,
    isDefeated: false,
    defeatTimer: 0,
    hitFlashTimer: 0,
    animCycle: Math.random() * 10
  }));

  const checkpoints: Checkpoint[] = config.checkpoints.map(cp => ({
    x: cp.x,
    y: cp.y,
    activated: false
  }));

  // Immediately focus the camera on the character from frame 0
  const initialCam = getCameraTarget(player, levelWidth, levelHeight, viewportWidth, viewportHeight);

  return {
    player,
    blocks,
    items,
    enemies,
    projectiles: [],
    particles: [],
    checkpoints,
    activeCheckpoint: null,
    cameraX: initialCam.x,
    cameraY: initialCam.y,
    viewportWidth,
    viewportHeight,
    levelWidth,
    levelHeight,
    timeLeft: config.timeLimit,
    isLevelCleared: false,
    isGameOver: false,
    screenShake: 0,
    goal: { ...config.goal },
    isBossLevel: isBoss
  };
}

export interface InputKeys {
  left: boolean;
  right: boolean;
  jump: boolean;
  down: boolean;
  action: boolean; // Shoot or special
}

export function updatePhysics(
  state: GameState,
  input: InputKeys,
  gravityModifier: number = 1.0,
  dt: number = 1 / 60,
  viewportWidth?: number,
  viewportHeight?: number
): { levelCleared: boolean; playerDied: boolean } {
  const p = state.player;
  let levelCleared = false;
  let playerDied = false;

  if (viewportWidth) state.viewportWidth = viewportWidth;
  if (viewportHeight) state.viewportHeight = viewportHeight;

  if (state.screenShake > 0) {
    state.screenShake = Math.max(0, state.screenShake - dt * 15);
  }

  // Update timers
  state.timeLeft = Math.max(0, state.timeLeft - dt);
  if (state.timeLeft <= 0 && !state.isGameOver) {
    p.lives--;
    if (p.lives <= 0) {
      state.isGameOver = true;
      soundManager.playGameOver();
    } else {
      playerDied = true;
    }
  }

  if (p.invulnerableTimer > 0) {
    p.invulnerableTimer = Math.max(0, p.invulnerableTimer - dt);
  }
  if (p.shootCooldown > 0) {
    p.shootCooldown = Math.max(0, p.shootCooldown - dt);
  }

  // Temporary buffs update
  for (let i = p.tempBuffs.length - 1; i >= 0; i--) {
    p.tempBuffs[i].timeLeft -= dt;
    if (p.tempBuffs[i].timeLeft <= 0) {
      p.tempBuffs.splice(i, 1);
    }
  }

  const hasSpeedBuff = p.tempBuffs.some(b => b.type === 'speed');
  const hasShieldBuff = p.tempBuffs.some(b => b.type === 'shield');

  // Adjust size based on powerUp (Serum Giga makes player larger)
  if (p.powerUp === 'serum_giga') {
    p.width = 42;
    p.height = 54;
  } else {
    p.width = 32;
    p.height = 44;
  }

  // Horizontal Movement Physics
  const baseSpeed = hasSpeedBuff ? 6.5 : 4.5;
  const accel = p.isGrounded ? 0.8 : 0.45;
  const friction = p.isGrounded ? 0.78 : 0.92;

  if (input.left) {
    p.vx -= accel;
    if (p.vx < -baseSpeed) p.vx = -baseSpeed;
    p.facing = 'left';
  } else if (input.right) {
    p.vx += accel;
    if (p.vx > baseSpeed) p.vx = baseSpeed;
    p.facing = 'right';
  } else {
    p.vx *= friction;
    if (Math.abs(p.vx) < 0.1) p.vx = 0;
  }

  // Jump Buffering & Coyote Time
  if (p.isGrounded) {
    p.coyoteTimer = 0.12;
    p.canDoubleJump = p.powerUp === 'jetpack';
    p.jetpackFuel = 100;
  } else {
    p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);
  }

  if (input.jump && !p.jumpHeld) {
    p.jumpBufferTimer = 0.15;
  } else {
    p.jumpBufferTimer = Math.max(0, p.jumpBufferTimer - dt);
  }

  // Execute Jump
  const baseJumpForce = -11.5 * Math.sqrt(gravityModifier);
  if (p.jumpBufferTimer > 0 && p.coyoteTimer > 0) {
    p.vy = baseJumpForce;
    p.isGrounded = false;
    p.coyoteTimer = 0;
    p.jumpBufferTimer = 0;
    p.squashStretch = 1.26;
    soundManager.playJump();
    spawnDustParticles(state, p.x + p.width / 2, p.y + p.height);
  } else if (input.jump && !p.jumpHeld && !p.isGrounded && p.canDoubleJump && p.powerUp === 'jetpack') {
    // Jetpack Double Jump
    p.vy = baseJumpForce * 0.95;
    p.canDoubleJump = false;
    p.squashStretch = 1.22;
    soundManager.playDoubleJump();
    spawnJetpackParticles(state, p.x + p.width / 2, p.y + p.height);
  }

  // Jetpack Glide / Hovering
  if (input.jump && !p.isGrounded && p.powerUp === 'jetpack' && p.vy > 0 && p.jetpackFuel > 0) {
    p.vy = Math.min(p.vy, 1.8);
    p.jetpackFuel = Math.max(0, p.jetpackFuel - dt * 60);
    p.isGliding = true;
    if (Math.random() < 0.3) {
      spawnJetpackParticles(state, p.x + p.width / 2, p.y + p.height);
    }
  } else {
    p.isGliding = false;
  }

  // Variable Jump Height (cut upward velocity on key release)
  if (!input.jump && p.vy < -3) {
    p.vy *= 0.55;
  }
  p.jumpHeld = input.jump;

  // Gravity
  const standardGravity = 0.52 * gravityModifier;
  p.vy += standardGravity;
  const maxFallSpeed = 12 * gravityModifier;
  if (p.vy > maxFallSpeed) p.vy = maxFallSpeed;

  // Crouch check
  p.isCrouching = input.down && p.isGrounded;

  // Shoot Action (Energy Glove)
  if (input.action && p.shootCooldown <= 0 && p.powerUp === 'energy_glove') {
    p.shootCooldown = 0.35;
    const shotVx = p.facing === 'right' ? 9 : -9;
    state.projectiles.push({
      id: `proj_${Date.now()}_${Math.random()}`,
      x: p.facing === 'right' ? p.x + p.width + 2 : p.x - 10,
      y: p.y + p.height * 0.45,
      vx: shotVx,
      vy: 0,
      radius: 6,
      fromPlayer: true,
      color: '#38bdf8',
      damage: 1,
      lifespan: 1.8
    });
    soundManager.playShoot();
  }

  // --- Horizontal Collision Resolution ---
  p.x += p.vx;
  for (const block of state.blocks) {
    if (block.isCrumbled) continue;
    if (checkAABB(p, block)) {
      if (p.vx > 0) {
        p.x = block.x - p.width;
        p.vx = 0;
      } else if (p.vx < 0) {
        p.x = block.x + block.width;
        p.vx = 0;
      }
    }
  }

  // Clamp level left boundary
  if (p.x < 0) {
    p.x = 0;
    p.vx = 0;
  }

  // --- Vertical Collision Resolution ---
  p.y += p.vy;
  p.isGrounded = false;

  for (const block of state.blocks) {
    if (block.isCrumbled) continue;

    // Laser hazard check
    if (block.type === 'laser_hazard') {
      block.cycleTimer = (block.cycleTimer || 0) + dt;
      const isLaserActive = Math.floor(block.cycleTimer) % 2 === 0;
      if (isLaserActive && checkAABB(p, block)) {
        handlePlayerHit(state);
      }
      continue;
    }

    if (checkAABB(p, block)) {
      if (p.vy > 0) {
        // Landing on top of block
        if (!p.isGrounded && p.vy > 2.5) {
          p.squashStretch = 0.74; // Impact squash upon landing
          spawnDustParticles(state, p.x + p.width / 2, block.y);
        }
        p.y = block.y - p.height;
        p.vy = 0;
        p.isGrounded = true;

        // Bouncy Mushroom
        if (block.type === 'bouncy_mushroom') {
          p.vy = -16.5;
          p.isGrounded = false;
          p.squashStretch = 1.35;
          soundManager.playBounce();
          spawnSparkleParticles(state, block.x + block.width / 2, block.y, '#10b981');
        }

        // Crumbling Platform
        if (block.type === 'crumbling') {
          block.crumbleTimer = (block.crumbleTimer || 0) + dt;
          if (block.crumbleTimer > 0.6) {
            block.isCrumbled = true;
            spawnDebrisParticles(state, block.x + block.width / 2, block.y + block.height / 2, '#38bdf8');
          }
        }

        // Geyser steam thrust
        if (block.type === 'geyser' && block.active) {
          p.vy = -14.5;
          p.isGrounded = false;
          soundManager.playBounce();
          spawnSteamParticles(state, block.x + block.width / 2, block.y);
        }
      } else if (p.vy < 0) {
        // Hitting block from below
        p.y = block.y + block.height;
        p.vy = 0;

        // Breakable block
        if (block.type === 'breakable') {
          if (p.powerUp === 'serum_giga') {
            block.isCrumbled = true;
            soundManager.playBreakBlock();
            state.screenShake = 6;
            spawnDebrisParticles(state, block.x + block.width / 2, block.y + block.height / 2, '#fbbf24');
            // Drop stardust
            state.items.push({
              id: `item_drop_${Date.now()}`,
              type: 'stardust',
              x: block.x + 8,
              y: block.y - 20,
              width: 24,
              height: 24,
              collected: false
            });
          } else {
            soundManager.playStomp();
          }
        }
      }
    }
  }

  // Check pit fall
  if (p.y > state.levelHeight + 80) {
    p.lives--;
    soundManager.playHit();
    if (p.lives <= 0) {
      state.isGameOver = true;
      soundManager.playGameOver();
    } else {
      playerDied = true;
    }
  }

  // Collect Items
  for (const item of state.items) {
    if (item.collected) continue;
    if (checkAABB(p, item)) {
      item.collected = true;
      handleItemCollect(state, item);
    }
  }

  // Checkpoint Beacons
  for (const cp of state.checkpoints) {
    if (!cp.activated && Math.abs(p.x - cp.x) < 40 && Math.abs(p.y - cp.y) < 70) {
      cp.activated = true;
      state.activeCheckpoint = cp;
      soundManager.playCheckpoint();
      spawnSparkleParticles(state, cp.x, cp.y, '#38bdf8');
    }
  }

  // Player State & Animation Physics
  if (p.invulnerableTimer > 1.2) {
    p.state = 'hit';
  } else if (p.isCrouching) {
    p.state = 'crouch';
  } else if (!p.isGrounded) {
    p.state = p.vy < 0 ? 'jump' : 'fall';
  } else if (Math.abs(p.vx) > 0.4) {
    p.state = 'run';
  } else {
    p.state = 'idle';
  }

  // Smooth Walk Cycle and Tilting
  if (p.isGrounded) {
    if (Math.abs(p.vx) > 0.3) {
      p.walkCycle = (p.walkCycle || 0) + Math.abs(p.vx) * dt * 9;
    } else {
      p.walkCycle = 0;
    }
    const targetTilt = p.vx * 0.028;
    p.tiltAngle = (p.tiltAngle || 0) + (targetTilt - (p.tiltAngle || 0)) * 0.25;
  } else {
    const targetTilt = p.vx * 0.018;
    p.tiltAngle = (p.tiltAngle || 0) + (targetTilt - (p.tiltAngle || 0)) * 0.15;
  }

  // Elastic return to natural scale (squash & stretch recovery)
  const targetSquash = p.isCrouching ? 0.65 : 1.0;
  p.squashStretch = (p.squashStretch || 1.0) + (targetSquash - (p.squashStretch || 1.0)) * 0.15;

  // Eye Blinking Animation Timer
  p.blinkTimer = (p.blinkTimer || 2.5) - dt;
  if (p.blinkTimer <= 0) {
    p.eyeBlinking = true;
    if (p.blinkTimer < -0.15) {
      p.eyeBlinking = false;
      p.blinkTimer = 2.5 + Math.random() * 2.5;
    }
  } else {
    p.eyeBlinking = false;
  }

  // Projectiles update
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const proj = state.projectiles[i];
    proj.x += proj.vx;
    proj.y += proj.vy;
    if (proj.gravity) {
      proj.vy += proj.gravity;
    }
    proj.lifespan -= dt;

    if (proj.lifespan <= 0 || proj.x < 0 || proj.x > state.levelWidth || proj.y > 600) {
      state.projectiles.splice(i, 1);
      continue;
    }

    // Check hit against enemies
    if (proj.fromPlayer) {
      for (const enemy of state.enemies) {
        if (enemy.isDefeated) continue;
        if (
          proj.x > enemy.x &&
          proj.x < enemy.x + enemy.width &&
          proj.y > enemy.y &&
          proj.y < enemy.y + enemy.height
        ) {
          enemy.health -= proj.damage;
          enemy.hitFlashTimer = 0.25;
          spawnSparkleParticles(state, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#38bdf8');
          soundManager.playStomp();
          state.projectiles.splice(i, 1);

          if (enemy.health <= 0) {
            enemy.isDefeated = true;
            if (enemy.type.includes('boss')) {
              enemy.defeatTimer = 2.2;
              state.bossDefeatTimer = 2.2;
              state.bossDefeatedName = enemy.type;
              p.score += 3000;
              soundManager.playLevelClear();
              spawnBossExplosion(state, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
              for (let s = 0; s < 6; s++) {
                state.items.push({
                  id: `stardust_boss_${Date.now()}_${s}`,
                  type: 'stardust',
                  x: enemy.x + (Math.random() - 0.5) * 120,
                  y: enemy.y + (Math.random() - 0.5) * 80,
                  width: 24,
                  height: 24,
                  collected: false
                });
              }
            } else {
              p.score += 250;
            }
          }
          break;
        }
      }
    } else {
      // Enemy projectile hit player
      if (
        proj.x > p.x &&
        proj.x < p.x + p.width &&
        proj.y > p.y &&
        proj.y < p.y + p.height
      ) {
        state.projectiles.splice(i, 1);
        handlePlayerHit(state);
      }
    }
  }

  // Enemies Update & Collision
  for (const enemy of state.enemies) {
    if (enemy.isDefeated) continue;
    enemy.timer += dt;
    enemy.animCycle = (enemy.animCycle || 0) + dt * 6;
    if (enemy.hitFlashTimer && enemy.hitFlashTimer > 0) {
      enemy.hitFlashTimer -= dt;
    }

    // Movement AI based on enemy type
    if (enemy.type === 'botlet') {
      enemy.x += enemy.vx;
      if (enemy.x > enemy.patrolStartX + enemy.patrolRange) {
        enemy.vx = -Math.abs(enemy.vx);
        enemy.facing = 'left';
      } else if (enemy.x < enemy.patrolStartX) {
        enemy.vx = Math.abs(enemy.vx);
        enemy.facing = 'right';
      }
    } else if (enemy.type === 'layangbot') {
      // Sine wave hover
      enemy.y = enemy.startY + Math.sin(enemy.timer * 2.5) * 55;
    } else if (enemy.type === 'iceslider') {
      enemy.x += enemy.vx;
      if (enemy.x > enemy.patrolStartX + enemy.patrolRange) {
        enemy.vx = -Math.abs(enemy.vx);
        enemy.facing = 'left';
      } else if (enemy.x < enemy.patrolStartX) {
        enemy.vx = Math.abs(enemy.vx);
        enemy.facing = 'right';
      }
    } else if (enemy.type === 'geyserbug') {
      // Emerges and shoots lava ball every 2.4s
      enemy.shootTimer = (enemy.shootTimer || 0) + dt;
      if (enemy.shootTimer > 2.4) {
        enemy.shootTimer = 0;
        const dir = p.x < enemy.x ? -1 : 1;
        state.projectiles.push({
          id: `bug_shot_${Date.now()}`,
          x: enemy.x + enemy.width / 2,
          y: enemy.y + 10,
          vx: dir * 4.5,
          vy: -3.5,
          radius: 7,
          fromPlayer: false,
          color: '#f97316',
          damage: 1,
          lifespan: 3
        });
      }
    } else if (enemy.type === 'drona_boss') {
      // Sektor 1 Boss: Drona-Botanika (Swoop & Recharge Pattern)
      enemy.bossAction = enemy.bossAction || 'hover';
      enemy.actionTimer = (enemy.actionTimer || 0) + dt;
      enemy.shootTimer = (enemy.shootTimer || 0) + dt;

      if (enemy.bossAction === 'hover') {
        enemy.x = enemy.patrolStartX + Math.cos(enemy.timer * 1.4) * 190;
        enemy.y = enemy.startY + Math.sin(enemy.timer * 2.6) * 35;

        // Shoot spore pellets
        if (enemy.shootTimer > 2.4) {
          enemy.shootTimer = 0;
          const angle = Math.atan2((p.y + p.height / 2) - enemy.y, (p.x + p.width / 2) - enemy.x);
          state.projectiles.push({
            id: `drona_spore_${Date.now()}`,
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height / 2,
            vx: Math.cos(angle) * 4.2,
            vy: Math.sin(angle) * 4.2,
            radius: 8,
            fromPlayer: false,
            color: '#10b981',
            damage: 1,
            lifespan: 3.5
          });
        }

        if (enemy.actionTimer > 4.5) {
          enemy.bossAction = 'swoop';
          enemy.actionTimer = 0;
        }
      } else if (enemy.bossAction === 'swoop') {
        // Swoop down to low elevation near the ground
        enemy.y += (350 - enemy.y) * 3.5 * dt;
        if (enemy.y >= 335) {
          enemy.bossAction = 'recharge';
          enemy.actionTimer = 0;
        }
      } else if (enemy.bossAction === 'recharge') {
        // Hover low and vulnerable for 2.6 seconds!
        enemy.y = 350 + Math.sin(enemy.timer * 4) * 6;
        if (Math.random() < 0.25) {
          spawnSparkleParticles(state, enemy.x + (Math.random() * enemy.width), enemy.y, '#34d399');
        }
        if (enemy.actionTimer > 2.6) {
          enemy.bossAction = 'hover';
          enemy.actionTimer = 0;
        }
      }

    } else if (enemy.type === 'cryo_boss') {
      // Sektor 2 Boss: Cryo-Titan (Ground Slam & Stun in Ice!)
      enemy.bossAction = enemy.bossAction || 'hover';
      enemy.actionTimer = (enemy.actionTimer || 0) + dt;
      enemy.shootTimer = (enemy.shootTimer || 0) + dt;

      if (enemy.bossAction === 'hover') {
        // Smoothly float and track player's horizontal position
        enemy.y = (enemy.startY || 160) + Math.sin(enemy.timer * 3) * 15;
        const targetX = p.x + p.width / 2 - enemy.width / 2;
        enemy.x += (targetX - enemy.x) * 1.8 * dt;

        // Shoot vertical icicle shards
        if (enemy.shootTimer > 1.6) {
          enemy.shootTimer = 0;
          state.projectiles.push({
            id: `icicle_${Date.now()}`,
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height,
            vx: (Math.random() - 0.5) * 1.5,
            vy: 5.2,
            radius: 8,
            fromPlayer: false,
            color: '#38bdf8',
            damage: 1,
            lifespan: 2.5
          });
        }

        if (enemy.actionTimer > 3.4) {
          enemy.bossAction = 'aim';
          enemy.actionTimer = 0;
          enemy.slamTargetX = p.x + p.width / 2 - enemy.width / 2;
        }
      } else if (enemy.bossAction === 'aim') {
        // Target lock telegraph warning with jitter
        const baseTarget = enemy.slamTargetX || enemy.x;
        enemy.x = baseTarget + (Math.random() - 0.5) * 7;
        if (Math.random() < 0.3) {
          spawnSparkleParticles(state, enemy.x + enemy.width / 2, enemy.y + enemy.height, '#f43f5e');
        }

        if (enemy.actionTimer > 1.1) {
          enemy.bossAction = 'slam';
          enemy.actionTimer = 0;
          enemy.vy = 18;
        }
      } else if (enemy.bossAction === 'slam') {
        // High speed ground slam!
        enemy.y += enemy.vy;
        if (enemy.y >= 380) {
          enemy.y = 380;
          enemy.vy = 0;
          state.screenShake = 0.35;
          soundManager.playStomp();
          spawnSparkleParticles(state, enemy.x + enemy.width / 2, enemy.y + enemy.height, '#38bdf8');
          // Twin ice shockwaves on floor
          state.projectiles.push(
            {
              id: `wave_l_${Date.now()}`,
              x: enemy.x,
              y: 440,
              vx: -5.5,
              vy: 0,
              radius: 8,
              fromPlayer: false,
              color: '#bae6fd',
              damage: 1,
              lifespan: 1.8
            },
            {
              id: `wave_r_${Date.now()}`,
              x: enemy.x + enemy.width,
              y: 440,
              vx: 5.5,
              vy: 0,
              radius: 8,
              fromPlayer: false,
              color: '#bae6fd',
              damage: 1,
              lifespan: 1.8
            }
          );
          enemy.bossAction = 'stunned';
          enemy.actionTimer = 0;
        }
      } else if (enemy.bossAction === 'stunned') {
        // Stuck in the ice floor, completely helpless for 3.5 seconds!
        enemy.y = 380;
        if (Math.random() < 0.25) {
          spawnSparkleParticles(state, enemy.x + (Math.random() * enemy.width), enemy.y, '#fef08a');
        }
        if (enemy.actionTimer > 3.5) {
          enemy.bossAction = 'recover';
          enemy.actionTimer = 0;
        }
      } else if (enemy.bossAction === 'recover') {
        // Ascends back up to floating height
        enemy.y += ((enemy.startY || 160) - enemy.y) * 4 * dt;
        if (enemy.y <= (enemy.startY || 160) + 10) {
          enemy.bossAction = 'hover';
          enemy.actionTimer = 0;
        }
      }

    } else if (enemy.type === 'pyro_boss') {
      // Sektor 3 Boss: Magma-Vulcanor (Mortar Barrage & Overheat Venting)
      enemy.bossAction = enemy.bossAction || 'mortar';
      enemy.actionTimer = (enemy.actionTimer || 0) + dt;
      enemy.shootTimer = (enemy.shootTimer || 0) + dt;

      if (enemy.bossAction === 'mortar') {
        // Patrol ground floor
        enemy.x += enemy.vx;
        if (enemy.x > enemy.patrolStartX + enemy.patrolRange) {
          enemy.vx = -Math.abs(enemy.vx);
          enemy.facing = 'left';
        } else if (enemy.x < enemy.patrolStartX) {
          enemy.vx = Math.abs(enemy.vx);
          enemy.facing = 'right';
        }

        // Fire high-arcing parabolic lava mortars
        if (enemy.shootTimer > 2.0) {
          enemy.shootTimer = 0;
          const dir = p.x < enemy.x ? -1 : 1;
          state.projectiles.push({
            id: `lava_mortar_${Date.now()}`,
            x: enemy.x + enemy.width / 2,
            y: enemy.y + 10,
            vx: dir * (3.2 + Math.random() * 2.2),
            vy: -8.5,
            gravity: 0.28,
            radius: 9,
            fromPlayer: false,
            color: '#f97316',
            damage: 1,
            lifespan: 3.5
          });
        }

        if (enemy.actionTimer > 4.5) {
          enemy.bossAction = 'overheat';
          enemy.actionTimer = 0;
        }
      } else if (enemy.bossAction === 'overheat') {
        // Stop moving, vent open with thick steam!
        if (Math.random() < 0.4) {
          spawnSparkleParticles(state, enemy.x + enemy.width / 2, enemy.y - 10, '#f8fafc');
        }
        if (enemy.actionTimer > 3.2) {
          enemy.bossAction = 'mortar';
          enemy.actionTimer = 0;
        }
      }

    } else if (enemy.type === 'zorgax_boss') {
      // Final Boss 3-phase AI
      enemy.shootTimer = (enemy.shootTimer || 0) + dt;
      enemy.x += enemy.vx;
      if (enemy.x > enemy.patrolStartX + enemy.patrolRange) {
        enemy.vx = -Math.abs(enemy.vx);
        enemy.facing = 'left';
      } else if (enemy.x < enemy.patrolStartX) {
        enemy.vx = Math.abs(enemy.vx);
        enemy.facing = 'right';
      }

      // Phase 1 (HP 6-5): Charges + dual lasers
      // Phase 2 (HP 4-3): Plasma barrage / Orbital Strike
      // Phase 3 (HP 2-1): Fast erratic leaps + energy rain
      if (enemy.shootTimer > (enemy.health <= 2 ? 1.3 : 2.0)) {
        enemy.shootTimer = 0;
        const dir = p.x < enemy.x ? -1 : 1;

        if (enemy.health <= 2) {
          // Phase 3: Triple spread plasma
          for (let s = -1; s <= 1; s++) {
            state.projectiles.push({
              id: `zorgax_spread_${Date.now()}_${s}`,
              x: enemy.x + enemy.width / 2,
              y: enemy.y + 40,
              vx: dir * 5.8,
              vy: s * 2.2,
              radius: 9,
              fromPlayer: false,
              color: '#c084fc',
              damage: 1,
              lifespan: 3
            });
          }
        } else if (enemy.health <= 4) {
          // Phase 2: Orbital sky strike
          state.projectiles.push({
            id: `zorgax_orbital_${Date.now()}`,
            x: p.x + (Math.random() - 0.5) * 60,
            y: 50,
            vx: 0,
            vy: 6.5,
            radius: 11,
            fromPlayer: false,
            color: '#a855f7',
            damage: 1,
            lifespan: 2.5
          });
        } else {
          // Phase 1: Heavy laser beam
          state.projectiles.push({
            id: `zorgax_laser_${Date.now()}`,
            x: enemy.x + (dir === 1 ? enemy.width : 0),
            y: enemy.y + 40,
            vx: dir * 6.5,
            vy: 0,
            radius: 10,
            fromPlayer: false,
            color: '#a855f7',
            damage: 1,
            lifespan: 3
          });
        }
      }
    }

    // Player vs Enemy Collision
    if (checkAABB(p, enemy)) {
      const isBossStunned = enemy.bossAction === 'stunned' || enemy.bossAction === 'recharge' || enemy.bossAction === 'overheat';
      // Stomp check: falling onto enemy top OR jumping onto stunned/vulnerable boss
      const isFalling = p.vy > 0;
      const isAbove = (p.y + p.height) <= (enemy.y + enemy.height * 0.75);
      const isStomping = (isFalling && isAbove) || (isBossStunned && isFalling);

      if (isStomping && enemy.type !== 'spikon') {
        // Player stomps enemy
        p.vy = -11.5; // High satisfying bounce
        p.squashStretch = 1.35;
        soundManager.playStomp();
        spawnSparkleParticles(state, enemy.x + enemy.width / 2, enemy.y, '#f59e0b');

        enemy.health -= 1;
        enemy.hitFlashTimer = 0.3;

        // Visual feedback when hitting stunned boss
        if (isBossStunned) {
          spawnSparkleParticles(state, enemy.x + enemy.width / 2, enemy.y, '#38bdf8');
          state.screenShake = 0.2;
        }

        if (enemy.health <= 0) {
          enemy.isDefeated = true;
          if (enemy.type.includes('boss')) {
            enemy.defeatTimer = 2.2;
            state.bossDefeatTimer = 2.2;
            state.bossDefeatedName = enemy.type;
            p.score += 3000;
            soundManager.playLevelClear();
            spawnBossExplosion(state, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            for (let s = 0; s < 6; s++) {
              state.items.push({
                id: `stardust_boss_${Date.now()}_${s}`,
                type: 'stardust',
                x: enemy.x + (Math.random() - 0.5) * 120,
                y: enemy.y + (Math.random() - 0.5) * 80,
                width: 24,
                height: 24,
                collected: false
              });
            }
          } else {
            p.score += 200;
          }
        }
      } else if (isBossStunned) {
        // Player safely brushed against stunned boss without jumping: gentle push back, no damage
        p.vx = p.x < enemy.x ? -3 : 3;
      } else {
        // Player gets hit by enemy
        handlePlayerHit(state);
      }
    }
  }

  // Boss Defeat Sequence Timer
  if (state.bossDefeatTimer !== undefined) {
    state.bossDefeatTimer -= dt;
    // Continuing celebratory sparks during dramatic defeat slow-mo
    if (Math.random() < 0.45) {
      spawnSparkleParticles(
        state,
        state.goal.x + (Math.random() - 0.5) * 180,
        state.goal.y - Math.random() * 120,
        ['#10b981', '#38bdf8', '#f59e0b', '#a855f7', '#ec4899'][Math.floor(Math.random() * 5)]
      );
    }
    if (state.bossDefeatTimer <= 0) {
      delete state.bossDefeatTimer;
      levelCleared = true;
      state.isLevelCleared = true;
      soundManager.playLevelClear();
    }
  }

  // Goal Check
  const bossRemaining = state.enemies.some(e => e.type.includes('boss') && !e.isDefeated);
  const distToGoalX = Math.abs((p.x + p.width / 2) - state.goal.x);
  const distToGoalY = Math.abs((p.y + p.height / 2) - state.goal.y);

  if (!bossRemaining && distToGoalX < 60 && distToGoalY < 85) {
    levelCleared = true;
    state.isLevelCleared = true;
    soundManager.playLevelClear();
  }

  // Update Particles
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const part = state.particles[i];
    part.x += part.vx;
    part.y += part.vy;
    part.alpha -= part.decay;
    if (part.gravity) part.vy += part.gravity;
    if (part.alpha <= 0) {
      state.particles.splice(i, 1);
    }
  }

  // Camera Follow
  const viewW = viewportWidth || state.viewportWidth || 800;
  const viewH = viewportHeight || state.viewportHeight || 600;
  const targetCam = getCameraTarget(p, state.levelWidth, state.levelHeight, viewW, viewH);
  state.cameraX += (targetCam.x - state.cameraX) * 0.12;
  state.cameraY += (targetCam.y - state.cameraY) * 0.12;

  return { levelCleared, playerDied };
}

function handlePlayerHit(state: GameState) {
  const p = state.player;
  const hasShield = p.tempBuffs.some(b => b.type === 'shield');

  if (hasShield) {
    // Absorb hit with shield
    p.tempBuffs = p.tempBuffs.filter(b => b.type !== 'shield');
    soundManager.playBounce();
    spawnSparkleParticles(state, p.x + p.width / 2, p.y + p.height / 2, '#38bdf8');
    p.invulnerableTimer = 1.0;
    return;
  }

  if (p.invulnerableTimer > 0) return;

  state.screenShake = 10;
  soundManager.playHit();

  if (p.powerUp !== 'none') {
    // Downgrade power-up tier (GDD Rule: downgrade instead of instant death!)
    if (p.powerUp === 'jetpack' || p.powerUp === 'energy_glove') {
      p.powerUp = 'serum_giga';
    } else {
      p.powerUp = 'none';
    }
    p.invulnerableTimer = 1.6;
    p.vy = -6;
    p.vx = p.facing === 'right' ? -4 : 4;
  } else {
    // At base level: lose 1 life!
    p.lives--;
    p.invulnerableTimer = 2.0;
    p.vy = -6;
    p.vx = p.facing === 'right' ? -4 : 4;

    if (p.lives <= 0) {
      state.isGameOver = true;
      soundManager.playGameOver();
    }
  }
}

function handleItemCollect(state: GameState, item: CollectibleItem) {
  const p = state.player;
  p.score += 50;

  switch (item.type) {
    case 'stardust':
      p.stardust++;
      soundManager.playCoin();
      spawnSparkleParticles(state, item.x, item.y, '#facc15');
      if (p.stardust >= 100) {
        p.stardust -= 100;
        if (p.lives < 9) {
          p.lives++;
          soundManager.playPowerup();
        }
      }
      break;

    case 'powerup_giga':
      p.powerUp = 'serum_giga';
      soundManager.playPowerup();
      spawnSparkleParticles(state, item.x, item.y, '#10b981');
      p.score += 300;
      break;

    case 'powerup_jetpack':
      p.powerUp = 'jetpack';
      soundManager.playPowerup();
      spawnSparkleParticles(state, item.x, item.y, '#38bdf8');
      p.score += 400;
      break;

    case 'powerup_glove':
      p.powerUp = 'energy_glove';
      soundManager.playPowerup();
      spawnSparkleParticles(state, item.x, item.y, '#c084fc');
      p.score += 400;
      break;

    case 'buff_shield':
      p.tempBuffs.push({ type: 'shield', timeLeft: 8, maxTime: 8 });
      soundManager.playPowerup();
      spawnSparkleParticles(state, item.x, item.y, '#38bdf8');
      break;

    case 'buff_speed':
      p.tempBuffs.push({ type: 'speed', timeLeft: 10, maxTime: 10 });
      soundManager.playPowerup();
      spawnSparkleParticles(state, item.x, item.y, '#fbbf24');
      break;

    case 'heart':
      if (p.lives < 9) p.lives++;
      soundManager.playPowerup();
      break;
  }
}

function checkAABB(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// Particle Spawners
function spawnDustParticles(state: GameState, x: number, y: number) {
  for (let i = 0; i < 5; i++) {
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 3,
      vy: -Math.random() * 1.5,
      size: 4 + Math.random() * 3,
      color: '#94a3b8',
      alpha: 0.8,
      decay: 0.04
    });
  }
}

function spawnJetpackParticles(state: GameState, x: number, y: number) {
  for (let i = 0; i < 4; i++) {
    state.particles.push({
      x: x + (Math.random() - 0.5) * 8,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: 2 + Math.random() * 3,
      size: 4 + Math.random() * 4,
      color: Math.random() < 0.6 ? '#38bdf8' : '#60a5fa',
      alpha: 0.9,
      decay: 0.05
    });
  }
}

function spawnSparkleParticles(state: GameState, x: number, y: number, color: string) {
  for (let i = 0; i < 10; i++) {
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      size: 3 + Math.random() * 3,
      color,
      alpha: 1,
      decay: 0.03
    });
  }
}

function spawnDebrisParticles(state: GameState, x: number, y: number, color: string) {
  for (let i = 0; i < 8; i++) {
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 7,
      vy: -Math.random() * 6,
      size: 5 + Math.random() * 4,
      color,
      alpha: 1,
      decay: 0.025,
      gravity: 0.4
    });
  }
}

function spawnSteamParticles(state: GameState, x: number, y: number) {
  for (let i = 0; i < 6; i++) {
    state.particles.push({
      x: x + (Math.random() - 0.5) * 16,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: -4 - Math.random() * 4,
      size: 6 + Math.random() * 6,
      color: '#f8fafc',
      alpha: 0.7,
      decay: 0.04
    });
  }
}

function spawnBossExplosion(state: GameState, x: number, y: number) {
  state.screenShake = 20;
  for (let i = 0; i < 40; i++) {
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 12,
      size: 6 + Math.random() * 8,
      color: ['#f59e0b', '#ef4444', '#a855f7', '#38bdf8'][Math.floor(Math.random() * 4)],
      alpha: 1,
      decay: 0.018,
      gravity: 0.15
    });
  }
}
