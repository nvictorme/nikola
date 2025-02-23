import { ApiClient } from "@/api/api.client";
import { ReactNode, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";

export function FileUploader({
  children,
  folder,
  onSuccess,
  onFailure,
  disabled = false,
  maxFiles = undefined,
}: {
  children: ReactNode;
  folder?: string;
  disabled?: boolean;
  maxFiles?: number;
  onSuccess?: ({ file, fileKey }: { file: File; fileKey: string }) => void;
  onFailure?: ({ file, fileKey }: { file: File; fileKey: string }) => void;
}) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      try {
        const api = new ApiClient();
        for (const file of acceptedFiles) {
          // clean up the file name
          const modifiedFile = new File(
            [file],
            file.name.replace(/[^a-z0-9.]/gi, "-"),
            { type: file.type }
          );
          const fileKey = folder
            ? `${folder}/${modifiedFile.name}`
            : modifiedFile.name;
          api
            .get(`/archivos/signed-url`, {
              fileKey,
            })
            .then(({ data }) => {
              if (data.uploadUrl) {
                fetch(data.uploadUrl, {
                  method: "PUT",
                  body: modifiedFile,
                  headers: {
                    "Content-Type": modifiedFile.type,
                  },
                }).then((response) => {
                  if (response.ok) {
                    if (onSuccess) onSuccess({ file: modifiedFile, fileKey });
                  } else {
                    if (onFailure) onFailure({ file: modifiedFile, fileKey });
                  }
                });
              }
            });
        }
      } catch (error) {
        console.error(error);
      }
    },
    [folder, onFailure, onSuccess]
  );
  const { getRootProps, getInputProps, fileRejections } = useDropzone({
    onDrop,
    disabled,
    ...(maxFiles && { maxFiles }),
  });
  useEffect(() => {
    if (maxFiles && fileRejections.length > maxFiles) {
      alert(`Solo puedes subir ${maxFiles} archivo${maxFiles > 1 ? "s" : ""}`);
    }
  }, [fileRejections, maxFiles]);
  return (
    <section>
      <div
        {...getRootProps()}
        className="bg-background border-dashed border-2 border-primary rounded-lg p-2 text-center"
      >
        <input {...getInputProps()} />
        {children}
      </div>
    </section>
  );
}
