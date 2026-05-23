// Game configuration constants
export const ARENA_SIZE = 80;

export const TANK = {
  SPEED: 12,
  TURRET_SPEED: 8,
  CANNON_PITCH_SPEED: 4,
  CANNON_MIN_PITCH: -0.5,
  CANNON_MAX_PITCH: 0.15,
  HEADLIGHT_RANGE: 30,
  HEADLIGHT_INTENSITY: 10,
  FIRE_COOLDOWN: 0.25,
  MAX_HP: 100,
  BODY_SIZE: { x: 2.4, y: 0.5, z: 3.6 },
  TRACK_SIZE: { x: 0.5, y: 0.3, z: 3.8 },
  TURRET_RADIUS: 0.9,
  TURRET_HEIGHT: 0.5,
  CANNON_LENGTH: 2.0,
  CANNON_RADIUS: 0.15,
  WHEEL_RADIUS: 0.4,
};

export const BULLET = {
  SPEED: 40,
  LIFETIME: 2.0,
  DAMAGE: 25,
};

export const DRONE = {
  SPEED: 3,
  MAX_HP: 50,
  SPAWN_MARGIN: 10,
  DAMAGE_PER_SECOND: 15,
  SCORE_VALUE: 100,
};

export const COLORS = {
  CYAN: 0x00ffff,
  MAGENTA: 0xff00ff,
  PLAYER_BODY: 0x1a1a2e,
  PLAYER_TRACK: 0x222244,
  PLAYER_TURRET: 0x2a2a3e,
  CANNON: 0x16213e,
  DRONE: 0xff0044,
  BULLET: 0x00ffff,
  GROUND: 0x0a0a14,
  BOUNDARY: 0xff00ff,
  NEON_CYAN: 0x00ffff,
  NEON_MAGENTA: 0xff00ff,
};

export const STATE = {
  START: 'start',
  PLAYING: 'playing',
  GAMEOVER: 'gameover',
};
