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

export const CALISTHENICS_WARMUP = [
  { id: 'w1', name: 'Jumping Jacks', duration: '60 sec', reps: '40 reps', category: 'Cardio' },
  { id: 'w2', name: 'Arm Circles & Shoulder Dislocates', duration: '45 sec', reps: '20 forward / 20 reverse', category: 'Mobility' },
  { id: 'w3', name: 'Bodyweight Push-ups', duration: '45 sec', reps: '15 - 20 reps', category: 'Upper Body' },
  { id: 'w4', name: 'Deep Bodyweight Squats', duration: '60 sec', reps: '20 reps', category: 'Lower Body' },
  { id: 'w5', name: 'High Knees / Mountain Climbers', duration: '45 sec', reps: '30 reps', category: 'Core & Warmup' }
];

export const STRETCH_AND_ABS_COOLDOWN = [
  { id: 'c1', name: 'Plank Hold', duration: '60 sec', type: 'abs', target: 'Core Stability' },
  { id: 'c2', name: 'Bicycle Crunches', reps: '25 reps per side', type: 'abs', target: 'Obliques' },
  { id: 'c3', name: 'Hanging / Lying Leg Raises', reps: '15 - 20 reps', type: 'abs', target: 'Lower Abs' },
  { id: 'c4', name: 'Cobra Chest & Ab Stretch', duration: '45 sec', type: 'stretch', target: 'Abdominals' },
  { id: 'c5', name: 'Standing Quad & Hamstring Stretch', duration: '60 sec', type: 'stretch', target: 'Lower Body Mobility' },
  { id: 'c6', name: 'Doorway Pec & Lat Stretch', duration: '45 sec', type: 'stretch', target: 'Upper Body' }
];

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
  { id: 'e12', name: 'Leg Press', muscle: 'Legs' }
];
