export const DEFAULT_MACROS = {
  calories: 2400,
  protein: 180, // grams
  carbs: 250,   // grams
  fat: 70       // grams
};

export const MEASUREMENT_GUIDES = {
  waist: {
    title: 'Waist Size',
    description: 'Wrap a flexible measuring tape horizontally around your abdomen at the level of your navel (belly button). Keep the tape parallel to the floor, snug against the skin without compressing it, and measure at the end of a normal exhale.',
    tip: 'Do not suck in your stomach! Keep your posture natural for consistent tracking.',
    icon: 'Ruler'
  },
  bicep: {
    title: 'Bicep Size (Peak)',
    description: 'Raise your arm to shoulder height and flex your bicep at a 90-degree angle. Measure around the fullest, highest peak of the bicep muscle.',
    tip: 'Measure both Left and Right arms to monitor muscle symmetry.',
    icon: 'Activity'
  },
  chest: {
    title: 'Chest Circumference',
    description: 'Stand straight with arms slightly raised. Wrap the tape around the widest part of your chest, keeping it level under the armpits and across the nipple line.',
    tip: 'Breathe out naturally right before reading the tape.',
    icon: 'Shield'
  },
  thigh: {
    title: 'Thigh Size',
    description: 'Stand with your feet shoulder-width apart. Wrap the measuring tape around the thickest part of your upper thigh, just below the gluteal fold.',
    tip: 'Keep your leg relaxed without tensing the quad muscle.',
    icon: 'Zap'
  }
};

// Mon/Wed/Fri Special Cardio & Calves/Tibialis Routine
export const MON_WED_FRI_ROUTINE = {
  title: 'Mon / Wed / Fri Cardio & Calves / Tibialis Routine',
  items: [
    { id: 'mwf1', name: 'Rope Jumps (Switching Single Leg)', reps: '50 reps', category: 'Cardio' },
    { id: 'mwf2', name: 'Double Unders', reps: '50 reps', category: 'Cardio' },
    { id: 'mwf3', name: 'Calf Machine (Weight Log)', sets: 3, reps: '12 - 15 reps', rest: '30s', restSec: 30, category: 'Calves' },
    {
      id: 'mwf4',
      name: 'SUPERSET: Tibialis Raises + Abs Crunches + Russian Swings',
      isSuperset: true,
      exercises: ['Tibialis Raises (15 reps)', 'Abs Crunches (20 reps)', 'Russian Swings (20 reps)'],
      sets: 3,
      rest: '10s',
      restSec: 10,
      category: 'Superset Core'
    }
  ]
};

