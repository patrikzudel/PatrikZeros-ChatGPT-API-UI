import { type Writable, writable } from "svelte/store";
  import type { ChatCompletionRequestMessage } from "openai";

export interface Conversation {
  history: ChatCompletionRequestMessage[];
  conversationTokens: number;
  assistantRole: string;
  title: string;
}

export interface DefaultAssistantRole {
  role: string;
  type: string;
}

export interface GptModel {
  code: string;
  name: string;
  inputCost: number;
  outputCost: number;
  tokenLimit: number;
}

export const settingsVisible = writable(false)
export const menuVisible = writable(false)

let storedApiKey = localStorage.getItem("api_key")
let parsedApiKey = storedApiKey !== null ? JSON.parse(storedApiKey) : null;
export const apiKey:Writable<string|null> = writable(parsedApiKey)
apiKey.subscribe((value) => localStorage.setItem("api_key", JSON.stringify(value)));

let storedStreamMessages = localStorage.getItem("streamMessages")
let parsedStreamMessages: boolean = storedStreamMessages !== null ? JSON.parse(storedStreamMessages) : true;
export const streamMessages:Writable<boolean> = writable(parsedStreamMessages)
streamMessages.subscribe((value) => localStorage.setItem("streamMessages", JSON.stringify(value)));

let storedCombinedTokens = localStorage.getItem('combined_tokens');
let parsedCombinedTokens: number = storedCombinedTokens !== null ? JSON.parse(storedCombinedTokens) : 0;
export const combinedTokens = writable(parsedCombinedTokens);
combinedTokens.subscribe((value) => localStorage.setItem("combined_tokens", JSON.stringify(value)));

let storedDefaultAssistantRole = localStorage.getItem('default_assistant_role');
let parsedDefaultAssistantRole: DefaultAssistantRole = storedDefaultAssistantRole !== null ? JSON.parse(storedDefaultAssistantRole) : 0;
export const defaultAssistantRole = writable(parsedDefaultAssistantRole || {
    role: "You are a helpful assistant.",
    type: "system",
  });
defaultAssistantRole.subscribe((value) => localStorage.setItem("default_assistant_role", JSON.stringify(value)));

let storedModel = localStorage.getItem('model');
let parsedModel: GptModel = storedModel !== null ? JSON.parse(storedModel) : 0;
export const gptModel = writable(parsedModel || {
    code: "gpt-3.5-turbo",
    name: "GPT 3.5 Turbo",
    inputCost: 0.002,
    outputCost: 0.002,
    tokenLimit: 4096,
  });
gptModel.subscribe((value) => localStorage.setItem("model", JSON.stringify(value)));

export const chosenConversationId = writable(0);

let storedConversations = localStorage.getItem('conversations');
let parsedConversations: Conversation[] = storedConversations !== null ? JSON.parse(storedConversations) : null;

export const conversations: Writable<Conversation[]> = writable(parsedConversations || [{
    history: [],
    conversationTokens: 0,
    assistantRole: "You are a helpful assistant.",
    title: "",
  }]);

conversations.subscribe((value) => {
  localStorage.setItem('conversations', JSON.stringify(value));
});