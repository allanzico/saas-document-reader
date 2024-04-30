import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { pinecone } from "@/lib/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "@langchain/pinecone";
 
const f = createUploadthing();

export const ourFileRouter = {

  pdfUploader: f({ pdf: { maxFileSize: "4MB" } })

    .middleware(async ({ req }) => {

      const {getUser} = getKindeServerSession();
      const user = await getUser();
      if(!user || !user.id ) throw new UploadThingError('Unauthorized');

      return { userId: user.id  };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const createdFile = await db.file.create({
        data: {
          key: file.key,
          userId: metadata.userId,
          name: file.name,
          url: file.url,
          uploadStatus: 'PROCESSING',
        }
      });

      try {
        const response = await fetch(file.url);
        const blob = await response.blob();
        const loader = new PDFLoader(blob);
        const pageLevelDocs = await loader.load();
        const pagesAmt = pageLevelDocs.length;

        //vectorize and index the document
        const pineconeIndex = pinecone.Index('jas');
        const embeddings = new OpenAIEmbeddings(
          {
            openAIApiKey: process.env.OPENAI_API_KEY!
          }
        )

        await PineconeStore.fromDocuments(
          pageLevelDocs, embeddings, {
            pineconeIndex, namespace: createdFile.id
          }
        )

        await db.file.update({
          where: {
            id: createdFile.id
          },
          data: {
            uploadStatus: 'SUCCESS',
          }
        })
      } catch (error) {
        await db.file.update({
          where: {
            id: createdFile.id
          },
          data: {
            uploadStatus: 'FAILED',
          }
        })
      }

    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;