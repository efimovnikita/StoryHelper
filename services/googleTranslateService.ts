/**
 * Google Translate API Service
 * Used for translating user phrases from Italian to English.
 */

export const translateText = async (text: string): Promise<string> => {
  const apiKey = localStorage.getItem('google_translate_api_key');
  
  if (!apiKey) {
    console.warn("Google Translate API Key is missing. Please add it in settings.");
    return "";
  }

  if (!text.trim()) return "";

  try {
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: 'it',
        target: 'en',
        format: 'text'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Google Translate API error');
    }

    const data = await response.json();
    
    if (data.data && data.data.translations && data.data.translations.length > 0) {
      return data.data.translations[0].translatedText;
    }

    return "";
  } catch (error) {
    console.error("Google Translate error:", error);
    return "";
  }
};
