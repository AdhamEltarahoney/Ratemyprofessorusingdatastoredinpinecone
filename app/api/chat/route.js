// import { NextResponse } from "next/server";
// import { Pinecone } from "@pinecone-database/pinecone";
// import OpenAI from "openai";
// import { Stardos_Stencil } from "next/font/google";

// const systemPrompt = `
// You are a highly knowledgeable and helpful agent designed to assist students in finding professors based on specific queries. Each time a student asks a question about a professor, course, or department, you will retrieve the top 3 professors who best match their query using the latest data from RateMyProfessor and provide relevant information about them. Your responses should be concise, informative, and tailored to the student's needs. Prioritize professors with the highest ratings and most relevant attributes to the query.

// Key Instructions:

// - **Understanding the Query:** Analyze the student's query to understand what they're looking for—this could include professor expertise, course difficulty, teaching style, or department affiliation.

// - **Information Retrieval:** Use RAG to retrieve the most relevant professors based on the query. Ensure that the data is up-to-date and includes ratings, student reviews, and any other pertinent information.

// - **Ranking Professors:** Present the top 3 professors based on the relevancy to the query. Include the professor's name, department, course(s) they teach, overall rating, and a brief summary of student reviews.

// - **Response Structure:**
//   - **Introduction:** Acknowledge the query and explain that you've found the top 3 professors that match their criteria.
//   - **Professor 1:** Name, Department, Course(s), Overall Rating, Brief Summary of Reviews.
//   - **Professor 2:** Name, Department, Course(s), Overall Rating, Brief Summary of Reviews.
//   - **Professor 3:** Name, Department, Course(s), Overall Rating, Brief Summary of Reviews.
//   - **Conclusion:** Offer additional assistance if the student needs more information or has further questions.

// - **Tone and Language:** Maintain a helpful and neutral tone, ensuring clarity and accuracy in your responses.
// `;

// //read data

// export async function POST(req){
//     const data = await req.json()
//     const pc = new Pinecone({
//         apiKey: process.env.PINECONE_API_KEY
//     })
//     const index = pc.indec('rag').namespace('ns1')
//     const openai = new OpenAI()
//     //embedding
//     const text = data[data.length-1].content
//     const embedding = await OpenAI.Embeddings.create({
//         model: 'text-embedding-3-small',
//         input: text,
//         encoding_format: 'float'
//     })
//     const results= await index.query({
//         topk: 3,
//         includeMetadata: true,
//         vector: embedding.data[0].embedding
//     }) 
//     let resultString = `
//     \n\nReturned results from vector db (done automatically): `;

//     results.matches.forEach((match) => {
//         resultString += `\n
//         Professor: ${match.id}
//         Review:${match.metadata.stars}
//         Subject:${match.metadata.subject}
//         Stars ${match.metadata.stars}
//         \n\n`;
//     })

//     const lastMessage = data[data.length - 1]
//     const lastMessageContent= lastMessage.content + resultString
//     const lastDataWithoutLastMessage = data.slice(0, data.length-1)
//     const completeion = await openai.chat.completions.create({
//         messages=[
//             {role:'system', content:systemPrompt},
//             ...lastDataWithoutLastMessage,
//             {role:'user', content:lastMessageContent}
//         ],
//         model:'gpt-4o-mini',
//         stream: true,

//     })
//     const stream = ReadableStream({
//         async start(controller){
//             const encoder = new TextEncoder()
//             try{
//                 for await(const chunk of completion){
//                     const content = chunk.choices[0]?.delta?.content
//                     if (content){
//                         const text = ecoder.encode(content)
//                         controller.enqueue(text)
//                     }
//                 }
//             }
//             catch (err){
//                 controller.error(err)
//             }
//             finally{
//                 controller.close()
//             }
//         }
//     })
//     return new NextResponse(stream)
    

// }

// // export { systemPrompt };
import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import { ReadableStream } from "web-streams-polyfill"; // Import ReadableStream
import { TextEncoder } from "util"; // Import TextEncoder

const systemPrompt = `
You are a highly knowledgeable and helpful agent designed to assist students in finding professors based on specific queries. Each time a student asks a question about a professor, course, or department, you will retrieve the top 3 professors who best match their query using the latest data from RateMyProfessor and provide relevant information about them. Your responses should be concise, informative, and tailored to the student's needs. Prioritize professors with the highest ratings and most relevant attributes to the query.

Key Instructions:

- **Understanding the Query:** Analyze the student's query to understand what they're looking for—this could include professor expertise, course difficulty, teaching style, or department affiliation.

- **Information Retrieval:** Use RAG to retrieve the most relevant professors based on the query. Ensure that the data is up-to-date and includes ratings, student reviews, and any other pertinent information.

- **Ranking Professors:** Present the top 3 professors based on the relevancy to the query. Include the professor's name, department, course(s) they teach, overall rating, and a brief summary of student reviews.

- **Response Structure:**
  - **Introduction:** Acknowledge the query and explain that you've found the top 3 professors that match their criteria.
  - **Professor 1:** Name, Department, Course(s), Overall Rating, Brief Summary of Reviews.
  new line
  - **Professor 2:** Name, Department, Course(s), Overall Rating, Brief Summary of Reviews.
  new line
  - **Professor 3:** Name, Department, Course(s), Overall Rating, Brief Summary of Reviews.
  new line
  - **Conclusion:** Offer additional assistance if the student needs more information or has further questions.

- **Tone and Language:** Maintain a helpful and neutral tone, ensuring clarity and accuracy in your responses.
`;

export async function POST(req) {
    const data = await req.json();
    
    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY
    });

    const index = pc.index('rag').namespace('ns1');

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

    // Embedding the text
    const text = data[data.length - 1].content;
    const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text
    });

    const results = await index.query({
        topK: 3,
        includeMetadata: true,
        vector: embedding.data[0].embedding
    });

    let resultString = `\n\nReturned results from vector db (done automatically): `;

    results.matches.forEach((match) => {
        resultString += `\n
        Professor: ${match.id}
        Review: ${match.metadata.stars}
        Subject: ${match.metadata.subject}
        Stars: ${match.metadata.stars}
        \n\n`;
    });

    const lastMessage = data[data.length - 1];
    const lastMessageContent = lastMessage.content + resultString;
    const lastDataWithoutLastMessage = data.slice(0, data.length - 1);
    
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: systemPrompt },
            ...lastDataWithoutLastMessage,
            { role: 'user', content: lastMessageContent }
        ],
        stream: true
    });

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content;
                    if (content) {
                        const text = encoder.encode(content);
                        controller.enqueue(text);
                    }
                }
            } catch (err) {
                controller.error(err);
            } finally {
                controller.close();
            }
        }
    });

    return new NextResponse(stream);
}

export { systemPrompt };
