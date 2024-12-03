function Header() {
  return (
    <nav className="bg-zinc-800 border-zinc-700">
      <div className="max-w-screen-md flex flex-wrap items-center justify-start mx-auto py-4 px-4 md:px-0">
        <a href="/" className="flex items-center space-x-3">
          <img draggable="false" src="/logo.svg" className="h-8" alt="VidPress Logo" />
          <span className="text-2xl font-semibold whitespace-nowrap text-zinc-200">VidPress</span>
        </a>
      </div>
    </nav>
  );
}

export default Header;