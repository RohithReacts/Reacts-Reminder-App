// lib/audioManager.ts
import type { Audio as AudioType } from "expo-av";
import { Vibration } from "react-native";

class AudioManager {
  private static instance: AudioManager;
  private sound: any = null;
  private isPlaying: boolean = false;
  private AudioModule: typeof AudioType | null = null;

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!this.instance) {
      this.instance = new AudioManager();
    }
    return this.instance;
  }

  private async loadAudioModule(): Promise<typeof AudioType | null> {
    if (this.AudioModule) return this.AudioModule;

    try {
      // Defer loading to prevent top-level crashes
      const { Audio } = require("expo-av");
      this.AudioModule = Audio;
      return Audio;
    } catch (e) {
      console.warn(
        "[AudioManager] Native module 'ExponentAV' not found. You MUST rebuild your app using 'npx expo run:android' to fix this.",
        e,
      );
      return null;
    }
  }

  public async playAlarm() {
    const Audio = await this.loadAudioModule();
    if (!Audio) {
      console.warn(
        "[AudioManager] Playback skipped: ExponentAV native module not found.",
      );
      // Fallback to vibration if audio is not available
      Vibration.vibrate([0, 500, 500], true);
      this.isPlaying = true; // Still mark as playing so STOP button works
      return;
    }

    if (this.isPlaying) return;

    try {
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      console.log("[AudioManager] Loading sound...");
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/sound/notification.mp3"),
        { isLooping: true },
      );
      this.sound = sound;
      this.isPlaying = true;

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
      });

      await this.sound.playAsync();
      console.log("[AudioManager] Alarm started looping");
    } catch (error) {
      console.error("[AudioManager] Error playing alarm:", error);
      this.isPlaying = false;
    }
  }

  public async stopAlarm() {
    Vibration.cancel();
    if (!this.isPlaying || !this.sound) {
      this.isPlaying = false;
      return;
    }

    try {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
      this.isPlaying = false;
      console.log("[AudioManager] Alarm stopped");
    } catch (error) {
      console.error("[AudioManager] Error stopping alarm:", error);
    }
  }

  public isAlarmPlaying(): boolean {
    return this.isPlaying;
  }
}

export const audioManager = AudioManager.getInstance();
