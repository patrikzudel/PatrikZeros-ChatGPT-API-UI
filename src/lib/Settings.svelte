<script lang="ts">
  import { writable } from "svelte/store";
  import {
    apiKey,
    settingsVisible,
    combinedTokens,
    defaultAssistantRole,
    gptModel,
    streamMessages,
    type DefaultAssistantRole,
  } from "../stores/stores";
  let apiTextField = $apiKey === null ? "" : $apiKey;
  let assistantRoleField = $defaultAssistantRole.role;
  let assistantRoleTypeField = $defaultAssistantRole.type;
  let modelNameField = $gptModel.code;
  let messageTypeField = $streamMessages.toString();
  let oldNameField = modelNameField;
  import CloseIcon from "../assets/close.svg";

  function clearTokens() {
    combinedTokens.set(0);
  }
  function handleSave() {
    defaultAssistantRole.set({
      role: assistantRoleField,
      type: assistantRoleTypeField,
    });
    switch (modelNameField) {
      case "gpt-3.5-turbo":
        gptModel.set({
          code: "gpt-3.5-turbo",
          name: "GPT 3.5 Turbo",
          inputCost: 0.002,
          outputCost: 0.002,
          tokenLimit: 4096,
        });
        break;
      case "gpt-4":
        gptModel.set({
          code: "gpt-4",
          name: "GPT 4 8k",
          inputCost: 0.03,
          outputCost: 0.06,
          tokenLimit: 8192,
        });
        break;
      case "gpt-4-32k":
        gptModel.set({
          code: "gpt-4-32k",
          name: "GPT 4 32k",
          inputCost: 0.06,
          outputCost: 0.12,
          tokenLimit: 32768,
        });
        break;
    }
    streamMessages.set(messageTypeField === "true");
    apiKey.set(apiTextField);
    handleClose();
  }
  function handleClose() {
    settingsVisible.set(false);
  }
</script>

<!-- Settings.svelte -->
<div class="fixed z-10 inset-0  overflow-y-auto animate-fade-in">
  <div class="flex items-center  justify-center min-h-screen">
    <div class="bg-primary text-white rounded-lg shadow-xl p-8 relative">
      <button
        class="absolute top-0 right-0 mt-2 mr-2 text-gray-500 hover:text-gray-600"
        on:click={handleClose}
      >
        <img class="icon-white w-8" alt="Close" src={CloseIcon} />
      </button>
      <h2 class="text-xl mb-2 font-bold ">Settings</h2>
      <div class="mb-4">
        <label for="api-key" class="block font-medium mb-2"
          >API Key <a
            class="text-blue-300"
            href="https://github.com/patrikzudel/PatrikZeros-ChatGPT-API-UI/blob/main/README.md"
            >(Tutorial)</a
          ></label
        >
        <input
          type="password"
          id="api-key"
          name="api-key"
          class="border text-black border-gray-300 p-2 rounded w-full"
          bind:value={apiTextField}
        />
      </div>
      <div class="mb-0">
        <label for="api-key" class="block font-medium mb-1"
          >Default Assistant role</label
        >
        <input
          class="border text-black border-gray-300 p-2 rounded w-full"
          bind:value={assistantRoleField}
        />
        <select
          bind:value={assistantRoleTypeField}
          class="max-w-[86px] text-black bg-white my-2 p-2 rounded focus:outline-none focus:bg-white "
        >
          <option value="system">System</option>
          <option value="user">User</option>
        </select>
      </div>
      <div>
        <label for="model" class="block font-medium mb-1">Chosen model</label>
        <select
          bind:value={modelNameField}
          class="max-w-[256px] text-black bg-white mb-2 p-2 rounded focus:outline-none focus:bg-white "
        >
          <option value="gpt-3.5-turbo">GPT 3.5 Turbo ($0.002)</option>
          <option value="gpt-4">GPT 4 8k ($0.03 / $0.06)</option>
          <option value="gpt-4-32k">GPT 4 32k ($0.06 / $0.12)</option>
        </select>
      </div>
      {#if modelNameField !== "gpt-3.5-turbo"}
        <h1 class=" text-red-500 font-bold mb-2">
          WARNING GPT 4 is VERY expensive!
        </h1>
      {/if}
      <div>
        <label for="model" class="block font-medium mb-1">Request type</label>
        <select
          bind:value={messageTypeField}
          class="max-w-[256px] text-black bg-white mb-2 p-2 rounded focus:outline-none focus:bg-white "
        >
          <option value="true">Stream</option>
          <option value="false">Request (Experimental)</option>
        </select>
      </div>
      {#if modelNameField !== oldNameField}
        <h1 class=" text-red-500 font-bold text-sm">
          Pricing updates only after saving!
        </h1>
      {/if}
      <div class="mb-4 flex flex-col justify-between items-start ">
        <div class="flex justify-between items-center">
          <p class="block font-bold">
            Tokens spent: {$combinedTokens.toFixed(0)} | {(
              ($combinedTokens / 1000) *
              (($gptModel.inputCost + $gptModel.outputCost) / 2)
            ).toFixed(4)} $
          </p>
          <button
            on:click={clearTokens}
            class="bg-warning hover:bg-warningHover transition-colors duration-200 text-white ml-10 w-5 h-5 flex align-middle justify-center rounded"
            style="font-size: 1rem"
          >
            <img class="icon-white w-3" alt="Close" src={CloseIcon} />
          </button>
        </div>
        <p class="block font-bold mt-2 text-xs">
          {$gptModel.name} pricing.
        </p>
        <p class="block font-bold text-xs">
          Averaged i/o cost per 1k tokens: {($gptModel.inputCost +
            $gptModel.outputCost) /
            2}
        </p>
      </div>
      <div class="flex justify-between items-end">
        <button
          class="bg-good hover:bg-good2 transition-colors duration-200 text-white py-2 px-4 rounded"
          on:click={handleSave}>Save</button
        >
        <a
          href="https://github.com/patrikzudel/PatrikZeros-ChatGPT-API-UI"
          class="text-sm text-gray-400">GitHub</a
        >
      </div>
    </div>
  </div>
</div>

<style>
  /* Set the background to semi-transparent black */
  .fixed {
    background-color: rgba(0, 0, 0, 0.4);
  }

  /* Center the settings window horizontally and vertically */
  .min-h-screen {
    min-height: calc(100vh - 4rem);
  }

  /* Adjust the width of the settings window */
  .bg-white {
    width: 24rem;
  }

  /* Add some padding to the text input */
  .border {
    padding: 0.5rem;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .animate-fade-in {
    animation-name: fadeIn;
    animation-duration: 0.2s;
    animation-fill-mode: forwards;
  }
</style>
