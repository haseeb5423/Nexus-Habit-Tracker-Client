
import { GoogleGenAI, Type } from "@google/genai";
import { Habit } from "../types";
import { calculateStreak } from "../utils/dateUtils";

// Initialize Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface Suggestion {
  title: string;
  reason: string;
  type: 'improvement' | 'new_habit';
}

export const getHabitSuggestions = async (habits: Habit[]): Promise<Suggestion[]> => {
  try {
    // Prepare context
    const habitSummary = habits.map(h => {
        const streak = calculateStreak(h);
        return {
            title: h.title,
            currentStreak: streak.current,
            completionRate: streak.completionRate
        };
    });

    const prompt = `
      Analyze the following user habit data:
      ${JSON.stringify(habitSummary)}

      Based on their performance (completion rates and streaks), suggest 3 specific, actionable items.
      1. If they are doing well, suggest a "next level" habit.
      2. If they are struggling, suggest a way to simplify or a different easier habit.
      3. Suggest one completely new wellness habit that fits a "calm productivity" theme.
      
      Return purely JSON format.
    `;

    // Updated model to 'gemini-3-flash-preview' for text tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              reason: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['improvement', 'new_habit'] }
            }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];
    
    return JSON.parse(jsonText) as Suggestion[];

  } catch (error) {
    console.error("Error fetching suggestions from Gemini:", error);
    // Fallback suggestions
    return [
      { title: "Drink Water", reason: "AI service unavailable, but staying hydrated is always good!", type: "new_habit" },
      { title: "Read 5 Pages", reason: "Start small to build momentum.", type: "new_habit" }
    ];
  }
};