'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './ui/button';
import { ClarificationMessage, WorkflowMessage } from './workflow';
import { cn, sanitizeText } from '@/lib/utils';
import { DefaultToolResult } from './default-tool-result';
import { DocumentPreview } from './document-preview';
import { DocumentToolCall, DocumentToolResult } from './document';
import { Markdown } from './markdown';
import { memo, useState } from 'react';
import { MessageActions } from './message-actions';
import { MessageEditor } from './message-editor';
import { MessageReasoning } from './message-reasoning';
import { PencilEditIcon, SparklesIcon } from './icons';
import { PreviewAttachment } from './preview-attachment';
import { SearchIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { VaultList, type UserUpload } from './vault-drawer';
import Badge from './badge';
import cx from 'classnames';
import equal from 'fast-deep-equal';
import GradientText from './GradientText/GradientText';
import Options from './options';
import Sources from './sources';
import ToolCallBadge from './tool-call-badge';
import type { UIMessage } from 'ai';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { Vote } from '@/lib/db/schema';

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  reload,
  isReadonly,
  requiresScrollPadding,
  append,
}: {
  chatId: string;
  message: UIMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
  append: UseChatHelpers['append'];
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  const rearrangeParts = (parts: UIMessage['parts']) =>
    parts.slice().sort((a, b) => {
      const score = (item: typeof a) =>
        // if the tool invocation is a clarification or options, it should be at the bottom of the message
        item.type === 'tool-invocation' &&
        (item.toolInvocation.toolName === 'clarificationTool' ||
          item.toolInvocation.toolName === 'optionsTool')
          ? 1
          : 0;
      return score(a) - score(b);
    });

  const handleSendUploads = (uploads: UserUpload[]) => {
    append({
      role: 'user',
      content: `${uploads.length === 1 ? 'This is the document' : 'These are the documents'} that I want to process!.`,
      experimental_attachments: uploads,
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
            {
              'w-full': mode === 'edit',
              'group-data-[role=user]/message:w-fit': mode !== 'edit',
            },
          )}
        >
          {message.role === 'assistant' && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
          )}

          <div
            className={cn('flex flex-col gap-4 w-full', {
              'min-h-96': message.role === 'assistant' && requiresScrollPadding,
            })}
          >
            {message.annotations &&
              message.annotations.length > 0 &&
              message.annotations.map(
                (annotation: { type: string } & any, index: number) => {
                  if (annotation.type === 'agent-choice') {
                    return (
                      <Badge
                        key={index}
                        icon={SparklesIcon}
                        text={
                          <GradientText
                            colors={[
                              '#154fc2',
                              '#9b61e8',
                              '#4bdee2',
                              '#9b61e8',
                              '#154fc2',
                            ]}
                            animationSpeed={3}
                            showBorder={false}
                            className="text-xs"
                          >
                            {annotation.agentChoice}
                          </GradientText>
                        }
                      />
                    );
                  }
                },
              )}

            {message.experimental_attachments &&
              message.experimental_attachments.length > 0 && (
                <div
                  data-testid={`message-attachments`}
                  className="flex flex-row justify-end gap-2"
                >
                  {message.experimental_attachments.map((attachment, index) => (
                    <PreviewAttachment
                      key={`${attachment.name}-${index}`}
                      attachment={attachment}
                      readOnly={isReadonly}
                    />
                  ))}
                </div>
              )}
            {/* {JSON.stringify(message.parts, null, 2)} */}
            {rearrangeParts(message.parts)?.map((part, index) => {
              const { type } = part;
              const key = `message-${message.id}-part-${index}`;

              if (type === 'reasoning') {
                return (
                  <MessageReasoning
                    key={key}
                    isLoading={isLoading}
                    reasoning={part.reasoning}
                  />
                );
              }

              if (type === 'text') {
                if (mode === 'view') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      {message.role === 'user' && !isReadonly && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              data-testid="message-edit-button"
                              variant="ghost"
                              className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
                              onClick={() => {
                                setMode('edit');
                              }}
                            >
                              <PencilEditIcon />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit message</TooltipContent>
                        </Tooltip>
                      )}

                      <div
                        data-testid="message-content"
                        className={cn('flex flex-col gap-4', {
                          'bg-primary text-primary-foreground px-3 py-2 rounded-xl':
                            message.role === 'user',
                        })}
                      >
                        <Markdown>{sanitizeText(part.text)}</Markdown>
                      </div>
                    </div>
                  );
                }

                if (mode === 'edit') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      <div className="size-8" />

                      <MessageEditor
                        key={message.id}
                        message={message}
                        setMode={setMode}
                        setMessages={setMessages}
                        reload={reload}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-invocation') {
                const { toolInvocation } = part;
                const { toolName, toolCallId, state } = toolInvocation;

                const isVaultTool =
                  toolName === 'queryVaultDocumentsTool' ||
                  toolName === 'listVaultDocumentsTool';

                if (state === 'call') {
                  const { args } = toolInvocation;

                  return (
                    <div
                      key={toolCallId}
                      className={cx({
                        skeleton: ['searxngTool'].includes(toolName),
                      })}
                    >
                      {isVaultTool ||
                      (toolName === 'crawlerTool' && args?.query) ? (
                        <ToolCallBadge icon={SearchIcon} query={args.query} />
                      ) : toolName === 'searxngTool' ? (
                        <Sources args={args} streaming={true} />
                      ) : toolName === 'createDocument' ? (
                        <DocumentPreview isReadonly={isReadonly} args={args} />
                      ) : toolName === 'updateDocument' ? (
                        <DocumentToolCall
                          type="update"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'requestSuggestions' ? (
                        <DocumentToolCall
                          type="request-suggestions"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'listVaultDocumentsTool' ? (
                        <VaultList
                          uploads={args.documents.map((document: any) => ({
                            id: document.id,
                            filename: document.filename,
                            url: document.url,
                            createdAt: document.createdAt,
                          }))}
                          isLoading={isLoading}
                          isDeletable={true}
                          isSelectable={true}
                          onSendToAgent={handleSendUploads}
                        />
                      ) : (
                        <div>{toolName}</div>
                      )}
                    </div>
                  );
                }

                if (state === 'result') {
                  const { result } = toolInvocation;
                  // Custom: Show ToolCallBadge with file(s) for queryVaultDocumentsTool
                  if (toolName === 'queryVaultDocumentsTool') {
                    // Try to extract filenames from result
                    let filenames: string[] = [];
                    if (Array.isArray(result?.results)) {
                      filenames = Array.from(
                        new Set(
                          result.results
                            .map((r: any) => String(r.filename))
                            .filter(Boolean),
                        ),
                      ) as string[];
                    }
                    return (
                      <div key={toolCallId} className="flex flex-col gap-2">
                        <ToolCallBadge
                          icon={SearchIcon}
                          query={
                            filenames.length > 0
                              ? `${filenames.join(', ')}`
                              : 'No results found'
                          }
                        />
                      </div>
                    );
                  }
                  return (
                    <div key={toolCallId}>
                      {toolName === 'searxngTool' ? (
                        <Sources args={result} streaming={false} />
                      ) : toolName === 'crawlerTool' ? (
                        <ToolCallBadge
                          icon={SearchIcon}
                          query={result[0].url}
                        />
                      ) : toolName === 'optionsTool' ? (
                        <Options options={result.options} append={append} />
                      ) : toolName === 'workflowTool' ? (
                        <WorkflowMessage result={result} />
                      ) : toolName === 'clarificationTool' ? (
                        <ClarificationMessage result={result} append={append} />
                      ) : toolName === 'createDocument' ? (
                        <DocumentPreview
                          isReadonly={isReadonly}
                          result={result}
                        />
                      ) : toolName === 'listVaultDocumentsTool' ? (
                        <VaultList
                          uploads={result.documents.map((document: any) => ({
                            id: document.id,
                            filename: document.filename,
                            url: document.url,
                            createdAt: document.createdAt,
                          }))}
                          isLoading={isLoading}
                          isDeletable={true}
                          isSelectable={true}
                          onSendToAgent={handleSendUploads}
                        />
                      ) : toolName === 'updateDocument' ? (
                        <DocumentToolResult
                          type="update"
                          result={result}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'requestSuggestions' ? (
                        <DocumentToolResult
                          type="request-suggestions"
                          result={result}
                          isReadonly={isReadonly}
                        />
                      ) : (
                        <DefaultToolResult
                          toolName={toolName}
                          result={result}
                        />
                      )}
                    </div>
                  );
                }
              }
            })}
            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                vote={vote}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
      return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return true;
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message min-h-96"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          },
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Hmm...
          </div>
        </div>
      </div>
    </motion.div>
  );
};
