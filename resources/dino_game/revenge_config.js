

export const REVENGE_CONFIG = {
  STARTING_BONES: 65,
  CLICK_REWARD: 2,
  CLICK_PER_WAVE: 2,
  BASE_CPS: 2,

  MAX_HP: 350,
  IFRAME_MS: 600,
  HURT_ESCAPE_PAUSE_MS: 300,

  ESCAPE_FILL_PER_SECOND_AT_BASE_SPEED: 1.05,
  ESCAPE_WAVE_BONUS: 0.08,
  WAVE_ESCAPE_STEP: 20,

  SLOW_DURATION_MS: 1500,
  SLOW_SPEED_FACTOR: 0.45,
  SLOW_ESCAPE_FACTOR: 0.35,

  SPAWN_STACK_OFFSET: 30,
  MAX_LIVE_OBSTACLES: 7,
  METEOR_COOLDOWN_MS: 3500,

  PTERO_DUCK_LOCK_MS: 600,
  PTERO_MISS_CHANCE: 0.4,
  PTERO_MISS_FLOOR: 0.3,
  COMBO_WINDOW_MS: 1500,
  COMBO_BONUS_DAMAGE: 10,

  HAZARDS: {
    bush: {
      id: "bush",
      label: "Cacto",
      hotkey: "1",
      typeName: "CACTUS_SMALL",
      cost: 15,
      damage: 10,
      slow: false,
    },
    ptero: {
      id: "ptero",
      label: "Pterodáctilo",
      hotkey: "2",
      typeName: "PTERODACTYL",
      cost: 35,
      damage: 25,
      slow: false,
      preferredYPos: 75,
    },
    boulder: {
      id: "boulder",
      label: "Cacto Grande",
      hotkey: "3",
      typeName: "CACTUS_LARGE",
      cost: 25,
      damage: 20,
      slow: true,
    },
    meteor: {
      id: "meteor",
      label: "Meteoro",
      cost: 140,
      hotkey: "4",
      damage: 30,
    },
  },
};
