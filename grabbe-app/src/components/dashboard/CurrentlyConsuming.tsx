const mediaItems = [
  {
    id: 1,
    title: 'Neon Genesis: Rework',
    progress: 'S1: E08 of 12',
    percent: 75,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTDPUsK_UwLSqODGjaw3RzDN0tS7KPqhpmiEy4kvUUOmWAcPPn7fjG5e_z74p1AbYKW3OnL2hJ1kPD4ImHURqFM3LZi3ycYsR5q1oNaKcn-DO4tPiYmrGyT6VUh820mwC3OgOFJ68mQdL-lUCbW4DQBToDwimilEePFCx5twI00cP8DBITgc-gdJHbxWpG-G49S_0EXSUn2w2a-IPCiUOnn-s12I3vykjfo6CoGdSCTqXwY8GOgHpiarCcV_iN3vuCQ-Qd9gj5x7Ek'
  },
  {
    id: 2,
    title: 'The Archive Chronicles',
    progress: '214 of 700 pages',
    percent: 30,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIBFQi4VE6wfUt5nEz85oNi6Td6T6ZT6Uq2YsNJGI_rjIanD-bgEbYsHY-lQSqPfM0GquVwmF_N_5dG5WeHmpcD5T224rIgyBfm2SqNLTLDO1l9j_J6uoN2-9M_0EXChCF1qZmArquga9wxpboyNQtnKuzJh6dRRPnqsKdE3eWc5mXP8JNCe4xuuVQnxQBUZxEutXv6zoUD-Vl8_42j3rAJJk1Q4y-4jZk3pgh16bkW1cdDTlqBcHxkUcxQTFl31d4-LXFE4FaLErY'
  },
  {
    id: 3,
    title: 'Stairway to Silence',
    progress: '92 mins of 110 mins',
    percent: 90,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-Yu_5_S5kftsnbANyC0GHXDS7TRr9onnEdClPgVmBs0x7FKSMsBgg3pR28ynKNA3yqHDMipuBKyJ4qvDVnFw0a488jncja7jP9iwWf1xxL9DYMOK2TWVIHmKRpkEtfo9Dn8-oOLkw1wvMjCSwFrY96KFoU8s5hhjb5PO-1ETOT5tVRdaC7td7vCzFvSBS3-ThqIbiL-1r95gImgMo8WeXmzWGMGgav7bGDPrmpiYoRuZ-JpR4CH8fb7uuJlC5lqX7W1GtmMIxPFyq'
  },
  {
    id: 4,
    title: 'Frozen Echoes',
    progress: 'S2: E01 of 22',
    percent: 15,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCeCRQzciPcw-p6WWOoPU1-9NTVuAYAQNXMob-t0JbETtd5oPAvTWT4vv2wM2c98O8WEKXvPQUqM3Zp3PL1cdtw2H9lj-X-KrCYHu43ziU9cKfWnmo91TfWU9S0ql2usYwRr_09XaqLA7_fF2ZkFB5Y5mQbyJ4Fgtu-jpe0tISctow6QyhFtkt8CnuK2oVrT-ykrVhTxgAEFYyivKQq9djehxJr90tQ1et4r8PluXVAEimsJbEW1767U6Ma6mxc86jilA0HwOyfuU-D'
  }
];

export const CurrentlyConsuming = () => {
  return (
    <section>
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-text-high">Currently Consuming</h2>
        <a className="text-sm font-bold text-primary hover:text-tertiary transition-colors" href="#">View All Session</a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {mediaItems.map(item => (
          <div key={item.id} className="group relative bg-surface rounded-lg p-2 transition-transform duration-200 hover:scale-[1.05] primary-glow">
            <div className="relative w-full h-[240px] rounded-lg overflow-hidden border-2 border-primary mb-3">
              <img className="w-full h-full object-cover" alt={item.title} src={item.image} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              <div className="absolute top-2 right-2 px-2 py-1 glass-panel rounded-full text-[10px] font-bold text-secondary uppercase">Active</div>
            </div>
            <h3 className="font-bold text-sm truncate px-1 text-text-high">{item.title}</h3>
            <div className="px-1 mt-2">
              <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${item.percent}%` }}></div>
              </div>
              <p className="text-[9px] text-text-muted mt-1">{item.progress}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
