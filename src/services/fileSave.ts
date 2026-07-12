interface FilePickerAcceptType {
  description?: string;
  accept: Record<string, string[]>;
}

interface SaveFilePickerOptionsLike {
  suggestedName?: string;
  types?: FilePickerAcceptType[];
  excludeAcceptAllOption?: boolean;
}

interface FileSystemWritableFileStreamLike {
  write: (data: string) => Promise<void>;
  close: () => Promise<void>;
}

interface FileSystemFileHandleLike {
  createWritable: () => Promise<FileSystemWritableFileStreamLike>;
}

interface SaveFilePickerWindow extends Window {
  showSaveFilePicker?: (options?: SaveFilePickerOptionsLike) => Promise<FileSystemFileHandleLike>;
}

export type SaveJsonResult = 'saved' | 'cancelled' | 'fallback-downloaded';

const downloadJsonPayload = (json: string, fileName: string): void => {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const supportsSaveFilePicker = (): boolean => {
  const { showSaveFilePicker } = window as SaveFilePickerWindow;
  return typeof showSaveFilePicker === 'function';
};

export const downloadJsonFile = <T>(data: T, suggestedName: string): void => {
  const payload = JSON.stringify(data, null, 2);
  const normalizedName = suggestedName.endsWith('.json') ? suggestedName : `${suggestedName}.json`;
  downloadJsonPayload(payload, normalizedName);
};

export const saveJsonWithPicker = async <T>(data: T, suggestedName: string): Promise<SaveJsonResult> => {
  const payload = JSON.stringify(data, null, 2);
  const normalizedName = suggestedName.endsWith('.json') ? suggestedName : `${suggestedName}.json`;
  const { showSaveFilePicker } = window as SaveFilePickerWindow;

  if (!showSaveFilePicker) {
    downloadJsonPayload(payload, normalizedName);
    return 'fallback-downloaded';
  }

  try {
    const handle = await showSaveFilePicker({
      suggestedName: normalizedName,
      types: [
        {
          description: 'JSON-Datei',
          accept: {
            'application/json': ['.json']
          }
        }
      ],
      excludeAcceptAllOption: false
    });
    const writable = await handle.createWritable();
    await writable.write(payload);
    await writable.close();
    return 'saved';
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return 'cancelled';
    }
    throw err;
  }
};
