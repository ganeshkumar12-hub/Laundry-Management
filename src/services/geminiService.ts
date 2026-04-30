import { GoogleGenerativeAI } from "@google/generative-ai";
import { Garment } from "../types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function getWashCareAdvice(garments: Garment[]): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const garmentList = garments.map(g => `${g.quantity}x ${g.type}`).join(', ');
    
    const prompt = `You are a professional dry cleaning expert. 
    A customer has brought in the following items: ${garmentList}.
    Provide a concise (3-4 bullet points) wash/dry/ironing advice or specialty care tips for these items combined.
    Focus on fabric protection and quality preservation. Keep it friendly and expert.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ensure delicate fabrics are dry cleaned and separate colors from whites to prevent bleeding.";
  }
}
