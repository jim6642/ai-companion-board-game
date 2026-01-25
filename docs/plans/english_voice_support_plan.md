# English Voice Support Implementation Plan

## 1. Overview
This document outlines the plan to introduce English voice support to Wolfcha. The goal is to allow the game to seamlessly switch between Chinese and English voice output based on the user's selected locale, ensuring character personalities remain consistent across languages.

## 2. Voice Selection Strategy
We will map existing Chinese character archetypes to MiniMax English voice IDs. The mapping strategy focuses on maintaining the "vibe" (age, energy, tone) rather than exact voice matching.

### English Voice Presets (MiniMax T2A V2)

| Character Archetype | Chinese Reference | **English Voice ID** | **English Name** | Traits |
| :--- | :--- | :--- | :--- | :--- |
| **Narrator** | Mature Woman | `Serene_Woman` | Serene Woman | Calm, Storytelling |
| **Trustworthy Male** | Sincere/Elite Youth | `English_Trustworthy_Man` | Trustworthy Man | Reliable, Steady |
| **Gentle Male** | Gentle Youth | `English_Gentle-voiced_man` | Gentle-voiced man | Soft, Calm |
| **Serious Male** | Radio Host/Logic | `English_Diligent_Man` | Diligent Man | Serious, Professional |
| **Energetic Male** | Playful/Agressive | `English_Aussie_Bloke` | Aussie Bloke | Rough, Energetic |
| **Mature Female** | Elegant/Bestie | `English_Graceful_Lady` | Graceful Lady | Elegant, Mature |
| **Young Female** | Warm/Cute Girl | `Sweet_Girl` | Sweet Girl | Sweet, Young |
| **Soft Female** | Soft Girl | `English_Whispering_girl` | Whispering girl | Quiet, Soft |
| **Charming Female** | Flight Attendant | `Charming_Lady` | Charming Lady | Attractive, Warm |

## 3. Architecture Changes

### A. Voice Constants (`src/lib/voice-constants.ts`)
1.  **New Constant**: Define `ENGLISH_VOICE_PRESETS` array containing the selected English voices with metadata (gender, age ranges, styles).
2.  **Update `resolveVoiceId`**:
    *   Add `locale` parameter: `(..., locale: "zh" | "en" = "zh")`.
    *   **Logic**:
        *   If `locale === "zh"`, use existing logic (return input ID if valid, or fallback to Chinese preset).
        *   If `locale === "en"`, **ignore the input Chinese ID**. Instead, use the `gender`, `age`, and `styles` (from the character's persona) to find the best match in `ENGLISH_VOICE_PRESETS`.
    *   This ensures we don't need to store double voice IDs in the database/state; we resolve them at runtime.

### B. Narrator System (`src/lib/narrator-voice.ts`)
1.  **Voice ID**: Add `NARRATOR_VOICE_ID_EN = "Serene_Woman"`.
2.  **Text Map**: Add `NARRATOR_TEXTS_EN` containing English translations for all game phases (e.g., "Night has fallen, please close your eyes").
3.  **Path Resolution**:
    *   Update `getNarratorAudioPath(key)` to accept `locale`.
    *   New structure: `/audio/narrator/{locale}/{key}.mp3`.

### C. Audio Player (`src/lib/narrator-audio-player.ts`)
1.  Integrate with `src/i18n/locale-store.ts` to get the current app locale.
2.  In `play(key)`, auto-detect locale and request the correct audio file path.

## 4. Asset Management & Generation

### A. Directory Structure
Refactor `public/audio/narrator/` to support localization:
```text
public/
  audio/
    narrator/
      zh/  <-- Move existing files here
      en/  <-- New generated files
```

### B. Generation Script (`scripts/generate-narrator-audio.ts`)
1.  Update script to iterate over both languages.
2.  Use `NARRATOR_TEXTS` (CN) and `NARRATOR_TEXTS_EN` (EN).
3.  Use corresponding Voice IDs for generation.
4.  Ensure output directories exist before writing.

## 5. Integration Points

### A. Character Generator (`src/lib/character-generator.ts`)
*   Update `resolveVoiceId` usage. When generating characters, we strictly store the **Chinese Voice ID** (or a generic ID) in the persona. The runtime resolution handles the switch.
*   *Alternative*: If we want to support fixed English IDs, we could, but the runtime mapping approach is more flexible for language switching.

### B. Game Phases (Runtime TTS)
*   **Location**: `src/hooks/game-phases/useDayPhase.ts` (and others using `runAISpeech`).
*   **Action**: When calling `resolveVoiceId` to prepare TTS tasks:
    ```typescript
    const locale = getLocale(); // from i18n
    const voiceId = resolveVoiceId(player.persona.voiceId, ..., locale);
    ```
*   **API Route**: `src/app/api/tts/route.ts` generally just forwards the ID to MiniMax, so it doesn't need logic changes as long as the frontend sends the correct (English) Voice ID.

## 6. Implementation Steps

1.  **Refactor Constants**: Create `ENGLISH_VOICE_PRESETS` and update `resolveVoiceId`.
2.  **Refactor Narrator Config**: Add English texts and IDs in `narrator-voice.ts`.
3.  **File Migration**: Move existing narrator audio to `public/audio/narrator/zh/`.
4.  **Update Script**: Modify `generate-narrator-audio.ts` and generate English assets.
5.  **Update Player**: Modify `NarratorAudioPlayer` to handle locale-based paths.
6.  **Update Runtime**: Modify `useDayPhase` etc. to pass locale to `resolveVoiceId`.
7.  **Testing**:
    *   Verify Chinese audio still works.
    *   Verify English audio plays when locale is switched.
    *   Verify Character TTS switches to English voices.
