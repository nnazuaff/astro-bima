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
  renderGoalAltar(ctx, state.levelWidth - 240, 380, worldId, time);

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

function renderGoalAltar(ctx: CanvasRenderingContext2D, x: number, y: number, worldId: WorldId, time: number) {
  ctx.save();
  ctx.translate(x, y);

  // Ancient Altar Pedestal
  ctx.fillStyle = '#334155';
  ctx.fillRect(-35, 30, 70, 40);
  ctx.fillStyle = '#475569';
  ctx.fillRect(-45, 60, 90, 20);

  // Floating Core Crystal Shard
  const floatY = Math.sin(time * 3) * 10;
  ctx.translate(0, floatY);

  const crystalColor = worldId === 'hutan-neon' ? '#10b981' :
                       worldId === 'kristal-es' ? '#38bdf8' :
                       worldId === 'gurun-vulkanik' ? '#f97316' : '#a855f7';

  ctx.shadowColor = crystalColor;
  ctx.shadowBlur = 24;

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
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fill();

  // Orbiting stardust ring
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 32, 10, time * 2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function renderPlayer(ctx: CanvasRenderingContext2D, p: any, time: number) {
  ctx.save();
  ctx.translate(p.x + p.width / 2, p.y + p.height / 2);

  // Blinking when invulnerable
  if (p.invulnerableTimer > 0 && Math.floor(time * 16) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }

  // Facing direction
  if (p.facing === 'left') {
    ctx.scale(-1, 1);
  }

  // Scale if Serum Giga
  const isGiga = p.powerUp === 'serum_giga';
  const scale = isGiga ? 1.3 : 1.0;
  ctx.scale(scale, scale);

  // Shield Bubble effect around Bima
  const hasShield = p.tempBuffs.some((b: any) => b.type === 'shield');
  if (hasShield) {
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Jetpack on back
  if (p.powerUp === 'jetpack') {
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-16, -10, 6, 18);
    // Exhaust thruster flame
    if (!p.isGrounded || p.isGliding) {
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(-16, 8);
      ctx.lineTo(-13, 16 + Math.random() * 6);
      ctx.lineTo(-10, 8);
      ctx.fill();
    }
  }

  // Striped Raccoon Tail
  const tailAngle = Math.sin(time * 8 + p.vx) * 0.3;
  ctx.save();
  ctx.translate(-10, 6);
  ctx.rotate(-0.4 + tailAngle);
  // Tail segments (grey and black stripes)
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.ellipse(-10, 0, 12, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-14, -5, 5, 10);
  ctx.fillRect(-6, -5, 5, 10);
  ctx.restore();

  // Bima Body (Space suit: White & Teal)
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.ellipse(0, 6, 11, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  // Teal suit chest insignia
  ctx.fillStyle = '#0d9488';
  ctx.fillRect(-5, 0, 10, 8);
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(0, 4, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Running Legs
  const legOffset = p.isGrounded ? Math.sin(time * 14 * Math.abs(p.vx || 1)) * 5 : 0;
  ctx.fillStyle = '#334155';
  // Left leg
  ctx.fillRect(-8, 16, 5, 8 + legOffset);
  // Right leg
  ctx.fillRect(3, 16, 5, 8 - legOffset);

  // Space Helmet & Visor (Raccoon Ears poking out!)
  // Left Ear
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(-10, -12);
  ctx.lineTo(-14, -22);
  ctx.lineTo(-6, -16);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-9, -13);
  ctx.lineTo(-12, -19);
  ctx.lineTo(-7, -15);
  ctx.fill();

  // Right Ear
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(6, -16);
  ctx.lineTo(14, -22);
  ctx.lineTo(10, -12);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(7, -15);
  ctx.lineTo(12, -19);
  ctx.lineTo(9, -13);
  ctx.fill();

  // Glass Helmet Dome
  ctx.fillStyle = 'rgba(241, 245, 249, 0.9)';
  ctx.beginPath();
  ctx.arc(0, -10, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Helmet Visor (Tinted Gold / Cyan Glass)
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.ellipse(3, -10, 9, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Raccoon Mask inside visor
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, -12, 10, 4);

  // Visor Light Glint Reflection
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(1, -12, 4, 1.5, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // Arms / Energy Glove
  if (p.powerUp === 'energy_glove') {
    ctx.fillStyle = '#a855f7';
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(8, 6, 6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#0d9488';
    ctx.fillRect(6, 2, 5, 8);
  }

  ctx.restore();
}

function renderEnemies(ctx: CanvasRenderingContext2D, enemies: Enemy[], time: number) {
  for (const enemy of enemies) {
    if (enemy.isDefeated) continue;

    ctx.save();
    ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);

    if (enemy.type === 'botlet') {
      // Sentry dome robot
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(0, -4, 15, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-15, -4, 30, 14);

      // Blinking red scanner eye
      const eyeScan = Math.sin(time * 5) * 6;
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#f87171';
      ctx.shadowBlur = 6;
      ctx.fillRect(eyeScan - 3, -1, 6, 4);

      // Walking feet
      const footSwing = Math.sin(time * 12) * 4;
      ctx.fillStyle = '#334155';
      ctx.fillRect(-12, 10, 8, 6 + footSwing);
      ctx.fillRect(4, 10, 8, 6 - footSwing);
    } else if (enemy.type === 'spikon') {
      // Spiky static hazard crystal
      ctx.fillStyle = '#475569';
      ctx.fillRect(-15, 6, 30, 10);

      // Glowing dangerous sharp spikes
      ctx.fillStyle = '#e11d48';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 8;
      for (let i = -12; i <= 12; i += 8) {
        ctx.beginPath();
        ctx.moveTo(i - 4, 6);
        ctx.lineTo(i, -14);
        ctx.lineTo(i + 4, 6);
        ctx.fill();
      }
    } else if (enemy.type === 'layangbot') {
      // Flying drone
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();

      // Twin spinning rotors
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-18, -14, 36, 3);

      // Blue sensor eye
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#7dd3fc';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (enemy.type === 'iceslider') {
      // Crystal spiked puck
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(0, 4, 16, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      // Sharp horn
      ctx.fillStyle = '#bae6fd';
      ctx.beginPath();
      ctx.moveTo(enemy.facing === 'right' ? 14 : -14, 4);
      ctx.lineTo(enemy.facing === 'right' ? 24 : -24, 0);
      ctx.lineTo(enemy.facing === 'right' ? 14 : -14, -4);
      ctx.fill();
    } else if (enemy.type === 'geyserbug') {
      // Molten armored bug
      ctx.fillStyle = '#9a3412';
      ctx.beginPath();
      ctx.arc(0, 4, 16, Math.PI, 0);
      ctx.fill();
      // Fiery glowing abdomen
      ctx.fillStyle = '#f97316';
      ctx.shadowColor = '#fb923c';
      ctx.shadowBlur = 8;
      ctx.fillRect(-8, -4, 16, 6);
    } else if (enemy.type === 'drona_boss') {
      // Mini-boss Drona
      const bossColor = enemy.phase === 1 ? '#10b981' : enemy.phase === 2 ? '#0284c7' : '#ea580c';
      // Outer rotating shield ring
      ctx.save();
      ctx.rotate(time * 2);
      ctx.strokeStyle = bossColor;
      ctx.lineWidth = 4;
      ctx.shadowColor = bossColor;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.ellipse(0, 0, 36, 16, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Main Orb Chassis
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Center Eye
      ctx.fillStyle = bossColor;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();

      // Boss Health Bar above head
      renderBossHealthBar(ctx, enemy.health, enemy.maxHealth, bossColor);
    } else if (enemy.type === 'zorgax_boss') {
      // Final Boss Zorgax
      ctx.fillStyle = '#1e1b4b';
      // Heavy Mecha Shoulders
      ctx.fillRect(-38, -35, 76, 25);
      // Torso
      ctx.fillStyle = '#312e81';
      ctx.fillRect(-28, -10, 56, 45);

      // Core Reactor (Flashes violet/crimson)
      const corePulse = Math.sin(time * 8) * 0.3 + 0.7;
      ctx.fillStyle = '#a855f7';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 18 * corePulse;
      ctx.beginPath();
      ctx.arc(0, 10, 14, 0, Math.PI * 2);
      ctx.fill();

      // Menacing Horned Cyborg Visor
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-18, -48, 36, 20);
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#f87171';
      ctx.shadowBlur = 10;
      ctx.fillRect(-12, -42, 24, 6);

      // Dual Arm Laser Cannons
      ctx.fillStyle = '#4c1d95';
      ctx.fillRect(-44, -15, 14, 38);
      ctx.fillRect(30, -15, 14, 38);

      // Final Boss Health Bar
      renderBossHealthBar(ctx, enemy.health, enemy.maxHealth, '#a855f7');
    }

    ctx.restore();
  }
}

function renderBossHealthBar(ctx: CanvasRenderingContext2D, current: number, max: number, color: string) {
  const barW = 64;
  const barH = 6;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-barW / 2, -46, barW, barH);
  ctx.fillStyle = color;
  const fillW = (current / max) * (barW - 2);
  ctx.fillRect(-barW / 2 + 1, -45, fillW, barH - 2);
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
