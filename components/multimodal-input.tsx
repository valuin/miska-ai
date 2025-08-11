"use client";

import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import { useVaultFilesStore } from "@/lib/store/vault-files-store";
import { useMessageCountStore } from "./chat-with-preview";
import type { UseChatHelpers } from "@ai-sdk/react";
import { upload } from "@vercel/blob/client";
import type { Attachment, UIMessage } from "ai";
import cx from "classnames";
import equal from "fast-deep-equal";
import { AnimatePresence, motion } from "framer-motion";
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import { toast } from "sonner";
import { useLocalStorage, useWindowSize } from "usehooks-ts";
import { ArrowUpIcon, PaperclipIcon, StopIcon } from "./icons";
import { MultiSelect } from "./multi-select";
import { PreviewAttachment } from "./preview-attachment";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import type { UserUpload } from "./vault-drawer";
import type { VisibilityType } from "./visibility-selector";
import { VaultDrawer } from "./vault-drawer";
import Integrations from "./integrations";
import { classifyFinancialText } from "@/app/(chat)/actions";

function MessageInputSection({
  input,
  status,
  textareaRef,
  handleInput,
  className,
  submitForm,
}: {
  input: string;
  status: UseChatHelpers["status"];
  textareaRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  handleInput: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  submitForm: () => void;
}) {
  return (
    <div className="w-full relative">
      <Textarea
        data-testid="multimodal-input"
        ref={textareaRef}
        placeholder="Ask me anything about accounting, tax, or audit..."
        value={input}
        onChange={handleInput}
        className={cx(
          className,
          "min-h-[200px] max-h-[200px] resize-none border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-200",
          "text-base leading-relaxed placeholder:text-gray-500 dark:placeholder:text-gray-400",
          "shadow-md hover:shadow-lg focus:shadow-xl transition-shadow duration-200 shadow-[#A6E564]/50"
        )}
        rows={2}
        autoFocus
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();
            if (status !== "ready") {
              toast.error("Please wait for the model to finish its response!");
            } else {
              submitForm();
            }
          }
        }}
      />
    </div>
  );
}

declare global {
  interface Window {
    __documentPreviewContext?: any;
  }
}

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
  selectedVisibilityType,
}: {
  chatId: string;
  input: UseChatHelpers["input"];
  setInput: UseChatHelpers["setInput"];
  status: UseChatHelpers["status"];
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers["setMessages"];
  append: UseChatHelpers["append"];
  handleSubmit: UseChatHelpers["handleSubmit"];
  className?: string;
  selectedVisibilityType: VisibilityType;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();
  console.log(width);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const uploadFile = async (file: File): Promise<Attachment | undefined> => {
    const toastId = toast.loading(`Uploading "${file.name}"...`);
    try {
      const newBlob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/files/upload-blob",
        multipart: true,
      });
      const processResponse = await fetch("/api/files/process-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: newBlob.url,
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!processResponse.ok) throw new Error("Failed to process document");

      const processResult = await processResponse.json();

      if (processResult.success && processResult.document.canSaveToVault) {
        toast.success(`"${file.name}" uploaded and processed.`);
      } else if (processResult.success) {
        toast.success(`"${file.name}" uploaded successfully.`);
      }

      return { url: newBlob.url, name: file.name, contentType: file.type };
    } catch (error) {
      toast.error("Failed to upload and process file.");
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      setUploadQueue(files.map((file) => file.name));
      try {
        const uploadedAttachments = await Promise.all(files.map(uploadFile));
        const successfulUploads = uploadedAttachments.filter(
          (att): att is Attachment => att !== undefined
        );
        setAttachments((curr) => [...curr, ...successfulUploads]);
      } catch (error) {
      } finally {
        setUploadQueue([]);
        if (event.target) {
          event.target.value = "";
        }
      }
    },
    [setAttachments]
  );

  const unattachFile = (name: string) => {
    setAttachments((currentAttachments) =>
      currentAttachments.filter((a) => a.name !== name)
    );
  };

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = "98px";
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    "input",
    ""
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;

      const finalValue = domValue || localStorageInput || "";
      setInput(finalValue);
      adjustHeight();
    }
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const { selectedVaultFileNames } = useVaultFilesStore();

  const { setMessageCount } = useMessageCountStore();

  const submitForm = useCallback(async () => {
    window.history.replaceState({}, "", `/chat/${chatId}`);

    let userPrompt = input;
    let restoreInput = false;
    if (selectedVaultFileNames && selectedVaultFileNames.length > 0) {
      userPrompt = `[Vault Files Selected: ${selectedVaultFileNames.join(
        ", "
      )}]\n${input}`;
      setInput(userPrompt);
      restoreInput = true;
    }

    let systemPrompt: string | undefined = undefined;
    if (selectedVaultFileNames && selectedVaultFileNames.length > 0) {
      systemPrompt = `Vault Files Selected: ${selectedVaultFileNames.join(
        ", "
      )}`;
    }

    const body: { systemPrompt?: string } = {};
    if (systemPrompt) {
      body.systemPrompt = systemPrompt;
    }

    // Use the classifyFinancialText function to determine message count based on input
    const category = await classifyFinancialText(input);
    setMessageCount(category);

    handleSubmit(undefined, {
      experimental_attachments: attachments.filter((att) => !!att.url),
      body,
    });

    if (restoreInput) {
      setTimeout(() => setInput(""), 0);
    }

    setAttachments([]);
    setLocalStorageInput("");
    resetHeight();

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    attachments,
    handleSubmit,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
    input,
    selectedVaultFileNames,
    setInput,
    setMessageCount,
    classifyFinancialText,
  ]);

  const { isAtBottom, scrollToBottom } = useScrollToBottom();

  useEffect(() => {
    if (status === "submitted") {
      scrollToBottom();
    }
  }, [status, scrollToBottom]);

  return (
    <div className="relative w-full flex flex-col gap-4">
      <AnimatePresence>
        {!isAtBottom && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute left-1/2 bottom-28 -translate-x-1/2 z-50"
          />
        )}
      </AnimatePresence>

      {/* Attachment Previews */}
      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div
          data-testid="attachments-preview"
          className="flex flex-row gap-2 overflow-x-scroll items-end"
        >
          {attachments.map((attachment) => (
            <PreviewAttachment
              key={attachment.url}
              attachment={attachment}
              unattachFile={() => unattachFile(attachment.name ?? "")}
            />
          ))}
          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              unattachFile={() => unattachFile(filename)}
              attachment={{ url: "", name: filename, contentType: "" }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      {/* Message input section */}
      <MessageInputSection
        input={input}
        status={status}
        textareaRef={textareaRef}
        handleInput={handleInput}
        className={cx(
          "min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-muted dark:border-zinc-700 p-4",
          className
        )}
        submitForm={submitForm}
      />

      {/* Hidden file input */}
      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {/* Action Buttons inside textarea */}
      <div className="absolute bottom-2 inset-x-2 flex flex-row items-center justify-between w-auto mb-6 mx-4">
        <div className="flex items-center gap-2">
          <VaultDrawer width={width} />
          <Button
            data-testid="upload-button"
            size="sm"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={status !== "ready"}
            className="border"
          >
            <PaperclipIcon />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Integrations />
          {status === "submitted" ? (
            <StopButton stop={stop} setMessages={setMessages} />
          ) : (
            <SendButton input={input} submitForm={submitForm} />
          )}
        </div>
      </div>
    </div>
  );
}