// Complete Weekly Split Program
export const WEEKLY_WORKOUT_SPLIT = {
  Saturday: {
    dayName: 'Leg Day (Saturday)',
    tag: 'Leg Focus',
    warmupTitle: 'Leg Day Dynamic Warmup',
    warmup: [
      { id: 'leg_w1', name: 'Burpees (30s rest)', reps: '20 reps', rest: 30 },
      { id: 'leg_w2', name: 'Plank Up Down with Knee Drive (30s rest)', duration: '45 sec', rest: 30 },
      { id: 'leg_w3', name: 'Hollow Position (30s) + Superman (30s) [Set 1]', duration: '60 sec', rest: 30 },
      { id: 'leg_w4', name: 'Hollow Position (30s) + Superman (30s) [Set 2]', duration: '60 sec', rest: 30 },
      { id: 'leg_w5', name: 'Deep Squat to Hamstring Stretch', reps: '10 reps' },
      { id: 'leg_w6', name: 'Standing Lunges', reps: '20 reps' },
      { id: 'leg_w7', name: 'Deep Air Squats', reps: '20 reps' },
      { id: 'leg_w8', name: 'Hyperextensions (10 Bodyweight + 10 with 20kg)', reps: '20 reps' }
    ],
    mainExercises: [
      { id: 'sat_m1', name: 'Powerlifting Back Squat', targetSets: 4, targetReps: 6, restSec: 180, note: 'Rest 3 min between sets' },
      { id: 'sat_m2', name: 'Deep Squat', targetSets: 3, targetReps: 8, restSec: 180, note: 'Rest 3 min' },
      {
        id: 'sat_m3',
        name: 'SUPERSET: Squat Machine + Romanian Deadlift',
        isSuperset: true,
        subExercises: ['Squat Machine (10 reps)', 'Romanian Deadlift (10 reps)'],
        targetSets: 4,
        restSec: 120,
        note: 'Rest 2 min between sets'
      },
      {
        id: 'sat_m4',
        name: 'SUPERSET: Leg Press + Bulgarian Split Squat',
        isSuperset: true,
        subExercises: ['Leg Press (12 reps)', 'Bulgarian Split Squat (10 reps/leg)'],
        targetSets: 3,
        restSec: 180,
        note: 'Rest 3 min'
      }
    ],
    cooldown: [
      { id: 'sat_c1', name: 'Full Leg Stretch & Mobility', duration: '5 min', type: 'stretch' }
    ]
  },

  Sunday: {
    dayName: 'Chest Day (Sunday)',
    tag: 'Chest & Back',
    warmupTitle: 'Upper Body Dynamic Warmup',
    warmup: [
      { id: 'ch_w1', name: 'Shoulder Pass Through', reps: '15 reps' },
      { id: 'ch_w2', name: '500m Rowing Machine', duration: '500m' },
      { id: 'ch_w3', name: 'Plank Up Down with Knee Drive', duration: '45 sec', rest: 30 },
      { id: 'ch_w4', name: 'Hollow Position (30s) + Superman (30s) [Set 1]', duration: '60 sec', rest: 30 },
      { id: 'ch_w5', name: 'Hollow Position (30s) + Superman (30s) [Set 2]', duration: '60 sec', rest: 30 },
      { id: 'ch_w6', name: 'Deep Squat to Hamstring Stretch', reps: '10 reps' }
    ],
    mainExercises: [
      { id: 'sun_m1', name: 'Weighted Dips', targetSets: 4, targetReps: 8, restSec: 120, note: 'Rest 2 min' },
      {
        id: 'sun_m2',
        name: 'SUPERSET: Flat Bench Press + Supinated Pull-ups (15 reps)',
        isSuperset: true,
        subExercises: ['Flat Bench Press (8 reps)', 'Supinated Pull-ups (15 reps)'],
        targetSets: 4,
        restSec: 180,
        note: 'Rest 3 min'
      },
      { id: 'sun_m3', name: 'Lat Pulldown', targetSets: 4, targetReps: 10, restSec: 120, note: 'Rest 2 min' },
      { id: 'sun_m4', name: 'Incline Dumbbell Bench Press', targetSets: 3, targetReps: 10, restSec: 180, note: 'Rest 3 min' },
      { id: 'sun_m5', name: 'Seated Cable Row', targetSets: 3, targetReps: 12, restSec: 120, note: 'Rest 2 min' },
      { id: 'sun_m6', name: 'Weighted Pull-ups', targetSets: 3, targetReps: 6, restSec: 180, note: 'Rest 3 min' }
    ],
    cooldown: [
      { id: 'sun_c1', name: 'Toes To Bar', reps: '20 reps', targetSets: 3, type: 'abs' },
      { id: 'sun_c2', name: 'Hanging Windshield Wipers', reps: '6 reps per side', targetSets: 3, type: 'abs' },
      { id: 'sun_c3', name: "Child's Pose", duration: '1 min', type: 'stretch' },
      { id: 'sun_c4', name: 'Lying Chest Opener Stretch', duration: '1 min', type: 'stretch' },
      { id: 'sun_c5', name: 'Cat-Cow Stretch', duration: '30 sec', type: 'stretch' },
      { id: 'sun_c6', name: 'Thread The Needle Stretch', duration: '30 sec', type: 'stretch' }
    ]
  },

  Monday: {
    dayName: 'Arm Day (Monday)',
    tag: 'Arms & Shoulders',
    warmupTitle: 'Upper Body Dynamic Warmup + Mon/Wed/Fri Cardio',
    includeMonWedFri: true,
    warmup: [
      { id: 'arm_w1', name: 'Shoulder Pass Through', reps: '15 reps' },
      { id: 'arm_w2', name: '500m Rowing Machine (30s rest)', duration: '500m', rest: 30 },
      { id: 'arm_w3', name: 'Plank Up Down with Knee Drive', duration: '45 sec', rest: 30 },
      { id: 'arm_w4', name: 'Hollow Position (30s) + Superman (30s) [Set 1]', duration: '60 sec', rest: 30 },
      { id: 'arm_w5', name: 'Hollow Position (30s) + Superman (30s) [Set 2]', duration: '60 sec', rest: 30 },
      { id: 'arm_w6', name: 'Deep Squat to Hamstring Stretch', reps: '10 reps' }
    ],
    mainExercises: [
      { id: 'mon_m1', name: 'Dumbbell Shoulder Press', targetSets: 4, targetReps: 10, restSec: 180, note: 'Rest 3 min' },
      { id: 'mon_m2', name: 'Standing Bicep Curls', targetSets: 4, targetReps: 12, restSec: 120, note: 'Rest 2 min' },
      {
        id: 'mon_m3',
        name: 'SUPERSET: Lying Triceps Extension + Hammer Curls',
        isSuperset: true,
        subExercises: ['Lying Triceps Skullcrushers (10 reps)', 'Dumbbell Hammer Curls (10 reps)'],
        targetSets: 4,
        restSec: 180,
        note: 'Rest 3 min'
      },
      { id: 'mon_m4', name: 'Incline Dumbbell Bicep Curl', targetSets: 3, targetReps: 10, restSec: 120, note: 'Rest 2 min' },
      { id: 'mon_m5', name: 'Close Grip Bench Press', targetSets: 4, targetReps: 8, restSec: 180, note: 'Rest 3 min' }
    ],
    cooldown: [
      { id: 'mon_c1', name: 'Toes To Bar', reps: '20 reps', targetSets: 3, type: 'abs' },
      { id: 'mon_c2', name: 'Hanging Windshield Wipers', reps: '6 reps', targetSets: 3, type: 'abs' },
      { id: 'mon_c3', name: "Child's Pose", duration: '1 min', type: 'stretch' },
      { id: 'mon_c4', name: 'Lying Chest Opener Stretch', duration: '1 min', type: 'stretch' },
      { id: 'mon_c5', name: 'Cat-Cow Stretch', duration: '30 sec', type: 'stretch' },
      { id: 'mon_c6', name: 'Thread The Needle Stretch', duration: '30 sec', type: 'stretch' }
    ]
  },

  Tuesday: {
    dayName: 'Calisthenics Skill Focus (Tuesday)',
    tag: 'Calisthenics Focus',
    isCalisthenicsOnlyDay: true,
    warmupTitle: 'Bodyweight Skill & Core Warmup',
    warmup: [
      { id: 'tue_w1', name: 'Jumping Jacks & Arm Circles', duration: '60 sec' },
      { id: 'tue_w2', name: 'Plank Up Down with Knee Drive', duration: '45 sec' },
      { id: 'tue_w3', name: 'Hollow Position + Superman', duration: '60 sec' },
      { id: 'tue_w4', name: 'Deep Squat to Hamstring Stretch', reps: '10 reps' }
    ],
    mainExercises: [],
    cooldown: [
      { id: 'tue_c1', name: 'Full Calisthenics Shoulder & Wrist Stretch', duration: '5 min', type: 'stretch' }
    ]
  },

  Wednesday: {
    dayName: 'Leg Day #2 (Wednesday)',
    tag: 'Leg Focus #2',
    warmupTitle: 'Leg Day Warmup + Mon/Wed/Fri Cardio',
    includeMonWedFri: true,
    warmup: [
      { id: 'wed_w1', name: 'Burpees (30s rest)', reps: '20 reps', rest: 30 },
      { id: 'wed_w2', name: 'Plank Up Down with Knee Drive (30s rest)', duration: '45 sec', rest: 30 },
      { id: 'wed_w3', name: 'Hollow Position (30s) + Superman (30s) [Set 1]', duration: '60 sec', rest: 30 },
      { id: 'wed_w4', name: 'Hollow Position (30s) + Superman (30s) [Set 2]', duration: '60 sec', rest: 30 },
      { id: 'wed_w5', name: 'Deep Squat to Hamstring Stretch', reps: '10 reps' },
      { id: 'wed_w6', name: 'Standing Lunges', reps: '20 reps' },
      { id: 'wed_w7', name: 'Deep Air Squats', reps: '20 reps' },
      { id: 'wed_w8', name: 'Hyperextensions (10 Bodyweight + 10 with 20kg)', reps: '20 reps' }
    ],
    mainExercises: [
      { id: 'wed_m1', name: 'Conventional / Sumo Deadlift', targetSets: 4, targetReps: 5, restSec: 180, note: 'Rest 3 min' },
      { id: 'wed_m2', name: 'Barbell Front Squat', targetSets: 3, targetReps: 8, restSec: 180, note: 'Rest 3 min' },
      { id: 'wed_m3', name: 'Hack Squat Machine', targetSets: 3, targetReps: 10, restSec: 120, note: 'Rest 2 min' },
      {
        id: 'wed_m4',
        name: 'SUPERSET: Barbell Hip Thrust + Seated Hip Abduction',
        isSuperset: true,
        subExercises: ['Barbell Hip Thrust (12 reps)', 'Seated Hip Abduction (15 reps)'],
        targetSets: 4,
        restSec: 120,
        note: 'Rest 2 min'
      },
      { id: 'wed_m5', name: 'Leg Extension', targetSets: 3, targetReps: 12, restSec: 90, note: 'Rest 90s' },
      { id: 'wed_m6', name: 'Lying Leg Curl', targetSets: 3, targetReps: 12, restSec: 90, note: 'Rest 90s' }
    ],
    cooldown: [
      { id: 'wed_c1', name: '5 Min Deep Leg & Glute Stretch', duration: '5 min', type: 'stretch' }
    ]
  },

  Thursday: {
    dayName: 'Arm Day #2 & Calisthenics (Thursday)',
    tag: 'Arms & Calisthenics',
    warmupTitle: 'Calisthenics Skill & Upper Body Warmup',
    warmup: [
      { id: 'thu_w1', name: 'Shoulder Pass Through', reps: '15 reps' },
      { id: 'thu_w2', name: '500m Rowing Machine', duration: '500m' },
      { id: 'thu_w3', name: 'Plank Up Down with Knee Drive', duration: '45 sec', rest: 30 },
      { id: 'thu_w4', name: 'Hollow Position (30s) + Superman (30s) [Set 1]', duration: '60 sec', rest: 30 },
      { id: 'thu_w5', name: 'Hollow Position (30s) + Superman (30s) [Set 2]', duration: '60 sec', rest: 30 },
      { id: 'thu_w6', name: 'Deep Squat to Hamstring Stretch', reps: '10 reps' },
      { id: 'thu_w7', name: 'Handstand Hold / Practice', duration: '2 min' },
      { id: 'thu_w8', name: 'Gymnastic Ring Work (2 sets for MAX REPS)', reps: 'MAX REPS', targetSets: 2, rest: 90, note: '2 sets for MAX REPS' },
      { id: 'thu_w9', name: 'Front Lever Hold', duration: '1 min' },
      { id: 'thu_w10', name: 'L-Sit Hold', duration: '1 min' },
      { id: 'thu_w11', name: 'High Pulls', reps: '6 reps' },
      { id: 'thu_w12', name: '1-Arm Push-ups', reps: '6 reps' }
    ],
    mainExercises: [
      {
        id: 'thu_m1',
        name: 'SUPERSET: Dumbbell Lateral Raises + Rope Triceps Pushdown',
        isSuperset: true,
        subExercises: ['Dumbbell Lateral Raises (12 reps)', 'Rope Triceps Pushdown (12 reps)'],
        targetSets: 4,
        restSec: 120,
        note: 'Rest 2 min'
      },
      { id: 'thu_m2', name: 'Cable Bicep Curl', targetSets: 3, targetReps: 12, restSec: 90, note: 'Rest 90s' },
      { id: 'thu_m3', name: 'Cable Hammer Curls', targetSets: 4, targetReps: 12, restSec: 90, note: 'Rest 90s' },
      { id: 'thu_m4', name: 'Reverse Pec Deck (Rear Delt Fly)', targetSets: 4, targetReps: 15, restSec: 90, note: 'Rest 90s' },
      { id: 'thu_m5', name: 'Weighted Supinated Pull-ups', targetSets: 4, targetReps: 8, restSec: 180, note: 'Rest 3 min' }
    ],
    cooldown: [
      { id: 'thu_c1', name: 'Toes To Bar', reps: '20 reps', targetSets: 3, type: 'abs' },
      { id: 'thu_c2', name: 'Hanging Windshield Wipers', reps: '6 reps per side', targetSets: 3, type: 'abs' }
    ]
  },

  Friday: {
    dayName: 'Calisthenics & Cardio Day (Friday)',
    tag: 'Calisthenics & Cardio',
    isCalisthenicsOnlyDay: true,
    warmupTitle: 'Cardio Warmup + Mon/Wed/Fri Routine',
    includeMonWedFri: true,
    warmup: [
      { id: 'fri_w1', name: 'Jumping Jacks & Arm Circles', duration: '60 sec' },
      { id: 'fri_w2', name: 'Plank Up Down with Knee Drive', duration: '45 sec' },
      { id: 'fri_w3', name: 'Hollow Position + Superman', duration: '60 sec' }
    ],
    mainExercises: [],
    cooldown: [
      { id: 'fri_c1', name: 'Full Body Mobility & Cooldown Stretch', duration: '5 min', type: 'stretch' }
    ]
  }
};

