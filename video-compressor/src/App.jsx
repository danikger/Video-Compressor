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
  const [video, setVideo] = useState({name: "", size: 0});
  const [downloadUrl, setDownloadUrl] = useState(null);

  const [loaded, setLoaded] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef(null);
  const messageRef = useRef(null);

  useEffect(() => {
    console.log(loaded);
    if (loaded) {
      transcode();
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
      '-i',
      'input.mp4',       // Input file
      '-threads',
      '4',               // Use 8 threads
      '-vcodec',
      'libx264',         // Video codec
      '-crf',
      '30',              // Constant Rate Factor (quality level, higher = lower quality)
      '-preset',
      'veryfast',       // Preset for faster encoding
      '-c:a',
      'copy',            // Copy audio stream without re-encoding
      'output.mp4'       // Output file
    ]);
    // await ffmpeg.exec([
    //   '-i', 
    //   'input.mp4', 
    //   '-b:v', 
    //   '1M', // Reduce bitrate to 1 Mbps
    //   '-c:v', 
    //   'libx264', 
    //   '-preset', 
    //   'ultrafast', 
    //   '-pix_fmt', 
    //   'yuv420p', 
    //   'output.mp4'
    // ]);
    const data = await ffmpeg.readFile('output.mp4');
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
    return splitName[0]+"_compressed."+splitName[1];
  }


  // Array of possible questions and answers (what it do and how it do)
  const faqs = [
    { question: "What it do?", answer: "It do what it do." },
    { question: "How it do?", answer: "It do how it do." },
  ];

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
                <span className="text-zinc-200 text-3xl">50 MB</span>
              </div>

              {/* AFTER */}
              <div className="bg-zinc-800 rounded-xl p-4 mt-4 sm:mt-0">
                <h2 className="text-zinc-400 font-light text-sm tracking-wide mb-1">COMPRESSED</h2>
                <div className="flex items-center justify-between w-full">
                  <span className="text-zinc-200 text-3xl flex items-center">
                    80 MB
                    <span className="flex items-center py-0.5 px-1 ml-2 bg-green-500 rounded-sm text-xs font-medium text-zinc-900">
                      <AiFillCaretDown />
                      80%
                    </span>
                  </span>
                  <a href={downloadUrl} download={getDownloadVideoName()} target='_blank' className="flex items-center py-2 px-3 bg-green-500 rounded-md text-zinc-900 text-sm font-medium hover:bg-green-600">
                    <HiDownload className="size-4 mr-1" />
                    Download
                  </a>
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