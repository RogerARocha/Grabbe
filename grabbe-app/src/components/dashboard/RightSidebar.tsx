export const RightSidebar = () => {
  return (
    <aside className="col-span-12 lg:col-span-3 space-y-8">
      {/* Planned Next */}
      <section className="bg-surface rounded-xl p-6 bloom-shadow border border-outline-variant/20">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-text-high">
          <span className="material-symbols-outlined text-primary">bookmark</span>
          Planned Next
        </h2>
        <div className="space-y-6">
          <div className="flex gap-4 group cursor-pointer">
            <div className="w-12 h-16 bg-surface-container-high rounded overflow-hidden shrink-0">
              <img 
                className="w-full h-full object-cover" 
                alt="The Last Nomad" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCq0oPfDfcClEM8z0ulJIZUwyhzOCooRZLWGbRzOyaLARgs1Ru-22BYu8nJsVhsPAMKrLZvltF7MNM_Xnsce4Po-UNqQsMYFZbTawFAO-v-gvilbgNojPSlKkTdWOWUGBTTfM2lzbkpOb8PoRnD7GafmzoI4sLA7qzLIOqhbif-y71QhcqSHwLtejuLOzfymhxZebKcj3tI-JohhOBbL-f1Ji3vKgNx2-iREkvo4SMLSihxYNvMdqitcboGDtV7w8oyoEczaHglamte"
              />
            </div>
            <div>
              <h4 className="text-[13px] font-bold group-hover:text-primary transition-colors text-text-high">The Last Nomad</h4>
              <p className="text-[10px] text-text-muted uppercase mt-1">Sci-Fi • 2h 40m</p>
            </div>
          </div>
          
          <div className="flex gap-4 group cursor-pointer">
            <div className="w-12 h-16 bg-surface-container-high rounded overflow-hidden shrink-0">
              <img 
                className="w-full h-full object-cover" 
                alt="Brutalist Dreams" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAo_8mU-0IBKnRsITd0NvWE2uT-sdDmgs9V4Rbb6Z_VCl2Zki4Ger3h4sTL6rgqLGB02yL1Fn9AwAgY3mYLNfekTQ9WPhXwS6BUl84Rrya3xGndXB86cCTUQfWeuqQoduJzQOn8_RsnOqGyzx8I4TJHB2fIKEHkU827DSBub8br_tpNETTziH1pHuJBUefLD325ycZj_WLU1hvWf7rRmkDRp9eGKp1h8DqFkRkG0sb_1W96LZOpiQRZhOtAnVQBuZMizf6_AWGunOy3"
              />
            </div>
            <div>
              <h4 className="text-[13px] font-bold group-hover:text-primary transition-colors text-text-high">Brutalist Dreams</h4>
              <p className="text-[10px] text-text-muted uppercase mt-1">Documentary • 1h 12m</p>
            </div>
          </div>
          
          <div className="flex gap-4 group cursor-pointer">
            <div className="w-12 h-16 bg-surface-container-high rounded overflow-hidden shrink-0">
              <img 
                className="w-full h-full object-cover" 
                alt="Celluloid Ghost" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBp0iaOlcpJ_C7MZulb0gY0vIxCBULKf7f6YZr2hABsLtNSTTO7tWH2_tNBRdrSUduvS3kru3SC7yYg7AM2gGKa2Pr54GLIau21Pjs4B26RfoLNOtKncDzf5sMGB8atPH7Za6OjDysDxygE_C2E1fsaS1bAXpq2ZSI97fzeicClCpzrOEwILGuM92r2IdGhT1LtFTDJbwXi4EiOGx-4GqT2gXHIRdoY2EqOUqg0z9zHGPI7QDRvKDydXF2TwHodo7-H2ywqnTCl_W9J"
              />
            </div>
            <div>
              <h4 className="text-[13px] font-bold group-hover:text-primary transition-colors text-text-high">Celluloid Ghost</h4>
              <p className="text-[10px] text-text-muted uppercase mt-1">Thriller • Series</p>
            </div>
          </div>
        </div>
        <button className="w-full mt-8 py-2 bg-surface-container-high rounded-lg text-[11px] font-bold text-primary hover:bg-surface-container-highest transition-colors">
          Manage Watchlist
        </button>
      </section>

      {/* Community Pulse */}
      <section className="bg-gradient-to-br from-tertiary/20 to-primary/10 rounded-xl p-6 border border-on-tertiary-container/10">
        <h2 className="text-lg font-black mb-4 italic tracking-tighter text-text-high">Community Pulse</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-secondary rounded-full"></div>
            <div>
              <p className="text-[12px] font-bold text-text-high">"Visions" is trending</p>
              <p className="text-[10px] text-text-muted">1.4k new evaluations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-primary rounded-full"></div>
            <div>
              <p className="text-[12px] font-bold text-text-high">Director AMA live</p>
              <p className="text-[10px] text-text-muted">Starts in 2 hours</p>
            </div>
          </div>
        </div>
      </section>
    </aside>
  );
};
