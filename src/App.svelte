<script lang="ts">
  import { Configuration, OpenAIApi } from "openai";
  import type {
    ChatCompletionRequestMessage,
    ChatCompletionRequestMessageRoleEnum,
  } from "openai";
  import Topbar from "./lib/Topbar.svelte";
  import Sidebar from "./lib/Sidebar.svelte";
  import { writable } from "svelte/store";
  import { afterUpdate } from "svelte";
  import Settings from "./lib/Settings.svelte";
  import SvelteMarkdown from "svelte-markdown";
  import {
    settingsVisible,
    apiKey,
    conversations,
    chosenConversationId,
    type Conversation,
    type DefaultAssistantRole,
    combinedTokens,
    defaultAssistantRole,
  } from "./stores/stores";
  import CodeRenderer from "./renderers/Code.svelte";
  import EmRenderer from "./renderers/Em.svelte";
  import ListRenderer from "./renderers/ListRenderer.svelte";
  import ListItemRenderer from "./renderers/ListItem.svelte";
  import CodeSpanRenderer from "./renderers/CodeSpan.svelte";
  import ParagraphRenderer from "./renderers/Paragraph.svelte";
  import HtmlRenderer from "./renderers/Html.svelte";
  import { SSE } from "sse.js";
  import DeleteIcon from "./assets/delete.svg";
  import MoreIcon from "./assets/more.svg";
  import SendIcon from "./assets/send.svg";
  import Paragraph from "./renderers/Paragraph.svelte";

  // DEFINES && SETUP
  let MSG_TYPES = {
    WITH_HISTORY: "with_history",
    WITHOUT_HISTORY: "without_history",
    SUMMARIZE: "summarize",
  };

  type Usage = {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };

  // VARS
  let configuration: Configuration = null;
  let openai: OpenAIApi = null;

  let streamText = "";
  let streamMsg: ChatCompletionRequestMessage = null;
  let input: string = "";
  let chatContainer: HTMLElement;
  let moreButtonsToggle: boolean = false;

  const errorMessage: ChatCompletionRequestMessage[] = [
    {
      role: "assistant",
      content:
        "There was an error. Maybe the API key is wrong? Or the servers could be down?",
    },
  ];
  newChat();

  // Functions

  // Sets up the configuration and OpenAIApi object.
  function setupConfig() {
    if ($apiKey !== null && configuration === null) {
      configuration = new Configuration({
        apiKey: $apiKey,
      });
      openai = new OpenAIApi(configuration);
      console.debug("OpenAI API initialized");
    }
  }

  // Scrolls the chatContainer to the bottom.
  function scrollChat() {
    if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Reloads the configuration.
  function reloadConfig() {
    console.log("Reloading config");
    configuration = null;
    newChat();
    setupConfig();
  }

  // Deletes message of index i in current conversation.
  // @param {number} i
  function deleteMessage(i: number) {
    let conv = $conversations;
    let msgs = $conversations[$chosenConversationId].history.filter(
      (value, index) => index !== i
    );
    conv[$chosenConversationId].history = msgs;
    conversations.set(conv);
  }

  // Sets history in current conversation.
  // @param {ChatCompletionRequestMesasge[]} msg
  // optional @param {number} convId : Allows selecting the conversation
  function setHistory(
    msg: ChatCompletionRequestMessage[],
    convId: number = $chosenConversationId
  ) {
    let conv = $conversations;
    conv[convId].history = msg;
    conversations.set(conv);
  }

  // Sets conversation title to str.
  // @param {string} str
  function setTitle(title: string) {
    let conv = $conversations;
    conv[$chosenConversationId].title = title;
    conversations.set(conv);
  }

  // Counts the "`" in str.
  // @param {string} str
  function countTicks(str: string) {
    let out: number = str.split("").filter((char) => char === "`").length;
    return out;
  }

  // Creates a fake assistent message in history from current input.
  function addAssitantMessage() {
    let currentHistory = $conversations[$chosenConversationId].history;
    setHistory([
      ...currentHistory,
      {
        role: "assistant",
        content: input,
      },
    ]);
  }

  // Creates a new conversation
  function newChat() {
    console.log("New chat");
    if ($conversations[$conversations.length - 1].history.length === 0) {
      chosenConversationId.set($conversations.length - 1);
      return;
    }
    input = "";
    let newConversation: Conversation = {
      history: [],
      conversationTokens: 0,
      assistantRole: $defaultAssistantRole.role,
      title: "",
    };
    conversations.set([...$conversations, newConversation]);
    chosenConversationId.set($conversations.length - 1);
  }

  //   Checks if a configuration has been successfully created.
  function hasConfig(): boolean {
    setupConfig();
    if (configuration === null) {
      setHistory([
        {
          role: "assistant",
          content: "Enter your OpenAI API key in the Settings.",
        },
      ]);
      return false;
    }
    return true;
  }

  // MAIN FUNCTIONS

  //   Sends request to OpenAI API with and streams the response data.
  //   @param {ChatCompletionRequestMessage[]} msg - Array of messages. Probably history + new message.
  function createStream(msg: ChatCompletionRequestMessage[]) {
    let tickCounter = 0;
    let ticks = false;
    let currentHistory = $conversations[$chosenConversationId].history;
    let currentConvId = $chosenConversationId;
    let roleMsg: ChatCompletionRequestMessage = {
      role: $defaultAssistantRole.type as ChatCompletionRequestMessageRoleEnum,
      content: $conversations[$chosenConversationId].assistantRole,
    };
    msg = [roleMsg, ...msg];
    console.log("Message:");
    console.log(msg);
    let done = false;
    console.log("Creating stream");
    currentHistory = [...currentHistory];
    let source = new SSE("https://api.openai.com/v1/chat/completions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${$apiKey}`,
      },
      method: "POST",
      payload: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: msg,
        stream: true,
      }),
    });

    source.addEventListener("message", (e) => {
      if (e.data != "[DONE]") {
        let payload = JSON.parse(e.data);
        let typing = false;
        let text = payload.choices[0].delta.content;
        if (text == undefined) typing = !typing;
        if (text != undefined) {
          let msgTicks = countTicks(text);
          tickCounter += msgTicks;
          if (msgTicks == 0) tickCounter = 0;
          if (tickCounter === 3) {
            ticks = !ticks;
            tickCounter = 0;
          }
          streamText = streamText + text;
          // console.log(streamText);
          setHistory(
            [
              ...currentHistory,
              {
                role: "assistant",
                content: streamText + "█" + (ticks ? "\n```" : ""),
              },
            ],
            currentConvId
          );
        }
      } else {
        setHistory(
          [
            ...currentHistory,
            {
              role: "assistant",
              content: streamText,
            },
          ],
          currentConvId
        );
        estimateTokens(msg);
        streamText = "";
        done = true;
        console.log("Stream closed");
        source.close();
      }
    });

    source.addEventListener("error", (e) => {
      if (done) return;
      configuration = null;
      setHistory([...currentHistory, ...errorMessage]);
      console.error(e);
      console.log("Stream closed on error");
      source.close();
    });

    source.stream();
  }

  //   Estimates the number of tokens from the character count of the messages in msg.
  //   @param {ChatCompletionRequestMessage[]} msg - Array of messages. Probably history + new message.
  function estimateTokens(msg: ChatCompletionRequestMessage[]) {
    let chars = 0;
    msg.map((m) => {
      chars += m.content.length;
    });
    chars += streamText.length;
    let tokens = chars / 4;
    let conv = $conversations;
    conv[$chosenConversationId].conversationTokens =
      conv[$chosenConversationId].conversationTokens + tokens;
    conversations.set(conv);
    combinedTokens.set($combinedTokens + tokens);
  }

  //   Sends request to OpenAI API without streaming text.
  //   @param {ChatCompletionRequestMessage[]} msg - Array of messages. Probably history + new message.
  async function sendRequest(msg: ChatCompletionRequestMessage[]) {
    {
      msg = [
        {
          role: "system",
          content: $conversations[$chosenConversationId].assistantRole,
        },
        ...msg,
      ];
      console.log("Sending request");
      const response = await openai
        .createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: msg,
        })
        .catch((error: Error) => {
          configuration = null;
          setHistory(errorMessage);
          console.error(error);
        });
      if (response) countTokens(response.data.usage);
      return response;
    }
  }

  //   Attempts to create a title for the conversation.
  //   @param {string} currentInput - Users request message.
  async function createTitle(currentInput: string) {
    if ($conversations[$chosenConversationId].title !== "") {
      return;
    }
    let response = await sendRequest([
      { role: "user", content: currentInput },
      {
        role: "user",
        content:
          "Excluding this summarization request, summarize my previous request in a natural way in max 4 words.",
      },
    ]);
    if (response) {
      let message = response.data.choices[0].message.content;
      setTitle(message.toString());
    }
    console.log("Title created");
  }

  //   Attempts to send a message affected by the action modifier.
  //   @param {MSG_TYPES} action - Type of message.
  async function sendMessage(action) {
    if (!hasConfig()) return;
    let currentHistory = $conversations[$chosenConversationId].history;
    let messageHistory = currentHistory;
    currentHistory = [...currentHistory, { role: "user", content: input }];
    const currentInput = input;
    setHistory(currentHistory);
    input = "";
    let outgoingMessage: ChatCompletionRequestMessage[];

    // Select action
    switch (action) {
      case MSG_TYPES.SUMMARIZE:
        // currentHistory = [];
        setHistory([]);
        outgoingMessage = [
          ...messageHistory,
          {
            role: "user",
            content:
              "Please summarize our whole previous conversation as conscisely as possible. Max word count is 400.",
          },
        ];
        console.log("Chat summarized.");
        break;
      case MSG_TYPES.WITHOUT_HISTORY:
        messageHistory = [];
        console.log("Message without history.");
      default:
        outgoingMessage = [
          ...messageHistory,
          { role: "user", content: currentInput },
        ];
        break;
    }

    // Send request
    // OLD: Using sendRequest
    // const response = await sendRequest(outgoingMessage);
    // if (response) {
    //   const message = response.data.choices[0].message;
    //   setHistory([...currentHistory, message]);
    //   countTokens(response.data.usage);
    // }
    createStream(outgoingMessage);
    createTitle(currentInput);
  }

  //   Adds the number of tokens from a request to the combined tokens.
  //   @param {Object} usage - An object containing the total tokens used in a request.
  function countTokens(usage) {
    let conv = $conversations;
    conv[$chosenConversationId].conversationTokens =
      conv[$chosenConversationId].conversationTokens + usage.total_tokens;
    conversations.set(conv);
    combinedTokens.set($combinedTokens + usage.total_tokens);
    console.log("Counted tokens: " + usage.total_tokens);
  }

  afterUpdate(() => {
    scrollChat();
  });
