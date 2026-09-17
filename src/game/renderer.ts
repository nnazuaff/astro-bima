import { GameState } from './physics';
import { WorldId, PlatformBlock, Enemy, CollectibleItem, Projectile, Particle } from '../types';

export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  worldId: WorldId,
  canvasWidth: number,
  canvasHeight: number,
  time: number
) {
  ctx.save();

  // Screen shake
  if (state.screenShake > 0) {
    const dx = (Math.random() - 0.5) * state.screenShake * 1.5;
    const dy = (Math.random() - 0.5) * state.screenShake * 1.5;
    ctx.translate(dx, dy);
  }

  // Clear & render parallax background
  renderParallaxBackground(ctx, worldId, state.cameraX, canvasWidth, canvasHeight, time);

  // Apply Camera Translation for Game World (both X and Y)
  ctx.save();
  ctx.translate(-Math.round(state.cameraX), -Math.round(state.cameraY));

  // 1. Render Checkpoints
  renderCheckpoints(ctx, state, time);

  // 2. Render Platforms & Hazards
  renderPlatforms(ctx, state.blocks, worldId, time);

  // 3. Render Collectibles / Items
  renderItems(ctx, state.items, time);

  // 4. Render Goal Altar
  const bossRemaining = state.enemies.some(e => e.type.includes('boss') && !e.isDefeated);
  if (!state.isBossLevel || !bossRemaining || state.bossDefeatTimer !== undefined) {
    renderGoalAltar(ctx, state.goal.x, state.goal.y, worldId, time, state.bossDefeatTimer !== undefined);
  }

  // 5. Render Projectiles
  renderProjectiles(ctx, state.projectiles);

  // 6. Render Enemies
  renderEnemies(ctx, state.enemies, time);

  // 7. Render Player Bima
  renderPlayer(ctx, state.player, time);

  // 8. Render Particles
  renderParticles(ctx, state.particles);

  ctx.restore(); // Restore Camera
  ctx.restore(); // Restore Screen Shake
}

