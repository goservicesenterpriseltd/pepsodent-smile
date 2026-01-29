import type { ResponseTemplate } from '@/types/responses';

// 100 responses distributed across score ranges and genders
export const responseTemplates: ResponseTemplate[] = [
  // Score 81-100, Male
  {
    scoreRange: '81-100',
    gender: 'male',
    responses: [
      "Top tier smile. Absolutely radiant."
      // "Wow {firstName}! Your smile is absolutely radiant! 🌟",
      // "Incredible {firstName}! That's a million-dollar smile! 💎",
      // "{firstName}, your smile could light up a room! ✨",
      // "Amazing {firstName}! You've got the perfect smile! 😊",
      // "Outstanding {firstName}! Your smile is pure joy! 🎉",
      // "Fantastic {firstName}! That smile is contagious! 😄",
      // "Brilliant {firstName}! Your smile is absolutely stunning! ⭐",
      // "Perfect {firstName}! That's a winning smile! 🏆",
    ],
  },
  // Score 81-100, Female
  {
    scoreRange: '81-100',
    gender: 'female',
    responses: [
      "Top tier smile. Absolutely radiant."
      // "Wow {firstName}! Your smile is absolutely radiant! 🌟",
      // "Incredible {firstName}! That's a million-dollar smile! 💎",
      // "{firstName}, your smile could light up a room! ✨",
      // "Amazing {firstName}! You've got the perfect smile! 😊",
      // "Outstanding {firstName}! Your smile is pure joy! 🎉",
      // "Fantastic {firstName}! That smile is contagious! 😄",
      // "Brilliant {firstName}! Your smile is absolutely stunning! ⭐",
      // "Perfect {firstName}! That's a winning smile! 🏆",
    ],
  },
  // Score 81-100, Other
  {
    scoreRange: '81-100',
    gender: 'other',
    responses: [
      "Top tier smile. Absolutely radiant."
      // "Wow {firstName}! Your smile is absolutely radiant! 🌟",
      // "Incredible {firstName}! That's a million-dollar smile! 💎",
      // "{firstName}, your smile could light up a room! ✨",
      // "Amazing {firstName}! You've got the perfect smile! 😊",
      // "Outstanding {firstName}! Your smile is pure joy! 🎉",
      // "Fantastic {firstName}! That smile is contagious! 😄",
      // "Brilliant {firstName}! Your smile is absolutely stunning! ⭐",
      // "Perfect {firstName}! That's a winning smile! 🏆",
    ],
  },
  // Score 61-80, Male
  {
    scoreRange: '61-80',
    gender: 'male',
    responses: [
      "{firstName}, bright smiles look good on you."
      // "Great job {firstName}! That's a wonderful smile! 😊",
      // "Nice smile {firstName}! Keep it up! 👍",
      // "Well done {firstName}! Your smile is looking good! 😄",
      // "Good smile {firstName}! You're on the right track! ✨",
      // "Lovely smile {firstName}! Keep smiling! 😃",
      // "Nice one {firstName}! That's a happy smile! 🎈",
      // "Great {firstName}! Your smile is bright! ☀️",
      // "Good work {firstName}! That's a cheerful smile! 🌈",
    ],
  },
  // Score 61-80, Female
  {
    scoreRange: '61-80',
    gender: 'female',
    responses: [
      "{firstName}, bright smiles look good on you."
      // "Great job {firstName}! That's a wonderful smile! 😊",
      // "Nice smile {firstName}! Keep it up! 👍",
      // "Well done {firstName}! Your smile is looking good! 😄",
      // "Good smile {firstName}! You're on the right track! ✨",
      // "Lovely smile {firstName}! Keep smiling! 😃",
      // "Nice one {firstName}! That's a happy smile! 🎈",
      // "Great {firstName}! Your smile is bright! ☀️",
      // "Good work {firstName}! That's a cheerful smile! 🌈",
    ],
  },
  // Score 61-80, Other
  {
    scoreRange: '61-80',
    gender: 'other',
    responses: [
      "{firstName}, bright smiles look good on you."
      // "Great job {firstName}! That's a wonderful smile! 😊",
      // "Nice smile {firstName}! Keep it up! 👍",
      // "Well done {firstName}! Your smile is looking good! 😄",
      // "Good smile {firstName}! You're on the right track! ✨",
      // "Lovely smile {firstName}! Keep smiling! 😃",
      // "Nice one {firstName}! That's a happy smile! 🎈",
      // "Great {firstName}! Your smile is bright! ☀️",
      // "Good work {firstName}! That's a cheerful smile! 🌈",
    ],
  },
  // Score 41-60, Male
  {
    scoreRange: '41-60',
    gender: 'male',
    responses: [
      "Now that’s a smile worth showing off."
      // "Not bad {firstName}! Try smiling a bit more! 😊",
      // "Good start {firstName}! Let's see an even bigger smile! 😄",
      // "You're getting there {firstName}! Show us more joy! ✨",
      // "Nice try {firstName}! A bigger smile would be perfect! 😃",
      // "Keep going {firstName}! You can smile even wider! 🌟",
      // "Good effort {firstName}! Let's see that beautiful smile! 💫",
      // "Almost there {firstName}! Smile from your heart! ❤️",
      // "You're doing well {firstName}! Show us more happiness! 🎉",
    ],
  },
  // Score 41-60, Female
  {
    scoreRange: '41-60',
    gender: 'female',
    responses: [
      "Now that’s a smile worth showing off."
      // "Not bad {firstName}! Try smiling a bit more! 😊",
      // "Good start {firstName}! Let's see an even bigger smile! 😄",
      // "You're getting there {firstName}! Show us more joy! ✨",
      // "Nice try {firstName}! A bigger smile would be perfect! 😃",
      // "Keep going {firstName}! You can smile even wider! 🌟",
      // "Good effort {firstName}! Let's see that beautiful smile! 💫",
      // "Almost there {firstName}! Smile from your heart! ❤️",
      // "You're doing well {firstName}! Show us more happiness! 🎉",
    ],
  },
  // Score 41-60, Other
  {
    scoreRange: '41-60',
    gender: 'other',
    responses: [
      "Now that’s a smile worth showing off."
      // "Not bad {firstName}! Try smiling a bit more! 😊",
      // "Good start {firstName}! Let's see an even bigger smile! 😄",
      // "You're getting there {firstName}! Show us more joy! ✨",
      // "Nice try {firstName}! A bigger smile would be perfect! 😃",
      // "Keep going {firstName}! You can smile even wider! 🌟",
      // "Good effort {firstName}! Let's see that beautiful smile! 💫",
      // "Almost there {firstName}! Smile from your heart! ❤️",
      // "You're doing well {firstName}! Show us more happiness! 🎉",
    ],
  },
  // Score 21-40, Male
  {
    scoreRange: '21-40',
    gender: 'male',
    responses: [
      "Fresh vibes {firstName}! Your smile is getting there."
      // "Come on {firstName}! Show us your beautiful smile! 😊",
      // "You can do it {firstName}! Let's see that smile! 😄",
      // "Try again {firstName}! Smile big and bright! ✨",
      // "Don't be shy {firstName}! Show us your happiness! 😃",
      // "Let's see more {firstName}! A big smile please! 🌟",
      // "You've got this {firstName}! Smile from ear to ear! 😁",
      // "Come on {firstName}! Show us your joy! 🎈",
      // "Try smiling more {firstName}! You've got a great smile! 💫",
    ],
  },
  // Score 21-40, Female
  {
    scoreRange: '21-40',
    gender: 'female',
    responses: [
      "Fresh vibes {firstName}! Your smile is getting there."
      // "Come on {firstName}! Show us your beautiful smile! 😊",
      // "You can do it {firstName}! Let's see that smile! 😄",
      // "Try again {firstName}! Smile big and bright! ✨",
      // "Don't be shy {firstName}! Show us your happiness! 😃",
      // "Let's see more {firstName}! A big smile please! 🌟",
      // "You've got this {firstName}! Smile from ear to ear! 😁",
      // "Come on {firstName}! Show us your joy! 🎈",
      // "Try smiling more {firstName}! You've got a great smile! 💫",
    ],
  },
  // Score 21-40, Other
  {
    scoreRange: '21-40',
    gender: 'other',
    responses: [
      "Fresh vibes {firstName}! Your smile is getting there."
      // "Come on {firstName}! Show us your beautiful smile! 😊",
      // "You can do it {firstName}! Let's see that smile! 😄",
      // "Try again {firstName}! Smile big and bright! ✨",
      // "Don't be shy {firstName}! Show us your happiness! 😃",
      // "Let's see more {firstName}! A big smile please! 🌟",
      // "You've got this {firstName}! Smile from ear to ear! 😁",
      // "Come on {firstName}! Show us your joy! 🎈",
      // "Try smiling more {firstName}! You've got a great smile! 💫",
    ],
  },
  // Score 0-20, Male
  {
    scoreRange: '0-20',
    gender: 'male',
    responses: [
      "A good start. Bright smiles are built daily."
      // "Let's try again {firstName}! Show us your biggest smile! 😊",
      // "Come on {firstName}! You've got a great smile inside! 😄",
      // "Don't worry {firstName}! Let's see that beautiful smile! ✨",
      // "Try once more {firstName}! Smile big and wide! 😃",
      // "You can do it {firstName}! Show us your happiness! 🌟",
      // "Let's see it {firstName}! A big, bright smile! 😁",
      // "Come on {firstName}! Show us your joy! 🎈",
      // "Try again {firstName}! You've got this! 💫",
    ],
  },
  // Score 0-20, Female
  {
    scoreRange: '0-20',
    gender: 'female',
    responses: [
      "A good start. Bright smiles are built daily."
      // "Let's try again {firstName}! Show us your biggest smile! 😊",
      // "Come on {firstName}! You've got a great smile inside! 😄",
      // "Don't worry {firstName}! Let's see that beautiful smile! ✨",
      // "Try once more {firstName}! Smile big and wide! 😃",
      // "You can do it {firstName}! Show us your happiness! 🌟",
      // "Let's see it {firstName}! A big, bright smile! 😁",
      // "Come on {firstName}! Show us your joy! 🎈",
      // "Try again {firstName}! You've got this! 💫",
    ],
  },
  // Score 0-20, Other
  {
    scoreRange: '0-20',
    gender: 'other',
    responses: [
      "A good start. Bright smiles are built daily."
      // "Let's try again {firstName}! Show us your biggest smile! 😊",
      // "Come on {firstName}! You've got a great smile inside! 😄",
      // "Don't worry {firstName}! Let's see that beautiful smile! ✨",
      // "Try once more {firstName}! Smile big and wide! 😃",
      // "You can do it {firstName}! Show us your happiness! 🌟",
      // "Let's see it {firstName}! A big, bright smile! 😁",
      // "Come on {firstName}! Show us your joy! 🎈",
      // "Try again {firstName}! You've got this! 💫",
    ],
  },
];

