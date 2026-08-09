/**
 * OpenAI API Integration Service for GymsLab AI
 * Supports GPT-4o and GPT-4o-mini with visual analysis & memory-driven text reasoning.
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
    if (profile.photos.front) {
      contentArray.push({ type: 'image_url', image_url: { url: profile.photos.front } });
    }
    if (profile.photos.side) {
      contentArray.push({ type: 'image_url', image_url: { url: profile.photos.side } });
    }
    if (profile.photos.back) {
      contentArray.push({ type: 'image_url', image_url: { url: profile.photos.back } });
    }
  }

  const messages = [
    { role: 'system', content: 'You respond only in valid JSON.' },
    { role: 'user', content: contentArray }
  ];

  return callOpenAI({ apiKey, messages, responseFormat: 'json_object', model: 'gpt-4o' });
}

/**
 * AI Food Photo Scanner - GPT-4o Vision
 */
export async function analyzeFoodPhoto(base64Image, apiKey) {
  const messages = [
    { role: 'system', content: 'You are an expert sports nutritionist AI. Analyze the food image and estimate macros in JSON.' },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Identify the food item(s) in this photo, estimate total weight/portions, and compute approximate nutrition:
Return JSON:
{
  "mealName": "Descriptive meal title",
  "calories": number,
  "protein": number (grams),
  "carbs": number (grams),
  "fat": number (grams),
  "confidence": "High" | "Medium" | "Low",
  "notes": "Brief nutritional advice or portion notes"
}`
        },
        { type: 'image_url', image_url: { url: base64Image } }
      ]
    }
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
 * Daily 23:00 AI Summary & Form Analysis with Historical Context Memory
 */
export async function generateDaily23Summary(dailyLog, historicalMemory, videoFrames, apiKey) {
  const contentArray = [
    {
      type: 'text',
      text: `You are GymsLab AI performing the Daily 23:00 End-of-Day Executive Summary.
HISTORICAL MEMORY CONTEXT:
- Profile Goal: ${historicalMemory.profile?.goalType || 'Recomposition'} (Target Weight: ${historicalMemory.profile?.targetWeight || 'N/A'} kg)
- Baseline Waist: ${historicalMemory.profile?.waist || 'N/A'} cm
- Past Weight Trend (last 5 days): ${JSON.stringify(historicalMemory.recentWeights || [])}
- Past Daily Grades: ${JSON.stringify(historicalMemory.recentGrades || [])}
- Latest 1RM Strength Benchmark: ${JSON.stringify(historicalMemory.latest1RM || 'None logged yet')}

TODAY'S LOGGED METRICS (${dailyLog.date}):
- Morning Weight: ${dailyLog.weight ? dailyLog.weight + ' kg' : 'Not logged'}
- Total Macros Consumed: Calories: ${dailyLog.totalMacros?.calories || 0} / ${dailyLog.targetMacros?.calories || 2400} kcal, Protein: ${dailyLog.totalMacros?.protein || 0}g / ${dailyLog.targetMacros?.protein || 180}g, Carbs: ${dailyLog.totalMacros?.carbs || 0}g, Fat: ${dailyLog.totalMacros?.fat || 0}g
- Warmup Calisthenics Done: ${dailyLog.warmupCompleted ? 'YES' : 'NO'}
- Cooldown Stretch & Abs Done: ${dailyLog.cooldownCompleted ? 'YES' : 'NO'}
- Exercises Logged (${dailyLog.exercises?.length || 0}): ${JSON.stringify(dailyLog.exercises || [])}
- Form Videos Recorded: ${dailyLog.videos?.length || 0} video clips uploaded.

TASK:
Provide an inspiring, rigorous daily evaluation comparing today's performance against past historical memory.
If exercise video keyframes are attached below, carefully analyze movement form, depth, back alignment, and tempo.

Return JSON:
{
  "grade": "A+" | "A" | "B" | "C" | "D",
  "goalAchieved": true | false,
  "headline": "Punchy 1-line summary title",
  "nutritionFeedback": "Detailed feedback on calorie & macro targets",
  "workoutFeedback": "Detailed feedback on calisthenics warmup, heavy sets, and stretch/abs",
  "formAnalysis": "Detailed form feedback based on uploaded videos (or note if no videos)",
  "comparativeMemoryInsight": "How today compares to previous days and baseline waist/strength metrics",
  "tomorrowRecommendation": "1-2 actionable tips for tomorrow"
}`
    }
  ];

  // Attach food photo URLs or video frame URLs if available
  if (videoFrames && videoFrames.length > 0) {
    videoFrames.forEach((frameBase64) => {
      contentArray.push({ type: 'image_url', image_url: { url: frameBase64 } });
    });
  }

  const messages = [
    { role: 'system', content: 'You respond only in valid JSON.' },
    { role: 'user', content: contentArray }
  ];

  return callOpenAI({ apiKey, messages, responseFormat: 'json_object', model: 'gpt-4o' });
}

/**
 * Weekly Progress & Comparative Body Photo AI Assessment
 */
export async function generateWeeklySummary(weeklyData, historicalMemory, apiKey) {
  const contentArray = [
    {
      type: 'text',
      text: `You are GymsLab AI conducting the 7-Day Weekly Progress Review.
BASELINE / PREVIOUS WEEK DATA:
- Baseline Weight: ${historicalMemory.profile?.weight} kg -> Target Weight: ${historicalMemory.profile?.targetWeight} kg
- Baseline Waist: ${historicalMemory.profile?.waist} cm
- Baseline Bicep: ${historicalMemory.profile?.bicepLeft} cm (L) / ${historicalMemory.profile?.bicepRight} cm (R)

CURRENT WEEK DATA (${weeklyData.weekId}):
- Current Weight: ${weeklyData.weight} kg
- Current Waist Size: ${weeklyData.waist} cm
- Current Bicep Size: ${weeklyData.bicepLeft} cm (L) / ${weeklyData.bicepRight} cm (R)
- Current Chest Size: ${weeklyData.chest || 'N/A'} cm
- Average Daily Calories: ${weeklyData.avgCalories || 'N/A'} kcal

Compare current week photos and measurements against baseline.
Return JSON:
{
  "summaryHeadline": "Inspiring weekly summary headline",
  "waistChange": "Analysis of waist circumference change (reduction or maintenance)",
  "muscleGainInsight": "Analysis of bicep/chest measurements and muscle retention/growth",
  "physiquePhotoAnalysis": "Detailed comparison of body composition, definition, and posture from weekly photos",
  "nextWeekAdjustments": "Recommended adjustments for calories, macros, or training intensity",
  "overallScore": "A+" | "A" | "B" | "C"
}`
    }
  ];

  if (weeklyData.photos) {
    if (weeklyData.photos.front) contentArray.push({ type: 'image_url', image_url: { url: weeklyData.photos.front } });
    if (weeklyData.photos.side) contentArray.push({ type: 'image_url', image_url: { url: weeklyData.photos.side } });
    if (weeklyData.photos.back) contentArray.push({ type: 'image_url', image_url: { url: weeklyData.photos.back } });
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
