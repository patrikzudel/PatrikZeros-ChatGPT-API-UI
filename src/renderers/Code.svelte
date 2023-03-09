<script>
  export let lang;
  export let text;
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("Error copying text: ", error);
    }
  };
</script>

<pre class="{lang} p-5 pb-0 md:mx-2 mx-0 mt-3 mb-6" style="position:relative">
<code>{text}</code>
<button on:click={copyToClipboard}>Copy to Clipboard</button>
</pre>

<!-- <p class="text-red-400">{lang}</p> -->
<style>
  pre {
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: 10px;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);

    opacity: 0;
    animation: fade-in 0.5s ease-in-out forwards;
  }

  pre:hover button {
    opacity: 1;
  }

  code {
    font-weight: bold;
    overflow-wrap: break-word;
    white-space: pre-wrap;
  }

  button {
    position: absolute;
    opacity: 0;
    top: 0;
    right: 0;
    margin: 10px;
    transition: all 0.1s ease-in-out;
  }

  button:hover {
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5),
      0 0 20px rgba(255, 255, 255, 0.5), 0 0 30px rgba(255, 255, 255, 0.3),
      0 0 40px rgba(255, 255, 255, 0.5);
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
