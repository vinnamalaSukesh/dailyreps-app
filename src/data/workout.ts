import type { Exercise } from '../lib/types';

/**
 * Your routine. Edit freely: order = play order.
 * Images: drop PNGs in assets/exercises/ and reference them with require(...).
 * Leave `image` out and the player shows the name only.
 */
export const ROUTINE_NAME = 'Morning mobility + strength';

const img = {
  catCow: require('../../assets/exercises/cat-cow-pose.png'),
  cossack: require('../../assets/exercises/cossack-squats.webp'),
  inchworm: require('../../assets/exercises/inchworm-to-pike-pushup.jpg'),
  bulgarian: require('../../assets/exercises/bulgarian-split-squat.webp'),
  decline: require('../../assets/exercises/decline-push-up.jpg'),
  bridge: require('../../assets/exercises/sinlge-leg-glute-bridges.jpg'),
  cobra: require('../../assets/exercises/child-to-cobra-pose.webp'),
};

const REST = 20; // between exercises
const SWITCH = 10; // between legs

export const ROUTINE: Exercise[] = [
  { name: 'Cat-Cow to Thoracic Reach', image: img.catCow, durationSec: 60, restSec: REST, cue: 'Slow breaths. Reach the arm up and open the chest' },
  { name: 'Deep Cossack Squats', image: img.cossack, durationSec: 120, restSec: REST, cue: 'Side to side, heel down, chest up' },
  { name: 'Inchworm to Pike Push-Up', image: img.inchworm, durationSec: 90, restSec: REST, cue: 'Walk out, hips high, head toward the floor' },
  { name: 'Bulgarian Split Squat, left leg', image: img.bulgarian, durationSec: 60, restSec: SWITCH, cue: 'Rear foot on bed or chair' },
  { name: 'Bulgarian Split Squat, right leg', image: img.bulgarian, durationSec: 60, restSec: REST, cue: 'Rear foot on bed or chair' },
  { name: 'Decline Push-Ups', image: img.decline, durationSec: 90, restSec: REST, cue: 'Feet on bed or chair, body straight' },
  { name: 'Single-Leg Glute Bridge, left leg', image: img.bridge, durationSec: 30, restSec: 5, cue: 'Squeeze at the top' },
  { name: 'Single-Leg Glute Bridge, right leg', image: img.bridge, durationSec: 30, restSec: REST, cue: 'Squeeze at the top' },
  { name: 'Cobra to Child’s Pose Flow', image: img.cobra, durationSec: 60, restSec: 0, cue: 'Move with your breath' },
];

export const totalSeconds = (r: Exercise[]) => r.reduce((s, e) => s + e.durationSec + e.restSec, 0);
