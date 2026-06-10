import { useState, useEffect } from 'react';
import { calculateInvestedMinutes } from '../../lib/timeMetrics';
import { getSetting } from '../../lib/db';

export const WelcomeHeader = ({ items = [] }: { items?: any[] }) => {
  const [randomMessage, setRandomMessage] = useState('');
  const [userName, setUserName] = useState('Roger');
  const [greeting, setGreeting] = useState('Welcome Back');

  useEffect(() => {
    async function loadName() {
      const name = await getSetting('USER_NAME');
      if (name) {
        setUserName(name);
      }
    }
    loadName();

    const greetings = [
      'Welcome Back',
      'Hello',
      'Glad to see you',
      'Great to have you here',
      'Hey there',
      'Enjoy your media'
    ];
    setGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
  }, []);

  useEffect(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const newThisWeek = items.filter(i => i.created_at && new Date(i.created_at) >= oneWeekAgo).length;
    const masterpieces = items.filter(i => i.score === 10).length;
    
    const completedCount = items.filter(i => i.status === 'COMPLETED').length;
    const totalMinutes = items.reduce((acc, item) => {
      return acc + calculateInvestedMinutes(item.type, item.consumption_metric, item.progress || 0);
    }, 0);
    const estimatedHours = Math.round(totalMinutes / 60);
    
    const plannedCount = items.filter(i => i.status === 'PLANNED').length;
    const droppedCount = items.filter(i => i.status === 'DROPPED').length;

    const messages = [];
    
    if (newThisWeek > 0) {
        messages.push(`The cinematic world has shifted in your absence. ${newThisWeek} new items were added to your radar this week.`);
    } else {
        messages.push(`The cinematic world has shifted in your absence. Ready to add something new to your radar today?`);
    }

    if (completedCount > 0) {
        messages.push(`You've spent roughly ${estimatedHours} hours consuming ${completedCount} pieces of media. Time well spent.`);
    }

    if (masterpieces > 0) {
        messages.push(`Your taste is impeccable. You've uncovered ${masterpieces} masterpieces that stand above the rest.`);
    }
    
    if (plannedCount > 0) {
        messages.push(`The future looks bright. You have ${plannedCount} items waiting to be experienced in your backlog.`);
    }

    if (droppedCount > 0) {
        messages.push(`Life is too short for bad media. You've ruthlessly dropped ${droppedCount} items that didn't make the cut.`);
    }

    if (messages.length === 0) {
        messages.push(`Welcome to your library. Start tracking and evaluating media to see your stats grow.`);
    }

    setRandomMessage(messages[Math.floor(Math.random() * messages.length)]);
  }, [items]);

  const getGreetingText = () => {
    switch (greeting) {
      case 'Hello':
      case 'Hey there':
        return { prefix: `${greeting}, `, suffix: '!' };
      case 'Great to have you here':
        return { prefix: `${greeting}, `, suffix: '!' };
      default:
        return { prefix: `${greeting}, `, suffix: '.' };
    }
  };

  const { prefix, suffix } = getGreetingText();

  return (
    <section className="mb-12">
      <h1 className="text-5xl font-extrabold tracking-tighter mb-2">
        {prefix}<span className="prismatic-text">{userName}</span>{suffix}
      </h1>
      <p className="text-text-muted max-w-2xl h-6">
        {randomMessage}
      </p>
    </section>
  );
};

