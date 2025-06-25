import type { Attachment } from 'ai';

import { LoaderIcon, FileIcon, CrossSmallIcon } from './icons';

export const PreviewAttachment = ({
  attachment,
  readOnly = false,
  isUploading = false,
  unattachFile,
}: {
  attachment: Attachment;
  readOnly?: boolean;
  isUploading?: boolean;
  unattachFile?: () => void;
}) => {
  const { name, url, contentType } = attachment;

  return (
    <div
      data-testid="input-attachment-preview"
      className="flex flex-col gap-2 relative"
    >
      {!readOnly && unattachFile && (
        <button
          type="button"
          onClick={unattachFile}
          className="absolute top-0 right-0 z-10"
        >
          <CrossSmallIcon size={16} />
        </button>
      )}

      <div className="w-20 h-16 aspect-video bg-muted rounded-md relative flex flex-col items-center justify-center">
        {contentType ? (
          contentType.startsWith('image') ? (
            // NOTE: it is recommended to use next/image for images
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt={name ?? 'An image attachment'}
              className="rounded-md size-full object-cover"
            />
          ) : (
            <FileIcon />
          )
        ) : (
          <FileIcon />
        )}

        {isUploading && (
          <div
            data-testid="input-attachment-loader"
            className="animate-spin absolute text-zinc-500"
          >
            <LoaderIcon />
          </div>
        )}
      </div>
      <div className="text-xs text-zinc-500 max-w-16 truncate">{name}</div>
    </div>
  );
};
