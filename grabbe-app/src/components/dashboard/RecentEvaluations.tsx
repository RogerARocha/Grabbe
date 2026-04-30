export const RecentEvaluations = () => {
  return (
    <section>
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-text-high">Recent Evaluations</h2>
        <div className="flex gap-2">
          <span className="bg-surface px-3 py-1 rounded-full text-[10px] font-bold text-text-high border border-outline-variant/20">Movies</span>
          <span className="bg-surface px-3 py-1 rounded-full text-[10px] font-bold text-text-muted">Books</span>
          <span className="bg-surface px-3 py-1 rounded-full text-[10px] font-bold text-text-muted">Series</span>
        </div>
      </div>
      
      <div className="grid grid-cols-12 gap-6">
        {/* Bento Large */}
        <div className="col-span-12 md:col-span-8 bg-surface rounded-xl overflow-hidden bloom-shadow group border border-outline-variant/20">
          <div className="flex flex-col md:flex-row h-full">
            <div className="md:w-1/2 overflow-hidden h-full">
              <img 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                alt="Beyond The Horizon" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6-uwg4um-wuY88K2rmX-hsKVzzA3IKlIQz9OAvgjWsyzv45CHP2VCk_3EfQKc70Lm3xIu4YyfcgZund7jhDBQNLovlCp3eRjeqXha_b_7qHluXKkKinax0LB_8FS92nY-fDIBWrc1QWQw-YgigZO9v5NAI2s8HvDXzVECmDlFV2gmqbr_wr4P71G4QzPgtCY3MC73Dxm9DzWlAMZoYcmNC7qGV2huASIgiP_H5X5T3tK6LchNC-mhB3UD7vN7_F07roZAHNY-XFk6"
              />
            </div>
            <div className="md:w-1/2 p-8 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold px-2 py-1 bg-tertiary/10 text-tertiary rounded uppercase">Critic's Choice</span>
                <span className="text-[10px] font-bold px-2 py-1 bg-secondary/10 text-secondary rounded uppercase">Masterpiece</span>
              </div>
              <h3 className="text-3xl font-black mb-4 leading-none prismatic-text">Beyond The Horizon</h3>
              <p className="text-text-muted text-sm mb-6 line-clamp-3">
                A visual symphony that redefines the genre. The use of negative space and silence creates a tension rarely seen in modern cinema. An absolute tour de force.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-text-high">10/10</span>
                  <span className="text-[9px] uppercase tracking-widest text-text-muted font-bold">Evaluation</span>
                </div>
                <button className="ml-auto flex items-center gap-2 text-xs font-bold hover:text-primary transition-colors text-text-high">
                  Read Review <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bento Small 1 */}
        <div className="col-span-12 md:col-span-4 bg-surface rounded-xl p-6 bloom-shadow border border-outline-variant/20">
          <div className="mb-4 aspect-video rounded-lg overflow-hidden">
            <img 
              className="w-full h-full object-cover" 
              alt="Tokyo Drift: Nightfall" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeuQquA6OoMlzECX7qUAsudXlPfB1pwh8Jx0_-YTpTdmBNu4dfA3tVT_5mn8OvweEN8p0NSsrHYywxGqNeDOpElp7EgqYXC5WjxKC5UL3kHzT1jUb9eRvbSUzUrsZOEBLCLujs0lT2DqKY6ibRg01pHV9i9Lp36r_JQtXVbHo2jZS76AaTF_dTVKT9BiqzqmXtzFZUDfTF76hhiJQdNTRGGeNVlNJ4LYghemr4jwqJuQ3zaokymzyfD3igCeOsAuzzLQGhy4FTXs8K"
            />
          </div>
          <h4 className="font-bold mb-2 text-text-high">Tokyo Drift: Nightfall</h4>
          <p className="text-[12px] text-text-muted mb-4 line-clamp-2">
            The cinematography is peak, but the narrative falls slightly short in the third act.
          </p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-warning">8.2/10</span>
            <span className="text-[10px] font-bold text-text-muted">Yesterday</span>
          </div>
        </div>
      </div>
    </section>
  );
};