</script>

{#if $settingsVisible}
  <Settings on:settings-changed={reloadConfig} />
{/if}
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, maximum-scale=1"
/>
<head>
  <title
    >{$conversations[$chosenConversationId].title ||
      "PatrikZero's ChatGPT UI"}</title
  >
</head>
<main class="bg-primary overflow-hidden">
  <Sidebar on:new-chat={newChat} />

  <div class="h-screen flex flex-col md:ml-[260px] bg-secondary text-white/80">
    <Topbar
      bind:conversation_title={$conversations[$chosenConversationId].title}
      on:new-chat={newChat}
    />
    <!-- MESSAGES WINDOW BEGINNING -->
    <div
      class="flex-1  bg-primary overflow-y-auto overflow-x-hidden"
      bind:this={chatContainer}
    >
      <div class="flex flex-col ">
        {#each $conversations[$chosenConversationId].history as message, i}
          <div
            class="message relative inline-block {message.role === 'assistant'
              ? 'bg-hover2'
              : 'bg-primary'}  px-2 py-5"
          >
            <button
              class="deleteButton"
              on:click={() => {
                deleteMessage(i);
              }}
            >
              <img class="icon-white w-8" alt="Delete" src={DeleteIcon} />
            </button>
            <div class="px-3 md:px-20 text-[1rem]">
              <SvelteMarkdown
                renderers={{
                  code: CodeRenderer,
                  em: EmRenderer,
                  list: ListRenderer,
                  listitem: ListItemRenderer,
                  codespan: CodeSpanRenderer,
                  paragraph: ParagraphRenderer,
                  html: HtmlRenderer,
                }}
                source={message.content.toString()}
              />
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- CHAT INPUT WINDOW BEGINNING -->
    <div class="flex p-2 bg-primary mt-auto">
      <textarea
        class="w-full min-h-[96px] h-24 rounded p-2 mx-1 mr-0 rounded-r-none bg-chat resize-none focus: outline-none"
        placeholder="Type your message"
        on:keydown={(event) => {
          if (event.key === "Enter") {
            if (event.shiftKey) {
              return;
            } else {
              sendMessage(MSG_TYPES.WITH_HISTORY);
            }
          }
        }}
        bind:value={input}
      />
      <div class="flex relative">
        <button
          class="bg-chat rounded py-2 px-4 mx-1 ml-0 rounded-l-none"
          on:click={() => {
            sendMessage(MSG_TYPES.WITH_HISTORY);
          }}
        >
          <img
            class="icon-white min-w-[24px] w-[24px]"
            alt="Send"
            src={SendIcon}
          />
        </button>
        <button
          class="bg-hover2 rounded min-w-[40px] mx-1 flex justify-center align-middle items-center"
          on:click={() => {
            moreButtonsToggle = !moreButtonsToggle;
          }}
        >
          <img class="icon-white w-[32px]" alt="More" src={MoreIcon} />
        </button>
        <div
          class={`otherButtons ${
            moreButtonsToggle
              ? "translate-x-0 static"
              : "hidden md:flex absolute translate-x-[600px] "
          } flex transition-all duration-100`}
        >
          <button
            class="bg-good2 rounded py-2 px-4 mx-1"
            on:click={() => {
              sendMessage(MSG_TYPES.WITHOUT_HISTORY);
            }}>Send without history</button
          >
          <div class="flex-col hidden md:flex max-h-[96px]">
            <button
              class="bg-good2 flex-1 rounded mb-2 py-2 px-4 mx-1"
              on:click={() => {
                sendMessage(MSG_TYPES.SUMMARIZE);
              }}>Summarize</button
            >
            <button
              class="bg-good2 flex-1 rounded py-2 px-4 mx-1"
              on:click={() => {
                addAssitantMessage();
              }}>Assistant</button
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</main>

<style>
  .message:hover button {
    opacity: 1;
  }

  .deleteButton {
    padding: 5px;
    position: absolute;
    opacity: 0;
    top: 0;
    right: 0;
    margin: 10px;
    transition: all 0.1s ease-in-out;
  }
</style>
