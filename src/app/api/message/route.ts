import { db } from "@/db";
import { openai } from "@/lib/openai";
import { pinecone } from "@/lib/pinecone";
import { SendMessageValidator } from "@/lib/validators/SendMessageValidator";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
    const body = await req.json();

    const {getUser} = getKindeServerSession();
    const user = await getUser();


    if(!user?.id) new Response('Unauthorized', {status: 401})

    const {fileId, message} = SendMessageValidator.parse(body);

    const file = await db.file.findFirst({
        where: {
            id: fileId,
            userId: user?.id,
        },
    });

    if(!file) return new Response('File not found', {status: 404})

        await db.message.create({
            data: {
                text: message,
                isUserMessage: true,
                fileId,
                userId: user?.id,
            }
        })

        //vectorize message

        const embeddings = new OpenAIEmbeddings(
            {
              openAIApiKey: process.env.OPENAI_API_KEY!
            }
          )
          const pineconeIndex = pinecone.Index('jas');

          const vectorStore = await PineconeStore.fromExistingIndex( embeddings, {
            pineconeIndex, namespace: file.id
          });

          const results = await vectorStore.similaritySearch(message, 4);

          const prevMessage = await db.message.findMany({
            where: {
                fileId: file.id,
            },
            orderBy: {
                createdAt: 'asc',
            },
            take: 6,
          });

          const formattedMessages = prevMessage.map((message) => ({
            role: message.isUserMessage ? 'user' as const : 'assistant' as const,
            content : message.text,
          }))

          const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            stream: true,
           
            temperature: 0,
            messages: [
                {
                  role: 'system',
                  content:
                    'Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.',
                },
                {
                  role: 'user',
                  content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
                  
            \n----------------\n
            
            PREVIOUS CONVERSATION:
            ${formattedPrevMessages.map((message) => {
              if (message.role === 'user') return `User: ${message.content}\n`
              return `Assistant: ${message.content}\n`
            })}
            
            \n----------------\n
            
            CONTEXT:
            ${results.map((r) => r.pageContent).join('\n\n')}
            
            USER INPUT: ${message}`,
                },
              ],
          });
}