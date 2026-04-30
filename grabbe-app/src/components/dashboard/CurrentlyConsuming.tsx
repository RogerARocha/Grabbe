import { MediaCard } from '../shared/MediaCard';

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
          <MediaCard 
            key={item.id} 
            variant="dashboard" 
            title={item.title} 
            subtitle={item.progress} 
            image={item.image} 
            percent={item.percent} 
          />
        ))}
      </div>
    </section>
  );
};
