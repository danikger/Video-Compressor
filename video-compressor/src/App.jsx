import './App.css';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from "react-router";

import ProgressBar from './Components/progressBar';
import FileDropzone from './Components/fileDropzone';
import VideoPlayer from './Components/videoPlayer';

import { HiDownload, HiChevronDown, HiOutlineTrash, HiRefresh } from "react-icons/hi";
import { AiFillCaretDown, AiFillCaretUp } from "react-icons/ai";
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

function App() {
  const [sizesOpen, setSizesOpen] = useState(false);
  const [video, setVideo] = useState({ name: "", size: 0 });
  const [hideDropzone, setHideDropzone] = useState(false);

  const [originalVidSrc, setOriginalVidSrc] = useState(null);
  const [compressedVidSrc, setCompressedVidSrc] = useState(null);

  const [compressedVideoSize, setCompressedVideoSize] = useState(0);

  const [loaded, setLoaded] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());

  const [transcodingProgress, setTranscodingProgress] = useState(0);
  const [isTranscoded, setIsTranscoded] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  let navigate = useNavigate();

  // Array of possible questions and answers (what it do and how it do)
  const faqs = [
    { question: "What it do?", answer: "It do what it do." },
    { question: "How it do?", answer: "It do how it do." },
  ];


  useEffect(() => {
    if (loaded) {
      transcode();
      setSizesOpen(true);
    }
  }, [loaded]);


  const load = async () => {
    const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm";
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on('log', ({ message }) => {
      console.log(message);
      if (message.includes("total_size")) {
        let splitMessage = message.split("=");
        setCompressedVideoSize(parseInt(splitMessage[1]));
      }
      if (message.includes("Aborted(OOM)")) {
        // something to do with memory. usually happens with high res vids
        setFailed(true);
      }
    });
    ffmpeg.on('progress', ({ progress }) => {
      setTranscodingProgress(progress * 100);
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
    const inputFileName = video.name;
    const inputExtension = inputFileName.split('.').pop();
    const inputFile = `input.${inputExtension}`;

    const ffmpeg = ffmpegRef.current;
    await ffmpeg.writeFile(inputFile, await fetchFile(video));
    await ffmpeg.exec([
      "-i",
      inputFile,
      "-threads", // Number of threads for multithreading
      "4",
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
    setCompressedVidSrc(url);
    setDownloadUrl(url);
    setSizesOpen(true);
  }


  /**
   * Adds "_compressed" to the name of the video that was uploaded.
   * 
   * @returns {string} The name of the compressed video
   */
  function getDownloadVideoName() {
    let splitName = video.name.split(".");
    return splitName[0] + "_compressed." + splitName[1];
  }


  /**
   * Handles the file upload event from the dropzone component.
   * 
   * @param {File} video Video file that was uploaded through the dropzone. 
   */
  function handleFileUpload(video) {
    setVideo(video);
    setHideDropzone(true);
    const url = URL.createObjectURL(video);
    setOriginalVidSrc(url);
    load();
  }


  /**
   * Converts file size in bytes to a more readable size format with a suffix (KB, MB, GB)
   * 
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
   * 
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


  /**
   * Returns the main content area based on the transcoding progress.
   * 
   * @param {number} transcodingProgress 
   * @returns {JSX.Element} Element to display in the main content area. (Dropzone or progress bar)
   */
  function getMainContents(transcodingProgress) {
    console.log(transcodingProgress);

    if (hideDropzone && !isTranscoded) {
      return (
        <div className="bg-zinc-800 aspect-video rounded-xl">
          <div className="flex flex-col items-center justify-center size-full rounded-xl">
            <ProgressBar progress={transcodingProgress} />
          </div>
        </div>
      );
    }

    if (!isTranscoded) {
      return (
        <div className="aspect-video rounded-xl">
          <FileDropzone onFileUpload={handleFileUpload} />
        </div>
      );
    }

    if (failed) {
      return (
        <div className="bg-zinc-800 flex flex-col justify-center items-center rounded-xl p-4 aspect-video">
          <h2 className="text-zinc-200 font-semibold mb-2">Failed to compress video</h2>
          <button onClick={() => navigate(0)} className="flex items-center py-2 px-3 bg-green-500 rounded-md text-zinc-900 text-sm font-medium hover:bg-green-600">
            <HiRefresh className="size-4 mr-1" />
            Try Again
          </button>
        </div>
      );
    }



  }


  return (
    <>
      <main className="bg-zinc-900 min-h-screen relative size-full">

        {/* HEADER */}
        <nav className="bg-zinc-800 border-zinc-700">
          <div className="max-w-screen-md flex flex-wrap items-center justify-start mx-auto py-4 px-4 md:px-0">
            <a href="/" className="flex items-center space-x-3">
              <img draggable="false" src="/logo.svg" className="h-8" alt="Logo" />
              <span className="text-2xl font-semibold whitespace-nowrap text-zinc-200">VidPress</span>
            </a>
          </div>
        </nav>


        <div className="max-w-screen-md mx-auto mt-16 px-2 sm:px-0 pb-16">

          {getMainContents(transcodingProgress)}

          {isTranscoded && !failed &&
            <VideoPlayer originalVidSrc={originalVidSrc} compressedVidSrc={compressedVidSrc} />
          }

          {sizesOpen && !failed &&
            <div className="w-full mt-4 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
              {/* BEFORE */}
              <div className="bg-zinc-800 rounded-xl p-4">
                <h2 className="text-zinc-400 font-light text-sm tracking-wide mb-1">ORIGINAL</h2>
                <div className="flex items-center justify-between w-full">
                  <span className="text-zinc-200 text-3xl">{getFileSize(video.size)}</span>
                  <button onClick={() => window.location.href = "/"} className="bg-zinc-800 rounded-lg border border-zinc-600 p-1.5 hover:bg-zinc-700">
                    <HiOutlineTrash className="size-5 text-zinc-200" />
                  </button>
                </div>
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

          {/* DESCRIPTION */}
          <div className="flex flex-col gap-4 mt-16 sm:px-0 px-2">
            <h1 className="text-3xl text-zinc-200 font-semibold">Video Compressor</h1>
            <p className="text-zinc-400 leading-relaxed">
              Compress video files with minimal quality loss using FFmpeg. It’s completely free, runs entirely in your browser, and never stores or sends your files anywhere.
            </p>
          </div>

          {/* <dl className="mt-16 space-y-6 divide-y divide-zinc-700 sm:px-0 px-2">
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
          </dl> */}

        </div>

        {/* FOOTER */}
        <footer className="bg-zinc-900 absolute bottom-0 left-0 right-0">
          <div className="w-full mx-auto max-w-screen-md p-4 flex items-center justify-center">
            <span className="text-sm text-zinc-400 text-center">2024 VidPress | <a href="https://github.com/danikger/Video-Compressor" className="hover:underline">GitHub</a> | Powered by <a href="https://www.ffmpeg.org/" className="hover:underline">FFmpeg</a>.</span>
          </div>
        </footer>
      </main >
    </>
  );
}

export default App;