export const MAX_1RM_TEST_EXERCISES = [
  { id: 'bench', name: 'Bench Press', unit: 'kg/lbs', description: 'Barbell Flat Bench Press 1-Rep Max' },
  { id: 'pullups', name: 'Weighted Pull-ups', unit: 'kg/lbs added', description: 'Strict Pull-up with extra weight attached' },
  { id: 'squat', name: 'Barbell Squat', unit: 'kg/lbs', description: 'Parallel Barbell Back Squat 1-Rep Max' },
  { id: 'deadlift', name: 'Deadlift', unit: 'kg/lbs', description: 'Conventional / Sumo Barbell Deadlift 1-Rep Max' }
];

export const PRESET_EXERCISES = [
  { id: 'e1', name: 'Barbell Bench Press', muscle: 'Chest' },
  { id: 'e2', name: 'Weighted Pull-ups', muscle: 'Back' },
  { id: 'e3', name: 'Barbell Back Squat', muscle: 'Legs' },
  { id: 'e4', name: 'Barbell Deadlift', muscle: 'Back & Hamstrings' },
  { id: 'e5', name: 'Incline Dumbbell Press', muscle: 'Chest' },
  { id: 'e6', name: 'Overhead Shoulder Press', muscle: 'Shoulders' },
  { id: 'e7', name: 'Barbell Bicep Curl', muscle: 'Biceps' },
  { id: 'e8', name: 'Tricep Rope Pushdown', muscle: 'Triceps' },
  { id: 'e9', name: 'Seated Cable Row', muscle: 'Back' },
  { id: 'e10', name: 'Romanian Deadlift', muscle: 'Hamstrings' },
  { id: 'e11', name: 'Lateral Dumbbell Raise', muscle: 'Shoulders' },
  { id: 'e12', name: 'Leg Press', muscle: 'Legs' },
  { id: 'e13', name: 'Leg Extension', muscle: 'Quads' },
  { id: 'e14', name: 'Lying Leg Curl', muscle: 'Hamstrings' }
];
