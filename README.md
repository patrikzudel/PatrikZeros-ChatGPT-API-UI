<img src="https://raw.githubusercontent.com/patrikzudel/PatrikZeros-ChatGPT-API-UI/main/LogoLight.png?sanitize=true#gh-dark-mode-only" alt="Logo">
<img src="https://raw.githubusercontent.com/patrikzudel/PatrikZeros-ChatGPT-API-UI/main/LogoDark.png?sanitize=true#gh-light-mode-only" alt="Logo">

#### ⭐️ Star the repo if you like it!
#### Static website that allows you to use your OpenAI API key for the same experience as you get with ChatGPT!

  ## 📖 How to use
  - Visit the GitHub Pages release [here](https://chat.patrikzudel.me/).
  - Or to run locally, pull the repository and run ```npm run dev```
  - **Guide** If you don't know your API key:
    - **Register / Login** [here](https://platform.openai.com/account/api-keys)
      - Setup your **billing** [here](https://platform.openai.com/account/billing/overview), don't forget to set a **billing limit** as well [here](https://platform.openai.com/account/billing/limits). And then generate an **API key** [here](https://platform.openai.com/account/api-keys). You should be able to find  everything in the top right corner "**Manage Account**" page.
      - Once you have your API key just go to **Settings** on my app in the bottom left corner and from there you should see it right away.



## ⚡ Features
- All features that are in ChatGPT
- Ability to use your own OpenAI API key.
- No minimum cost, great for students!
  - Cheaper than ChatGPT Premium for most users.
- Usage calculator for pricing - See how much you've spent so far!
  - Calculating token count with OpenAI's [Tokenizer](https://platform.openai.com/tokenizer).
    - Could be not 100% accurate, but its pretty good!
- Token / cost saving features:
  - Send message without history. 
    - When you are asking a sequence of unrelated questions, don't bother sending the whole history!
  - Summarize the chat, useful if you have a message over the 4k token limit but you want to keep the context.
- More features for jailbreaking
  - Ability to fake a "Assistant" message
  - More below
- Ability to set a default system message. 
  - This sets the role of the assistant, and provides it additional information
    - Example uses:
      - For telling the assistant which technology stack you're using so you don't have to repeat yourself.
      - For roleplaying a character
  - You can also switch between it being a "System" message or "User" message for finer control.
    - "User" has stronger impact from what I've tried.
    
## 🖥️ Preview
**[!["Preview"](https://raw.githubusercontent.com/patrikzudel/PatrikZeros-ChatGPT-API-UI/main/Preview.png)](https://chat.patrikzudel.me/)**

## 💬 Reasonings
  I've been frustrated with **ChatGPT** **slowdowns**, **errors**, **constant reloading** and lack of **some features**. I was about to pay for Premium and noticed they released an API that is going to be much **cheaper** for most users. I also wanted to learn JS + a framework for a while now and this seemed like the perfect opportunity to learn. Hope you find it useful!

## 📖 How it works

Stack: Svelte, Tailwind, Typescript.

Just makes calls to the OpenAI API using the key specified in settings.

## 🍀 Supporters

**[!["Buy Me A Ramen"](https://raw.githubusercontent.com/patrikzudel/patrikzudel/main/ramen.png)](https://www.buymeacoffee.com/patrikzero)**

> If you like this project and would like to support me, feel free to buy me a ramen! 🍜🍜🍜

> Or **Paypal:**

**[!["Buy Me A Ramen"](https://raw.githubusercontent.com/patrikzudel/patrikzudel/main/ramenpaypal.png)](https://ko-fi.com/patrikzudel)**

  ## 📋 To be added

  - [ ] Google search using embeddings.
  - [ ] PDF search using embeddings.

## 📃 Dependencies
- OpenAI
- Svelte-markdown 
- sse.js

---

💻❤🍲 by [Patrik Žúdel](https://twitter.com/PatrikZero)
