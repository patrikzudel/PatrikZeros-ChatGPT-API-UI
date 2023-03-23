<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import {
    settingsVisible,
    conversations,
    chosenConversationId,
    menuVisible,
    apiKey,
    defaultAssistantRole,
    type Conversation,
    type DefaultAssistantRole,
    type GptModel,
    gptModel,
  } from "../stores/stores";
  import CloseIcon from "../assets/close.svg";
  const dispatch = createEventDispatcher();
  let placeholder = `Using: Svelte, Typescript.
OR
You are a therapist. ETC...`;

  function newChat() {
    dispatch("new-chat");
  }

  function openSettings() {
    settingsVisible.set(true);
  }

  function deleteConversation(i: number) {
    let conv = $conversations.filter((value, index) => index !== i);
    if (i < $chosenConversationId || i == $chosenConversationId) {
      if ($chosenConversationId !== 0) {
        chosenConversationId.set($chosenConversationId - 1);
      }
    }
    conversations.set(conv);
    if ($conversations.length === 0) {
      dispatch("new-chat");
      chosenConversationId.set(0);
    }
  }
</script>

<div class="flex flex-col text-white/90">
  <div
    class="{$menuVisible == true
      ? 'translate-x-0'
      : '-translate-x-[100%] md:translate-x-0'}  duration-200 h-full fixed md:flex w-[260px] flex-col bg-secondary"
  >
    <nav class="flex h-full fle-1 flex-col space-y-1 p-2 bg-secondary">
      <button
        on:click={() => {
          menuVisible.set(false);
        }}
        class="md:hidden flex py-3 px-3 items-center gap-3 rounded-md hover:bg-hover hover:opacity-hover transition-colors duration-200 cursor-pointer text-sm mb-2 flex-shrink-0 border border-white/50"
      >
        Close menu
      </button>
      <button
        on:click={newChat}
        class="flex py-3 px-3 items-center gap-3 rounded-md hover:bg-hover  transition-colors duration-200 cursor-pointer text-sm mb-2 flex-shrink-0 border border-white/50"
      >
        New chat
      </button>
      <div class="py-1 select-none">
        <p class="text-left px-8 font-bold text-xl ">
          PatrikZero's <br />
        </p>
        <p class="text-center font-bold text-2xl  leading-4">ChatGPT UI</p>
      </div>
      <div class="flex flex-col h-40 my-2 flex-grow overflow-y-auto ">
        <!-- TU ZACINA -->
        <!-- Test 10 times -->
        {#each $conversations.slice().reverse() as conv, i}
          <button
            on:click={() => {
              let id = $conversations.length - i - 1;
              console.log(id);
              chosenConversationId.set(id);
            }}
            on:touchend={() => {
              let id = $conversations.length - i - 1;
              chosenConversationId.set(id);
            }}
            class="{$chosenConversationId === $conversations.length - i - 1
              ? 'bg-hover2 hover:bg-hover2'
              : ''} conversation flex justify-between min-h-[64px] mt-2 py-3 px-3 items-center gap-3 rounded-t-md hover:bg-hover cursor-pointer text-sm transition-colors duration-200"
          >
            <p class=" text-left text-sm max-w-[178px]">
              {conv.title === "" ? "Empty conversation" : conv.title}
            </p>
            <button
              on:click={(e) => {
                let id = $conversations.length - i - 1;
                e.stopPropagation();
                deleteConversation(id);
              }}
              class="delete rounded w-5 h-5 font-bold flex justify-center items-center bg-warning"
              ><img
                src={CloseIcon}
                alt="X"
                class="icon-white min-w-3 w-3 h-3"
              /></button
            >
            <p class="text-blue-200 tokens">
              {conv.conversationTokens.toFixed(0)}
            </p>
          </button>
          {#if $chosenConversationId === $conversations.length - i - 1}
            <textarea
              bind:value={$conversations[$chosenConversationId].assistantRole}
              {placeholder}
              class="bg-primary px-2 pt-1 mb-2 pb-3 resize-none ronded-t-none rounded-b-md focus:outline-none focus:outline-primary"
            />
          {/if}
        {/each}
        <!-- TUTO KONCI PRIKLAD -->
      </div>
      <button
        on:click={openSettings}
        class="flex border border-white/50 py-3 px-3 items-center font-bold gap-3 rounded-md hover:bg-hover transition-colors duration-200 cursor-pointer text-sm mt-auto"
      >
        <div class="flex justify-between w-full items-center">
          <p>
            Settings {$apiKey === null ? "(Insert API key)" : ""}
          </p>
          <p class=" text-xs text-chat">
            {$apiKey === null ? "" : $gptModel.name}
          </p>
        </div>
      </button>
    </nav>
  </div>
</div>

<style>
  * {
    z-index: 1;
  }

  .conversation:hover .delete {
    display: flex;
  }

  .conversation:hover .tokens {
    display: none;
  }

  .delete {
    display: none;
  }
</style>