function renderParallaxBackground(
  ctx: CanvasRenderingContext2D,
  worldId: WorldId,
  cameraX: number,
  width: number,
  height: number,
  time: number
) {
  // Sky Gradient
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  if (worldId === 'hutan-neon') {
    grad.addColorStop(0, '#042f2e');
    grad.addColorStop(1, '#021815');
  } else if (worldId === 'kristal-es') {
    grad.addColorStop(0, '#0c4a6e');
    grad.addColorStop(1, '#031c2c');
  } else if (worldId === 'gurun-vulkanik') {
    grad.addColorStop(0, '#431407');
    grad.addColorStop(1, '#1a0502');
  } else {
    // Markas Zorgax
    grad.addColorStop(0, '#2e1065');
    grad.addColorStop(1, '#090518');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Distant Stars (Parallax 0.05)
  ctx.save();
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 60; i++) {
    const starX = ((i * 137.5 - cameraX * 0.05) % width + width) % width;
    const starY = (i * 83.3) % (height - 100);
    const blink = Math.sin(time * 3 + i) * 0.4 + 0.6;
    ctx.globalAlpha = blink * 0.8;
    ctx.fillRect(starX, starY, (i % 3 === 0 ? 2.5 : 1.5), (i % 3 === 0 ? 2.5 : 1.5));
  }
  ctx.restore();

  // Celestial Body / Moon in sky
  const moonX = ((width * 0.8 - cameraX * 0.02) % width + width) % width;
  ctx.save();
  ctx.beginPath();
  ctx.arc(moonX, 110, 48, 0, Math.PI * 2);
  const moonGrad = ctx.createRadialGradient(moonX - 12, 110 - 12, 5, moonX, 110, 48);
  if (worldId === 'hutan-neon') {
    moonGrad.addColorStop(0, '#6ee7b7');
    moonGrad.addColorStop(1, '#065f46');
  } else if (worldId === 'kristal-es') {
    moonGrad.addColorStop(0, '#bae6fd');
    moonGrad.addColorStop(1, '#0284c7');
  } else if (worldId === 'gurun-vulkanik') {
    moonGrad.addColorStop(0, '#fcd34d');
    moonGrad.addColorStop(1, '#ea580c');
  } else {
    moonGrad.addColorStop(0, '#f472b6');
    moonGrad.addColorStop(1, '#7e22ce');
  }
  ctx.fillStyle = moonGrad;
  ctx.shadowColor = 'rgba(255,255,255,0.4)';
  ctx.shadowBlur = 25;
  ctx.fill();

  // Planetary ring for cosmic feel
  ctx.beginPath();
  ctx.ellipse(moonX, 110, 75, 14, -0.25, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();

  // Aurora effect for Ice Crystal world
  if (worldId === 'kristal-es') {
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.moveTo(0, 160);
    for (let x = 0; x <= width; x += 40) {
      const y = 140 + Math.sin((x + cameraX * 0.2) * 0.01 + time * 1.5) * 45;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, 0);
    ctx.lineTo(0, 0);
    const auroraGrad = ctx.createLinearGradient(0, 0, 0, 200);
    auroraGrad.addColorStop(0, '#38bdf8');
    auroraGrad.addColorStop(1, '#34d399');
    ctx.fillStyle = auroraGrad;
    ctx.fill();
    ctx.restore();
  }

  // Mid-ground Silhouettes (Parallax 0.25)
  ctx.save();
  ctx.fillStyle = worldId === 'hutan-neon' ? '#064e3b' :
                  worldId === 'kristal-es' ? '#0e7490' :
                  worldId === 'gurun-vulkanik' ? '#7c2d12' : '#4c1d95';
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let x = 0; x <= width + 50; x += 60) {
    const wave = Math.sin((x + cameraX * 0.25) * 0.008) * 60 + Math.cos((x + cameraX * 0.25) * 0.015) * 35;
    ctx.lineTo(x, height - 160 + wave);
  }
  ctx.lineTo(width + 50, height);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function renderPlatforms(ctx: CanvasRenderingContext2D, blocks: PlatformBlock[], worldId: WorldId, time: number) {
  for (const block of blocks) {
    if (block.isCrumbled) continue;

    ctx.save();

    if (block.type === 'solid' || block.type === 'ice') {
      const isIce = block.type === 'ice';
      // Base platform rectangle
      ctx.fillStyle = isIce ? '#0284c7' :
                      worldId === 'hutan-neon' ? '#047857' :
                      worldId === 'gurun-vulkanik' ? '#9a3412' : '#4c1d95';
      ctx.fillRect(block.x, block.y, block.width, block.height);

      // Top surface line
      ctx.fillStyle = isIce ? '#7dd3fc' :
                      worldId === 'hutan-neon' ? '#34d399' :
                      worldId === 'gurun-vulkanik' ? '#fb923c' : '#c084fc';
      ctx.fillRect(block.x, block.y, block.width, 6);

      // Detail accents
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      for (let bx = block.x + 16; bx < block.x + block.width - 16; bx += 32) {
        ctx.fillRect(bx, block.y + 12, 14, 4);
      }
    } else if (block.type === 'breakable') {
      // Breakable crystal block
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(block.x, block.y, block.width, block.height);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.strokeRect(block.x + 2, block.y + 2, block.width - 4, block.height - 4);
      
      // Question mark / Crystal icon
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('◆', block.x + block.width / 2, block.y + block.height / 2);
    } else if (block.type === 'bouncy_mushroom') {
      // Springy Neon Mushroom
      const bounceWobble = Math.sin(time * 6) * 3;
      // Stem
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(block.x + block.width * 0.35, block.y + 12, block.width * 0.3, block.height - 12);

      // Cap
      ctx.beginPath();
      ctx.ellipse(block.x + block.width / 2, block.y + 10, block.width / 2, 14 + bounceWobble, 0, Math.PI, 0);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.strokeStyle = '#6ee7b7';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Mushroom spots
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(block.x + block.width * 0.3, block.y + 8, 3, 0, Math.PI * 2);
      ctx.arc(block.x + block.width * 0.5, block.y + 5, 3.5, 0, Math.PI * 2);
      ctx.arc(block.x + block.width * 0.7, block.y + 8, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (block.type === 'crumbling') {
      // Shaking crumbling platform
      const shakeOffset = (block.crumbleTimer || 0) > 0 ? (Math.random() - 0.5) * 4 : 0;
      ctx.translate(shakeOffset, 0);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(block.x, block.y, block.width, block.height);
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 2;
      ctx.strokeRect(block.x, block.y, block.width, block.height);

      // Cracks
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.beginPath();
      ctx.moveTo(block.x + 20, block.y);
      ctx.lineTo(block.x + 35, block.y + block.height);
      ctx.moveTo(block.x + block.width - 30, block.y);
      ctx.lineTo(block.x + block.width - 45, block.y + block.height);
      ctx.stroke();
    } else if (block.type === 'geyser') {
      // Volcanic steam geyser vent
      ctx.fillStyle = '#431407';
      ctx.fillRect(block.x, block.y + 10, block.width, block.height - 10);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(block.x + 4, block.y + 6, block.width - 8, 6);

      // Erupting steam column
      const steamHeight = 110 + Math.sin(time * 8) * 20;
      const steamGrad = ctx.createLinearGradient(0, block.y, 0, block.y - steamHeight);
      steamGrad.addColorStop(0, 'rgba(255, 237, 213, 0.75)');
      steamGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
      ctx.fillStyle = steamGrad;
      ctx.fillRect(block.x + 8, block.y - steamHeight, block.width - 16, steamHeight);
    } else if (block.type === 'laser_hazard') {
      // Laser cannon emitter & beam
      const isLaserActive = Math.floor(block.cycleTimer || 0) % 2 === 0;
      ctx.fillStyle = '#475569';
      ctx.fillRect(block.x, block.y, 14, block.height);
      ctx.fillRect(block.x + block.width - 14, block.y, 14, block.height);

      if (isLaserActive) {
        // Red glowing deadly laser beam
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#f87171';
        ctx.shadowBlur = 12;
        ctx.fillRect(block.x + 14, block.y + block.height * 0.35, block.width - 28, block.height * 0.3);
      } else {
        // Charging warning dots
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.fillRect(block.x + 14, block.y + block.height * 0.45, block.width - 28, 2);
      }
    }

    ctx.restore();
  }
}

function renderItems(ctx: CanvasRenderingContext2D, items: CollectibleItem[], time: number) {
  for (const item of items) {
    if (item.collected) continue;

    ctx.save();
    const floatY = Math.sin(time * 4 + (item.bounceOffset || 0)) * 6;
    ctx.translate(item.x + item.width / 2, item.y + item.height / 2 + floatY);

    if (item.type === 'stardust') {
      // Rotating 5-pointed sparkling star
      ctx.rotate(time * 2.5);
      drawStar(ctx, 0, 0, 5, 12, 6, '#facc15', '#fef08a');
    } else if (item.type === 'powerup_giga') {
      // Serum Giga flask
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 4, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-4, -12, 8, 8);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('G', 0, 8);
    } else if (item.type === 'powerup_jetpack') {
      // Jetpack module
      ctx.fillStyle = '#0284c7';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.fillRect(-10, -10, 20, 20);
      // Twin nozzles
      ctx.fillStyle = '#f97316';
      ctx.fillRect(-8, 10, 5, 6);
      ctx.fillRect(3, 10, 5, 6);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🚀', 0, 4);
    } else if (item.type === 'powerup_glove') {
      // Energy Glove
      ctx.fillStyle = '#9333ea';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡', 0, 4);
    } else if (item.type === 'buff_shield') {
      // Shield Bubble
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#7dd3fc';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🛡️', 0, 4);
    } else if (item.type === 'buff_speed') {
      // Speed boots
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡', 0, 4);
    }

    ctx.restore();
  }
}

function renderCheckpoints(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  for (const cp of state.checkpoints) {
    ctx.save();
    ctx.translate(cp.x, cp.y);

    // Antenna Pole
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-3, -50, 6, 50);

    // Glowing Beacon Ring
    const isAct = cp.activated;
    ctx.fillStyle = isAct ? '#38bdf8' : '#94a3b8';
    ctx.shadowColor = isAct ? '#38bdf8' : 'transparent';
    ctx.shadowBlur = isAct ? 15 : 0;

    const ringY = -45 + Math.sin(time * 4) * 4;
    ctx.beginPath();
    ctx.ellipse(0, ringY, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Beacon Top Crystal
    ctx.beginPath();
    ctx.moveTo(0, ringY - 14);
    ctx.lineTo(8, ringY);
    ctx.lineTo(0, ringY + 14);
    ctx.lineTo(-8, ringY);
    ctx.closePath();
    ctx.fillStyle = isAct ? '#7dd3fc' : '#cbd5e1';
    ctx.fill();

    ctx.restore();
  }
}

function renderGoalAltar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  worldId: WorldId,
  time: number,
  isActivatedBoss: boolean = false
) {
  ctx.save();
  ctx.translate(x, y);

  // Radiant Celestial Portal Light Beam if activated or clear
  if (isActivatedBoss) {
    const beamGrad = ctx.createLinearGradient(0, 60, 0, -500);
    beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.6)');
    beamGrad.addColorStop(0.5, 'rgba(250, 204, 21, 0.4)');
    beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(-35, -500, 70, 560);

    // Glowing ascension rings
    for (let r = 0; r < 3; r++) {
      const ringY = -((time * 80 + r * 100) % 350);
      const ringAlpha = Math.max(0, 1 + ringY / 350);
      ctx.strokeStyle = `rgba(255, 255, 255, ${ringAlpha * 0.7})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, ringY, 30, 8, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Ancient Altar Pedestal
  ctx.fillStyle = '#334155';
  ctx.fillRect(-35, 30, 70, 40);
  ctx.fillStyle = '#475569';
  ctx.fillRect(-45, 60, 90, 20);

  // Pedestal energy runes
  const runeGlow = Math.sin(time * 4) * 0.3 + 0.7;
  ctx.fillStyle = `rgba(56, 189, 248, ${runeGlow})`;
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 8;
  ctx.fillRect(-25, 42, 50, 4);

  // Floating Core Crystal Shard
  const floatY = Math.sin(time * 3) * 10;
  ctx.translate(0, floatY);

  const crystalColor = worldId === 'hutan-neon' ? '#10b981' :
                       worldId === 'kristal-es' ? '#38bdf8' :
                       worldId === 'gurun-vulkanik' ? '#f97316' : '#a855f7';

  ctx.shadowColor = crystalColor;
  ctx.shadowBlur = isActivatedBoss ? 35 : 24;

  ctx.beginPath();
  ctx.moveTo(0, -32);
  ctx.lineTo(20, 0);
  ctx.lineTo(0, 32);
  ctx.lineTo(-20, 0);
  ctx.closePath();
  ctx.fillStyle = crystalColor;
  ctx.fill();

  // Crystal Facet Highlight
  ctx.beginPath();
  ctx.moveTo(0, -32);
  ctx.lineTo(10, 0);
  ctx.lineTo(0, 32);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fill();

  // Orbiting stardust ring
  ctx.strokeStyle = isActivatedBoss ? 'rgba(250, 204, 21, 0.9)' : 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 34, 11, time * 2.2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function renderPlayer(ctx: CanvasRenderingContext2D, p: any, time: number) {
  ctx.save();
  ctx.translate(p.x + p.width / 2, p.y + p.height / 2);

  // Blinking when invulnerable
  if (p.invulnerableTimer > 0 && Math.floor(time * 18) % 2 === 0) {
    ctx.globalAlpha = 0.35;
  }

  // Facing direction flip
  if (p.facing === 'left') {
    ctx.scale(-1, 1);
  }

  // Scale if Serum Giga
  const isGiga = p.powerUp === 'serum_giga';
  const powerScale = isGiga ? 1.3 : 1.0;
  ctx.scale(powerScale, powerScale);

  // Squash and Stretch Matrix
  const sq = p.squashStretch || 1.0;
  ctx.scale(1 / sq, sq);

  // Dynamic Lean Tilt Angle (Forward on run, back on air drag)
  ctx.rotate(p.tiltAngle || 0);

  // Natural Vertical Breathing / Running Bounce
  let bounceY = 0;
  if (p.isGrounded) {
    if (Math.abs(p.vx) > 0.3) {
      bounceY = -Math.abs(Math.sin(p.walkCycle || 0)) * 3.2;
    } else {
      bounceY = Math.sin(time * 3.5) * 1.5;
    }
  }
  ctx.translate(0, bounceY);

  // Shield Bubble effect around Bima
  const hasShield = p.tempBuffs && p.tempBuffs.some((b: any) => b.type === 'shield');
  if (hasShield) {
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Shield orbiting sparklet
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(Math.cos(time * 6) * 28, Math.sin(time * 6) * 28, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Jetpack on back
  if (p.powerUp === 'jetpack') {
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-17, -12, 7, 20);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-18, -8, 2, 12);

    // Twin Exhaust Thruster Flames with dual-layer color
    if (!p.isGrounded || p.isGliding) {
      const flameLen = 14 + Math.random() * 8;
      // Outer flame (Orange)
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(-17, 8);
      ctx.lineTo(-13.5, 8 + flameLen);
      ctx.lineTo(-10, 8);
      ctx.fill();
      // Inner core flame (Bright Yellow/White)
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(-15.5, 8);
      ctx.lineTo(-13.5, 8 + flameLen * 0.6);
      ctx.lineTo(-11.5, 8);
      ctx.fill();
    }
  }

  // Striped Raccoon Tail (Dynamic Spring Wavy S-Curve)
  const tailBaseAngle = -0.35 + (p.isGrounded ? Math.sin((p.walkCycle || 0) + time * 4) * 0.25 : Math.sin(time * 6) * 0.35);
  ctx.save();
  ctx.translate(-10, 8);
  ctx.rotate(tailBaseAngle);
  // Segment 1 (Grey)
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.ellipse(-5, 0, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Segment 2 (Dark stripe)
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.ellipse(-10, 0, 6, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Segment 3 (Light stripe)
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.ellipse(-15, 0, 6, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Tail Tip (Fluffy Black)
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(-20, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Bima Space Suit Body (White Pearlescent with soft contouring)
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.ellipse(0, 6, 12, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Teal suit chest insignia & golden galaxy crest
  ctx.fillStyle = '#0d9488';
  ctx.fillRect(-6, 0, 12, 9);
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(0, 4.5, 2.8, 0, Math.PI * 2);
  ctx.fill();

  // Utility Space Belt
  ctx.fillStyle = '#334155';
  ctx.fillRect(-8, 12, 16, 3.5);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(-2, 12, 4, 3.5);

  // Articulated Legs and Space Boots
  ctx.fillStyle = '#334155';
  if (p.isGrounded) {
    if (Math.abs(p.vx) > 0.3) {
      // Running Gait: alternating swing with knee bending
      const legSwing = Math.sin(p.walkCycle || 0) * 8;
      // Back leg
      ctx.fillRect(-8, 15, 5, 8 - legSwing * 0.7);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-9, 21 - legSwing * 0.7, 7, 4); // Back boot
      // Front leg
      ctx.fillStyle = '#334155';
      ctx.fillRect(3, 15, 5, 8 + legSwing * 0.7);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(2, 21 + legSwing * 0.7, 7, 4); // Front boot
    } else {
      // Standing Idle: sturdy grounded boots
      ctx.fillRect(-7, 16, 5, 8);
      ctx.fillRect(2, 16, 5, 8);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-8, 22, 6.5, 4);
      ctx.fillRect(1, 22, 6.5, 4);
    }
  } else {
    // Airborne / Jumping Pose: Front leg tucked forward, back leg trailing
    if (p.vy < 0) {
      // Jumping up: agile tucked legs
      ctx.fillRect(-7, 14, 5, 6);
      ctx.fillRect(3, 15, 5, 8);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-8, 18, 6.5, 4);
      ctx.fillRect(2, 21, 6.5, 4);
    } else {
      // Falling down: legs stretched ready for impact
      ctx.fillRect(-7, 15, 5, 9);
      ctx.fillRect(3, 15, 5, 8.5);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-8, 22, 6.5, 4);
      ctx.fillRect(2, 21.5, 6.5, 4);
    }
  }

  // Raccoon Space Helmet & Ears
  // Left Ear
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(-10, -12);
  ctx.lineTo(-15, -23);
  ctx.lineTo(-6, -17);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-9, -13);
  ctx.lineTo(-13, -20);
  ctx.lineTo(-7, -16);
  ctx.fill();

  // Right Ear
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(6, -17);
  ctx.lineTo(15, -23);
  ctx.lineTo(10, -12);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(7, -16);
  ctx.lineTo(13, -20);
  ctx.lineTo(9, -13);
  ctx.fill();

  // Glass Helmet Dome
  ctx.fillStyle = 'rgba(241, 245, 249, 0.95)';
  ctx.beginPath();
  ctx.arc(0, -9, 14.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Helmet Visor (Deep Space Blue glass)
  ctx.fillStyle = '#0369a1';
  ctx.beginPath();
  ctx.ellipse(2.5, -9, 9.5, 7.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Raccoon Dark Eye Mask
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, -12, 10.5, 5);

  // Animated Eyes
  if (p.state === 'hit') {
    // Cute dizzy/hit star eyes
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('★', 3, -8);
    ctx.fillText('★', 8, -8);
  } else if (p.eyeBlinking) {
    // Blinking: closed eye arcs
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(2, -9);
    ctx.lineTo(5, -9);
    ctx.moveTo(7, -9);
    ctx.lineTo(10, -9);
    ctx.stroke();
  } else {
    // Open Expressive Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(3.8, -9.5, 2.2, 0, Math.PI * 2);
    ctx.arc(8.5, -9.5, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(4.2, -9.5, 1.3, 0, Math.PI * 2);
    ctx.arc(8.9, -9.5, 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Specular Glint
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(3.6, -10.2, 0.8, 0, Math.PI * 2);
    ctx.arc(8.3, -10.2, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Visor Light Sheen / Glass Reflection
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0.5, -12.5, 4.5, 1.6, -0.35, 0, Math.PI * 2);
  ctx.fill();

  // Articulated Arms & Power Gloves
  if (p.powerUp === 'energy_glove') {
    // Energy Glove: Pulsing neon plasma glove
    const gloveGlow = Math.sin(time * 12) * 4 + 12;
    ctx.save();
    ctx.fillStyle = '#9333ea';
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = gloveGlow;
    ctx.beginPath();
    ctx.arc(9, 6, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // Glove Plasma Core Sparks
    ctx.fillStyle = '#f0abfc';
    ctx.beginPath();
    ctx.arc(9, 6, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    // Standard Suit Arm
    const armSwing = p.isGrounded && Math.abs(p.vx) > 0.3 ? -Math.sin(p.walkCycle || 0) * 5 : 0;
    ctx.fillStyle = '#0d9488';
    ctx.fillRect(6, 3 + armSwing * 0.5, 5, 7.5);
    ctx.fillStyle = '#334155';
    ctx.fillRect(6, 9 + armSwing * 0.5, 5, 3.5); // Glove cuff
  }

  ctx.restore();
}

function renderEnemies(ctx: CanvasRenderingContext2D, enemies: Enemy[], time: number) {
  for (const enemy of enemies) {
    // Handle boss defeat explosion animation
    if (enemy.isDefeated) {
      if (enemy.defeatTimer && enemy.defeatTimer > 0) {
        // Dramatic Boss Destruction Slow-Mo Sequence
        ctx.save();
        const jitter = (Math.random() - 0.5) * 8;
        ctx.translate(enemy.x + enemy.width / 2 + jitter, enemy.y + enemy.height / 2 + jitter);
        const shrink = Math.max(0.2, enemy.defeatTimer / 2.2);
        ctx.scale(shrink, shrink);
        ctx.globalAlpha = Math.min(1, enemy.defeatTimer);

        // Exploding core burst
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(0, 0, 35, 0, Math.PI * 2);
        ctx.fill();

        // Radiating energy shockwaves
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, (2.2 - enemy.defeatTimer) * 50, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      }
      continue;
    }

    ctx.save();
    ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);

    // Hit Flash feedback when taking damage
    const isFlashing = enemy.hitFlashTimer && enemy.hitFlashTimer > 0;
    if (isFlashing) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 18;
    }

    const anim = enemy.animCycle || time * 5;

    if (enemy.type === 'botlet') {
      // Sentry Dome Robot
      if (enemy.facing === 'left') {
        ctx.scale(-1, 1);
      }

      // Holographic floor scanner cone
      ctx.save();
      const scanGrad = ctx.createRadialGradient(0, 0, 10, 35, 15, 60);
      scanGrad.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
      scanGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = scanGrad;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(55, 12);
      ctx.lineTo(45, 26);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Top Spring Antenna & Pulsing Red Beacon
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      const antWobble = Math.sin(anim * 1.5) * 3;
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(antWobble, -20);
      ctx.stroke();

      ctx.fillStyle = isFlashing ? '#ffffff' : '#ef4444';
      ctx.shadowColor = '#f87171';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(antWobble, -21, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Sentry Dome Chassis
      ctx.fillStyle = isFlashing ? '#ffffff' : '#64748b';
      ctx.beginPath();
      ctx.arc(0, -3, 14, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-14, -3, 28, 12);

      // Red Scanner Eye Visor
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-10, -3, 20, 6);
      const eyeScan = Math.sin(anim * 1.2) * 6;
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#f87171';
      ctx.shadowBlur = 6;
      ctx.fillRect(eyeScan - 3, -2, 6, 4);
      ctx.shadowBlur = 0;

      // Walking Mechanical Feet
      const footSwing = Math.sin(anim * 2.2) * 5;
      ctx.fillStyle = '#334155';
      ctx.fillRect(-11, 9, 7, 6 + footSwing);
      ctx.fillRect(4, 9, 7, 6 - footSwing);

    } else if (enemy.type === 'spikon') {
      // Levitating Obsidian Crystals with Magma Arcs
      const bob = Math.sin(anim * 1.5) * 4;
      ctx.translate(0, bob);

      // Pedestal Base
      ctx.fillStyle = '#334155';
      ctx.fillRect(-14, 8, 28, 8);

      // Core Dark Matter Node
      ctx.fillStyle = isFlashing ? '#ffffff' : '#e11d48';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();

      // Sharp Levitating Spikes
      for (let i = -10; i <= 10; i += 10) {
        const spikeBob = Math.sin(anim * 2 + i) * 3;
        ctx.beginPath();
        ctx.moveTo(i - 4, 6);
        ctx.lineTo(i, -16 + spikeBob);
        ctx.lineTo(i + 4, 6);
        ctx.fillStyle = isFlashing ? '#ffffff' : '#be123c';
        ctx.fill();
      }

    } else if (enemy.type === 'layangbot') {
      // Hovering Drone with Fast Spinning Rotor
      const tilt = Math.sin(anim * 1.4) * 0.15;
      ctx.rotate(tilt);

      // High-speed rotor blur
      ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
      ctx.beginPath();
      ctx.ellipse(0, -15, 20, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rotor Mast
      ctx.fillStyle = '#475569';
      ctx.fillRect(-2, -15, 4, 6);

      // Main Spherical Drone Shell
      ctx.fillStyle = isFlashing ? '#ffffff' : '#0284c7';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Glowing Blue Optical Lens Eye
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#7dd3fc';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Pulse exhaust thruster
      ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.beginPath();
      ctx.arc(0, 15, 3 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();

    } else if (enemy.type === 'iceslider') {
      // Aerodynamic Cryo-Glider
      if (enemy.facing === 'left') {
        ctx.scale(-1, 1);
      }

      // Ice skate blades underneath
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-16, 12, 32, 3);
      ctx.fillRect(-18, 9, 4, 6);
      ctx.fillRect(14, 9, 4, 6);

      // Main streamlined body
      ctx.fillStyle = isFlashing ? '#ffffff' : '#0284c7';
      ctx.beginPath();
      ctx.ellipse(0, 3, 16, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Frosted Glass Dome with Ice Core
      ctx.fillStyle = 'rgba(224, 242, 254, 0.85)';
      ctx.beginPath();
      ctx.arc(0, -1, 9, Math.PI, 0);
      ctx.fill();

      // Sharp Ice Ram Horn
      ctx.fillStyle = '#bae6fd';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(14, 3);
      ctx.lineTo(24, 0);
      ctx.lineTo(14, -3);
      ctx.fill();
      ctx.shadowBlur = 0;

    } else if (enemy.type === 'geyserbug') {
      // Magma Beetle with 4 Articulated Legs
      const legStep = Math.sin(anim * 2.5) * 4;

      // 4 Walking Legs
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      // Back legs
      ctx.moveTo(-8, 5);
      ctx.lineTo(-18, 14 + legStep);
      ctx.moveTo(8, 5);
      ctx.lineTo(18, 14 - legStep);
      // Front legs
      ctx.moveTo(-10, 2);
      ctx.lineTo(-20, 11 - legStep);
      ctx.moveTo(10, 2);
      ctx.lineTo(20, 11 + legStep);
      ctx.stroke();

      // Armored Chitin Shell
      ctx.fillStyle = isFlashing ? '#ffffff' : '#9a3412';
      ctx.beginPath();
      ctx.arc(0, 3, 15, Math.PI, 0);
      ctx.fill();

      // Pulsing Magma Abdomen Chamber
      const magmaGlow = Math.sin(anim * 3) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(249, 115, 22, ${magmaGlow})`;
      ctx.shadowColor = '#fb923c';
      ctx.shadowBlur = 10;
      ctx.fillRect(-7, -4, 14, 6);
      ctx.shadowBlur = 0;

    } else if (enemy.type === 'drona_boss') {
      // Sektor 1 Boss: Drona-Botanika
      const bossColor = '#10b981';

      // 3 Orbiting Mini Spore Drones (in 3D Perspective)
      for (let s = 0; s < 3; s++) {
        const orbitAngle = time * 2.2 + (s * Math.PI * 2) / 3;
        const satX = Math.cos(orbitAngle) * 44;
        const satY = Math.sin(orbitAngle) * 20;
        ctx.save();
        ctx.fillStyle = bossColor;
        ctx.shadowColor = bossColor;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(satX, satY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Outer Rotating Gyro Ring
      ctx.save();
      ctx.rotate(time * 1.8);
      ctx.strokeStyle = isFlashing ? '#ffffff' : bossColor;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = bossColor;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.ellipse(0, 0, 36, 16, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Inner Counter-Rotating Ring
      ctx.save();
      ctx.rotate(-time * 2.4);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 28, 12, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Central Orb Chassis
      ctx.fillStyle = isFlashing ? '#ffffff' : '#064e3b';
      ctx.beginPath();
      ctx.arc(0, 0, 23, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Ocular Core Eye
      const eyePulse = Math.sin(time * 8) * 2;
      ctx.fillStyle = isFlashing ? '#ffffff' : bossColor;
      ctx.shadowColor = bossColor;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, 11 + eyePulse, 0, Math.PI * 2);
      ctx.fill();

      // Pupil Glint
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-2, -3, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Vulnerable Recharge Telegraph
      if (enemy.bossAction === 'recharge') {
        ctx.save();
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 10px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#059669';
        ctx.shadowBlur = 8;
        ctx.fillText('RECHARGE - INJAK!', 0, -38);
        ctx.restore();
      }

      // Boss Health Bar
      renderBossHealthBar(ctx, enemy.health, enemy.maxHealth, bossColor, 'DRONA-BOTANIKA');

    } else if (enemy.type === 'cryo_boss') {
      // Sektor 2 Boss: Cryo-Titan (Ice Golem Mecha)
      const isStunned = enemy.bossAction === 'stunned';
      const isAiming = enemy.bossAction === 'aim';

      if (isStunned) {
        ctx.rotate(0.18); // Tilted lodged into ice
      }

      // Orbiting Freezing Ice Shards
      for (let s = 0; s < 4; s++) {
        const orbitAngle = time * 2.5 + (s * Math.PI * 2) / 4;
        const satX = Math.cos(orbitAngle) * 46;
        const satY = Math.sin(orbitAngle) * 24;
        ctx.save();
        ctx.fillStyle = '#bae6fd';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(satX, satY - 7);
        ctx.lineTo(satX + 5, satY);
        ctx.lineTo(satX, satY + 7);
        ctx.lineTo(satX - 5, satY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Crystalline Shoulder Spikes
      ctx.fillStyle = isFlashing ? '#ffffff' : '#0284c7';
      ctx.beginPath();
      ctx.moveTo(-36, -14);
      ctx.lineTo(-46, -34);
      ctx.lineTo(-24, -20);
      ctx.moveTo(36, -14);
      ctx.lineTo(46, -34);
      ctx.lineTo(24, -20);
      ctx.fill();

      // Main Glacial Torso Block
      ctx.fillStyle = isFlashing ? '#ffffff' : '#0369a1';
      ctx.fillRect(-28, -20, 56, 42);
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-28, -20, 56, 42);

      // Ice Armor Plates
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-22, -14, 44, 10);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(-18, 2, 36, 14);

      // Titan Crown Horn
      ctx.fillStyle = '#e0f2fe';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(-16, -20);
      ctx.lineTo(0, -42);
      ctx.lineTo(16, -20);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Glowing Eyes
      ctx.fillStyle = isAiming ? '#ef4444' : isStunned ? '#64748b' : '#ffffff';
      ctx.shadowColor = isAiming ? '#f87171' : '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(-10, -8, 4, 0, Math.PI * 2);
      ctx.arc(10, -8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Slam Telegraph Laser Line
      if (isAiming) {
        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
        ctx.setLineDash([6, 4]);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 20);
        ctx.lineTo(0, 250);
        ctx.stroke();
        ctx.restore();
      }

      // Stunned Dizzy Stars Animation & Clear Hint
      if (isStunned) {
        ctx.save();
        // Orbiting Dizzy Stars
        for (let k = 0; k < 3; k++) {
          const starAngle = time * 7 + (k * Math.PI * 2) / 3;
          const starX = Math.cos(starAngle) * 26;
          const starY = Math.sin(starAngle) * 12 - 40;
          ctx.fillStyle = '#fde047';
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(starX, starY, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
        // Floating Call-To-Action Text
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 11px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ca8a04';
        ctx.shadowBlur = 10;
        ctx.fillText('TERTANCAP! INJAK KEPALANYA!', 0, -52);
        ctx.restore();
      }

      // Boss Health Bar
      renderBossHealthBar(ctx, enemy.health, enemy.maxHealth, '#38bdf8', 'CRYO-TITAN');

    } else if (enemy.type === 'pyro_boss') {
      // Sektor 3 Boss: Magma-Vulcanor (Heavy Armored Volcanic Beetle)
      const isOverheating = enemy.bossAction === 'overheat';

      // 6 Heavy Mechanical Chitin Legs
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let leg = -20; leg <= 20; leg += 20) {
        const legWalk = Math.sin(time * 8 + leg) * 6;
        ctx.moveTo(leg, 16);
        ctx.lineTo(leg - 14, 34 + (isOverheating ? 0 : legWalk));
        ctx.moveTo(leg, 16);
        ctx.lineTo(leg + 14, 34 - (isOverheating ? 0 : legWalk));
      }
      ctx.stroke();

      // Basalt Body Carapace
      ctx.fillStyle = isFlashing ? '#ffffff' : '#292524';
      ctx.beginPath();
      ctx.arc(0, 10, 36, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Twin Mortar Cannons on Shell
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(-28, -12, 14, 22);
      ctx.fillRect(14, -12, 14, 22);
      // Cannon Muzzle Glow
      ctx.fillStyle = '#f97316';
      ctx.shadowColor = '#fb923c';
      ctx.shadowBlur = 8;
      ctx.fillRect(-26, -14, 10, 4);
      ctx.fillRect(16, -14, 10, 4);
      ctx.shadowBlur = 0;

      // Glowing Magma Core Vent
      if (isOverheating) {
        // Carapace vents open, blazing yellow heart revealed
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Overheat Action Callout
        ctx.save();
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 10px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ea580c';
        ctx.shadowBlur = 10;
        ctx.fillText('OVERHEAT! INJAK DARI GEYSER!', 0, -42);
        ctx.restore();
      } else {
        // Slit glowing eyes & vents
        ctx.fillStyle = '#f97316';
        ctx.shadowColor = '#ea580c';
        ctx.shadowBlur = 10;
        ctx.fillRect(-12, 2, 24, 6);
        ctx.shadowBlur = 0;
      }

      // Boss Health Bar
      renderBossHealthBar(ctx, enemy.health, enemy.maxHealth, '#f97316', 'MAGMA-VULCANOR');

    } else if (enemy.type === 'zorgax_boss') {
      // Final Boss Zorgax: Floating Mecha Commander
      const hover = Math.sin(time * 3) * 6;
      ctx.translate(0, hover);

      // Phase 3 Enrage Aura
      if (enemy.health <= 2) {
        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(0, 0, 48 + Math.sin(time * 12) * 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Billowing Cyber-Cape behind
      ctx.save();
      ctx.fillStyle = 'rgba(76, 29, 149, 0.7)';
      ctx.beginPath();
      ctx.moveTo(-28, -20);
      const capeWave1 = Math.sin(time * 4) * 8;
      const capeWave2 = Math.cos(time * 4) * 8;
      ctx.quadraticCurveTo(-45 + capeWave1, 15, -35 + capeWave2, 45);
      ctx.lineTo(35 + capeWave1, 45);
      ctx.quadraticCurveTo(45 + capeWave2, 15, 28, -20);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Heavy Mecha Pauldrons (Shoulders)
      ctx.fillStyle = isFlashing ? '#ffffff' : '#1e1b4b';
      ctx.fillRect(-38, -35, 76, 24);
      ctx.fillStyle = '#4338ca';
      ctx.fillRect(-36, -33, 20, 8);
      ctx.fillRect(16, -33, 20, 8);

      // Mecha Torso
      ctx.fillStyle = isFlashing ? '#ffffff' : '#312e81';
      ctx.fillRect(-26, -10, 52, 46);

      // Dark Matter Reactor Core (Violet/Crimson Pulse)
      const corePulse = Math.sin(time * 8) * 0.3 + 0.7;
      ctx.fillStyle = isFlashing ? '#ffffff' : (enemy.health <= 2 ? '#ef4444' : '#a855f7');
      ctx.shadowColor = enemy.health <= 2 ? '#f87171' : '#c084fc';
      ctx.shadowBlur = 18 * corePulse;
      ctx.beginPath();
      ctx.arc(0, 10, 14, 0, Math.PI * 2);
      ctx.fill();

      // Horned Cyborg Head
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-18, -48, 36, 20);

      // Menacing Horns
      ctx.fillStyle = '#4c1d95';
      ctx.beginPath();
      ctx.moveTo(-18, -48);
      ctx.lineTo(-28, -60);
      ctx.lineTo(-12, -48);
      ctx.moveTo(18, -48);
      ctx.lineTo(28, -60);
      ctx.lineTo(12, -48);
      ctx.fill();

      // Laser Scanner Visor with scanning blip
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#f87171';
      ctx.shadowBlur = 10;
      ctx.fillRect(-12, -42, 24, 6);
      ctx.fillStyle = '#ffffff';
      const zorgaxScan = Math.sin(time * 5) * 8;
      ctx.fillRect(zorgaxScan - 2, -42, 4, 6);
      ctx.shadowBlur = 0;

      // Heavy Arm Blaster Cannons
      ctx.fillStyle = isFlashing ? '#ffffff' : '#4c1d95';
      ctx.fillRect(-44, -14, 14, 38);
      ctx.fillRect(30, -14, 14, 38);
      // Blaster Muzzle Charge Glow
      ctx.fillStyle = '#a855f7';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 8;
      ctx.fillRect(-42, 22, 10, 4);
      ctx.fillRect(32, 22, 10, 4);
      ctx.shadowBlur = 0;

      // Final Boss Health Bar
      renderBossHealthBar(ctx, enemy.health, enemy.maxHealth, enemy.health <= 2 ? '#ef4444' : '#a855f7', 'EMPEROR ZORGAX');
    }

    ctx.restore();
  }
}

function renderBossHealthBar(
  ctx: CanvasRenderingContext2D,
  current: number,
  max: number,
  color: string,
  bossName: string = 'BOSS'
) {
  const barW = 74;
  const barH = 7;
  ctx.save();

  // Boss Name
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 9px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 4;
  ctx.fillText(bossName, 0, -56);

  // Background
  ctx.fillStyle = '#090d16';
  ctx.fillRect(-barW / 2 - 1, -48, barW + 2, barH + 2);

  // Health fill
  ctx.fillStyle = color;
  const fillW = Math.max(0, (current / max) * barW);
  ctx.fillRect(-barW / 2, -47, fillW, barH);

  // Border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.strokeRect(-barW / 2 - 1, -48, barW + 2, barH + 2);

  ctx.restore();
}

function renderProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[]) {
  for (const proj of projectiles) {
    ctx.save();
    ctx.fillStyle = proj.color;
    ctx.shadowColor = proj.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function renderParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
  fillColor: string,
  strokeColor: string
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.shadowColor = strokeColor;
  ctx.shadowBlur = 8;
  ctx.fill();
}
