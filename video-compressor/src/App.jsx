import './App.css';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone'

import { HiDownload, HiChevronDown } from "react-icons/hi";
import { AiFillCaretDown, AiFillCaretUp } from "react-icons/ai";
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

function App() {
  const [sizesOpen, setSizesOpen] = useState(false);
  const [isTranscoded, setIsTranscoded] = useState(false);
  const [video, setVideo] = useState({ name: "", size: 0 });
  const [downloadUrl, setDownloadUrl] = useState(null);

  const [compressedVideoSize, setCompressedVideoSize] = useState(0);

  const [loaded, setLoaded] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef(null);
  const messageRef = useRef(null);

  // Array of possible questions and answers (what it do and how it do)
  const faqs = [
    { question: "What it do?", answer: "It do what it do." },
    { question: "How it do?", answer: "It do how it do." },
  ];

  useEffect(() => {
    console.log(loaded);
    if (loaded) {
      transcode();
      setSizesOpen(true);
    }
  }, [loaded]);

  const onDrop = useCallback(acceptedFiles => {
    // Do something with the files
    console.log(acceptedFiles);
    if (acceptedFiles.length > 0) {
      setVideo(acceptedFiles[0]);
      load();
    }
  }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'video/*': [], }, // Video files only
    maxFiles: 1,       // One file at a time
    onDrop,
  })

  const load = async () => {
    const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm";
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on('log', ({ message }) => {
      // messageRef.current.innerHTML = message;
      console.log(message);
      if (message.includes("total_size")) {
        let splitMessage = message.split("=");
        setCompressedVideoSize(parseInt(splitMessage[1]));
      }
    });
    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, "text/javascript"),
    });
    setLoaded(true);
  }


  const transcode = async () => {
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.writeFile('input.mp4', await fetchFile(video));
    await ffmpeg.exec([
      "-i",
      "input.mp4",
      '-threads', // Number of threads for multithreading
      '4',
      "-c:v", // Video codec
      "libx264",
      "-tag:v", // Video tag
      "avc1",
      "-movflags", // Moves metadata to the beginning of the file
      "faststart",
      "-crf", // Constant Rate Factor (quality level, higher = lower quality)
      "30",
      "-preset", // Preset for faster encoding
      "superfast",
      "-progress", // Progress info
      "-",
      "-v", // Verbose
      "",
      "-y",
      "output.mp4"
    ]);

    const data = await ffmpeg.readFile('output.mp4');
    setCompressedVideoSize(data.byteLength);
    let url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
    setIsTranscoded(true);
    videoRef.current.src = url;
    setDownloadUrl(url);
    setSizesOpen(true);
    console.log(data);
  }


  /**
   * Adds "_compressed" to the name of the video that was uploaded.
   * @returns {string} The name of the compressed video
   */
  function getDownloadVideoName() {
    let splitName = video.name.split(".");
    return splitName[0] + "_compressed." + splitName[1];
  }


  /**
   * Converts file size in bytes to a more readable size format with a suffix (KB, MB, GB)
   * @param {number} bytes File size in bytes.
   * @returns Converted number
   */
  function getFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];

    if (bytes === 0) return '0 Bytes';
    const sizeIndex = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, sizeIndex)).toFixed(1)) + ' ' + sizes[sizeIndex];
  }


  /**
   * Calculates the percentage change between two numbers and returns a span element with the percentage change.
   * @param {number} original Size of the original video file (in bytes).
   * @param {number} compressed Size of the compressed video file (in bytes).
   * @returns {JSX.Element} A span element with the percentage change.
   */
  function getPercentChange(original, compressed, isTranscoded) {
    let percentChange = ((compressed - original) / original) * 100;

    // Show only once file finished encoding
    if (!isTranscoded) return null;

    return (
      <>
        <span className={`flex items-center py-0.5 px-1 ml-2 rounded-sm text-xs font-semibold text-zinc-900 ${percentChange > 0 ? "bg-red-500" : "bg-green-500"}`}>
          {percentChange > 0 ? <AiFillCaretUp /> : <AiFillCaretDown />}
          {Math.abs(percentChange).toFixed(0)}%
        </span >
      </>
    );
  }


  return (
    <>
      <main className="bg-zinc-900 min-h-screen absolute w-full px-2 sm:px-0">
        <div className="max-w-screen-md mx-auto mt-16">


          {!isTranscoded &&
            <div className="aspect-video rounded-xl">
              <div {...getRootProps()} className={`flex flex-col items-center justify-center size-full rounded-xl border-2 border-dashed border-zinc-500 ${isDragActive ? ' bg-zinc-700' : 'bg-zinc-800'}`}>
                <input {...getInputProps()} />
                <p className="text-zinc-200 mb-1">Drag & drop your video</p>
                <p className="text-zinc-200 text-sm">or</p>
                <button type="button" className="mt-2 flex py-2 px-6 rounded-md text-sm font-medium text-zinc-900 bg-green-500 hover:bg-green-600">
                  Browse Files
                </button>
              </div>
            </div>
          }

          <>
            <video className={`rounded-xl ${isTranscoded ? "" : "hidden"}`} ref={videoRef} controls></video>
          </>

          {sizesOpen &&
            <div className="w-full mt-4 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
              {/* BEFORE */}
              <div className="bg-zinc-800 rounded-xl p-4">
                <h2 className="text-zinc-400 font-light text-sm tracking-wide mb-1">ORIGINAL</h2>
                <span className="text-zinc-200 text-3xl">{getFileSize(video.size)}</span>
              </div>

              {/* AFTER */}
              <div className="bg-zinc-800 rounded-xl p-4 mt-4 sm:mt-0">
                <h2 className="text-zinc-400 font-light text-sm tracking-wide mb-1">COMPRESSED</h2>
                <div className="flex items-center justify-between w-full">
                  <span className="text-zinc-200 text-3xl flex items-center">
                    {getFileSize(compressedVideoSize)}
                    {getPercentChange(video.size, compressedVideoSize, isTranscoded)}
                  </span>
                  {isTranscoded && downloadUrl && (
                    <a
                      href={downloadUrl}
                      download={getDownloadVideoName()}
                      className="flex items-center py-2 px-3 bg-green-500 rounded-md text-zinc-900 text-sm font-medium hover:bg-green-600"
                    >
                      <HiDownload className="size-4 mr-1" />
                      Download
                    </a>
                  )}
                </div>
              </div>
            </div>
          }

          <dl className="mt-16 space-y-6 divide-y divide-zinc-700">
            {faqs.map((faq) => (
              <Disclosure key={faq.question} as="div" className="pt-6">
                <dt>
                  <DisclosureButton className="group flex w-full items-start justify-between text-left text-zinc-400">
                    <span className="font-semibold">{faq.question}</span>
                    <span className="ml-6 flex h-7 items-center">
                      <HiChevronDown className="size-6 group-data-[open]:rotate-180" />
                    </span>
                  </DisclosureButton>
                </dt>
                <DisclosurePanel as="dd" className="mt-2 pr-12">
                  <p className="text-base/7 text-zinc-200">{faq.answer}</p>
                </DisclosurePanel>
              </Disclosure>
            ))}
          </dl>

        </div>
      </main >
    </>
  );
}

export default App;