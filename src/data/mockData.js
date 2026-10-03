export const SAMPLE_VIDEO_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

export const INITIAL_PROJECTS = [
  {
    id: "proj_1",
    name: "Kolkata Tech Talk",
    description: "Keynote presentation on AI-driven creator tools and automated video workflows.",
    category: "Technology & AI",
    targetPlatforms: ["Instagram Reels", "YouTube Shorts", "TikTok"],
    createdAt: "2026-10-01",
    status: "Active",
    thumbnail: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=80",
    assetsCount: 3,
    clipsCount: 4
  },
  {
    id: "proj_2",
    name: "SaaS Launch Roadmap",
    description: "Breakdown of product strategy, pricing models, and acquisition channels.",
    category: "Product & Startup",
    targetPlatforms: ["LinkedIn", "YouTube Shorts"],
    createdAt: "2026-09-28",
    status: "Active",
    thumbnail: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80",
    assetsCount: 2,
    clipsCount: 2
  }
];

export const INITIAL_ASSETS = [
  {
    id: "asset_v1",
    projectId: "proj_1",
    filename: "Kolkata_Tech_Talk_Full_Keynote.mp4",
    fileType: "video",
    fileSize: 48500000, // ~48.5 MB
    url: SAMPLE_VIDEO_URL,
    uploadDate: "2026-10-01",
    duration: 160.0,
    status: "ready"
  },
  {
    id: "asset_s1",
    projectId: "proj_1",
    filename: "Keynote_Presentation_Script.txt",
    fileType: "script",
    fileSize: 4200,
    url: "#",
    uploadDate: "2026-10-01",
    status: "ready",
    content: `Welcome everyone to Kolkata Tech Talk 2026! Today we are discussing how AI is reshaping content creation.

Most creators make one huge mistake when starting with AI tools: they treat AI as a replacement rather than an operating copilot.

When you leverage script matching and automated clip extraction, your production speed increases tenfold without sacrificing creative quality.

Here is the exact step-by-step workflow: first analyze long-form video transcript, identify key emotional peaks, and cut vertical 9:16 clips for Reels and Shorts.

If you master hook generation in the first 3 seconds, your retention rate will skyrocket across TikTok and Instagram.`
  },
  {
    id: "asset_a1",
    projectId: "proj_1",
    filename: "Background_Lofi_Beat.mp3",
    fileType: "audio",
    fileSize: 3200000,
    url: "#",
    uploadDate: "2026-10-02",
    status: "ready"
  }
];

export const INITIAL_TRANSCRIPT = [
  { start: 0.0, end: 12.5, text: "Welcome everyone to Kolkata Tech Talk 2026! Today we are discussing how AI is reshaping content creation." },
  { start: 12.5, end: 35.0, text: "Most creators make one huge mistake when starting with AI tools: they treat AI as a replacement rather than an operating copilot." },
  { start: 35.0, end: 62.0, text: "When you leverage script matching and automated clip extraction, your production speed increases tenfold without sacrificing creative quality." },
  { start: 62.0, end: 95.0, text: "Here is the exact step-by-step workflow: first analyze long-form video transcript, identify key emotional peaks, and cut vertical 9:16 clips for Reels and Shorts." },
  { start: 95.0, end: 128.0, text: "If you master hook generation in the first 3 seconds, your retention rate will skyrocket across TikTok and Instagram." },
  { start: 128.0, end: 160.0, text: "Thank you for listening, make sure to check out CreatorAI platform for automated video operations!" }
];

export const INITIAL_CLIPS = [
  {
    id: "clip_1",
    projectId: "proj_1",
    assetId: "asset_v1",
    title: "The #1 AI Creator Mistake",
    startTime: 12.5,
    endTime: 35.0,
    duration: 22.5,
    aspectRatio: "9:16",
    potentialScore: 94.5,
    ratingLabel: "High Potential",
    suggestedHook: "Most creators make one huge mistake when starting with AI...",
    hooks: [
      "🔥 Stop making this #1 mistake when using AI tools for Instagram Reels!",
      "💡 Here's how top 1% creators automate video workflows in 2026...",
      "🚀 The secret step-by-step strategy to boost video engagement tenfold."
    ],
    selectedHookIndex: 0,
    caption: "Ready to level up your content game on Instagram Reels? 🚀\n\nIn this clip: Most creators treat AI as a replacement instead of a copilot...\n\nComment 'CREATOR' for full access!",
    hashtags: ["#CreatorEconomy", "#AIWorkflow", "#ReelsViral", "#TechTools"],
    subtitles: [
      { id: 1, start: 0.0, end: 3.5, text: "Most creators make one huge mistake" },
      { id: 2, start: 3.5, end: 7.0, text: "when starting with AI tools:" },
      { id: 3, start: 7.0, end: 12.0, text: "they treat AI as a replacement" },
      { id: 4, start: 12.0, end: 18.0, text: "rather than an operating copilot." }
    ],
    status: "Ready for Review",
    scheduledDate: "2026-10-05T14:00:00",
    platform: "Instagram Reels",
    exportedUrl: null
  },
  {
    id: "clip_2",
    projectId: "proj_1",
    assetId: "asset_v1",
    title: "3-Second Hook Retention Secret",
    startTime: 95.0,
    endTime: 128.0,
    duration: 33.0,
    aspectRatio: "9:16",
    potentialScore: 89.2,
    ratingLabel: "High Potential",
    suggestedHook: "If you master hook generation in the first 3 seconds...",
    hooks: [
      "⚡ How to skyrocket your TikTok watch time instantly!",
      "📈 The 3-second rule that changed my video analytics forever.",
      "🎥 Retention secret that big creators don't want you to know."
    ],
    selectedHookIndex: 0,
    caption: "Retention is everything in 2026! 📈 Master the 3-second hook to keep viewers locked in.",
    hashtags: ["#TikTokTips", "#ContentGrowth", "#VideoHooks", "#Shorts"],
    subtitles: [
      { id: 1, start: 0.0, end: 4.0, text: "If you master hook generation" },
      { id: 2, start: 4.0, end: 8.5, text: "in the first 3 seconds," },
      { id: 3, start: 8.5, end: 15.0, text: "your retention rate will skyrocket!" }
    ],
    status: "Scheduled",
    scheduledDate: "2026-10-06T18:30:00",
    platform: "TikTok",
    exportedUrl: null
  }
];

export const INITIAL_ANALYTICS = {
  totalViews: "148,200",
  avgEngagement: "8.4%",
  publishedClips: 14,
  scheduledClips: 3,
  platformBreakdown: [
    { name: "Instagram Reels", views: 68000, engagement: 9.1 },
    { name: "YouTube Shorts", views: 48000, engagement: 7.8 },
    { name: "TikTok", views: 24000, engagement: 8.9 },
    { name: "LinkedIn", views: 8200, engagement: 6.2 }
  ],
  weeklyPerformance: [
    { day: "Mon", views: 12000, clips: 2 },
    { day: "Tue", views: 18500, clips: 3 },
    { day: "Wed", views: 24000, clips: 2 },
    { day: "Thu", views: 31000, clips: 4 },
    { day: "Fri", views: 28000, clips: 3 },
    { day: "Sat", views: 34000, clips: 2 },
    { day: "Sun", views: 42000, clips: 5 }
  ]
};
