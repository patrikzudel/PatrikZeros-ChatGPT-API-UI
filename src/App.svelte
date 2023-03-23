<script lang="ts">
  import { Configuration, OpenAIApi } from "openai";
  import type {
    ChatCompletionRequestMessage,
    ChatCompletionRequestMessageRoleEnum,
  } from "openai";
  import Topbar from "./lib/Topbar.svelte";
  import Sidebar from "./lib/Sidebar.svelte";
  import { writable } from "svelte/store";
  import { afterUpdate, onMount } from "svelte";
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
    gptModel,
    streamMessages,
    type GptModel,
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
  import { encodeTokens } from "./Encoder";

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
  let waitingForResponse: boolean = false;
  let lastMsgTokenCount: number = 0;

  newChat();

  // Functions
  onMount(() => {
    if (window.innerWidth > 1200) {
      moreButtonsToggle = true;
    }
  });

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
  function setTitle(title: string, id: number = $chosenConversationId) {
    let conv = $conversations;
    conv[id].title = title;
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
    if ($conversations.length > 0) {
      if ($conversations[$conversations.length - 1].history.length === 0) {
        chosenConversationId.set($conversations.length - 1);
        return;
      }
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
          role: "system",
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
  function createStream(
    msg: ChatCompletionRequestMessage[],
    recursive: boolean = false
  ) {
    waitingForResponse = true;
    let tickCounter = 0;
    let ticks = false;
    let currentHistory = $conversations[$chosenConversationId].history;
    let currentConvId = $chosenConversationId;
    let originalMsg = msg;
    let roleMsg: ChatCompletionRequestMessage = {
      role: $defaultAssistantRole.type as ChatCompletionRequestMessageRoleEnum,
      content: $conversations[$chosenConversationId].assistantRole,
    };
    msg = [roleMsg, ...msg];
    console.log("Creating stream");
    console.log("New message:");
    console.log(msg);
    if (recursive === false) {
      console.log("Attempted message tokens");
      lastMsgTokenCount = countMessagesTokens(msg);
      console.log(lastMsgTokenCount);
    }
    let done = false;
    currentHistory = [...currentHistory];
    let source = new SSE("https://api.openai.com/v1/chat/completions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${$apiKey}`,
      },
      method: "POST",
      payload: JSON.stringify({
        model: $gptModel.code,
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
          waitingForResponse = false;
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
        msg = [
          ...msg,
          {
            role: "assistant",
            content: streamText,
          },
        ];
        addTokens(countMessagesTokens(msg));
        streamText = "";
        done = true;
        console.log("Stream closed");
        source.close();
      }
    });

    source.addEventListener("error", (e) => {
      if (done) return;
      configuration = null;
      let errorData;
      try {
        errorData = JSON.parse(e.data);
      } catch {
        errorData = {
          error: {
            message:
              "The servers are probably down. (Or your internet connection)",
          },
        };
      }
      let errorMessage = errorData.error.message;

      // Handle messages over the token limit
      source.close();
      waitingForResponse = false;
      if (errorMessage.includes("maximum context length")) {
        if (originalMsg.length > 1) {
          console.log(errorMessage);
          console.log("Token limit reached, attempting to shorten history");
          originalMsg.shift(); // Removes the oldest msg
          createStream(originalMsg, true);
          return;
        }
      }

      console.log("Stream closed on error");
      console.error(e);
      setHistory([
        ...currentHistory,
        {
          role: "system",
          content: errorMessage,
        },
      ]);
    });

    source.stream();
  }

  //   Calculates the tokens contained in a msg[] using gpt-3-encoder.
  //   Including the tokens of the latest streamed message. (streamText)
  //   @param {ChatCompletionRequestMessage[]} msg - Array of messages. Probably history + new message.
  function countMessagesTokens(msg: ChatCompletionRequestMessage[]): number {
    let tokenCount = 0;
    msg.map((m) => {
      let historyTokens = encodeTokens(m.content);
      tokenCount += historyTokens.length;
    });
    console.log("Gpt-3-counter Tokens in msg: " + tokenCount);
    console.log(msg);
    return tokenCount;
  }

  //   Adds the tokens to the current conversation and the global counter.
  //   @param {number} tokenCount : Number of tokens.
  function addTokens(tokenCount: number) {
    let conv = $conversations;
    conv[$chosenConversationId].conversationTokens =
      conv[$chosenConversationId].conversationTokens + tokenCount;
    conversations.set(conv);
    combinedTokens.set($combinedTokens + tokenCount);
  }

  //   Sends request to OpenAI API without streaming text.
  //   @param {ChatCompletionRequestMessage[]} msg - Array of messages. Probably history + new message.
  async function sendRequest(
    msg: ChatCompletionRequestMessage[],
    chatMsg: boolean = true
  ) {
    console.log("Sending request");
    console.log("Sent message:");
    console.log(msg);
    let currentConvId = $chosenConversationId;
    let originalMsg = msg;
    const response = await openai
      .createChatCompletion({
        model: $gptModel.code,
        messages: msg,
      })
      .catch((error) => {
        configuration = null;
        let errorData = error.response;
        if (!errorData) {
          errorData = {
            data: {
              error: {
                message:
                  "The servers are probably down. (Or your internet connection)",
              },
            },
          };
        }
        console.log(errorData);
        let errorMessage = errorData.data.error.message;
        let currentHistory = $conversations[currentConvId].history;
        if (chatMsg) {
          setHistory([
            ...currentHistory,
            {
              role: "system",
              content: errorMessage,
            },
          ]);
        }
        waitingForResponse = false;
        return null;
      });
    return response;
  }

  async function sendMessageNoStream(msg: ChatCompletionRequestMessage[]) {
    waitingForResponse = true;
    let currentConvId = $chosenConversationId;
    let roleMsg: ChatCompletionRequestMessage = {
      role: $defaultAssistantRole.type as ChatCompletionRequestMessageRoleEnum,
      content: $conversations[currentConvId].assistantRole,
    };
    msg = [roleMsg, ...msg];
    let currentHistory = $conversations[currentConvId].history;
    const response = await sendRequest(msg);
    if (response) {
      waitingForResponse = false;
      const message = response.data.choices[0].message;
      console.log("Response message:");
      console.log(message);
      setHistory([...currentHistory, message], currentConvId);
      lastMsgTokenCount = countTokens(response.data.usage);
    }
  }

  //   Attempts to create a title for the conversation.
  //   @param {string} currentInput - Users request message.
  async function createTitle(currentInput: string) {
    let currentConvId = $chosenConversationId;
    if ($conversations[currentConvId].title !== "") {
      return;
    }
    let msg: ChatCompletionRequestMessage[] = [
      { role: "user", content: currentInput },
      {
        role: "user",
        content:
          "Excluding this summarization request, summarize my previous request in a natural way in max 4 words.",
      },
    ];
    let response = await sendRequest(msg, false);
    if (response) {
      let message = response.data.choices[0].message.content;
      countTokens(response.data.usage);
      setTitle(message.toString(), currentConvId);
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

    if ($streamMessages) createStream(outgoingMessage);
    else sendMessageNoStream(outgoingMessage);
    createTitle(currentInput);
  }

  //   Adds the number of tokens from a request to the combined tokens.
  //   @param {Object} usage - An object containing the total tokens used in a request.
  function countTokens(usage): number {
    console.log("Reported tokens from response: ");
    console.log(usage);
    let conv = $conversations;
    conv[$chosenConversationId].conversationTokens =
      conv[$chosenConversationId].conversationTokens + usage.total_tokens;
    conversations.set(conv);
    combinedTokens.set($combinedTokens + usage.total_tokens);
    return usage.total_tokens;
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
            class="message relative inline-block px-2 py-5 pb-2 {`${(() => {
              switch (message.role) {
                case 'assistant':
                  return 'bg-hover2';
                case 'user':
                  return 'bg-primary';
                case 'system':
                  return 'bg-error';
              }
              // This below might just be the ugliest thing I've ever seen.
            })()}`}"
          >
            <button
              class="deleteButton"
              on:click={() => {
                deleteMessage(i);
              }}
            >
              <img class="icon-white w-8" alt="Delete" src={DeleteIcon} />
            </button>
            <div class="m-auto md:max-w-2xl px-4 py-0 text-[1rem]">
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
        {#if waitingForResponse}
          <div class="bg-hover2 w-full flex justify-center py-5">
            <div
              class="border-[4px] border-solid border-chat w-6 h-6 rounded-full border-t-[4px] border-t-good2 animate-spin"
            />
          </div>
        {/if}
      </div>
    </div>

    <!-- CHAT INPUT WINDOW BEGINNING -->
    <div class="flex-col bg-primary">
      {#if lastMsgTokenCount >= $gptModel.tokenLimit - 500}
        <p class="px-4 pt-1">
          Last message too long ({lastMsgTokenCount} tokens), may start losing context
          after {$gptModel.tokenLimit} tokens. Summarization advised.
        </p>
      {/if}
      <div class="flex p-2 bg-primary mt-auto">
        <textarea
          class="w-full min-h-[96px] h-24 rounded p-2 mx-1 mr-0 rounded-r-none bg-chat resize-none md:resize-y focus: outline-none"
          placeholder="Type your message"
          on:keydown={(event) => {
            if (event.key === "Enter") {
              if (event.shiftKey) {
                return;
              } else {
                event.preventDefault();
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
              title="Sending a message without prior conversation history can save token costs."
              class="bg-good2 rounded py-2 px-4 mx-1"
              on:click={() => {
                sendMessage(MSG_TYPES.WITHOUT_HISTORY);
              }}>Send without history</button
            >
            <div class="flex-col hidden sm:flex ">
              <button
                title="Summarizing conversations saves token costs and is ideal for preserving context in lengthy discussions."
                class="bg-good2 flex-1 rounded mb-2 py-2 px-4 mx-1"
                on:click={() => {
                  sendMessage(MSG_TYPES.SUMMARIZE);
                }}>Summarize</button
              >
              <button
                title="Injecting assistant message from input into history; useful for jailbreaks."
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
