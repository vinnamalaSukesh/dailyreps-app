import type { Exercise } from '../lib/types';

/**
 * Your routine. Edit freely: order = play order.
 * Images: drop PNGs in assets/exercises/ and reference them with require(...).
 * Leave `image` out and the player shows the name only.
 */
export const ROUTINE_NAME = 'Morning mobility + strength';

const img = {
  cossack: require('../../assets/exercises/cossack-squats.webp'),
  bulgarian: require('../../assets/exercises/bulgarian-split-squat.webp'),
  decline: require('../../assets/exercises/decline-push-up.jpg'),
  bridge: require('../../assets/exercises/sinlge-leg-glute-bridges.jpg'),
  cobra: require('../../assets/exercises/child-to-cobra-pose.webp'),
  ytw: require('../../assets/exercises/prone-ytw-raises.svg'),
  wristCurl: require('../../assets/exercises/wrist-curls.svg'),
  headLift: require('../../assets/exercises/chin-tuck-head-lift.svg'),
};

const REST = 20; // between exercises
const SWITCH = 10; // between legs

export const ROUTINE: Exercise[] = [
  { name: 'Prone Y-T-W Raises', image: img.ytw, durationSec: 60, restSec: REST, cue: 'Face down, thumbs up. Squeeze shoulder blades, hold 2s in each letter' },
  { name: 'Deep Cossack Squats', image: img.cossack, durationSec: 120, restSec: REST, cue: 'Side to side, heel down, chest up' },
  { name: 'Wrist Curls, palms up', image: img.wristCurl, durationSec: 45, restSec: 5, cue: 'Water bottle in hand, forearm on thigh. Only the wrist moves' },
  { name: 'Reverse Wrist Curls, palms down', image: img.wristCurl, durationSec: 45, restSec: REST, cue: 'Same setup, palms down. Slow on the way down' },
  { name: 'Bulgarian Split Squat, left leg', image: img.bulgarian, durationSec: 60, restSec: SWITCH, cue: 'Rear foot on bed or chair' },
  { name: 'Bulgarian Split Squat, right leg', image: img.bulgarian, durationSec: 60, restSec: REST, cue: 'Rear foot on bed or chair' },
  { name: 'Decline Push-Ups', image: img.decline, durationSec: 90, restSec: REST, cue: 'Feet on bed or chair, body straight' },
  { name: 'Single-Leg Glute Bridge, left leg', image: img.bridge, durationSec: 30, restSec: 5, cue: 'Squeeze at the top' },
  { name: 'Single-Leg Glute Bridge, right leg', image: img.bridge, durationSec: 30, restSec: REST, cue: 'Squeeze at the top' },
  { name: 'Cobra Stretch', image: img.cobra, durationSec: 30, restSec: SWITCH, cue: 'Hips down, press up gently, shoulders away from ears' },
  { name: 'Chin-Tuck Head Lifts', image: img.headLift, durationSec: 60, restSec: 0, cue: 'Lie flat, look at the ceiling. Tuck chin first, lift head an inch, hold 5s' },
];

export const totalSeconds = (r: Exercise[]) => r.reduce((s, e) => s + e.durationSec + e.restSec, 0);
