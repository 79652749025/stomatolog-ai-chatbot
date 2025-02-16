require('dotenv').config();  
const openaiApiKey = process.env.OPENAI_API_KEY; // For local development  

export default defineEventHandler(async (event) => {  
    const config = useRuntimeConfig();  
    let messages = [];  
    
    // Read previous messages from the request body  
    const previousMessages = await readBody(event) || []; // Ensure it's an array  
    messages = messages.concat(previousMessages);  

    // Create the prompt for the OpenAI API  
    let prompt = messages.map((message) => `${message.role}: ${message.message}`).join('\n') + `\nAI:`;  

    try {  
        const req = await fetch('https://api.openai.com/v1/completions', {  
            method: 'POST',  
            headers: {  
                'Content-Type': 'application/json',  
                Authorization: `Bearer ${config.OPENAI_API_KEY || openaiApiKey}` // Fallback for local development  
            },  
            body: JSON.stringify({  
                model: 'gpt-4o-mini',  // Ensure this model is correct  
                prompt: prompt,  
                temperature: 0.9,  
                max_tokens: 512,  
                top_p: 1.0,  
                frequency_penalty: 0,  
                presence_penalty: 0.6,  
                stop: [' User:', ' AI:']  
            })  
        });  

        // Check for response errors  
        if (!req.ok) {  
            const errorDetails = await req.json();  
            throw new Error(`OpenAI API error: ${errorDetails.message}`);  
        }  

        const res = await req.json();  

        // Check if choices exist and have results  
        if (res.choices && res.choices.length > 0) {  
            const result = res.choices[0];  
            return {  
                message: result.text  
            };  
        } else {  
            throw new Error("No choices returned from OpenAI API.");  
        }  
    } catch (error) {  
        console.error("Error in OpenAI API call:", error);  
        return {  
            error: "Failed to get a response from the AI."  
        };  
    }  
});
