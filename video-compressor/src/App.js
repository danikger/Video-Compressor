import './App.css';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone'

import { HiDownload, HiChevronDown } from "react-icons/hi";
import { AiFillCaretDown, AiFillCaretUp } from "react-icons/ai";
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'

function App() {
  const [sizesOpen, setSizesOpen] = useState(true);

  const onDrop = useCallback(acceptedFiles => {
    // Do something with the files
    console.log(acceptedFiles);
  }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {'video/*': [], }, // Video files only
    maxFiles: 1,       // One file at a time
    onDrop,
  })


  // Array of possible questions and answers (what it do and how it do)
  const faqs = [
    { question: "What it do?", answer: "It do what it do." },
    { question: "How it do?", answer: "It do how it do." },
  ];

  return (
    <>
      <main className="bg-zinc-900 min-h-screen absolute w-full px-2 sm:px-0">
        <div className="max-w-screen-md mx-auto mt-16">
          {/* File Upload */}
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
                  <button className="flex items-center py-2 px-3 bg-green-500 rounded-md text-zinc-900 text-sm font-medium hover:bg-green-600">
                    <HiDownload className="size-4 mr-1" />
                    Download
                  </button>
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