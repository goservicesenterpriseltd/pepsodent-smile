# Pepsodent Smile Game 😊

An interactive, playful smile recognition app that captures users' smiles, analyzes them using Luxand Emotion Recognition API, and displays personalized results with a competitive leaderboard.

## Features

- 📸 **Live Camera Capture**: Real-time camera access with smile detection feedback
- 🤖 **AI-Powered Analysis**: Integration with Luxand Emotion Recognition API
- 🎉 **Celebratory Confetti**: Animated confetti for high scores
- 🏆 **Leaderboard**: Competitive leaderboard with score aggregation
- 💾 **Local Persistence**: IndexedDB storage for offline functionality
- 🎨 **Beautiful UI**: Colorful, playful design using Pepsodent brand colors
- 📱 **Responsive**: Works on desktop and mobile devices

## Tech Stack

- **Next.js 16** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **MobX** - State management
- **Tailwind CSS** - Styling
- **Canvas Confetti** - Celebration animations
- **IndexedDB (idb)** - Local storage
- **Luxand API** - Emotion recognition

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Luxand API key ([Get one here](https://luxand.cloud))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pepsodent-smile
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Add your Luxand API key to `.env.local`:
```
NEXT_PUBLIC_LUXAND_API_KEY=your_api_key_here
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
app/
  ├── (screens)/          # Screen components
  │   ├── welcome/        # Welcome screen
  │   ├── personalize/    # User info form
  │   ├── capture/        # Camera capture
  │   ├── processing/     # Loading screen
  │   ├── results/        # Results display
  │   └── leaderboard/    # Leaderboard page
  ├── components/         # Reusable components
  │   ├── ui/             # UI components
  │   ├── camera/         # Camera components
  │   └── confetti/       # Confetti animations
  ├── stores/             # MobX stores
  ├── lib/                # Utilities
  │   ├── api/            # API clients
  │   ├── image/          # Image processing
  │   ├── leaderboard/    # Leaderboard logic
  │   ├── persistence/    # Storage
  │   └── responses/      # Response templates
  └── types/              # TypeScript types
```

## Usage Flow

1. **Welcome Screen**: User enters the game
2. **Personalization**: User provides name, email, phone, and gender
3. **Camera Capture**: User takes a photo with their smile (with auto-capture when face is detected)
4. **Processing**: Image is analyzed by Luxand API
5. **Results**: Personalized message with score and confetti
6. **Leaderboard**: View rankings and compete with others (accessible at `/leaderboard`)

## Leaderboard

The leaderboard is available as a **separate page** at `/leaderboard`, making it perfect for displaying on a different screen while others play the game.

### Features:
- **Auto-refresh**: Automatically refreshes every 5 seconds (configurable)
- **Real-time updates**: Shows latest scores as players complete the game
- **Dual mode**: Works with local storage (default) or backend API
- **Manual refresh**: Users can manually refresh at any time
- **Auto-scrolling**: Smooth scrolling through the leaderboard list

## API Integration

### Luxand Emotion Recognition API
- Endpoint: `https://api.luxand.cloud/photo/emotions`
- Method: POST
- Body: FormData with image file
- Response: Emotion scores including happiness (0-100)

### Backend API (Optional)

When `NEXT_PUBLIC_USE_BACKEND_API=true`, the app will:

1. **Submit Attempts**: POST to `${BACKEND_API_URL}/api/attempts`
   ```json
   {
     "email": "user@example.com",
     "firstName": "John",
     "lastName": "Doe",
     "phone": "+1234567890",
     "gender": "male",
     "score": 85,
     "timestamp": 1234567890
   }
   ```

2. **Fetch Leaderboard**: GET from `${BACKEND_API_URL}/api/leaderboard`
   - Expected response format:
   ```json
   {
     "leaderboard": [
       {
         "email": "user@example.com",
         "firstName": "John",
         "lastName": "Doe",
         "totalScore": 450,
         "attemptCount": 5,
         "averageScore": 90,
         "highestScore": 95,
         "lastPlayed": 1234567890,
         "rank": 1
       }
     ]
   }
   ```

The app gracefully falls back to local storage if the backend API is unavailable.

## Score Calculation

- The smile score is directly taken from the `emotion.happy` value (0-100)
- If multiple faces are detected, the face with the highest happy score is used
- Scores are aggregated per user (by email) for the leaderboard

## Leaderboard

- Scores are aggregated by user email
- Total score = sum of all attempts
- Rankings are sorted by total score (descending)
- Top 3 users get special podium display
- Auto-scrolling list with pause on hover

## Response System

- 100+ personalized responses
- Responses vary by score range and gender
- Dynamic name interpolation
- Encouraging messages for all score levels

## Environment Variables

### Required
- `NEXT_PUBLIC_LUXAND_API_KEY`: Your Luxand API key (required)

### Optional (for Backend API Integration)
- `NEXT_PUBLIC_BACKEND_API_URL`: Backend API base URL (e.g., `https://api.example.com`)
- `NEXT_PUBLIC_USE_BACKEND_API`: Set to `"true"` to enable backend API integration (default: uses local storage)
- `NEXT_PUBLIC_LEADERBOARD_REFRESH_INTERVAL`: Leaderboard auto-refresh interval in milliseconds (default: `5000` = 5 seconds)

## Building for Production

```bash
npm run build
npm start
```

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

**Note**: Camera access requires HTTPS in production (or localhost for development)

## License

Private - Pepsodent Project

## Support

For issues or questions, please contact the development team.
