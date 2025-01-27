import { useDropzone } from 'react-dropzone'
import { useCallback } from 'react';

export default function FileDropzone({ onFileUpload }) {

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'video/mp4': [],  // MP4
      'video/webm': [], // WEBM
      'video/quicktime': [], // MOV
      'video/x-msvideo': [], // AVI
      'video/x-matroska': [], // MKV
    }, // Videos only
    maxFiles: 1, // 1 file limit
    maxSize: 2147483648, // 2GB
    onDrop,
  })

  return (
    <div {...getRootProps()} className={`flex flex-col items-center justify-center size-full rounded-xl border-2 border-dashed border-zinc-500 ${isDragActive ? ' bg-zinc-700' : 'bg-zinc-800'}`}>
      <label htmlFor="file-upload" className="sr-only">Upload your video</label>
      <input id="file-upload" {...getInputProps()} />
      <p className="text-zinc-200 mb-1 text-center">Drag & drop your video</p>
      <p className="text-zinc-200 text-sm">or</p>
      <button type="button" className="mt-2 flex py-2 px-6 rounded-md text-sm font-medium text-zinc-900 bg-green-500 hover:bg-green-600">
        Select File
      </button>
    </div>
  );
}