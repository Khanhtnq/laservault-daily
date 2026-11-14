import { Devvit, useState } from '@devvit/public-api';

Devvit.configure({
  redditAPI: true,
  redis: true,
});

// Custom Post Menu item to create a Daily LaserVault post
Devvit.addMenuItem({
  label: 'Spawn LaserVault Daily Post',
  location: 'subreddit',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    const subreddit = await reddit.getCurrentSubreddit();
    const today = new Date().toISOString().slice(0, 10);

    await reddit.submitPost({
      title: `LaserVault Daily [${today}] — Optics Tactical Heist`,
      subredditName: subreddit.name,
      preview: (
        <vstack height="100%" width="100%" alignment="middle center" backgroundColor="#05070a">
          <text size="large" weight="bold" color="#38bdf8">
            LaserVault Daily ⚡
          </text>
          <text size="medium" color="#94a3b8">
            Align mirrors, trigger sensors, crack the vault.
          </text>
          <spacer size="medium" />
          <button appearance="primary">Launch Vault</button>
        </vstack>
      ),
    });

    ui.showToast({ text: `Spawned LaserVault Daily for ${today}!` });
  },
});

// Custom Post Component with WebView Bridge and Redis leaderboard
Devvit.addCustomPostType({
  name: 'LaserVault Daily Interactive Post',
  height: 'tall',
  render: (context) => {
    const { redis, userId } = context;
    const today = new Date().toISOString().slice(0, 10);

    const [userStreak, setUserStreak] = useState(async () => {
      const streak = await redis.get(`user:${userId}:streak`);
      return streak ? parseInt(streak, 10) : 0;
    });

    const [dailySolved, setDailySolved] = useState(async () => {
      const solved = await redis.get(`daily:${today}:user:${userId}`);
      return solved === 'true';
    });

    const onMessage = async (msg: any) => {
      if (msg.type === 'VICTORY') {
        const newStreak = userStreak + 1;
        setUserStreak(newStreak);
        setDailySolved(true);

        // Store into Redis
        await redis.set(`user:${userId}:streak`, newStreak.toString());
        await redis.set(`daily:${today}:user:${userId}`, 'true');
        await redis.zAdd(`leaderboard:${today}`, {
          member: userId || 'anonymous',
          score: msg.moves,
        });

        context.ui.showToast({
          text: `Vault Cracked! Par: ${msg.par} | Moves: ${msg.moves} | Streak: ${newStreak} 🔥`,
        });
      }
    };

    return (
      <vstack height="100%" width="100%" backgroundColor="#05070a">
        <webview
          id="laserVaultWebview"
          url="index.html"
          width="100%"
          height="100%"
          onMessage={onMessage}
        />
      </vstack>
    );
  },
});

export default Devvit;
