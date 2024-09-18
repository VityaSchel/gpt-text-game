import OpenAI from 'openai'
import { Elysia } from 'elysia'
import { z } from 'zod'
import cors from '@elysiajs/cors'

const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] })
const assistantId = 'asst_0NVcdQuWcNPMVRuGTRuU5XXz'

const games = new Map<string, { background: { prompt: string, url?: string }, options: string[] }>()

const app = new Elysia()
  .use(cors({ origin: process.env.ORIGIN }))
  .post('/game', async () => {
    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: 'user',
          content: 'Начни игру. Придумай интересную сцену, главного персонажа.',
        }
      ]
    })
    const threadId = thread.id

    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: assistantId,
      model: 'gpt-4o-mini'
    })

    if(run.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(thread.id)
      const answer = messages.data.filter(message => message.role === 'assistant')[0]
      const responseSerialized = answer.content.filter(c => c.type === 'text').map(c => c.text.value).join('')
      const response = JSON.parse(responseSerialized)
      const responseParsingResult = await z.object({ text: z.string(), options: z.array(z.string()).length(3), background: z.string() }).safeParseAsync(response)
      if(responseParsingResult.success) {
        const { text, options } = responseParsingResult.data
        games.set(threadId, { background: { prompt: responseParsingResult.data.background }, options })
        return { ok: true, gameId: threadId, text, options }
      }
    }

    return { ok: false }
  })
  .post('/game/:gameId', async ({ params, body: _ }) => {
    const gameId = z.string().min(1).safeParse(params.gameId)
    if (!gameId.success) {
      return { ok: false }
    }
    const game = games.get(gameId.data)
    if (!game) {
      return { ok: false }
    }
    const body = z.object({
      option: z.number().int().min(0).max(2)
    }).safeParse(_)
    if (!body.success) {
      return { ok: false }
    }
    await openai.beta.threads.messages.create(gameId.data, {
      content: game.options[body.data.option],
      role: 'user'
    })
    const run = await openai.beta.threads.runs.createAndPoll(gameId.data, {
      assistant_id: assistantId,
      model: 'gpt-4o-mini'
    })
    if (run.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(gameId.data, { order: 'desc' })
      const answer = messages.data.filter(message => message.role === 'assistant')[0]
      const responseSerialized = answer.content.filter(c => c.type === 'text').map(c => c.text.value).join('')
      const response = JSON.parse(responseSerialized)
      const responseParsingResult = await z.object({ text: z.string(), options: z.array(z.string()).length(3), background: z.string() }).safeParseAsync(response)
      if (responseParsingResult.success) {
        const { text, options } = responseParsingResult.data
        games.set(gameId.data, { background: { prompt: responseParsingResult.data.background }, options })
        return { ok: true, text, options }
      }
    }
    return { ok: true }
  })
  .get('/picture/:gameId', async ({ params }) => {
    const gameId = z.string().min(1).safeParse(params.gameId)
    if (!gameId.success) {
      return { ok: false }
    }
    const game = games.get(gameId.data)
    if (!game) {
      return { ok: false }
    }
    let url = game.background.url
    if(!url) {
      const response = await openai.images.generate({
        prompt: game.background.prompt,
        model: 'dall-e-2',
        response_format: 'url',
        style: 'natural',
        size: '256x256',
        n: 1
      })
      url = response.data[0].url!
      game.background.url = url
    }
    const blob = await fetch(url).then(res => res.blob())
    return blob
  })
  .listen(3000)

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)