function VaultFilesSection({
  onAttachmentsChange,
  disabled,
}: {
  onAttachmentsChange?: (attachments: Array<Attachment>) => void;
  disabled?: boolean;
}) {
  const [vaultFiles, setVaultFiles] = useState<UserUpload[]>([]);
  const { selectedVaultFileNames, setSelectedVaultFileNames } =
    useVaultFilesStore();
  const [selectedVaultFiles, setSelectedVaultFiles] = useState<string[]>(
    selectedVaultFileNames
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string[]>).detail;
      if (Array.isArray(detail) && detail.length > 0) {
        setSelectedVaultFiles((prev) =>
          Array.from(new Set([...prev, ...detail]))
        );
      }
    };
    window.addEventListener("vault-autoselect", handler);
    return () => window.removeEventListener("vault-autoselect", handler);
  }, []);

  const [isLoading, setIsLoading] = useState(false);

  const fetchUserUploads = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/vault/documents");
      if (!response.ok) {
        throw new Error("Failed to fetch vault documents");
      }
      const data = await response.json();

      const uniqueDocuments = Array.from(
        new Map(
          (data.documents as UserUpload[]).map((doc) => [doc.filename, doc])
        ).values()
      );
      setVaultFiles(uniqueDocuments || []);
    } catch (error) {
      setVaultFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    onAttachmentsChange?.(
      selectedVaultFiles.map((fileId) => {
        const file = vaultFiles.find((f) => f.id === fileId);
        return {
          url: file?.url || "",
          name: file?.filename || "",
          contentType: "",
        };
      })
    );
    setSelectedVaultFileNames(selectedVaultFiles);
  }, [
    selectedVaultFiles,
    vaultFiles,
    onAttachmentsChange,
    setSelectedVaultFileNames,
  ]);

  return (
    <div className="w-full">
      <MultiSelect
        options={vaultFiles.map((file) => ({
          label: file.filename,
          value: file.filename,
        }))}
        onValueChange={setSelectedVaultFiles}
        defaultValue={selectedVaultFiles}
        placeholder="Select files from vault"
        className="w-full"
        disabled={disabled || isLoading}
        onOpen={fetchUserUploads}
      />
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;

    return true;
  }
);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers["setMessages"];
}) {
  return (
    <Button
      data-testid="stop-button"
      className="p-1.5 h-fit border dark:border-zinc-600 bg-gradient-to-b from-[#054135] to-[#A6E564] text-white"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

function PureSendButton({
  submitForm,
  input,
}: {
  submitForm: () => void;
  input: string;
}) {
  return (
    <Button
      data-testid="send-button"
      className="p-1.5 h-fit border-none bg-gradient-to-b from-[#054135] to-[#A6E564] text-white"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={input.length === 0}
    >
      <ArrowUpIcon size={14} />
    </Button>
  );
}

const SendButton = memo(PureSendButton);
