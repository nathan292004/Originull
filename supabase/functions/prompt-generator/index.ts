// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders } from '../_shared/cors.ts';
import 'jsr:@std/dotenv/load';
import { getAnonSupabaseClient } from '../_shared/supabaseClient.ts';

const PARAMETRIC_SYSTEM_PROMPT = `You generate ONE single prompt for an openscad parametric model. Rules:
- Return EXACTLY ONE prompt, never a list or multiple options
- Include specific dimensions (in mm) for key features
- Mention customizable/parametric aspects (e.g. "adjustable width", "configurable holes")
- Describe geometry that is 3D printable (flat bases, reasonable overhangs)
- Return ONLY the prompt text - no introductory phrases, quotes, or explanations
- Vary your sentence structure - don't always start with "a parametric..."

Examples of CORRECT responses:
"a hex-grid drawer organizer 150x50mm with adjustable wall thickness"
"stackable storage box 100mm cube with slide-on lid"
"cable clip for 5-10mm cables with screw mounting"

NEVER return multiple prompts or a list. Only ONE single prompt.`;

// Main server function handling incoming requests
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Ensure only POST requests are accepted
  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

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

  // Parse request body to get existing text if provided
  const { existingText }: { existingText?: string } = await req
    .json()
    .catch(() => ({}));

  try {
    let systemPrompt: string;
    let userPrompt: string;
    let maxTokens: number;

    if (existingText && existingText.length > 0) {
      // Augment existing text for parametric mode
      systemPrompt = `You enhance prompts for 3D printable parametric models. Rules:
- Add specific dimensions (in mm) for all key features
- Include multiple parametric variables (e.g., "customizable height", "variable screw size", "adjustable spacing")
- Add details about geometry, mounting options, and practical features
- Ensure the design is 3D printable (flat bottom, stable geometry)
- Return ONLY the enhanced prompt text - no introductory phrases, explanations, or quotes
- Be thorough and detailed in your enhancements`;

      userPrompt = `Enhance this prompt: ${existingText}`;
      maxTokens = 300;
    } else {
      // Generate new prompt for parametric mode
      systemPrompt = PARAMETRIC_SYSTEM_PROMPT;
      userPrompt = 'Generate a parametric modeling prompt.';
      maxTokens = 100;
    }

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
    if (!anthropicApiKey) {
      throw new Error('Missing ANTHROPIC_API_KEY for prompt-generator');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        system: systemPrompt,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Anthropic prompt-generator error: ${response.status} - ${errorText}`,
      );
    }

    const data = await response.json();
    const prompt = data.content?.[0]?.text?.trim?.() ?? '';

    return new Response(JSON.stringify({ prompt }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error calling Anthropic (prompt-generator):', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
