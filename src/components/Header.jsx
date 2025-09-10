const Header = () => {
    return(
      <div>
        <header className="flex items-center justify-between mb-4 px-4">
          <div className="text-xl font-bold text-[#FFFFFF]">Quant-Mate</div>
          <div className="flex items-center gap-3 text-lg">
            <button aria-label="night" className="p-2">🌙</button>
            <button aria-label="message" className="p-2">✉️</button>
            <button aria-label="menu" className="text-white p-2">☰</button>
          </div>
        </header>
        </div>
    )
}

export default Header;