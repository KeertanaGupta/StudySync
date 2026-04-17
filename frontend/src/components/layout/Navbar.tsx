export const Navbar = ({ onLoginClick }: { onLoginClick: () => void }) => {
  return (
    <nav className="w-full flex justify-between items-center p-4 md:p-6 bg-transparent border-b-4 border-black relative z-20">
      {/* Logo */}
      <div className="text-2xl md:text-3xl font-black uppercase tracking-tighter bg-yellow-400 px-4 py-1 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2 hover:rotate-0 transition-transform duration-300 cursor-pointer">
        StudySync
      </div>

      {/* Login Button in Navbar */}
      <button
        onClick={onLoginClick}
        className="font-bold uppercase border-4 border-black px-6 py-2 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
      >
        Log In
      </button>
    </nav>
  );
};