import { ref } from 'vue'

export function useVoice() {
  const listening = ref(false)
  const transcript = ref('')

  async function start() {
    listening.value = true
    transcript.value = 'Ecoute en cours...'
  }

  function stop() {
    listening.value = false
  }

  async function askAssistant(prompt: string): Promise<string> {
    // Same endpoint behavior as legacy code path, reading existing env if present.
    const key = localStorage.getItem('anthropic_key') || ''
    if (!key) return 'API non configuree.'
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) return 'Erreur assistant.'
    const data = (await res.json()) as { content?: Array<{ text?: string }> }
    return data.content?.[0]?.text || 'Pas de reponse.'
  }

  return { listening, transcript, start, stop, askAssistant }
}
