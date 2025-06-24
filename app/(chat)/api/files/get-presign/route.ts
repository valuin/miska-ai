import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { saveDocument } from '@/lib/db/queries';

// // Use Blob instead of File since File is not available in Node.js environment
// const FileSchema = z.object({
//   file: z
//     .instanceof(Blob)
//     .refine((file) => file.size <= 5 * 1024 * 1024, {
//       message: 'File size should be less than 5MB',
//     })
//     // Update the file type based on the kind of files you want to accept
//     .refine((file) => ['image/jpeg', 'image/png'].includes(file.type), {
//       message: 'File type should be JPEG or PNG',
//     }),
// });

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (
        pathname,
        /* clientPayload */
      ) => {
        // Generate a client token for the browser to upload the file
        // ⚠️ Authenticate and authorize users before generating the token.
        // Otherwise, you're allowing anonymous uploads.

        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            // optional, sent to your server on upload completion
            // you could pass a user id from auth, or a value from clientPayload
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Get notified of client upload completion
        // ⚠️ This will not work on `localhost` websites,
        // Use ngrok or similar to get the full upload flow

        console.log('blob upload completed', blob, tokenPayload);

        try {
          // Run any logic after the file upload completed
          //   const { userId } = JSON.parse(tokenPayload);
          //   await db.update({ avatar: blob.url, userId });
          //           xport async function saveDocument({
          //   id,
          //   title,
          //   kind,
          //   content,
          //   userId,
          // }: {
          await saveDocument({
            id: blob.id,
            title: blob.name,
            kind: 'image',
            content: blob.url,
            userId: session.user.id,
          });
        } catch (error) {
          throw new Error('Could not update user');
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
