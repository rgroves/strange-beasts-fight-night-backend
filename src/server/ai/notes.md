# AI Usage Notes

## Fight Announcer Prompts

I initially created a prompt, `fight-announcer-prompt.txt`, that was very much a first draft with not enough details and some issues. In an attempt to ensure I was following the recommended best practices I created a second prompt, `prompt-refinement-prompt.txt`, to iterate on the original and get the announcer prompt into better shape.

## Fight Announcer Prompt Trial w/ChatGPT

I needed some battle data that I could use to trial the announcer prompt, so I created a CLI tool, `battle-gen.ts`, which mocks a battle and spits out the necessary FIGHT_DATA.

I then pulled up the ChatGPT interface (https://chatgpt.com/), fed it the fight announcer prompt. After it confirmed it was ready, I followed that up with the mock battle data. It returned a few paragraphs describing the battle as guided by the fight data.

The announcer prompt now looks like it's working well enough to be used in the first iteration of the game. 🤘

## TTS Playground results

I wanted to not only feature the results of the battle in a textual form, but also have audio that can be played to hear the results as if a ring-side announcer was giving blow-by-blow commentary.

The settings below had a decent result in the playground (https://platform.openai.com/playground/tts):

```text
Model:
gpt-40-mini-ts

Instructions:
Speak in an energetic, clear, and engaging tone, with a focus on conveying excitement and information. Impersonate a 1920's old-time radio blow-by-blow boxing announcer.

Voice:
Ballad

Speed:
4.00 X

Response format
wav
```

Maybe look into and play with the response formats? I believe the api defaults to mp3.
