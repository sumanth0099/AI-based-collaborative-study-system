const { json } = require("express");

async function getData(){
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions',{
        method:'POST',
        headers:{
            "Content-Type": "application/json",
            Authorization: `Bearer `,
        },
        body:JSON.stringify({
            model:"llama-3.3-70b-versatile",
            messages:[
                {
                    role:"user",
                    content:"give me a json object where roll and name are keys i want only object nothing more even symbols and heading that says it is a json"
                }
            ]
        })
    })
    const data = await response.json();
    console.log(JSON.parse((data.choices[0].message.content)));
    
}
getData();
