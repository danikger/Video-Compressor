function Footer() {
  return (
    <footer className="bg-zinc-900 absolute bottom-0 left-0 right-0">
      <div className="w-full mx-auto max-w-screen-md p-4 flex items-center justify-center">
        <span className="text-sm text-zinc-400 text-center">2024 VidPress | <a target="_blank" href="https://github.com/danikger/Video-Compressor" className="hover:underline">GitHub</a> | Powered by <a target="_blank" href="https://www.ffmpeg.org/" className="hover:underline">FFmpeg</a>.</span>
      </div>
    </footer>
  );
}

export default Footer;