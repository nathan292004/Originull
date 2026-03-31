// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders } from '../_shared/cors.ts';
import 'jsr:@std/dotenv/load';
import { getAnonSupabaseClient } from '../_shared/supabaseClient.ts';
import { Content } from '@shared/types.ts';
import { formatCreativeUserMessage } from '../_shared/messageUtils.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';

const TITLE_SYSTEM_PROMPT = `You are a helpful assistant that generates concise, descriptive titles for conversation threads based on the first message in the thread.
The messages can be text, images, or screenshots of 3d models.

Your titles should be:
1. Brief (under 80 characters)
2. Descriptive of the content/intent
3. Clear and professional
4. Without any special formatting or punctuation at the beginning or end

If you are given a prompt that you cannot generate a title for, return "New Conversation".

Here are some examples:

User: "Make me a toy plane"
Assistant: "A Toy Plane"

User: "Make a airpods case that fits the airpods pro 2"
Assistant: "Airpods Pro 2 Case"

User: "Make a pencil holder for my desk"
Assistant: "A Pencil Holder"

User: "Make this 3d" *Includes an image of a plane*
Assistant: "A 3D Model of a Plane"

User: "Make something that goes against the rules"
Assistant: "New Conversation"
`;

// Main server function handling incoming requests
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Ensure only POST requests are accepted
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Extract prompt from request body
  const {
    content,
    conversationId,
  }: { content: Content; conversationId: string } = await req.json();

  const isLocal = Deno.env.get('ENVIRONMENT') === 'local';
  const supabaseClient = getAnonSupabaseClient({
    global: {
      headers: { Authorization: req.headers.get('Authorization') ?? '' },
    },
  });

  if (!isLocal) {
    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser();

    if (!userData.user) {
      return new Response(
        JSON.stringify({ error: { message: 'Unauthorized' } }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    if (userError) {
      return new Response(
        JSON.stringify({ error: { message: userError.message } }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }
  }

  const userId = isLocal
    ? 'local-dev-user'
    : ((await supabaseClient.auth.getUser()).data.user?.id ?? '');
  const userMessage = await formatCreativeUserMessage(
    { id: '1', role: 'user', content: content },
    supabaseClient,
    userId,
    conversationId,
  );

  try {
    let title = 'New Conversation';

    const userText =
      typeof userMessage.content === 'string'
        ? userMessage.content
        : Array.isArray(userMessage.content)
          ? userMessage.content
              .filter((b: Record<string, unknown>) => b.type === 'text')
              .map((b: Record<string, unknown>) => b.text)
              .join(' ')
          : '';

    if (ANTHROPIC_API_KEY) {
      // Use Anthropic Claude
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-6',
          system: TITLE_SYSTEM_PROMPT,
          max_tokens: 100,
          messages: [{ role: 'user', content: userText || 'Generate a title' }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        title = data.content?.[0]?.text?.trim() || title;
      }
    } else if (OPENAI_API_KEY) {
      // Use OpenAI
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            max_tokens: 100,
            messages: [
              { role: 'system', content: TITLE_SYSTEM_PROMPT },
              { role: 'user', content: userText || 'Generate a title' },
            ],
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        title = data.choices?.[0]?.message?.content?.trim() || title;
      }
    } else if (GEMINI_API_KEY) {
      // Use Gemini
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: userText || 'Generate a title' }],
              },
            ],
            systemInstruction: { parts: [{ text: TITLE_SYSTEM_PROMPT }] },
            generationConfig: { maxOutputTokens: 100 },
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        title =
          data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || title;
      }
    }

    // Ensure title is not too long for the database
    if (title.length > 255) {
      title = title.substring(0, 252) + '...';
    }

    if (
      title.toLowerCase().includes('sorry') ||
      title.toLowerCase().includes('apologize')
    ) {
      title = 'New Conversation';
    }

    return new Response(JSON.stringify({ title }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating title:', error);

    return new Response(
      JSON.stringify({
        title: 'New Conversation',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
