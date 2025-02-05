import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format');
    }

    console.log('Calling GROQ API with messages:', messages);

    const response = await fetch('https://api.groq.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a helpful and knowledgeable AI assistant. Provide clear, accurate, and engaging responses while maintaining a friendly and professional tone."
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
      }),
    });

    if (!response.ok) {
      console.error('GROQ API error:', await response.text());
      throw new Error('Failed to get response from GROQ API');
    }

    const data = await response.json();
    console.log('GROQ API response:', data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});