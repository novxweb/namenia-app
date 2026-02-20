# App_React_Expo

A modern mobile application template built with [Expo](https://expo.dev) and React Native.

## 🚀 Tech Stack

- **Framework:** [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/)
- **Routing:** [Expo Router](https://docs.expo.dev/router/introduction/)
- **Styling:** [NativeWind](https://www.nativewind.dev/) (Tailwind CSS)
- **Backend:** [Supabase](https://supabase.com/)
- **Icons:** [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native)

## 🛠 Prerequisites

- [Node.js](https://nodejs.org/)
- [Expo Go](https://expo.dev/client) app on your mobile device (optional, for testing on real devices)

## 📦 Installation

1.  Clone the repository or download the source code.

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables:
    Create a `.env` file in the root directory and add your Supabase credentials (if applicable):
    ```env
    EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
    EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

## 🏃‍♂️ Running the App

Start the development server:

```bash
npm run start
```

This will launch the Expo development server. You can:
- Press `a` to open in Android Emulator
- Press `i` to open in iOS Simulator
- Press `w` to open in Web Browser
- Scan the QR code with the Expo Go app to run on your physical device.

## 📁 Project Structure

- `app/`: Expo Router pages and layouts
- `components/`: Reusable UI components
- `core/`: Core providers, hooks, and context
- `lib/`: Utility functions and third-party integrations (Supabase)
- `assets/`: Images and fonts

## 📄 Scripts

- `npm run start`: Start the Expo server
- `npm run android`: Run on Android
- `npm run ios`: Run on iOS
- `npm run web`: Run on Web
