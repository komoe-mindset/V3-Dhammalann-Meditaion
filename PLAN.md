
# Project Plan: Wisdom-Guided Mindfulness Training

## 1. Vision & Purpose
To create a digital sanctuary that guides users through a structured mindfulness curriculum, blending ancient wisdom with modern tracking techniques to foster mental clarity and emotional resilience.

## 2. Phase-Based Curriculum
The app will be divided into four distinct phases:
- **Morning Phase (Current):** Awakening & Intention (5:00 AM - 12:00 PM). Focus on silence, study, and clarity.
- **Afternoon Phase:** Presence & Action (12:00 PM - 5:00 PM). Focus on mindful work and deep breathing.
- **Evening Phase:** Reflection & Connection (5:00 PM - 9:00 PM). Focus on gratitude and social presence.
- **Night Phase:** Rest & Surrender (9:00 PM - 5:00 AM). Focus on physical relaxation and deep sleep.

## 3. Technical Architecture
- **Frontend:** React 18+ with TypeScript for type safety and component-driven architecture.
- **Styling:** Tailwind CSS using the specified palette (Sage Green, Deep Teal, Soft Gold).
- **AI Integration:** Google Gemini API for generating "Daily Wisdom" snippets and summarizing morning progress.
- **Storage:** LocalStorage API with robust error handling for persistence.
- **Bilingual Support:** Hardcoded EN/MY strings for all interactive elements to ensure accessibility.

## 4. UI/UX Strategy
- **Minimalism:** Avoiding clutter to reduce cognitive load.
- **Visual Hierarchy:** Using Soft Gold for active states and Deep Teal for grounding elements.
- **Feedback Loops:** Clear success/error notifications for data operations.

## 5. Development Roadmap (Phase 1: Morning)
1. **Infrastructure:** Set up React, Tailwind, and types.
2. **State Management:** Logic for tracking 5 specific morning tasks.
3. **AI Service:** Integration of Gemini for context-aware wisdom.
4. **Persistence Layer:** CRUD operations on LocalStorage with fallback messages.
5. **Final Polish:** Responsive adjustments and bilingual verification.
