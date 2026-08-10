/**
 * OpenAI API Integration Service for GymsLab AI
 * Supports GPT-4o and GPT-4o-mini with visual analysis, memory-driven text reasoning, and custom meal planning.
 */

async function callOpenAI({ apiKey, messages, responseFormat = null, model = 'gpt-4o' }) {
  if (!apiKey) {
    throw new Error('OpenAI API Key is missing. Please set your key in App Settings.');
  }

  const payload = {
    model: model,
    messages: messages,
    temperature: 0.7,
  };

  if (responseFormat === 'json_object') {
    payload.response_format = { type: 'json_object' };
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (responseFormat === 'json_object') {
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  }

  return content;
}

/**
 * Baseline AI Onboarding Analysis
 */
export async function generateBaselineSummary(profile, apiKey) {
  const contentArray = [
    {
      type: 'text',
      text: `You are GymsLab AI, an elite high-performance fitness coach.
Analyze the user's initial onboarding baseline statistics and body progress photos:
- Height: ${profile.height} cm
- Starting Weight: ${profile.weight} kg
- Waist Size: ${profile.waist} cm
- Bicep Size: ${profile.bicepLeft} cm (L) / ${profile.bicepRight} cm (R)
- Chest Size: ${profile.chest || 'N/A'} cm
- Thigh Size: ${profile.thigh || 'N/A'} cm
- Target Weight Goal: ${profile.targetWeight} kg (${profile.goalType || 'Recomposition'})

Provide a professional, motivating initial assessment in JSON format with:
1. "analysis": A 3-4 paragraph baseline assessment of their current physique, waist-to-height ratio, and potential.
2. "recommendedMacros": { "calories": number, "protein": number, "carbs": number, "fat": number }
3. "keyFocusAreas": string array of 3 top priority focus areas (e.g. waist trim, chest hypertrophy, progressive overload).`
    }
  ];

  if (profile.photos) {
    if (profile.photos.front) contentArray.push({ type: 'image_url', image_url: { url: profile.photos.front } });
    if (profile.photos.side) contentArray.push({ type: 'image_url', image_url: { url: profile.photos.side } });
    if (profile.photos.back) contentArray.push({ type: 'image_url', image_url: { url: profile.photos.back } });
  }

  const messages = [
    { role: 'system', content: 'You respond only in valid JSON.' },
    { role: 'user', content: contentArray }
  ];

  return callOpenAI({ apiKey, messages, responseFormat: 'json_object', model: 'gpt-4o' });
}

/**
 * AI Food Photo + Optional Text Scanner - GPT-4o Vision
 */
export async function analyzeFoodPhoto(base64Image, textDescription, apiKey) {
  const promptText = `Identify the food item(s) in this photo ${textDescription ? `with additional user notes: "${textDescription}"` : ''}.
Estimate exact total weight/portions, and compute approximate nutrition.
Return JSON:
{
  "mealName": "Descriptive meal title",
  "calories": number,
  "protein": number (grams),
  "carbs": number (grams),
  "fat": number (grams),
  "confidence": "High" | "Medium" | "Low",
  "notes": "Brief nutritional advice or portion notes"
}`;

  const contentArray = [
    { type: 'text', text: promptText },
    { type: 'image_url', image_url: { url: base64Image } }
  ];

  const messages = [
    { role: 'system', content: 'You are an expert sports nutritionist AI. Analyze the food image and user notes, returning macros in JSON.' },
    { role: 'user', content: contentArray }
  ];

  return callOpenAI({ apiKey, messages, responseFormat: 'json_object', model: 'gpt-4o' });
}

/**
 * AI Food Text Scanner - GPT-4o Text Analysis
 */
export async function analyzeFoodText(textDescription, apiKey) {
  const messages = [
    { role: 'system', content: 'You are an expert sports nutritionist AI. Analyze the food text description and calculate macros in JSON.' },
    {
      role: 'user',
      content: `Analyze this meal text description: "${textDescription}"
Estimate exact total portion size, calories, and macros.

Return JSON:
{
  "mealName": "Descriptive meal title",
  "calories": number,
  "protein": number (grams),
  "carbs": number (grams),
  "fat": number (grams),
  "confidence": "High" | "Medium" | "Low",
  "notes": "Brief nutritional breakdown"
}`
    }
  ];

  return callOpenAI({ apiKey, messages, responseFormat: 'json_object', model: 'gpt-4o' });
}

/**
 * AI Custom Daily Meal Plan & Cooking Recipe Generator
 */
export async function generateMealPlan({ mealsPerDay, cravings, targetMacros, profile, chatHistory }, apiKey) {
  const systemPrompt = `You are a Master Sports Nutritionist & Elite Chef AI designing a custom daily meal plan for an athlete.

ATHLETE CONTEXT & STATS:
- Goal: ${profile?.goalType || 'Body Recomposition'}
- Current Weight: ${profile?.weight || 80} kg | Target Weight: ${profile?.targetWeight || 78} kg
- Height: ${profile?.height || 180} cm | Waist: ${profile?.waist || 85} cm
- Exercise Frequency: 5-6 Days per Week (Intense Resistance Training & Calisthenics)
- Daily Macro Goals: ${targetMacros.calories} kcal (${targetMacros.protein}g Protein, ${targetMacros.carbs}g Carbs, ${targetMacros.fat}g Fat)

CRITICAL NUTRITIONIST RULES:
1. USER INPUT ARE ONLY "WISHES/PREFERENCES". You are the Master Nutritionist who decides the optimal balance of whole foods, fiber, and micros.
2. DO NOT REPEAT THE SAME DISH! If the user requests a food (e.g. "salmon" or "eggs"), integrate it into 1 optimal meal. DO NOT generate 6 salmon poke bowls or repeat dishes across meals. Provide diverse, delicious, high-protein recipes.
3. MANDATORY ITEMS: ALWAYS include Creatine Monohydrate (5g) and a Whey Protein Shake in the daily schedule!
4. MEAL TIMING: Assign realistic approximate meal times between 07:00 AM and 22:00 PM (10:00 PM) for the ${mealsPerDay} meals.
5. STRICT MACRO TARGET MATCHING: The sum of calories and macros across all ${mealsPerDay} meals MUST match the target goals precisely: ${targetMacros.calories} kcal, ${targetMacros.protein}g Protein, ${targetMacros.carbs}g Carbs, ${targetMacros.fat}g Fat (within +/- 2% accuracy).

Return JSON format:
{
  "summary": "Brief 2-sentence nutritionist rationale explaining why this plan is optimal for the user's goals",
  "meals": [
    {
      "mealName": "Name of dish",
      "approxTime": "e.g. 07:00 AM",
      "category": "Breakfast | Lunch | Dinner | Post-Workout | Snack",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "ingredients": ["ingredient with weight/quantity"],
      "instructions": "Concise cooking instructions"
    }
  ]
}`;

  const apiMessages = [{ role: 'system', content: systemPrompt }];

  if (chatHistory && chatHistory.length > 0) {
    chatHistory.forEach((msg) => {
      if (msg.role === 'user') apiMessages.push({ role: 'user', content: msg.content });
      else if (msg.mealPlan) apiMessages.push({ role: 'assistant', content: JSON.stringify(msg.mealPlan) });
    });
  }

  const userMessage = cravings?.trim() || `Generate a custom ${mealsPerDay}-meal daily plan for today.`;
  apiMessages.push({ role: 'user', content: userMessage });

  return callOpenAI({ apiKey, messages: apiMessages, responseFormat: 'json_object', model: 'gpt-4o' });
}

/**
 * Daily 23:00 AI Executive Summary & Form Analysis with Multi-Workout & Past Photo Context
 */
export async function generateDaily23Summary(dailyLog, historicalMemory, videoFrames, weekendPhotos, pastWorkoutLogs, apiKey) {
  // Format Saved Workouts for Today cleanly
  const savedWorkoutsToday = (dailyLog.savedWorkouts || []).map((w, idx) => ({
    title: w.workoutName || `Workout #${idx + 1}`,
    time: w.timestamp || '',
    durationMinutes: Math.round((w.durationSecs || 0) / 60),
    totalVolumeKg: w.totalVolume || 0,
    totalSets: w.totalSets || 0,
    totalReps: w.totalReps || 0,
    exercises: (w.exercises || []).map((e) => ({
      name: e.name,
      sets: (e.sets || []).map((s) => `${s.weight}kg x ${s.reps} reps (${s.completed ? 'Done' : 'Incomplete'})`)
    }))
  }));

  const totalWorkoutTimeSecs = (dailyLog.workoutDurationSecs || 0) +
    (dailyLog.savedWorkouts || []).reduce((acc, w) => acc + (w.durationSecs || 0), 0);
  const totalWorkoutTimeMin = Math.round(totalWorkoutTimeSecs / 60);

  const contentArray = [
    {
      type: 'text',
      text: `You are GymsLab AI performing the Automatic Daily 23:00 End-of-Day Executive Assessment.
HISTORICAL MEMORY CONTEXT:
- Profile Goal: ${historicalMemory.profile?.goalType || 'Recomposition'} (Target Weight: ${historicalMemory.profile?.targetWeight || 'N/A'} kg)
- Baseline Waist: ${historicalMemory.profile?.waist || 'N/A'} cm
- Past Weight Trend (last 7 days): ${JSON.stringify(historicalMemory.recentWeights || [])}
- Past Daily Grades: ${JSON.stringify(historicalMemory.recentGrades || [])}
- Latest 1RM Strength Benchmark: ${JSON.stringify(historicalMemory.latest1RM || 'None logged yet')}
- PREVIOUS WORKOUT PERFORMANCE HISTORY (for comparison against today's lifts): ${JSON.stringify(pastWorkoutLogs || [])}

TODAY'S LOGGED METRICS (${dailyLog.date}):
- Morning Fast Weight: ${dailyLog.weight ? dailyLog.weight + ' kg' : 'Not logged'}
- TOTAL WORKOUT DURATION TODAY: ${totalWorkoutTimeMin} minutes (Total active session duration)
- COMPLETED WORKOUT OBJECTS RECORDED TODAY (${savedWorkoutsToday.length}): ${JSON.stringify(savedWorkoutsToday)}
- CURRENT ACTIVE EXERCISES LOGGED: ${JSON.stringify(dailyLog.exercises || [])}
- Total Macros Consumed: Calories: ${dailyLog.totalMacros?.calories || 0} / ${dailyLog.targetMacros?.calories || 2400} kcal, Protein: ${dailyLog.totalMacros?.protein || 0}g / ${dailyLog.targetMacros?.protein || 180}g, Carbs: ${dailyLog.totalMacros?.carbs || 0}g, Fat: ${dailyLog.totalMacros?.fat || 0}g
- Hydration: ${dailyLog.waterLiters || 0} / 3.5 Liters (${dailyLog.waterGoalMet ? 'Met ✓' : 'Not met'})
- Daily Steps: ${dailyLog.steps || 0} / 10,000 steps (${dailyLog.stepsGoalMet ? 'Met ✓' : 'Not met'})
- Daily Supplements: Creatine (5g): ${dailyLog.supplements?.creatine ? 'YES' : 'NO'}, Whey Protein: ${dailyLog.supplements?.protein ? 'YES' : 'NO'}
- Daily Vitamins: ${JSON.stringify(dailyLog.vitamins || {})}
- Calisthenics Skill Session: ${dailyLog.calisthenicsCompleted ? 'YES' : 'N/A'}
- Post-Workout Sauna: ${dailyLog.saunaCompleted ? 'YES' : 'N/A'}
- Warmup Completed: ${dailyLog.warmupCompleted ? 'YES' : 'NO'}
- Cooldown Stretch & Abs Completed: ${dailyLog.cooldownCompleted ? 'YES' : 'NO'}
- Form Videos Uploaded: ${dailyLog.videos?.length || 0} video clips recorded today.

Analyze today's total workout time, progressive overload (comparing today's weights, reps, and sets against past workout history), macro adherence, and lifestyle metrics.
If food photos or previous weekend/progress photos are attached below, evaluate diet quality and visual conditioning.

Return JSON:
{
  "grade": "A+" | "A" | "B" | "C" | "D",
  "goalAchieved": true | false,
  "headline": "Punchy 1-line executive title",
  "nutritionFeedback": "Detailed analysis of calories, macros, 3.5L hydration, and 10k steps",
  "workoutFeedback": "Detailed feedback on total workout time (${totalWorkoutTimeMin}m), exercises, weights, reps, sets, and progressive overload vs previous workouts",
  "formAnalysis": "Detailed form breakdown from uploaded videos or food photo assessment",
  "comparativeMemoryInsight": "How today compares to previous workouts, past weights, and baseline goals",
  "tomorrowRecommendation": "1-2 actionable strategies for tomorrow"
}`
    }
  ];

  // Attach form video keyframes
  if (videoFrames && videoFrames.length > 0) {
    videoFrames.forEach((frameBase64) => {
      contentArray.push({ type: 'image_url', image_url: { url: frameBase64 } });
    });
  }

  // Attach today's food photos & previous weekend photos
  if (dailyLog.foodPhotos && dailyLog.foodPhotos.length > 0) {
    dailyLog.foodPhotos.forEach((photo) => {
      if (photo?.url) contentArray.push({ type: 'image_url', image_url: { url: photo.url } });
    });
  }

  if (weekendPhotos && weekendPhotos.length > 0) {
    weekendPhotos.forEach((photoUrl) => {
      if (photoUrl) contentArray.push({ type: 'image_url', image_url: { url: photoUrl } });
    });
  }

  const messages = [
    { role: 'system', content: 'You respond only in valid JSON.' },
    { role: 'user', content: contentArray }
  ];

  return callOpenAI({ apiKey, messages, responseFormat: 'json_object', model: 'gpt-4o' });
}

/**
 * Weekly Sunday 23:00 AI Assessment with Multi-Photo Memory Vault (Oldest, Last Month, Newest) & 7 Daily AI Summaries
 */
export async function generateWeeklySummary(weeklyData, historicalMemory, allWeekDailySummaries, photoVault, apiKey) {
  const contentArray = [
    {
      type: 'text',
      text: `You are GymsLab AI conducting the Mandatory Automatic Sunday 23:00 Weekly Transformation Review.

BASELINE PROFILE & MEASUREMENTS:
- Baseline Starting Weight: ${historicalMemory.profile?.weight || 80} kg -> Target: ${historicalMemory.profile?.targetWeight || 78} kg
- Baseline Waist: ${historicalMemory.profile?.waist || 85} cm
- Baseline Left Bicep: ${historicalMemory.profile?.bicepLeft || 38} cm | Right: ${historicalMemory.profile?.bicepRight || 38.5} cm

CURRENT SUNDAY CHECK-IN DATA (${weeklyData.weekId || 'Current Week'}):
- Current Weight: ${weeklyData.weight || historicalMemory.profile?.weight || 80} kg
- Current Waist: ${weeklyData.waist || historicalMemory.profile?.waist || 85} cm
- Current Left Bicep: ${weeklyData.bicepLeft || 38} cm | Right: ${weeklyData.bicepRight || 38.5} cm
- Current Chest: ${weeklyData.chest || 104} cm

ALL 7 DAILY AI SUMMARIES & GRADES FOR THIS WEEK (MONDAY THROUGH SUNDAY):
${JSON.stringify(allWeekDailySummaries || [])}

HISTORICAL STRENGTH BENCHMARKS (1RM):
${JSON.stringify(historicalMemory.latest1RM || 'None logged')}

Compare the user's physique progress visually across the 3 photo tiers attached below:
1. OLDEST BASELINE PHOTOS (First Month / Onboarding)
2. LAST MONTH PHOTOS (~30 Days Ago)
3. NEWEST CURRENT WEEK PHOTOS

Synthesize all 7 daily AI evaluations into an all-in-one executive weekly score and action plan.

Return JSON:
{
  "summaryHeadline": "Inspiring Sunday Weekly Transformation Title",
  "waistChange": "In-depth breakdown of waist measurement delta and fat loss trajectory",
  "muscleGainInsight": "In-depth analysis of bicep/chest measurements, progressive volume, and muscle hypertrophy",
  "physiquePhotoAnalysis": "Comprehensive visual comparison comparing Oldest Baseline photos vs Last Month photos vs Newest photos",
  "weeklySummariesReview": "Synthesis of all 7 daily AI grades and performance trends from Monday to Sunday",
  "nextWeekAdjustments": "Specific macro and training program adjustments for the upcoming week",
  "overallScore": "A+" | "A" | "B" | "C" | "D"
}`
    }
  ];

  // Attach Multi-Photo Vault
  if (photoVault) {
    // 1. Oldest Baseline Photos
    if (photoVault.oldestPhotos) {
      if (photoVault.oldestPhotos.front) contentArray.push({ type: 'image_url', image_url: { url: photoVault.oldestPhotos.front } });
      if (photoVault.oldestPhotos.side) contentArray.push({ type: 'image_url', image_url: { url: photoVault.oldestPhotos.side } });
      if (photoVault.oldestPhotos.back) contentArray.push({ type: 'image_url', image_url: { url: photoVault.oldestPhotos.back } });
    }

    // 2. Last Month Photos
    if (photoVault.lastMonthPhotos) {
      if (photoVault.lastMonthPhotos.front) contentArray.push({ type: 'image_url', image_url: { url: photoVault.lastMonthPhotos.front } });
      if (photoVault.lastMonthPhotos.side) contentArray.push({ type: 'image_url', image_url: { url: photoVault.lastMonthPhotos.side } });
      if (photoVault.lastMonthPhotos.back) contentArray.push({ type: 'image_url', image_url: { url: photoVault.lastMonthPhotos.back } });
    }

    // 3. Newest Photos
    if (photoVault.newestPhotos) {
      if (photoVault.newestPhotos.front) contentArray.push({ type: 'image_url', image_url: { url: photoVault.newestPhotos.front } });
      if (photoVault.newestPhotos.side) contentArray.push({ type: 'image_url', image_url: { url: photoVault.newestPhotos.side } });
      if (photoVault.newestPhotos.back) contentArray.push({ type: 'image_url', image_url: { url: photoVault.newestPhotos.back } });
    }
  }

  const messages = [
    { role: 'system', content: 'You respond only in valid JSON.' },
    { role: 'user', content: contentArray }
  ];

  return callOpenAI({ apiKey, messages, responseFormat: 'json_object', model: 'gpt-4o' });
}

/**
 * 15-Day 1RM Max Test AI Analysis
 */
export async function generate1RMSummary(currentTest, pastTests, apiKey) {
  const messages = [
    { role: 'system', content: 'You are GymsLab AI analyzing a 15-Day 1-Rep Max Strength Test in JSON.' },
    {
      role: 'user',
      content: `Analyze the user's latest 15-day 1-Rep Max (1RM) strength benchmark results:
Current 1RM Test:
- Bench Press: ${currentTest.bench || 0} kg/lbs
- Weighted Pull-ups: ${currentTest.pullups || 0} kg/lbs
- Barbell Squat: ${currentTest.squat || 0} kg/lbs
- Deadlift: ${currentTest.deadlift || 0} kg/lbs

Past 1RM History: ${JSON.stringify(pastTests || [])}

Return JSON:
{
  "strengthScore": "S" | "A+" | "A" | "B" | "C",
  "headline": "Strength breakthrough summary",
  "analysis": "In-depth breakdown of strength progression per lift (Bench, Pullups, Squat, Deadlift)",
  "powerRatio": "Estimated overall strength ratio relative to bodyweight",
  "trainingAdvice": "Targeted programming advice to break through plateaus over the next 15 days"
}`
    }
  ];

  return callOpenAI({ apiKey, messages, responseFormat: 'json_object', model: 'gpt-4o' });
}
