const getKey = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['openai-key'], (result) => {
      if (result['openai-key']) {
        const decodedKey = atob(result['openai-key']);
        resolve(decodedKey);
      }
    });
  });
};

const sendMessage = (content) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tab) => {
    const activeTab = tab[0].id;

    chrome.tabs.sendMessage(
      activeTab,
      { message: 'inject', content },
      (response) => {
        if (response.status === 'failed') {
          console.log('injection failed.');
        }
      }
    );
  });
};


const generate = async (prompt) => {
  const key = await getKey();
  console.log("afterkey")
  console.log("after key")
  const url = 'https://api.openai.com/v1/completions';
	
  const completionResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 1250,
      temperature: 0.7,
    }),
  });
	
  const completion = await completionResponse.json();
  return completion.choices.pop();
}



const generateCompletionAction = async (info) => {
	try {
        // Send mesage with generating text (this will be like a loading indicator)
        sendMessage('generating...');

        const { selectionText } = info;
        const basePromptPrefix =
        `
        Write me a detailed blog post with the topic below.
  
        Topic:
        `;
  
        const baseCompletion = await generate(`${basePromptPrefix}${selectionText}`);
    
      const secondPrompt = 
        `
        Take the table of contents and topic of the blog post below and generate a full blog post with a fun tone. Make it fun, joyous, and great to read. Make sure the reader isn't border while reading the blog. .
  
        Topic: ${selectionText}
  
        Table of Contents: ${baseCompletion.text}
  
        Email:
        `;
        
        const secondPromptCompletion = await generate(secondPrompt);
        
      // Send the output when we're all done
      sendMessage(secondPromptCompletion.text);
  } catch (error) {
    console.log(error);

		// Add this here as well to see if we run into any errors!
		sendMessage(error.toString());
  }
};

chrome.contextMenus.create({
  id: 'context-run',
  title: 'Generate blog post',
  contexts: ['selection'],
});

chrome.contextMenus.onClicked.addListener(generateCompletionAction);